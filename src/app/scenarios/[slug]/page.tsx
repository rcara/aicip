import Link from "next/link";
import { notFound } from "next/navigation";

import { difficultyLabel } from "@/components/scenario-card";
import { getPublishedBySlug, listOwnedAttempts, recordAnalytics } from "@/db/repository";
import { getMessages } from "@/lib/i18n";
import { currentActor, readLocale } from "@/modules/identity/session";
import { presentScenario } from "@/modules/simulation/present";

export const dynamic = "force-dynamic";

export default async function ScenarioPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const messages = getMessages(await readLocale());
  const published = await getPublishedBySlug(slug);
  if (!published) notFound();
  const actor = await currentActor();
  await recordAnalytics({ kind: "scenario_viewed", scenarioDbId: published.scenarioDbId, actor });
  const scenario = presentScenario(published);
  const attempts = await listOwnedAttempts(slug, actor);

  return (
    <article className="max-w-3xl">
      <p className="text-sm">
        <Link className="underline-offset-4 hover:underline" href="/scenarios">
          {messages.detail.back}
        </Link>
      </p>
      <p className="mt-6 text-sm text-pine">
        {difficultyLabel(messages, scenario.difficulty)} · {scenario.durationMinutes} {messages.catalog.duration} ·{" "}
        {scenario.decisionCount} {messages.player.chapterDecision.toLowerCase()}
      </p>
      <h1 className="mt-2 font-serif text-5xl tracking-tight">{scenario.title}</h1>
      <p className="mt-4 text-ink-soft">{scenario.audience}</p>
      <h2 className="mt-8 font-serif text-2xl">{messages.detail.objective}</h2>
      <p className="mt-2">{scenario.objective}</p>
      <h2 className="mt-8 font-serif text-2xl">{messages.detail.briefing}</h2>
      <p className="mt-2">{scenario.briefing}</p>
      <h2 className="mt-8 font-serif text-2xl">{messages.detail.rubric}</h2>
      <p className="mt-2 text-sm text-ink-soft">{messages.detail.rubricNote}</p>
      <ul className="mt-4 divide-y divide-line rounded-3xl border border-line">
        {scenario.competencies.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-4 px-4 py-3">
            <span>{item.label}</span>
            <span>{item.weight}</span>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-sm text-ink-soft">{scenario.disclaimer}</p>
      <Link className="mt-8 inline-flex rounded-full bg-accent px-5 py-3 text-accent-ink" href={`/demo/${scenario.slug}`}>
        {messages.detail.start}
      </Link>
      <h2 className="mt-10 font-serif text-2xl">
        {actor.userId ? messages.detail.attemptsAccount : messages.detail.attempts}
      </h2>
      {attempts.length === 0 ? (
        <p className="mt-2 text-sm text-ink-soft">
          {actor.userId ? messages.detail.noneAccount : messages.detail.none}
        </p>
      ) : null}
      <ul className="mt-3 space-y-2">
        {attempts.map((attempt) => (
          <li key={attempt.id}>
            <Link className="underline" href={`/demo/${scenario.slug}?attempt=${attempt.id}`}>
              {messages.detail.resume} · {attempt.status}
              {attempt.finalScore !== null ? ` · ${attempt.finalScore}` : ""}
            </Link>
          </li>
        ))}
      </ul>
    </article>
  );
}
