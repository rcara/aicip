import type { RealCoachConfig } from "@/lib/config";
import type { Feedback } from "@/modules/learning/feedback";
import {
  buildCoachContext,
  questionIsInjection,
  type CoachContext,
} from "@/modules/ai-coach/context";
import { fetchCoachTransport, requestCoach, type CoachTransport } from "@/modules/ai-coach/http";
import { coachOutputSchema, type CoachOutput } from "@/modules/ai-coach/output";

export { coachOutputSchema, type CoachOutput };

export type CoachRequest = {
  feedback: Feedback;
  briefing?: string;
  objective?: string;
  guidelines?: string[];
  question?: string;
  reflectionNote?: string;
};

export type CoachSource = "mock" | "fallback" | "real";

export type CoachResult = {
  output: CoachOutput;
  source: CoachSource;
  provider: string;
  model: string;
  certifying: false;
};

export type CoachUsage = {
  actorCount: number;
  globalCount: number;
};

export interface AiCoachProvider {
  readonly id: "mock" | "real";
  coach(request: CoachRequest): Promise<CoachOutput>;
}

function clip(value: string, max: number): string {
  const trimmed = value.replace(/\s+/g, " ").trim();
  return trimmed.length <= max ? trimmed : `${trimmed.slice(0, max - 1)}…`;
}

export class MockAiCoach implements AiCoachProvider {
  readonly id = "mock" as const;

  async coach(request: CoachRequest): Promise<CoachOutput> {
    const { feedback } = request;
    const strongest = [...feedback.competencies].sort((a, b) => b.normalized - a.normalized)[0];
    const weakest = feedback.competencies.find(
      (item) => item.competencyId === feedback.weakestCompetencyId,
    );
    const strengths = strongest
      ? [
          {
            competencyId: strongest.competencyId,
            evidence: clip(strongest.observations[0] ?? feedback.choices[0]?.evidence ?? "", 500),
            comment: clip(
              `Sur « ${strongest.label} », les décisions de ce parcours apportent des éléments observables.`,
              500,
            ),
          },
        ]
      : [];
    const improvements = weakest
      ? [
          {
            competencyId: weakest.competencyId,
            evidence: clip(weakest.observations[0] ?? "", 500),
            suggestion: clip(
              feedback.alternative
                ? `Une autre formulation possible : ${feedback.alternative.choiceLabel}`
                : `Au prochain entretien, précisez un fait, une attente et une date de suivi pour « ${weakest.label} ».`,
              500,
            ),
          },
        ]
      : [];

    const output = {
      summary: clip(
        feedback.endingText ??
          "Le débriefing s'appuie uniquement sur les décisions déjà jouées dans cette tentative.",
        500,
      ),
      strengths,
      improvements,
      alternativeReply: clip(
        feedback.alternative?.choiceLabel ??
          "Gardez une formulation concrète : un fait, l'effet observé, puis une prochaine étape datée.",
        500,
      ),
      reflectionQuestion: clip(
        "Qu'est-ce que vous testerez, mot pour mot, lors de votre prochain point avec l'équipe ?",
        300,
      ),
      uncertain: questionIsInjection(request.question),
    };
    return coachOutputSchema.parse(output);
  }
}

export function quotaAllows(usage: CoachUsage, config: RealCoachConfig): boolean {
  return usage.actorCount < config.actorDailyLimit && usage.globalCount < config.globalDailyLimit;
}

export async function runCoach(
  request: CoachRequest,
  mode: "mock" | "off" | "real",
  options?: {
    config?: RealCoachConfig | null;
    usage?: CoachUsage;
    transport?: CoachTransport;
  },
): Promise<CoachResult | null> {
  if (mode === "off") return null;
  const mock = new MockAiCoach();
  const mocked = async (source: "mock" | "fallback"): Promise<CoachResult> => ({
    output: await mock.coach(request),
    source,
    provider: "mock",
    model: "mock-v1",
    certifying: false,
  });
  if (mode !== "real") return mocked("mock");
  const config = options?.config ?? null;
  if (!config) return mocked("fallback");
  const usage = options?.usage ?? { actorCount: 0, globalCount: 0 };
  if (!quotaAllows(usage, config)) return mocked("fallback");
  try {
    const context: CoachContext = buildCoachContext(request);
    const output = await requestCoach({
      url: config.url,
      apiKey: config.apiKey,
      model: config.model,
      timeoutMs: config.timeoutMs,
      context,
      transport: options?.transport ?? fetchCoachTransport,
    });
    if (questionIsInjection(request.question)) output.uncertain = true;
    return {
      output,
      source: "real",
      provider: "operator-http",
      model: config.model,
      certifying: false,
    };
  } catch {
    return mocked("fallback");
  }
}
