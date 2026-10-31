import { z } from "zod";

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
