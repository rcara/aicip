import type { Messages } from "@/lib/i18n";

export function difficultyLabel(messages: Messages, difficulty: string): string {
  if (difficulty === "foundational" || difficulty === "intermediate" || difficulty === "advanced") {
    return messages.difficulty[difficulty];
  }
  return difficulty;
}

export function ScenarioCard({
  messages,
  scenario,
}: {
  messages: Messages;
  scenario: {
    slug: string;
    title: string;
    audience: string;
    difficulty: string;
    durationMinutes: number;
    objective: string;
  };
}) {
  return (
    <article className="flex h-full flex-col justify-between rounded-3xl border border-line bg-paper-2 p-6 shadow-[0_20px_50px_-40px_rgba(27,36,48,0.7)]">
      <div>
        <p className="text-sm text-pine">
          {difficultyLabel(messages, scenario.difficulty)} · {scenario.durationMinutes}{" "}
          {messages.catalog.duration}
        </p>
        <h2 className="mt-2 font-serif text-3xl tracking-tight">{scenario.title}</h2>
        <p className="mt-3 text-ink-soft">{scenario.objective}</p>
        <p className="mt-4 text-sm">{scenario.audience}</p>
      </div>
      <a
        className="mt-6 inline-flex w-fit rounded-full bg-ink px-4 py-2 text-sm text-paper-2"
        href={`/scenarios/${scenario.slug}`}
      >
        {messages.catalog.open}
      </a>
    </article>
  );
}
