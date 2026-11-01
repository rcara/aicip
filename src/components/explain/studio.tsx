"use client";

import { useMemo, useState } from "react";
import { Player } from "@remotion/player";

import type { ExplainerScene, ThemeId, VideoProject } from "@/modules/motion/schema";
import { totalFrames } from "@/modules/motion/schema";
import { templateLabels, themes } from "@/modules/motion/themes";

import { ExplainerComposition } from "../../remotion/ExplainerComposition";

const PROMPT =
  "Explique le fonctionnement d'un processus de gestion des incidents IT, de la déclaration jusqu'à la résolution.";

export function ExplainStudio({ project }: { project: VideoProject }) {
  const [theme, setTheme] = useState<ThemeId>(project.theme);
  const [scenes, setScenes] = useState(project.scenes);
  const [selected, setSelected] = useState(0);
  const scene = scenes[selected] ?? scenes[0];
  const edited = useMemo<VideoProject>(() => ({ ...project, theme, scenes }), [project, theme, scenes]);

  function updateNarration(value: string) {
    setScenes((current) =>
      current.map((item, index) => {
        if (index !== selected) return item;
        return retitle(item, value);
      }),
    );
  }

  return (
    <div className="space-y-8">
      <header className="max-w-3xl">
        <p className="text-sm uppercase tracking-[0.16em] text-accent">Studio</p>
        <h1 className="mt-3 font-serif text-4xl leading-tight tracking-tight sm:text-5xl">
          Que voulez-vous expliquer ?
        </h1>
        <label className="mt-6 block">
          <span className="text-sm font-semibold">Sujet</span>
          <textarea
            className="mt-2 min-h-24 w-full rounded-3xl border border-line bg-paper-2 px-4 py-3"
            readOnly
            value={PROMPT}
          />
        </label>
        <p className="mt-3 text-sm text-ink-soft">
          Cette preuve joue le storyboard version {project.version}, sans modèle de langage. Le style et le texte des
          sous-titres se modifient ici. La voix reste le fichier audio déjà mesuré.
        </p>
      </header>
      <div className="grid items-start gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <section aria-label="Storyboard" className="rounded-3xl border border-line bg-paper-2 p-3">
          <h2 className="px-2 py-2 font-serif text-2xl">Storyboard</h2>
          <ol className="space-y-1">
            {scenes.map((item, index) => (
              <li key={item.id}>
                <button
                  type="button"
                  className={`w-full rounded-2xl px-3 py-2 text-left ${index === selected ? "bg-ink text-paper-2" : "hover:bg-paper"}`}
                  onClick={() => setSelected(index)}
                  aria-current={index === selected ? "true" : undefined}
                >
                  <span className="block text-sm opacity-70">
                    {index + 1}. {templateLabels[item.template]}
                  </span>
                  <span className="block font-semibold">{item.title}</span>
                </button>
              </li>
            ))}
          </ol>
        </section>
        <section className="space-y-4">
          <div className="overflow-hidden rounded-3xl border border-line bg-black">
            <Player
              component={ExplainerComposition}
              inputProps={{ project: edited }}
              durationInFrames={totalFrames(edited)}
              compositionWidth={edited.width}
              compositionHeight={edited.height}
              fps={edited.fps}
              controls
              acknowledgeRemotionLicense
              style={{ width: "100%" }}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-[16rem_minmax(0,1fr)]">
            <label className="block">
              <span className="text-sm font-semibold">Style</span>
              <select
                className="mt-2 w-full rounded-2xl border border-line bg-paper-2 px-3 py-2"
                value={theme}
                onChange={(event) => setTheme(event.target.value as ThemeId)}
              >
                {Object.values(themes).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-semibold">Texte de « {scene?.title} »</span>
              <textarea
                className="mt-2 min-h-28 w-full rounded-3xl border border-line bg-paper-2 px-4 py-3"
                value={scene?.narration.text ?? ""}
                onChange={(event) => updateNarration(event.target.value)}
              />
            </label>
          </div>
          <p className="text-sm text-ink-soft">
            Export MP4 reproductible : <code>npm run motion:render</code>. Le fichier sort dans{" "}
            <code>out/incident-it.mp4</code>.
          </p>
        </section>
      </div>
    </div>
  );
}

function retitle(scene: ExplainerScene, text: string): ExplainerScene {
  const narration = text.trim() ? text : scene.narration.text;
  return {
    ...scene,
    narration: { ...scene.narration, text: narration },
    subtitles: [
      {
        id: `${scene.id}-edit`,
        text: narration.slice(0, 280),
        startMs: 0,
        endMs: scene.narration.durationMs,
        source: "segment",
      },
    ],
  };
}
