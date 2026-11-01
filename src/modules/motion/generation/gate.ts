import { compileProject, layoutTemplate, type ProjectDraft } from "@/modules/motion/compile";
import { parseVideoProject, type ThemeId, type VideoProject } from "@/modules/motion/schema";
import { inspectProject, type ProjectIssue } from "@/modules/motion/validate";

import type { ModelDocument } from "./document";

export const PLACEHOLDER_AUDIO = "motion/generated/silence.wav";
export const PLACEHOLDER_AUDIO_MS = 1000;
export const PLACEHOLDER_VOICE = "placeholder";

export type GateFailure = {
  ok: false;
  stage: "schema" | "inspection";
  issues: ProjectIssue[];
};

export type GateSuccess = {
  ok: true;
  project: VideoProject;
};

export function draftFromModel(document: ModelDocument, theme: ThemeId): ProjectDraft {
  return {
    id: "generated",
    version: 1,
    title: document.title,
    language: document.language,
    theme,
    scenes: document.scenes.map((scene, index) => ({
      id: `scene-${index + 1}`,
      title: scene.props.title,
      narration: scene.narration,
      audioSrc: PLACEHOLDER_AUDIO,
      voice: PLACEHOLDER_VOICE,
      audioDurationMs: PLACEHOLDER_AUDIO_MS,
      words: [],
      props: scene.props,
    })),
  };
}

export function gateModelDocument(document: ModelDocument, theme: ThemeId): GateFailure | GateSuccess {
  try {
    const compiled = compileProject(draftFromModel(document, theme));
    for (const [index, scene] of compiled.scenes.entries()) {
      const props = document.scenes[index]?.props;
      if (!props) return { ok: false, stage: "schema", issues: [] };
      const laidOut = layoutTemplate(props);
      if (JSON.stringify(scene.objects) !== JSON.stringify(laidOut)) {
        return { ok: false, stage: "schema", issues: [] };
      }
    }
    const project = parseVideoProject(compiled);
    const issues = inspectProject(project);
    if (issues.length > 0) return { ok: false, stage: "inspection", issues };
    return { ok: true, project };
  } catch {
    return { ok: false, stage: "schema", issues: [] };
  }
}

export function acceptDocumentForRender(value: unknown): GateFailure | GateSuccess {
  try {
    const project = parseVideoProject(value);
    const issues = inspectProject(project);
    if (issues.length > 0) return { ok: false, stage: "inspection", issues };
    return { ok: true, project };
  } catch {
    return { ok: false, stage: "schema", issues: [] };
  }
}
