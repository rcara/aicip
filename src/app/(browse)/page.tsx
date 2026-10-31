import { ScenarioCard } from "@/components/scenario-card";
import { getMessages } from "@/lib/i18n";
import { listPublishedScenarios } from "@/db/repository";
import { readLocale } from "@/modules/identity/session";

export const dynamic = "force-dynamic";

const PILOT = "entretien-difficile-technicien-it";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ compte?: string }>;
}) {
  const messages = getMessages(await readLocale());
  const query = await searchParams;
  let scenarios: Awaited<ReturnType<typeof listPublishedScenarios>> = [];
  let unavailable = false;
  try {
    scenarios = await listPublishedScenarios();
  } catch {
    unavailable = true;
  }
  const pilot = scenarios.find((item) => item.slug === PILOT) ?? scenarios[0];

  return (
    <div className="space-y-16">
      {query.compte === "supprime" ? (
        <p className="rounded-3xl border border-line bg-paper-2 px-4 py-3" role="status">
          {messages.account.deletedBanner}
        </p>
      ) : null}
      <section className="grid items-end gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(16rem,0.8fr)]">
        <div>
          <p className="text-sm uppercase tracking-[0.16em] text-accent">{messages.hero.eyebrow}</p>
          <h1 className="mt-4 max-w-3xl font-serif text-5xl leading-[1.05] tracking-tight sm:text-6xl">
            {messages.hero.title}
          </h1>
          <p className="mt-6 max-w-2xl text-xl text-ink-soft">{messages.hero.lede}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              className="inline-flex justify-center rounded-full bg-accent px-5 py-3 text-accent-ink"
              href={pilot ? `/demo/${pilot.slug}` : "/scenarios"}
            >
              {messages.hero.cta}
            </a>
            <a
              className="inline-flex justify-center rounded-full border border-ink px-5 py-3"
              href={pilot ? `/scenarios/${pilot.slug}` : "/scenarios"}
            >
              {messages.hero.secondary}
            </a>
          </div>
        </div>
        <div className="rounded-3xl border border-line bg-paper-2 p-6">
          <h2 className="font-serif text-2xl">{messages.beats.title}</h2>
          <ol className="mt-4 space-y-4">
            {(
              [
                ["pause", messages.beats.pause, messages.beats.pauseText],
                ["decide", messages.beats.decide, messages.beats.decideText],
                ["replay", messages.beats.replay, messages.beats.replayText],
                ["reflect", messages.beats.reflect, messages.beats.reflectText],
              ] as const
            ).map(([key, title, text], index) => (
              <li key={key}>
                <p className="font-semibold">
                  {index + 1}. {title}
                </p>
                <p className="text-sm text-ink-soft">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section>
        <h2 className="font-serif text-3xl">{messages.catalog.title}</h2>
        {unavailable ? (
          <p className="mt-4" role="alert">
            {messages.player.error}
          </p>
        ) : null}
        {!unavailable && scenarios.length === 0 ? <p className="mt-4">{messages.catalog.empty}</p> : null}
        {pilot ? (
          <div className="mt-6 max-w-xl">
            <ScenarioCard messages={messages} scenario={pilot} />
          </div>
        ) : null}
      </section>

      <section>
        <h2 className="font-serif text-3xl">{messages.paths.title}</h2>
        <ul className="mt-6 grid gap-4 md:grid-cols-3">
          <li className="rounded-3xl border border-pine bg-pine-soft p-5">
            <p className="text-sm text-pine">{messages.paths.available}</p>
            <h3 className="mt-2 font-serif text-2xl">{messages.paths.difficult}</h3>
            <p className="mt-2 text-sm">{messages.paths.difficultText}</p>
          </li>
          <li className="rounded-3xl border border-dashed border-line p-5">
            <p className="text-sm text-ink-soft">{messages.paths.soon}</p>
            <h3 className="mt-2 font-serif text-2xl">{messages.paths.influence}</h3>
            <p className="mt-2 text-sm text-ink-soft">{messages.paths.influenceText}</p>
          </li>
          <li className="rounded-3xl border border-dashed border-line p-5">
            <p className="text-sm text-ink-soft">{messages.paths.soon}</p>
            <h3 className="mt-2 font-serif text-2xl">{messages.paths.priorities}</h3>
            <p className="mt-2 text-sm text-ink-soft">{messages.paths.prioritiesText}</p>
          </li>
        </ul>
      </section>

      <section className="rounded-3xl bg-ink px-6 py-8 text-paper-2 sm:px-10">
        <h2 className="font-serif text-3xl">{messages.boundary.title}</h2>
        <p className="mt-3 max-w-3xl text-paper-2/90">{messages.boundary.body}</p>
      </section>
    </div>
  );
}
