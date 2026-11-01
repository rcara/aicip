import type { SubtitleCue } from "./schema";

export type TimedWord = {
  text: string;
  startMs: number;
  endMs: number;
};

const TICKS_PER_MS = 10_000;

export function wordsFromEdgeMetadata(metadata: unknown): TimedWord[] {
  if (!metadata || typeof metadata !== "object") return [];
  const rows = (metadata as { Metadata?: unknown }).Metadata;
  if (!Array.isArray(rows)) return [];
  const words: TimedWord[] = [];
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const record = row as { Type?: unknown; Data?: unknown; data?: unknown };
    if (record.Type !== "WordBoundary") continue;
    const data = (record.Data ?? record.data) as
      | { Offset?: unknown; Duration?: unknown; text?: { Text?: unknown } | string }
      | undefined;
    if (!data) continue;
    const offset = data.Offset;
    const duration = data.Duration;
    const rawText = typeof data.text === "string" ? data.text : data.text?.Text;
    if (typeof offset !== "number" || typeof duration !== "number" || typeof rawText !== "string") continue;
    const text = rawText.trim();
    if (!text) continue;
    words.push({
      text,
      startMs: Math.round(offset / TICKS_PER_MS),
      endMs: Math.round((offset + duration) / TICKS_PER_MS),
    });
  }
  return words;
}

export function groupWords(words: TimedWord[], maxChars = 52): Array<Omit<SubtitleCue, "id" | "source">> {
  const groups: Array<Omit<SubtitleCue, "id" | "source">> = [];
  let current: Omit<SubtitleCue, "id" | "source"> | null = null;
  for (const word of words) {
    if (!current) {
      current = { text: word.text, startMs: word.startMs, endMs: word.endMs };
      continue;
    }
    const joined: string = `${current.text} ${word.text}`;
    const closed = /[.!?;:]$/.test(current.text) || joined.length > maxChars;
    if (closed) {
      groups.push(current);
      current = { text: word.text, startMs: word.startMs, endMs: word.endMs };
    } else {
      current = { text: joined, startMs: current.startMs, endMs: word.endMs };
    }
  }
  if (current) groups.push(current);
  return groups;
}

export function cuesForNarration(
  sceneId: string,
  narration: string,
  durationMs: number,
  words: TimedWord[],
): SubtitleCue[] {
  const grouped = groupWords(words).filter((cue) => cue.endMs > cue.startMs);
  if (grouped.length === 0) {
    return [
      {
        id: `${sceneId}-cue-1`,
        text: narration,
        startMs: 0,
        endMs: durationMs,
        source: "segment",
      },
    ];
  }
  return grouped.map((cue, index) => ({
    id: `${sceneId}-cue-${index + 1}`,
    text: cue.text,
    startMs: cue.startMs,
    endMs: Math.min(cue.endMs, durationMs),
    source: "word-boundary" as const,
  }));
}
