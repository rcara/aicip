import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";

import type { ExplainerScene, VideoProject } from "../modules/motion/schema";

import { SceneFrame } from "./SceneGraphics";

function sceneStarts(scenes: ExplainerScene[]): number[] {
  const starts: number[] = [];
  let cursor = 0;
  for (const scene of scenes) {
    starts.push(cursor);
    cursor += scene.durationInFrames;
  }
  return starts;
}

const { fontFamily } = loadFont("normal", {
  weights: ["400", "600", "700"],
  subsets: ["latin"],
});

export function ExplainerComposition({ project }: { project: VideoProject }) {
  const starts = sceneStarts(project.scenes);
  return (
    <AbsoluteFill style={{ background: "#000", fontFamily }}>
      {project.scenes.map((scene, index) => (
        <Sequence key={scene.id} from={starts[index]} durationInFrames={scene.durationInFrames}>
          <SceneFrame scene={scene} themeId={project.theme} fontFamily={fontFamily} />
          <Audio src={staticFile(scene.narration.audioSrc)} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
}
