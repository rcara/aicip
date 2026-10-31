import { computeFeedback } from "@/modules/learning/feedback";
import { projectAttempt, type AttemptProjection } from "@/modules/simulation/project";
import type { Scenario } from "@/modules/scenarios/schema";
import type { AttemptState } from "@/modules/simulation/engine";

import { getDb } from "@/db/client";
import { getOwnedAttempt } from "@/db/repository";
import { attempts } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { Actor } from "@/modules/identity/actor";

export type PublicAttempt = AttemptProjection & {
  scenarioSlug: string;
  scenarioTitle: string;
  disclaimer: string;
  comparison: {
    parentId: string;
    parentIndicator: number | null;
    currentIndicator: number | null;
  } | null;
  reflectionNote: string | null;
};

export function presentScenario(input: { slug: string; scenario: Scenario }) {
  return {
    slug: input.slug,
    title: input.scenario.title,
    audience: input.scenario.audience,
    difficulty: input.scenario.difficulty,
    durationMinutes: input.scenario.durationMinutes,
    objective: input.scenario.objective,
    briefing: input.scenario.briefing,
    disclaimer: input.scenario.disclaimer,
    competencies: input.scenario.competencies.map((item) => ({
      id: item.id,
      label: item.label,
      weight: item.weight,
    })),
    decisionCount: input.scenario.nodes.filter((node) => node.type === "decision").length,
  };
}

export async function presentAttempt(input: {
  state: AttemptState;
  scenario: Scenario;
  slug: string;
  actor: Actor;
}): Promise<PublicAttempt> {
  const projection = projectAttempt(input.scenario, input.state);
  let comparison: PublicAttempt["comparison"] = null;
  if (input.state.parentAttemptId) {
    try {
      const parent = await getOwnedAttempt(input.state.parentAttemptId, input.actor);
      const parentFeedback = computeFeedback(parent.published.scenario, parent.state);
      comparison = {
        parentId: parent.state.id,
        parentIndicator: parentFeedback.exerciseIndicator,
        currentIndicator: projection.exerciseIndicator,
      };
    } catch {
      comparison = null;
    }
  }
  const note = await getDb()
    .select({ reflectionNote: attempts.reflectionNote })
    .from(attempts)
    .where(eq(attempts.id, input.state.id))
    .limit(1);
  return {
    ...projection,
    scenarioSlug: input.slug,
    scenarioTitle: input.scenario.title,
    disclaimer: input.scenario.disclaimer,
    comparison,
    reflectionNote: note[0]?.reflectionNote ?? null,
  };
}
