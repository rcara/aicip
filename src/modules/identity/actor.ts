import { createHash, randomBytes } from "node:crypto";

export const DEMO_COOKIE = "aicip_demo";
export const LOCALE_COOKIE = "aicip_locale";

export type Locale = "fr" | "en";

export function parseLocale(value: string | undefined): Locale {
  return value === "en" ? "en" : "fr";
}

export function newDemoToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashDemoToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export type Actor = {
  userId: string | null;
  anonymousTokenHash: string | null;
  role: "learner" | "admin" | null;
};

export function canAccessAttempt(
  attempt: { userId: string | null; anonymousTokenHash: string | null },
  actor: Actor,
): boolean {
  if (attempt.userId) return actor.userId === attempt.userId;
  if (!attempt.anonymousTokenHash || !actor.anonymousTokenHash) return false;
  return attempt.anonymousTokenHash === actor.anonymousTokenHash;
}
