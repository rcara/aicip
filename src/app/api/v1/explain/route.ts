import { z } from "zod";

import { getExplainerMode, getRealExplainerConfig } from "@/lib/config";
import { allowRequest } from "@/lib/http";
import { generateExplainer } from "@/modules/motion/generation/generate";
import { extractPdfText, PDF_MAX_BYTES } from "@/modules/motion/generation/pdf-text";
import { themeIds } from "@/modules/motion/schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const bodySchema = z
  .object({
    topic: z.string().trim().min(1).max(500),
    language: z.enum(["fr", "en"]).optional(),
    theme: z.enum(themeIds).optional(),
    text: z.string().max(20_000).optional(),
    pdfBase64: z.string().max(2_800_000).optional(),
  })
  .strict();

function decodePdf(value: string): Buffer | null {
  const compact = value.replace(/\s+/g, "");
  if (!compact || !/^[A-Za-z0-9+/=]+$/.test(compact)) return null;
  const buffer = Buffer.from(compact, "base64");
  if (buffer.length === 0 || buffer.length > PDF_MAX_BYTES) return null;
  return buffer;
}

export async function POST(request: Request) {
  if (!allowRequest("explain-generation", 30, 60_000)) {
    return Response.json({ ok: false, code: "rate-limited" }, { status: 429 });
  }
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ ok: false, code: "invalid-input" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return Response.json({ ok: false, code: "invalid-input" }, { status: 400 });

  let sourceText = parsed.data.text?.trim() ?? "";
  if (parsed.data.pdfBase64) {
    const bytes = decodePdf(parsed.data.pdfBase64);
    if (!bytes) return Response.json({ ok: false, code: "invalid-input" }, { status: 400 });
    const extracted = extractPdfText(bytes);
    if (!extracted.ok) return Response.json({ ok: false, code: extracted.code }, { status: 422 });
    sourceText = [sourceText, extracted.text].filter(Boolean).join("\n");
  }

  const result = await generateExplainer({
    topic: parsed.data.topic,
    sourceText,
    language: parsed.data.language,
    theme: parsed.data.theme,
    mode: getExplainerMode(),
    config: getRealExplainerConfig(),
  });
  if (!result.ok) {
    const status = result.code === "disabled" ? 403 : result.code === "provider-error" ? 502 : 422;
    return Response.json(result, { status });
  }
  return Response.json(result);
}
