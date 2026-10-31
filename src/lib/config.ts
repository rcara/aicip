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

export function cookieSecure(): boolean {
  return authBaseUrl().startsWith("https://");
}

const DEFAULT_RETENTION_DAYS = 365;

export type RealCoachConfig = {
  url: string;
  apiKey: string;
  model: string;
  timeoutMs: number;
  actorDailyLimit: number;
  globalDailyLimit: number;
};

function boundedInt(raw: string | undefined, fallback: number, min: number, max: number): number {
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < min || value > max) return fallback;
  return value;
}

export function getRealCoachConfig(): RealCoachConfig | null {
  const url = process.env.AI_API_BASE_URL?.trim() ?? "";
  const apiKey = process.env.AI_API_KEY?.trim() ?? "";
  const model = process.env.AI_MODEL?.trim() ?? "";
  if (!url || !apiKey || !model) return null;
  if (!url.startsWith("https://") && !url.startsWith("http://127.0.0.1") && !url.startsWith("http://localhost")) {
    return null;
  }
  return {
    url,
    apiKey,
    model,
    timeoutMs: boundedInt(process.env.AI_TIMEOUT_MS, 8000, 1000, 30000),
    actorDailyLimit: boundedInt(process.env.AI_ACTOR_DAILY_LIMIT, 20, 1, 200),
    globalDailyLimit: boundedInt(process.env.AI_GLOBAL_DAILY_LIMIT, 200, 1, 5000),
  };
}

export function accountRetentionDays(): number {
  const raw = process.env.ACCOUNT_RETENTION_DAYS;
  if (!raw) return DEFAULT_RETENTION_DAYS;
  const days = Number(raw);
  if (!Number.isInteger(days) || days < 1 || days > 3650) return DEFAULT_RETENTION_DAYS;
  return days;
}
