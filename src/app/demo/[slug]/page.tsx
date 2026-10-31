import { notFound } from "next/navigation";

import { SimulationPlayer } from "@/components/simulation/player";
import { getOwnedAttempt, getPublishedBySlug } from "@/db/repository";
import { getAiCoachMode } from "@/lib/config";
import { AppError } from "@/lib/errors";
import { getMessages } from "@/lib/i18n";
import { computeFeedback } from "@/modules/learning/feedback";
import { runCoach } from "@/modules/ai-coach/provider";
import { currentActor, readLocale } from "@/modules/identity/session";
import { presentAttempt, presentScenario } from "@/modules/simulation/present";

export const dynamic = "force-dynamic";

export default async function DemoPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ attempt?: string }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const published = await getPublishedBySlug(slug);
  if (!published) notFound();
  const messages = getMessages(await readLocale());
  const presentation = presentScenario(published);
  const actor = await currentActor();

  let initialAttempt = null;
  let initialCoach = null;
  let initialError: string | null = null;
  if (query.attempt) {
    try {
      const bundle = await getOwnedAttempt(query.attempt, actor);
      if (bundle.published.slug !== slug) notFound();
      initialAttempt = await presentAttempt({
        state: bundle.state,
        scenario: bundle.published.scenario,
        slug,
        actor,
      });
      if (bundle.state.status === "completed") {
        initialCoach = await runCoach(
          { feedback: computeFeedback(bundle.published.scenario, bundle.state) },
          getAiCoachMode(),
        );
      }
    } catch (error) {
      if (error instanceof AppError && error.status === 404) notFound();
      initialError = messages.player.error;
    }
  }

  return (
    <SimulationPlayer
      key={query.attempt ?? "briefing"}
      initialAttempt={initialAttempt}
      initialCoach={initialCoach}
      initialError={initialError}
      messages={messages}
      presentation={presentation}
      slug={slug}
    />
  );
}
