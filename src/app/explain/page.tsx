import raw from "@/modules/motion/fixtures/incident-it.json";
import { ExplainStudioLoader } from "@/components/explain/studio-loader";
import { parseVideoProject } from "@/modules/motion/schema";

export const metadata = {
  title: "Expliquer",
  description: "Prévisualisation d'une vidéo explicative composée depuis un storyboard.",
};

export default function ExplainPage() {
  const project = parseVideoProject(raw);
  return <ExplainStudioLoader project={project} />;
}
