import type { ExplainerMode, RealExplainerConfig } from "@/lib/config";
import type { TemplateId, ThemeId, VideoProject } from "@/modules/motion/schema";
import type { ProjectIssue } from "@/modules/motion/validate";

import type { ModelDocument } from "./document";
import { gateModelDocument } from "./gate";
import { ExplainerOutputError, fetchExplainerTransport, requestExplainer, type ExplainerTransport } from "./http";
import { clip, detectLanguage, mockDocument } from "./mock";

export type GenerationSuccess = {
  ok: true;
  source: "mock" | "real";
  provider: string;
  model: string;
  language: "fr" | "en";
  objective: string;
  audience: string;
  plan: Array<{ heading: string }>;
  script: Array<{ title: string; narration: string; template: TemplateId }>;
  project: VideoProject;
};

export type GenerationFailure = {
  ok: false;
  code: "disabled" | "invalid-document" | "provider-error";
  stage?: "schema" | "inspection" | "language";
  issues?: ProjectIssue[];
};

export type GenerationResult = GenerationSuccess | GenerationFailure;

function succeed(document: ModelDocument, project: VideoProject, source: "mock" | "real", model: string): GenerationSuccess {
  return {
    ok: true,
    source,
    provider: source === "mock" ? "mock" : "operator-http",
    model,
    language: document.language,
    objective: document.objective,
    audience: document.audience,
    plan: document.plan,
    script: document.scenes.map((scene) => ({
      title: scene.props.title,
      narration: scene.narration,
      template: scene.props.template,
    })),
    project,
  };
}

function fromDocument(
  document: ModelDocument,
  theme: ThemeId,
  source: "mock" | "real",
  model: string,
): GenerationResult {
  const gated = gateModelDocument(document, theme);
  if (!gated.ok) {
    return { ok: false, code: "invalid-document", stage: gated.stage, issues: gated.issues };
  }
  return succeed(document, gated.project, source, model);
}

export async function generateExplainer(input: {
  topic: string;
  sourceText?: string;
  language?: "fr" | "en";
  theme?: ThemeId;
  mode: ExplainerMode;
  config?: RealExplainerConfig | null;
  transport?: ExplainerTransport;
}): Promise<GenerationResult> {
  if (input.mode === "off") return { ok: false, code: "disabled" };
  const topic = clip(input.topic, 500);
  const sourceText = clip(input.sourceText ?? "", 12_000);
  if (!topic) return { ok: false, code: "invalid-document", stage: "schema" };
  const language = detectLanguage(topic, sourceText, input.language);
  const theme = input.theme ?? "minimal-professional";

  if (input.mode === "real" && input.config) {
    try {
      const document = await requestExplainer({
        config: input.config,
        brief: { topic, sourceText, language },
        transport: input.transport ?? fetchExplainerTransport,
      });
      if (document.language !== language) {
        return { ok: false, code: "invalid-document", stage: "language" };
      }
      return fromDocument(document, theme, "real", input.config.model);
    } catch (error) {
      if (error instanceof ExplainerOutputError) {
        return { ok: false, code: "invalid-document", stage: "schema" };
      }
      return { ok: false, code: "provider-error" };
    }
  }

  const document = mockDocument({ topic, sourceText, language });
  return fromDocument(document, theme, "mock", "mock-v1");
}
