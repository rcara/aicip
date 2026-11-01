"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Player } from "@remotion/player";

import type { ExplainerScene, ThemeId, VideoProject } from "@/modules/motion/schema";
import { parseVideoProject, totalFrames } from "@/modules/motion/schema";
import { inspectProject } from "@/modules/motion/validate";
import { templateLabels, themes } from "@/modules/motion/themes";

import { ExplainerComposition } from "../../remotion/ExplainerComposition";

const DEFAULT_TOPIC =
  "Explique le fonctionnement d'un processus de gestion des incidents IT, de la déclaration jusqu'à la résolution.";

type PlanItem = { heading: string };

export function ExplainStudio({ project }: { project: VideoProject }) {
  const [base, setBase] = useState(project);
  const [theme, setTheme] = useState<ThemeId>(project.theme);
  const [scenes, setScenes] = useState(project.scenes);
  const [selected, setSelected] = useState(0);
  const [topic, setTopic] = useState(DEFAULT_TOPIC);
  const [language, setLanguage] = useState<"fr" | "en">(project.language);
  const [sourceText, setSourceText] = useState("");
  const [pdf, setPdf] = useState<File | null>(null);
  const [plan, setPlan] = useState<PlanItem[] | null>(null);
  const [objective, setObjective] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generation, setGeneration] = useState(0);
  const scene = scenes[selected] ?? scenes[0];
  const edited = useMemo<VideoProject>(() => ({ ...base, theme, scenes }), [base, theme, scenes]);

  function updateNarration(value: string) {
    setScenes((current) =>
      current.map((item, index) => {
        if (index !== selected) return item;
        return retitle(item, value);
      }),
    );
  }

  async function onGenerate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (pdf && pdf.size > 2_000_000) {
      setError("Le PDF dépasse 2 Mo.");
      return;
    }
    setPending(true);
    try {
      const pdfBase64 = pdf ? await fileToBase64(pdf) : undefined;
      const response = await fetch("/api/v1/explain", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          topic,
          language,
          theme,
          text: sourceText,
          pdfBase64,
        }),
      });
      const body = (await response.json()) as {
        ok?: boolean;
        code?: string;
        project?: unknown;
        plan?: PlanItem[];
        objective?: string;
      };
      if (!response.ok || !body.ok || !body.project) {
        setError(refusalMessage(body.code));
        return;
      }
      const next = parseVideoProject(body.project);
      if (inspectProject(next).length > 0) {
        setError(refusalMessage("invalid-document"));
        return;
      }
      setBase(next);
      setTheme(next.theme);
      setScenes(next.scenes);
      setSelected(0);
      setPlan(body.plan ?? null);
      setObjective(body.objective ?? null);
      setGeneration((current) => current + 1);
    } catch {
      setError(refusalMessage("invalid-document"));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-8">
      <header className="max-w-3xl">
        <p className="text-sm uppercase tracking-[0.16em] text-accent">Studio</p>
        <h1 className="mt-3 font-serif text-4xl leading-tight tracking-tight sm:text-5xl">
          Que voulez-vous expliquer ?
        </h1>
        <form className="mt-6 space-y-4" onSubmit={onGenerate}>
          <label className="block">
            <span className="text-sm font-semibold">Sujet</span>
            <textarea
              className="mt-2 min-h-24 w-full rounded-3xl border border-line bg-paper-2 px-4 py-3"
              value={topic}
              maxLength={500}
              required
              onChange={(event) => setTopic(event.target.value)}
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-semibold">Langue</span>
              <select
                className="mt-2 w-full rounded-2xl border border-line bg-paper-2 px-3 py-2"
                value={language}
                onChange={(event) => setLanguage(event.target.value as "fr" | "en")}
              >
                <option value="fr">Français</option>
                <option value="en">English</option>
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-semibold">PDF avec texte</span>
              <input
                className="mt-2 block w-full text-sm"
                type="file"
                accept="application/pdf,.pdf"
                onChange={(event) => setPdf(event.target.files?.[0] ?? null)}
              />
            </label>
          </div>
          <label className="block">
            <span className="text-sm font-semibold">Texte source, facultatif</span>
            <textarea
              className="mt-2 min-h-24 w-full rounded-3xl border border-line bg-paper-2 px-4 py-3"
              value={sourceText}
              maxLength={20000}
              onChange={(event) => setSourceText(event.target.value)}
            />
          </label>
          <button
            type="submit"
            className="rounded-full bg-ink px-5 py-2 font-semibold text-paper-2 disabled:opacity-60"
            disabled={pending || topic.trim().length === 0}
          >
            {pending ? "Préparation…" : "Préparer le storyboard"}
          </button>
        </form>
        {error ? (
          <p role="alert" className="mt-4 rounded-2xl border border-line bg-paper-2 px-4 py-3 text-sm">
            {error}
          </p>
        ) : null}
        <p className="mt-3 text-sm text-ink-soft">
          {objective
            ? "Le storyboard vient du fournisseur mock ou du fournisseur configuré. La voix est un silence de remplacement. L'export MP4 du film d'incident reste npm run motion:render."
            : "L'aperçu initial est le storyboard figé de l'incident IT. Préparer un storyboard choisit un plan, un script et des modèles visuels, puis refuse un document invalide avant de l'afficher."}
        </p>
        {objective ? <p className="mt-2 text-sm">{objective}</p> : null}
      </header>
      <div className="grid items-start gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <section aria-label="Storyboard" className="rounded-3xl border border-line bg-paper-2 p-3">
          <h2 className="px-2 py-2 font-serif text-2xl">Storyboard</h2>
          {plan ? (
            <ol className="mb-3 space-y-1 px-2 text-sm text-ink-soft">
              {plan.map((item, index) => (
                <li key={`${index}-${item.heading}`}>{item.heading}</li>
              ))}
            </ol>
          ) : null}
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
              key={generation}
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
            Export MP4 reproductible du film figé : <code>npm run motion:render</code>. Le fichier sort dans{" "}
            <code>out/incident-it.mp4</code>.
          </p>
        </section>
      </div>
    </div>
  );
}

function refusalMessage(code: string | undefined): string {
  switch (code) {
    case "not-pdf":
      return "Ce fichier n'est pas un PDF.";
    case "encrypted":
      return "Ce PDF est chiffré et n'a pas été lu.";
    case "no-text":
      return "Ce PDF ne contient pas de texte extractible. Aucun rendu n'a été lancé.";
    case "too-large":
      return "Le PDF dépasse la taille autorisée.";
    case "disabled":
      return "La génération est désactivée.";
    case "provider-error":
      return "Le fournisseur n'a pas renvoyé de document utilisable. Aucun rendu n'a été lancé.";
    case "rate-limited":
      return "Trop de préparations en une minute.";
    default:
      return "Le document est invalide et a été refusé avant le rendu.";
  }
}

async function fileToBase64(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  const size = 0x8000;
  for (let index = 0; index < bytes.length; index += size) {
    binary += String.fromCharCode(...bytes.subarray(index, index + size));
  }
  return btoa(binary);
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
