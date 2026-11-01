"use client";

import dynamic from "next/dynamic";

import type { VideoProject } from "@/modules/motion/schema";

const ExplainStudio = dynamic(() => import("./studio").then((mod) => mod.ExplainStudio), {
  ssr: false,
  loading: () => (
    <p role="status" className="rounded-3xl border border-line bg-paper-2 px-4 py-3">
      Chargement du lecteur…
    </p>
  ),
});

export function ExplainStudioLoader({ project }: { project: VideoProject }) {
  return <ExplainStudio project={project} />;
}
