export type AiCoachMode = "mock" | "off" | "real";

export function getAiCoachMode(): AiCoachMode {
  const value = process.env.AI_COACH_MODE;
  if (value === "off" || value === "real" || value === "mock") return value;
  return "mock";
}

export function requireDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  return url;
}

export function requireAuthSecret(): string {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret || secret.length < 32 || secret.startsWith("replace-with")) {
    throw new Error(
      "BETTER_AUTH_SECRET must be set to a random string of at least 32 characters",
    );
  }
  return secret;
}

export function authBaseUrl(): string {
  return process.env.BETTER_AUTH_URL ?? "http://127.0.0.1:3000";
}
