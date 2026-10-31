"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { Messages } from "@/lib/i18n";

type TimelineItem =
  | { kind: "line"; speaker: string; text: string }
  | { kind: "choice"; label: string; prompt: string };

type AttemptView = {
  id: string;
  status: "in_progress" | "completed";
  timeline: TimelineItem[];
  current: {
    type: "dialogue" | "decision" | "ending";
    speaker: string;
    text: string;
    choices?: Array<{ id: string; label: string }>;
  } | null;
  progress: {
    phase: "reading" | "decision" | "debrief";
    decisionIndex: number;
    decisionTotal: number;
  };
  debrief: {
    exerciseIndicator: number | null;
    outcome: string | null;
    endingText: string | null;
    competencies: Array<{
      competencyId: string;
      label: string;
      weight: number;
      normalized: number;
      observations: string[];
    }>;
    alternative: { choiceLabel: string; evidence: string } | null;
    disclaimer: string;
    choices: Array<{ choiceId: string; label: string; evidence: string; prompt: string }>;
  } | null;
  replayPoints: Array<{ fromSequence: number; prompt: string; choiceLabel: string }>;
  comparison: {
    parentId: string;
    parentIndicator: number | null;
    currentIndicator: number | null;
  } | null;
};

type CoachView = {
  source: "mock" | "fallback";
  certifying: false;
  output: {
    summary: string;
    strengths: Array<{ comment: string; evidence: string }>;
    improvements: Array<{ suggestion: string; evidence: string }>;
    alternativeReply: string;
    reflectionQuestion: string;
    uncertain: boolean;
  };
};

type Presentation = {
  title: string;
  briefing: string;
  objective: string;
  disclaimer: string;
  audience: string;
  durationMinutes: number;
  competencies: Array<{ id: string; label: string; weight: number }>;
};

async function readJson(response: Response): Promise<{ attempt?: AttemptView; error?: { message?: string }; coach?: CoachView | null }> {
  return (await response.json()) as {
    attempt?: AttemptView;
    error?: { message?: string };
    coach?: CoachView | null;
  };
}

export function SimulationPlayer({
  slug,
  presentation,
  initialAttempt,
  initialCoach,
  initialError,
  messages,
}: {
  slug: string;
  presentation: Presentation;
  initialAttempt: AttemptView | null;
  initialCoach: CoachView | null;
  initialError: string | null;
  messages: Messages;
}) {
  const router = useRouter();
  const [attempt, setAttempt] = useState<AttemptView | null>(initialAttempt);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const [choiceId, setChoiceId] = useState("");
  const [coach, setCoach] = useState<CoachView | null>(initialCoach);
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);

  const loadCoach = async (id: string) => {
    const response = await fetch(`/api/v1/attempts/${id}/coach`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    });
    if (!response.ok) return;
    const body = await readJson(response);
    setCoach(body.coach ?? null);
  };

  async function start() {
    setPending(true);
    setError(null);
    const response = await fetch("/api/v1/attempts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug }),
    });
    const body = await readJson(response);
    setPending(false);
    if (!response.ok || !body.attempt) {
      setError(body.error?.message ?? messages.player.error);
      return;
    }
    setAttempt(body.attempt);
    router.replace(`/demo/${slug}?attempt=${body.attempt.id}`);
  }

  async function postAction(path: string, extra: Record<string, unknown>) {
    if (!attempt || pending) return;
    setPending(true);
    setError(null);
    const response = await fetch(path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...extra, idempotencyKey: crypto.randomUUID() }),
    });
    const body = await readJson(response);
    setPending(false);
    if (!response.ok || !body.attempt) {
      setError(body.error?.message ?? messages.player.error);
      return;
    }
    setAttempt(body.attempt);
    setChoiceId("");
    if (body.attempt.status === "completed") await loadCoach(body.attempt.id);
  }

  async function replay(fromSequence: number) {
    if (!attempt || pending) return;
    setPending(true);
    setError(null);
    const response = await fetch(`/api/v1/attempts/${attempt.id}/replay`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ fromSequence }),
    });
    const body = await readJson(response);
    setPending(false);
    if (!response.ok || !body.attempt) {
      setError(body.error?.message ?? messages.player.error);
      return;
    }
    setCoach(null);
    setAttempt(body.attempt);
    router.replace(`/demo/${slug}?attempt=${body.attempt.id}`);
  }

  async function saveNote() {
    if (!attempt) return;
    setPending(true);
    const response = await fetch(`/api/v1/attempts/${attempt.id}/transfer`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ note }),
    });
    setPending(false);
    if (response.ok) setSaved(true);
  }

  const progress = attempt?.progress;
  const progressLabel =
    !progress || progress.phase === "reading"
      ? messages.player.chapterReading
      : progress.phase === "debrief"
        ? messages.player.chapterDebrief
        : `${messages.player.chapterDecision} ${progress.decisionIndex} ${messages.player.of} ${progress.decisionTotal}`;

  return (
    <div className="grid gap-6 lg:grid-cols-[17rem_minmax(0,1fr)_18rem]">
      <aside className="order-2 rounded-3xl border border-line bg-paper-2 p-5 lg:order-1">
        <h2 className="font-serif text-2xl">{messages.player.context}</h2>
        <p className="mt-3 text-sm text-ink-soft">{presentation.audience}</p>
        <p className="mt-4">{presentation.briefing}</p>
        <p className="mt-4 text-sm">
          <span className="font-semibold">{messages.detail.objective}. </span>
          {presentation.objective}
        </p>
      </aside>

      <section aria-busy={pending} aria-live="polite" className="order-1 min-w-0 lg:order-2">
        {pending ? (
          <p className="mb-4 text-sm text-ink-soft" role="status">
            {messages.player.loading}
          </p>
        ) : null}
        {error ? (
          <div className="mb-4 rounded-2xl border border-danger/30 bg-white p-4" role="alert">
            <p>{error}</p>
            <button className="mt-3 underline" type="button" onClick={() => router.refresh()}>
              {messages.player.retry}
            </button>
          </div>
        ) : null}

        {!attempt ? (
          <div className="rounded-3xl border border-line bg-paper-2 p-6 sm:p-8">
            <p className="text-sm text-pine">{presentation.durationMinutes} min</p>
            <h1 className="mt-2 font-serif text-4xl tracking-tight">{presentation.title}</h1>
            <p className="mt-4 max-w-2xl text-lg">{presentation.briefing}</p>
            <p className="mt-4 text-sm text-ink-soft">{presentation.disclaimer}</p>
            <button
              className="mt-6 rounded-full bg-accent px-5 py-3 text-accent-ink disabled:opacity-60"
              disabled={pending}
              type="button"
              onClick={() => void start()}
            >
              {messages.player.start}
            </button>
          </div>
        ) : null}

        {attempt ? (
          <div className="rounded-3xl border border-line bg-paper-2 p-5 sm:p-7">
            <ol className="space-y-4">
              {attempt.timeline.map((item, index) =>
                item.kind === "line" ? (
                  <li key={`${item.speaker}-${index}`} className="max-w-2xl">
                    <p className="text-sm font-semibold text-pine">{item.speaker}</p>
                    <p className="mt-1">{item.text}</p>
                  </li>
                ) : (
                  <li key={`${item.label}-${index}`} className="max-w-2xl rounded-2xl bg-pine-soft px-4 py-3">
                    <p className="text-sm text-ink-soft">{item.prompt}</p>
                    <p className="mt-1">
                      <span className="font-semibold">{messages.player.you}. </span>
                      {item.label}
                    </p>
                  </li>
                ),
              )}
            </ol>

            {attempt.current?.type === "dialogue" ? (
              <div className="mt-6 max-w-2xl border-t border-line pt-5">
                <p className="text-sm font-semibold text-pine">{attempt.current.speaker}</p>
                <p className="mt-1 text-lg">{attempt.current.text}</p>
                <button
                  className="mt-5 rounded-full bg-ink px-5 py-3 text-paper-2 disabled:opacity-60"
                  disabled={pending}
                  type="button"
                  onClick={() => void postAction(`/api/v1/attempts/${attempt.id}/advance`, {})}
                >
                  {messages.player.continue}
                </button>
              </div>
            ) : null}

            {attempt.current?.type === "decision" ? (
              <form
                className="sticky bottom-0 mt-6 border-t border-line bg-paper-2 pt-5"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!choiceId) return;
                  void postAction(`/api/v1/attempts/${attempt.id}/choices`, { choiceId });
                }}
              >
                <fieldset disabled={pending}>
                  <legend className="text-lg font-semibold">{attempt.current.text}</legend>
                  <div className="mt-4 space-y-3">
                    {attempt.current.choices?.map((choice) => (
                      <label
                        key={choice.id}
                        className="flex cursor-pointer gap-3 rounded-2xl border border-line px-4 py-3 has-[:checked]:border-pine has-[:checked]:bg-pine-soft"
                      >
                        <input
                          checked={choiceId === choice.id}
                          className="mt-1"
                          name="choice"
                          required
                          type="radio"
                          value={choice.id}
                          onChange={() => setChoiceId(choice.id)}
                        />
                        <span>{choice.label}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <button
                  className="mt-4 rounded-full bg-accent px-5 py-3 text-accent-ink disabled:opacity-60"
                  disabled={pending || !choiceId}
                  type="submit"
                >
                  {messages.player.validate}
                </button>
              </form>
            ) : null}

            {attempt.debrief ? (
              <div className="mt-8 border-t border-line pt-6">
                <h2 className="font-serif text-3xl">{messages.player.debrief}</h2>
                <p className="mt-2 text-sm text-ink-soft">{messages.player.pedagogy}</p>
                {attempt.debrief.endingText ? <p className="mt-4 text-lg">{attempt.debrief.endingText}</p> : null}
                <p className="mt-4 text-sm text-ink-soft">
                  {messages.player.outcome}
                  {attempt.debrief.outcome ? ` · ${attempt.debrief.outcome}` : ""}
                </p>
                <p className="mt-4">
                  <span className="block text-sm text-ink-soft">{messages.player.indicator}</span>
                  <strong className="font-serif text-5xl" data-indicator="current">
                    {attempt.debrief.exerciseIndicator ?? "—"}
                  </strong>
                  <span className="text-ink-soft"> / 100</span>
                </p>
                <details className="mt-4">
                  <summary className="cursor-pointer">{messages.player.how}</summary>
                  <p className="mt-2 max-w-2xl text-sm text-ink-soft">{messages.player.howText}</p>
                </details>
                <ul className="mt-6 space-y-4">
                  {attempt.debrief.competencies.map((item) => (
                    <li key={item.competencyId} className="rounded-2xl border border-line p-4">
                      <p className="font-semibold">
                        {item.label} · {item.weight}
                      </p>
                      <p className="text-sm text-ink-soft">
                        {messages.player.observations} · {item.normalized} / 100
                      </p>
                      <ul className="mt-2 list-disc pl-5 text-sm">
                        {item.observations.map((observation) => (
                          <li key={observation}>{observation}</li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
                {attempt.debrief.alternative ? (
                  <div className="mt-6 rounded-2xl bg-pine-soft p-4">
                    <h3 className="font-semibold">{messages.player.alternative}</h3>
                    <p className="mt-2">{attempt.debrief.alternative.choiceLabel}</p>
                    <p className="mt-2 text-sm text-ink-soft">{attempt.debrief.alternative.evidence}</p>
                  </div>
                ) : null}
                <p className="mt-4 text-sm">{attempt.debrief.disclaimer}</p>

                {attempt.comparison ? (
                  <div className="mt-6 rounded-2xl border border-line p-4">
                    <h3 className="font-semibold">{messages.player.compare}</h3>
                    <p className="mt-2">
                      {messages.player.original}{" "}
                      <strong data-indicator="parent">{attempt.comparison.parentIndicator ?? "—"}</strong>
                    </p>
                    <p>
                      {messages.player.current}{" "}
                      <strong data-indicator="current">{attempt.comparison.currentIndicator ?? "—"}</strong>
                    </p>
                    <a className="mt-2 inline-block underline" href={`/demo/${slug}?attempt=${attempt.comparison.parentId}`}>
                      {messages.player.original}
                    </a>
                  </div>
                ) : null}

                <div className="mt-6">
                  <h3 className="font-semibold">{messages.player.transfer}</h3>
                  <p className="mt-1 text-sm text-ink-soft">{messages.player.transferText}</p>
                  <label className="mt-3 block text-sm" htmlFor="transfer-note">
                    {messages.player.transferLabel}
                  </label>
                  <textarea
                    className="mt-1 w-full rounded-2xl border border-line bg-white p-3"
                    id="transfer-note"
                    maxLength={500}
                    rows={3}
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                  />
                  <button
                    className="mt-2 rounded-full border border-ink px-4 py-2 disabled:opacity-60"
                    disabled={pending}
                    type="button"
                    onClick={() => void saveNote()}
                  >
                    {messages.player.transferSave}
                  </button>
                  {saved ? <p className="mt-2 text-sm text-pine">{messages.player.saved}</p> : null}
                </div>

                {coach ? (
                  <div className="mt-6 rounded-2xl border border-line p-4">
                    <h3 className="font-semibold">{messages.player.coach}</h3>
                    <p className="mt-1 text-sm text-ink-soft">
                      {coach.source === "fallback" ? messages.player.coachFallback : messages.player.coachMock}
                    </p>
                    <p className="mt-3">{coach.output.summary}</p>
                    {coach.output.improvements[0] ? (
                      <p className="mt-3">{coach.output.improvements[0].suggestion}</p>
                    ) : null}
                    <p className="mt-3 text-sm">{coach.output.reflectionQuestion}</p>
                    {coach.output.uncertain ? (
                      <p className="mt-2 text-sm text-ink-soft">{messages.player.uncertain}</p>
                    ) : null}
                  </div>
                ) : null}

                <ul className="mt-6 space-y-3">
                  {attempt.replayPoints.map((point) => (
                    <li key={`${point.fromSequence}-${point.choiceLabel}`}>
                      <p className="text-sm text-ink-soft">{point.prompt}</p>
                      <p className="text-sm">{point.choiceLabel}</p>
                      <button
                        className="mt-1 underline disabled:opacity-60"
                        disabled={pending}
                        type="button"
                        onClick={() => void replay(point.fromSequence)}
                      >
                        {messages.player.replay}
                        <span className="sr-only"> {point.prompt}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </section>

      <aside className="order-3 rounded-3xl border border-line bg-paper-2 p-5">
        <h2 className="font-serif text-2xl">{messages.player.help}</h2>
        <p className="mt-3 text-sm">{progressLabel}</p>
        <div aria-hidden className="mt-3 h-1.5 overflow-hidden rounded-full bg-line">
          <div
            className="h-full bg-pine"
            style={{
              width: `${progress ? (progress.decisionIndex / Math.max(progress.decisionTotal, 1)) * 100 : 8}%`,
            }}
          />
        </div>
        <p className="mt-4 text-sm text-ink-soft">{messages.player.helpText}</p>
        <ul className="mt-4 space-y-2 text-sm">
          {presentation.competencies.map((item) => (
            <li key={item.id} className="flex justify-between gap-3 border-b border-line py-2">
              <span>{item.label}</span>
              <span>{item.weight}</span>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
