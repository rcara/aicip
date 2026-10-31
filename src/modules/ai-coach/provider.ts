import { z } from "zod";

import type { Feedback } from "@/modules/learning/feedback";

export const coachOutputSchema = z.object({
  summary: z.string().max(500),
  strengths: z
    .array(
      z.object({
        competencyId: z.string().max(64),
        evidence: z.string().max(500),
        comment: z.string().max(500),
      }),
    )
    .max(3),
  improvements: z
    .array(
      z.object({
        competencyId: z.string().max(64),
        evidence: z.string().max(500),
        suggestion: z.string().max(500),
      }),
    )
    .max(3),
  alternativeReply: z.string().max(500),
  reflectionQuestion: z.string().max(300),
  uncertain: z.boolean(),
});

export type CoachOutput = z.infer<typeof coachOutputSchema>;

export type CoachRequest = {
  feedback: Feedback;
  question?: string;
};

export type CoachResult = {
  output: CoachOutput;
  source: "mock" | "fallback";
  certifying: false;
};

export interface AiCoachProvider {
  readonly id: "mock" | "real";
  coach(request: CoachRequest): Promise<CoachOutput>;
}

const INJECTION =
  /ignore (all |previous |tes )?instructions|system prompt|oublie (les |tes )?instructions|note maximale|set the score|change (the )?score|nextnodeid/i;

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
      uncertain: Boolean(request.question && INJECTION.test(request.question)),
    };
    return coachOutputSchema.parse(output);
  }
}

export class RealAiCoachDisabled implements AiCoachProvider {
  readonly id = "real" as const;

  async coach(): Promise<CoachOutput> {
    throw new Error("REAL_AI_DISABLED");
  }
}

export async function runCoach(request: CoachRequest, mode: "mock" | "off" | "real"): Promise<CoachResult | null> {
  if (mode === "off") return null;
  const mock = new MockAiCoach();
  if (mode === "real") {
    try {
      await new RealAiCoachDisabled().coach();
    } catch {
      return {
        output: await mock.coach(request),
        source: "fallback",
        certifying: false,
      };
    }
  }
  return {
    output: await mock.coach(request),
    source: "mock",
    certifying: false,
  };
}
