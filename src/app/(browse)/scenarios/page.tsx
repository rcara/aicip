import { ScenarioCard } from "@/components/scenario-card";
import { listPublishedScenarios } from "@/db/repository";
import { getMessages } from "@/lib/i18n";
import { readLocale } from "@/modules/identity/session";

export const dynamic = "force-dynamic";

export default async function ScenariosPage() {
  const messages = getMessages(await readLocale());
  let scenarios: Awaited<ReturnType<typeof listPublishedScenarios>> = [];
  let unavailable = false;
  try {
    scenarios = await listPublishedScenarios();
  } catch {
    unavailable = true;
  }

  return (
    <div>
      <h1 className="font-serif text-5xl tracking-tight">{messages.catalog.title}</h1>
      <p className="mt-3 max-w-2xl text-ink-soft">{messages.catalog.intro}</p>
      {unavailable ? (
        <p className="mt-8" role="alert">
          {messages.player.error}
        </p>
      ) : null}
      {!unavailable && scenarios.length === 0 ? (
        <p className="mt-8 rounded-3xl border border-dashed border-line p-6">{messages.catalog.empty}</p>
      ) : null}
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {scenarios.map((scenario) => (
          <ScenarioCard key={scenario.slug} messages={messages} scenario={scenario} />
        ))}
      </div>
    </div>
  );
}
