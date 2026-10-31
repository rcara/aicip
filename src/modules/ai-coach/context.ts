import type { Feedback } from "@/modules/learning/feedback";

const INJECTION =
  /ignore (all |previous |tes )?instructions|system prompt|oublie (les |tes )?instructions|note maximale|set the score|change (the )?score|nextnodeid/i;

export function clipText(value: string, max: number): string {
  const trimmed = value.replace(/\s+/g, " ").trim();
  return trimmed.length <= max ? trimmed : `${trimmed.slice(0, max - 1)}…`;
}

export type CoachContext = {
  briefing: string;
  objective: string;
  disclaimer: string;
  guidelines: string[];
  competencies: Array<{ id: string; label: string; weight: number }>;
  choices: Array<{ choiceId: string; label: string; evidence: string; prompt: string }>;
  endingText: string | null;
  outcome: string | null;
  learnerQuestion: string | null;
  reflectionNote: string | null;
};

export function buildCoachContext(input: {
  feedback: Feedback;
  briefing?: string;
  objective?: string;
  guidelines?: string[];
  question?: string;
  reflectionNote?: string;
}): CoachContext {
  return {
    briefing: clipText(input.briefing ?? "", 800),
    objective: clipText(input.objective ?? "", 400),
    disclaimer: clipText(input.feedback.disclaimer, 400),
    guidelines: (input.guidelines ?? []).slice(0, 6).map((item) => clipText(item, 300)),
    competencies: input.feedback.competencies.slice(0, 8).map((item) => ({
      id: item.competencyId,
      label: clipText(item.label, 80),
      weight: item.weight,
    })),
    choices: input.feedback.choices.slice(0, 8).map((item) => ({
      choiceId: item.choiceId,
      label: clipText(item.label, 300),
      evidence: clipText(item.evidence, 400),
      prompt: clipText(item.prompt, 300),
    })),
    endingText: input.feedback.endingText ? clipText(input.feedback.endingText, 500) : null,
    outcome: input.feedback.outcome,
    learnerQuestion: input.question ? clipText(input.question, 300) : null,
    reflectionNote: input.reflectionNote ? clipText(input.reflectionNote, 500) : null,
  };
}

export function contextLooksBounded(context: CoachContext): boolean {
  const serialized = JSON.stringify(context);
  return (
    serialized.length <= 8000 &&
    !serialized.includes("anonymousToken") &&
    !/"userId"/.test(serialized) &&
    !serialized.includes("finalScore")
  );
}

export function questionIsInjection(question: string | undefined): boolean {
  return Boolean(question && INJECTION.test(question));
}

export { INJECTION };
