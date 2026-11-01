import { inflateRawSync, inflateSync } from "node:zlib";

export const PDF_MAX_BYTES = 2_000_000;
export const PDF_MAX_TEXT = 12_000;

export type PdfTextCode = "not-pdf" | "encrypted" | "too-large" | "no-text";

export type PdfTextResult = { ok: true; text: string } | { ok: false; code: PdfTextCode };

const IMAGE_FILTER = /DCTDecode|JPXDecode|CCITTFaxDecode|JBIG2Decode|ASCII85Decode|ASCIIHexDecode|LZWDecode|RunLengthDecode/;

export function extractPdfText(bytes: Uint8Array): PdfTextResult {
  if (bytes.byteLength > PDF_MAX_BYTES) return { ok: false, code: "too-large" };
  if (bytes.byteLength < 8 || Buffer.from(bytes.subarray(0, 5)).toString("latin1") !== "%PDF-") {
    return { ok: false, code: "not-pdf" };
  }
  if (containsToken(bytes, "/Encrypt")) return { ok: false, code: "encrypted" };

  const parts: string[] = [];
  for (const stream of readStreams(bytes)) {
    const shown = extractShownText(stream);
    if (shown) parts.push(shown);
  }
  const text = parts.join(" ").replace(/\s+/g, " ").trim();
  if (!text) return { ok: false, code: "no-text" };
  return { ok: true, text: text.length <= PDF_MAX_TEXT ? text : text.slice(0, PDF_MAX_TEXT) };
}

function containsToken(bytes: Uint8Array, token: string): boolean {
  const needle = Buffer.from(token, "latin1");
  const haystack = Buffer.from(bytes);
  return haystack.includes(needle);
}

function readStreams(bytes: Uint8Array): string[] {
  const latin = Buffer.from(bytes).toString("latin1");
  const streams: string[] = [];
  let cursor = 0;
  while (cursor < latin.length) {
    const at = latin.indexOf("stream", cursor);
    if (at < 0) break;
    const previous = at === 0 ? " " : latin[at - 1];
    if (/[A-Za-z0-9]/.test(previous ?? "")) {
      cursor = at + 6;
      continue;
    }
    const dictStart = latin.lastIndexOf("<<", at);
    const dict = dictStart >= 0 && at - dictStart < 4000 ? latin.slice(dictStart, at) : "";
    let dataStart = at + "stream".length;
    if (latin[dataStart] === "\r" && latin[dataStart + 1] === "\n") dataStart += 2;
    else if (latin[dataStart] === "\n" || latin[dataStart] === "\r") dataStart += 1;

    const lengthMatch = /\/Length\s+(\d+)/.exec(dict);
    let raw: Buffer;
    if (lengthMatch) {
      const length = Number(lengthMatch[1]);
      if (!Number.isInteger(length) || length < 0 || dataStart + length > bytes.byteLength) {
        cursor = dataStart + 1;
        continue;
      }
      raw = Buffer.from(bytes.subarray(dataStart, dataStart + length));
      cursor = dataStart + length;
    } else {
      const end = latin.indexOf("endstream", dataStart);
      if (end < 0) break;
      let dataEnd = end;
      if (latin[dataEnd - 1] === "\n") dataEnd -= 1;
      if (latin[dataEnd - 1] === "\r") dataEnd -= 1;
      raw = Buffer.from(bytes.subarray(dataStart, Math.max(dataStart, dataEnd)));
      cursor = end + "endstream".length;
    }
    const decoded = decodeStream(dict, raw);
    if (decoded) streams.push(decoded);
  }
  return streams;
}

function decodeStream(dict: string, raw: Buffer): string | null {
  const filterMatch = /\/Filter\s*(\[[^\]]+\]|\/[A-Za-z0-9]+)/.exec(dict);
  const filter = filterMatch?.[1] ?? "";
  try {
    if (filter.includes("FlateDecode")) {
      try {
        return inflateSync(raw).toString("latin1");
      } catch {
        return inflateRawSync(raw).toString("latin1");
      }
    }
    if (filter && IMAGE_FILTER.test(filter)) return null;
    return raw.toString("latin1");
  } catch {
    return null;
  }
}

function extractShownText(content: string): string {
  const parts: string[] = [];
  let index = 0;
  while (index < content.length) {
    const char = content[index];
    if (char === "(") {
      const parsed = readLiteral(content, index);
      if (!parsed) break;
      const after = skipSpace(content, parsed.end);
      if (content.startsWith("Tj", after) || content[after] === "'" || content[after] === '"') {
        parts.push(parsed.text);
      }
      index = parsed.end;
      continue;
    }
    if (char === "<" && content[index + 1] !== "<") {
      const parsed = readHex(content, index);
      if (!parsed) {
        index += 1;
        continue;
      }
      const after = skipSpace(content, parsed.end);
      if (content.startsWith("Tj", after)) parts.push(parsed.text);
      index = parsed.end;
      continue;
    }
    if (char === "[") {
      const end = findArrayEnd(content, index);
      if (end < 0) break;
      const after = skipSpace(content, end);
      if (content.startsWith("TJ", after)) parts.push(...stringsInArray(content.slice(index + 1, end - 1)));
      index = end;
      continue;
    }
    index += 1;
  }
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

function skipSpace(content: string, index: number): number {
  let cursor = index;
  while (cursor < content.length && /\s/.test(content[cursor] ?? "")) cursor += 1;
  return cursor;
}

function readLiteral(content: string, start: number): { text: string; end: number } | null {
  if (content[start] !== "(") return null;
  let index = start + 1;
  let text = "";
  while (index < content.length) {
    const char = content[index];
    if (char === "\\") {
      const next = content[index + 1];
      if (next === undefined) return null;
      if (next === "n") text += "\n";
      else if (next === "r") text += "\r";
      else if (next === "t") text += "\t";
      else if (next === "b") text += "\b";
      else if (next === "f") text += "\f";
      else if (next === "(" || next === ")" || next === "\\") text += next;
      else if (next === "\n" || next === "\r") {
        index += 2;
        if (next === "\r" && content[index] === "\n") index += 1;
        continue;
      } else {
        const octal = /^[0-7]{1,3}/.exec(content.slice(index + 1));
        if (octal) {
          text += String.fromCharCode(Number.parseInt(octal[0], 8));
          index += 1 + octal[0].length;
          continue;
        }
        text += next;
      }
      index += 2;
      continue;
    }
    if (char === ")") return { text, end: index + 1 };
    text += char;
    index += 1;
  }
  return null;
}

function readHex(content: string, start: number): { text: string; end: number } | null {
  if (content[start] !== "<") return null;
  const end = content.indexOf(">", start + 1);
  if (end < 0) return null;
  const hex = content.slice(start + 1, end).replace(/\s+/g, "");
  if (hex.length === 0 || /[^0-9A-Fa-f]/.test(hex)) return null;
  const padded = hex.length % 2 === 0 ? hex : `${hex}0`;
  const buffer = Buffer.from(padded, "hex");
  const text =
    buffer.length >= 2 && buffer[0] === 0xfe && buffer[1] === 0xff
      ? decodeUtf16Be(buffer.subarray(2))
      : buffer.toString("latin1");
  return { text, end: end + 1 };
}

function decodeUtf16Be(buffer: Uint8Array): string {
  let text = "";
  for (let index = 0; index + 1 < buffer.length; index += 2) {
    text += String.fromCharCode(((buffer[index] ?? 0) << 8) | (buffer[index + 1] ?? 0));
  }
  return text;
}

function findArrayEnd(content: string, start: number): number {
  let depth = 0;
  let index = start;
  while (index < content.length) {
    const char = content[index];
    if (char === "(") {
      const parsed = readLiteral(content, index);
      if (!parsed) return -1;
      index = parsed.end;
      continue;
    }
    if (char === "[") depth += 1;
    if (char === "]") {
      depth -= 1;
      if (depth === 0) return index + 1;
    }
    index += 1;
  }
  return -1;
}

function stringsInArray(content: string): string[] {
  const parts: string[] = [];
  let index = 0;
  while (index < content.length) {
    if (content[index] === "(") {
      const parsed = readLiteral(content, index);
      if (!parsed) break;
      parts.push(parsed.text);
      index = parsed.end;
      continue;
    }
    if (content[index] === "<" && content[index + 1] !== "<") {
      const parsed = readHex(content, index);
      if (!parsed) {
        index += 1;
        continue;
      }
      parts.push(parsed.text);
      index = parsed.end;
      continue;
    }
    index += 1;
  }
  return parts;
}
