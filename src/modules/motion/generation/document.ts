import { z } from "zod";

const text = (max: number) => z.string().trim().min(1).max(max);

const stepSchema = z
  .object({
    label: text(80),
    detail: text(80).optional(),
  })
  .strict();

const sideSchema = z
  .object({
    title: text(80),
    points: z.array(text(80)).min(1).max(3),
  })
  .strict();

export const templatePropsSchema = z.discriminatedUnion("template", [
  z
    .object({
      template: z.literal("title-introduction"),
      kicker: text(60),
      title: text(120),
      lede: text(180),
    })
    .strict(),
  z
    .object({
      template: z.literal("concept-explanation"),
      title: text(80),
      concept: text(40),
      points: z.array(text(80)).min(1).max(3),
    })
    .strict(),
  z
    .object({
      template: z.literal("process-flow"),
      title: text(80),
      steps: z.array(stepSchema).min(1).max(6),
      emphasis: z.number().int().min(0).max(5),
    })
    .strict(),
  z
    .object({
      template: z.literal("comparison"),
      title: text(80),
      left: sideSchema,
      right: sideSchema,
    })
    .strict(),
  z
    .object({
      template: z.literal("timeline"),
      title: text(80),
      events: z.array(stepSchema).min(1).max(4),
    })
    .strict(),
  z
    .object({
      template: z.literal("hierarchy-diagram"),
      title: text(80),
      root: text(80),
      children: z.array(text(80)).min(1).max(4),
    })
    .strict(),
  z
    .object({
      template: z.literal("animated-chart"),
      title: text(80),
      unit: text(40),
      bars: z
        .array(
          z
            .object({
              label: text(40),
              value: z.number().int().positive().max(1000),
            })
            .strict(),
        )
        .min(1)
        .max(5),
    })
    .strict(),
  z
    .object({
      template: z.literal("cause-effect"),
      title: text(80),
      link: z
        .object({
          cause: text(80),
          effect: text(80),
          link: text(40),
        })
        .strict(),
    })
    .strict(),
  z
    .object({
      template: z.literal("key-takeaway"),
      title: text(80),
      takeaway: text(160),
      points: z.array(text(80)).min(1).max(3),
    })
    .strict(),
  z
    .object({
      template: z.literal("conclusion"),
      title: text(80),
      summary: text(160),
      steps: z.array(text(80)).min(1).max(6),
    })
    .strict(),
]);

export const modelDocumentSchema = z
  .object({
    language: z.enum(["fr", "en"]),
    title: text(160),
    objective: text(400),
    audience: text(120),
    plan: z
      .array(
        z
          .object({
            heading: text(120),
          })
          .strict(),
      )
      .min(1)
      .max(8),
    scenes: z
      .array(
        z
          .object({
            narration: text(280),
            props: templatePropsSchema,
          })
          .strict(),
      )
      .min(1)
      .max(8),
  })
  .strict();

export type ModelDocument = z.infer<typeof modelDocumentSchema>;
export type ModelTemplateProps = z.infer<typeof templatePropsSchema>;

export function parseModelDocument(value: unknown): ModelDocument {
  return modelDocumentSchema.parse(value);
}
