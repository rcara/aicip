import {
  SAFE_BOTTOM,
  SAFE_RIGHT,
  SAFE_TOP,
  SAFE_X,
  framesFromMs,
  type VideoProject,
} from "./schema";

export type ProjectIssue = {
  sceneId: string;
  code: string;
  detail: string;
};

const AUDIO_PATH = /^motion\/[a-z0-9/_-]+\.(mp3|wav)$/;

export function inspectProject(project: VideoProject): ProjectIssue[] {
  const issues: ProjectIssue[] = [];
  const sceneIds = new Set<string>();
  for (const scene of project.scenes) {
    if (sceneIds.has(scene.id)) {
      issues.push({ sceneId: scene.id, code: "duplicate-scene", detail: scene.id });
    }
    sceneIds.add(scene.id);
    if (scene.template.length === 0) {
      issues.push({ sceneId: scene.id, code: "template", detail: "empty" });
    }
    if (framesFromMs(scene.durationMs, project.fps) !== scene.durationInFrames) {
      issues.push({
        sceneId: scene.id,
        code: "duration-frames",
        detail: `${scene.durationInFrames} != ${framesFromMs(scene.durationMs, project.fps)}`,
      });
    }
    if (scene.narration.durationMs > scene.durationMs) {
      issues.push({ sceneId: scene.id, code: "audio-longer-than-scene", detail: scene.narration.audioSrc });
    }
    if (!AUDIO_PATH.test(scene.narration.audioSrc) || scene.narration.audioSrc.includes("..")) {
      issues.push({ sceneId: scene.id, code: "audio-path", detail: scene.narration.audioSrc });
    }
    const objectIds = new Set<string>();
    for (const item of scene.objects) {
      if (objectIds.has(item.id)) {
        issues.push({ sceneId: scene.id, code: "duplicate-object", detail: item.id });
      }
      objectIds.add(item.id);
      const right = item.x + item.width;
      const bottom = item.y + item.height;
      if (item.x < SAFE_X || item.y < SAFE_TOP || right > SAFE_RIGHT || bottom > SAFE_BOTTOM) {
        issues.push({
          sceneId: scene.id,
          code: "overflow",
          detail: `${item.id} ${item.x},${item.y} ${item.width}x${item.height}`,
        });
      }
      if (item.appearAtMs >= scene.durationMs) {
        issues.push({ sceneId: scene.id, code: "appear-after-end", detail: item.id });
      }
      if ((item.type === "text" || item.type === "node" || item.type === "badge") && !item.text) {
        issues.push({ sceneId: scene.id, code: "missing-text", detail: item.id });
      }
    }
    let previousEnd = -1;
    for (const cue of scene.subtitles) {
      if (cue.endMs <= cue.startMs || cue.endMs > scene.narration.durationMs) {
        issues.push({ sceneId: scene.id, code: "subtitle-range", detail: cue.id });
      }
      if (cue.startMs < previousEnd) {
        issues.push({ sceneId: scene.id, code: "subtitle-overlap", detail: cue.id });
      }
      previousEnd = cue.endMs;
    }
  }
  return issues;
}
