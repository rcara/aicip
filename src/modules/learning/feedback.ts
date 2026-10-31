import { EFFECT_CEILING, findChoice, getNode, type Scenario } from "@/modules/scenarios/schema";

import { choiceIds, type AttemptState } from "@/modules/simulation/engine";

export type CompetencyFeedback = {
  competencyId: string;
  label: string;
  weight: number;
  raw: number;
  maxRaw: number;
  normalized: number;
  observations: string[];
};

export type Feedback = {
  exerciseIndicator: number | null;
  decisionCount: number;
  outcome: string | null;
  endingText: string | null;
  competencies: CompetencyFeedback[];
  choices: Array<{ choiceId: string; label: string; evidence: string; prompt: string }>;
  weakestCompetencyId: string | null;
  alternative: { competencyId: string; choiceLabel: string; evidence: string } | null;
  disclaimer: string;
};

function roundIndicator(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return Math.round(numerator / denominator);
}

export function computeFeedback(scenario: Scenario, state: AttemptState): Feedback {
  const selected = choiceIds(state);
  const raw = new Map<string, number>();
  for (const competency of scenario.competencies) raw.set(competency.id, 0);

  const choices = selected.map((choiceId) => {
    const found = findChoice(scenario, choiceId);
    if (!found) {
      throw new Error(`Choix absent de la version épinglée : ${choiceId}`);
    }
    for (const competency of scenario.competencies) {
      raw.set(
        competency.id,
        (raw.get(competency.id) ?? 0) + (found.choice.effects[competency.id] ?? 0),
      );
    }
    return {
      choiceId,
      label: found.choice.label,
      evidence: found.choice.evidence,
      prompt: found.node.text,
    };
  });

  const decisionCount = selected.length;
  const maxRaw = decisionCount * EFFECT_CEILING;
  const competencies: CompetencyFeedback[] = scenario.competencies.map((competency) => {
    const points = raw.get(competency.id) ?? 0;
    const observations = choices
      .filter((choice) => {
        const found = findChoice(scenario, choice.choiceId);
        return (found?.choice.effects[competency.id] ?? 0) > 0;
      })
      .map((choice) => choice.evidence);
    return {
      competencyId: competency.id,
      label: competency.label,
      weight: competency.weight,
      raw: points,
      maxRaw,
      normalized: maxRaw === 0 ? 0 : Math.round((points / maxRaw) * 100),
      observations:
        observations.length > 0 ? observations : ["Peu présente sur les décisions de ce parcours."],
    };
  });

  const numerator = scenario.competencies.reduce(
    (sum, competency) => sum + (raw.get(competency.id) ?? 0) * competency.weight,
    0,
  );
  const exerciseIndicator =
    decisionCount === 0 ? null : roundIndicator(numerator, decisionCount * EFFECT_CEILING);

  const ranked = [...competencies].sort((a, b) => {
    if (a.normalized !== b.normalized) return a.normalized - b.normalized;
    if (a.weight !== b.weight) return b.weight - a.weight;
    return a.competencyId.localeCompare(b.competencyId);
  });
  const weakest = ranked[0] ?? null;

  let alternative: Feedback["alternative"] = null;
  if (weakest && decisionCount > 0) {
    let best: { effect: number; label: string; evidence: string; id: string } | null = null;
    for (const choiceId of selected) {
      const found = findChoice(scenario, choiceId);
      if (!found) continue;
      for (const candidate of found.node.choices) {
        if (candidate.id === choiceId) continue;
        const effect = candidate.effects[weakest.competencyId] ?? 0;
        const current = found.choice.effects[weakest.competencyId] ?? 0;
        if (effect <= current) continue;
        if (
          !best ||
          effect > best.effect ||
          (effect === best.effect && candidate.id.localeCompare(best.id) < 0)
        ) {
          best = {
            effect,
            label: candidate.label,
            evidence: candidate.evidence,
            id: candidate.id,
          };
        }
      }
    }
    if (best) {
      alternative = {
        competencyId: weakest.competencyId,
        choiceLabel: best.label,
        evidence: best.evidence,
      };
    }
  }

  const ending =
    state.status === "completed" ? getNode(scenario, state.currentNodeId) : null;
  const outcome = ending && ending.type === "ending" ? ending.outcome : null;
  const endingText = ending && ending.type === "ending" ? ending.text : null;

  return {
    exerciseIndicator,
    decisionCount,
    outcome,
    endingText,
    competencies,
    choices,
    weakestCompetencyId: weakest?.competencyId ?? null,
    alternative,
    disclaimer: scenario.disclaimer,
  };
}
