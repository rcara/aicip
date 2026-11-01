import { z } from "zod";

export const FPS = 30;
export const FRAME_WIDTH = 1280;
export const FRAME_HEIGHT = 720;
export const SAFE_X = 64;
export const SAFE_TOP = 48;
export const SUBTITLE_BAND = 108;
export const SAFE_RIGHT = FRAME_WIDTH - SAFE_X;
export const SAFE_BOTTOM = FRAME_HEIGHT - SUBTITLE_BAND;
export const HOLD_MS = 400;

export const templateIds = [
  "title-introduction",
  "concept-explanation",
  "process-flow",
  "comparison",
  "timeline",
  "hierarchy-diagram",
  "animated-chart",
  "cause-effect",
  "key-takeaway",
  "conclusion",
] as const;

export const themeIds = [
  "minimal-professional",
  "technical-blueprint",
  "educational-whiteboard",
  "corporate-motion",
  "modern-infographic",
] as const;

export const animationKinds = ["fade-up", "draw", "grow", "highlight"] as const;
export const objectTypes = ["text", "panel", "node", "arrow", "bar", "badge"] as const;
export const tones = ["ink", "muted", "accent", "card"] as const;

const idSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9-]+$/);

export const visualObjectSchema = z
  .object({
    id: idSchema,
    type: z.enum(objectTypes),
    x: z.number().int(),
    y: z.number().int(),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    text: z.string().min(1).max(240).optional(),
    fontSize: z.number().int().min(12).max(72),
    appearAtMs: z.number().int().min(0),
    animation: z.enum(animationKinds),
    tone: z.enum(tones),
    emphasis: z.boolean(),
  })
  .strict();

export const subtitleSchema = z
  .object({
    id: idSchema,
    text: z.string().min(1).max(280),
    startMs: z.number().int().min(0),
    endMs: z.number().int().positive(),
    source: z.enum(["segment", "word-boundary"]),
  })
  .strict();

export const sceneSchema = z
  .object({
    id: idSchema,
    template: z.enum(templateIds),
    title: z.string().min(1).max(120),
    narration: z
      .object({
        text: z.string().min(1).max(600),
        audioSrc: z.string().min(1).max(180),
        durationMs: z.number().int().positive(),
        voice: z.string().min(1).max(80),
      })
      .strict(),
    durationMs: z.number().int().positive(),
    durationInFrames: z.number().int().positive(),
    transition: z
      .object({
        type: z.enum(["fade", "cut"]),
        durationMs: z.number().int().min(0).max(1000),
      })
      .strict(),
    objects: z.array(visualObjectSchema).min(1).max(40),
    subtitles: z.array(subtitleSchema).min(1).max(24),
  })
  .strict();

export const videoProjectSchema = z
  .object({
    id: idSchema,
    version: z.number().int().positive(),
    schemaVersion: z.literal(1),
    title: z.string().min(1).max(160),
    language: z.enum(["fr", "en"]),
    aspectRatio: z.literal("16:9"),
    theme: z.enum(themeIds),
    fps: z.literal(FPS),
    width: z.literal(FRAME_WIDTH),
    height: z.literal(FRAME_HEIGHT),
    scenes: z.array(sceneSchema).min(1).max(24),
  })
  .strict();

export type TemplateId = (typeof templateIds)[number];
export type ThemeId = (typeof themeIds)[number];
export type VisualObject = z.infer<typeof visualObjectSchema>;
export type SubtitleCue = z.infer<typeof subtitleSchema>;
export type ExplainerScene = z.infer<typeof sceneSchema>;
export type VideoProject = z.infer<typeof videoProjectSchema>;

export function parseVideoProject(value: unknown): VideoProject {
  return videoProjectSchema.parse(value);
}

export function framesFromMs(ms: number, fps: number = FPS): number {
  return Math.max(1, Math.round((ms / 1000) * fps));
}

export function totalFrames(project: VideoProject): number {
  return project.scenes.reduce((sum, scene) => sum + scene.durationInFrames, 0);
}
