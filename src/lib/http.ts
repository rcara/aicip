import { z } from "zod";

import { AppError } from "@/lib/errors";
import { SimulationError } from "@/modules/simulation/engine";

export function jsonError(error: unknown): Response {
  if (error instanceof AppError) {
    return Response.json(
      { error: { code: error.code, message: error.message } },
      { status: error.status },
    );
  }
  if (error instanceof SimulationError) {
    const status =
      error.code === "CONFLICT" || error.code === "IDEMPOTENCY_CONFLICT"
        ? 409
        : error.code === "INVALID_CHOICE" ||
            error.code === "NOT_A_DECISION" ||
            error.code === "NOT_DIALOGUE" ||
            error.code === "INVALID_REPLAY_POINT" ||
            error.code === "ALREADY_COMPLETE"
          ? 422
          : 400;
    return Response.json({ error: { code: error.code, message: error.message } }, { status });
  }
  if (error instanceof z.ZodError) {
    return Response.json(
      { error: { code: "INVALID_INPUT", message: "Les données envoyées ne sont pas valides." } },
      { status: 400 },
    );
  }
  console.error("request_failed", error instanceof Error ? error.name : "unknown");
  return Response.json(
    { error: { code: "INTERNAL", message: "Une erreur interne est survenue." } },
    { status: 500 },
  );
}

const hits = new Map<string, number[]>();

export function allowRequest(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((stamp) => now - stamp < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  return true;
}

export const idempotencySchema = z.object({
  idempotencyKey: z.string().uuid(),
});

export const choiceSchema = idempotencySchema.extend({
  choiceId: z.string().min(1).max(64),
});

export const replaySchema = z.object({
  fromSequence: z.number().int().positive(),
});

export const transferSchema = z.object({
  note: z.string().max(500),
});

export const coachSchema = z.object({
  question: z.string().max(300).optional(),
});
