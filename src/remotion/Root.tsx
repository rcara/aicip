import { Composition } from "remotion";

import raw from "../modules/motion/fixtures/incident-it.json";
import { parseVideoProject, totalFrames } from "../modules/motion/schema";

import { ExplainerComposition } from "./ExplainerComposition";

const project = parseVideoProject(raw);

export function RemotionRoot() {
  return (
    <Composition
      id="IncidentIt"
      component={ExplainerComposition}
      durationInFrames={totalFrames(project)}
      fps={project.fps}
      width={project.width}
      height={project.height}
      defaultProps={{ project }}
    />
  );
}
