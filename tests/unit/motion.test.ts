import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { compileProject, sampleScene } from "@/modules/motion/compile";
import { cuesForNarration, groupWords, wordsFromEdgeMetadata } from "@/modules/motion/cues";
import { incidentScripts } from "@/modules/motion/fixtures/incident-authoring";
import { parseVideoProject, templateIds, totalFrames } from "@/modules/motion/schema";
import { inspectProject } from "@/modules/motion/validate";

describe("motion design engine", () => {
  it("compiles every catalogue template inside the frame", () => {
    for (const template of templateIds) {
      const project = parseVideoProject(
        compileProject({
          id: "catalogue",
          version: 1,
          title: "Catalogue",
          language: "fr",
          theme: "technical-blueprint",
          scenes: [sampleScene(template)],
        }),
      );
      expect(inspectProject(project)).toEqual([]);
      expect(project.scenes[0]?.template).toBe(template);
    }
  });

  it("keeps a second compile identical", () => {
    const draft = {
      id: "stable",
      version: 1,
      title: "Stable",
      language: "fr" as const,
      theme: "minimal-professional" as const,
      scenes: [sampleScene("cause-effect", 3200)],
    };
    expect(compileProject(draft)).toEqual(compileProject(draft));
  });

  it("groups provider word timings and does not invent them", () => {
    const words = wordsFromEdgeMetadata({
      Metadata: [
        { Type: "WordBoundary", Data: { Offset: 0, Duration: 3_000_000, text: { Text: "Un" } } },
        { Type: "SentenceBoundary", Data: { Offset: 0, Duration: 9_000_000, text: { Text: "ignored" } } },
        { Type: "WordBoundary", Data: { Offset: 3_500_000, Duration: 4_000_000, text: { Text: "signal." } } },
      ],
    });
    expect(words).toEqual([
      { text: "Un", startMs: 0, endMs: 300 },
      { text: "signal.", startMs: 350, endMs: 750 },
    ]);
    expect(groupWords([...words, { text: "Suite", startMs: 800, endMs: 1100 }])).toEqual([
      { text: "Un signal.", startMs: 0, endMs: 750 },
      { text: "Suite", startMs: 800, endMs: 1100 },
    ]);
    expect(cuesForNarration("scene", "sans temps", 2000, [])[0]?.source).toBe("segment");
  });

  it("loads the incident storyboard as eight editable scenes", () => {
    const project = parseVideoProject(JSON.parse(readFileSync("src/modules/motion/fixtures/incident-it.json", "utf8")));
    expect(project.scenes.map((scene) => scene.id)).toEqual(incidentScripts.map((scene) => scene.id));
    expect(inspectProject(project)).toEqual([]);
    expect(totalFrames(project)).toBeGreaterThan(30 * 60);
    expect(project.scenes.reduce((sum, scene) => sum + scene.durationMs, 0)).toBeLessThan(180_000);
    for (const scene of project.scenes) {
      expect(existsSync(`public/${scene.narration.audioSrc}`)).toBe(true);
      expect(scene.subtitles.length).toBeGreaterThan(0);
    }
    const edited = {
      ...project,
      scenes: project.scenes.map((scene, index) =>
        index === 2 ? { ...scene, narration: { ...scene.narration, text: "Texte modifié" } } : scene,
      ),
    };
    expect(edited.scenes[1]?.objects).toEqual(project.scenes[1]?.objects);
    expect(edited.scenes[2]?.narration.text).toBe("Texte modifié");
    expect(parseVideoProject(edited).scenes[3]?.id).toBe(project.scenes[3]?.id);
  });
});
