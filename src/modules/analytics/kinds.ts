export const ANALYTICS_KINDS = [
  "scenario_viewed",
  "attempt_started",
  "decision_committed",
  "attempt_completed",
  "replay_started",
  "feedback_viewed",
  "ai_request",
  "ai_error",
] as const;

export type AnalyticsKind = (typeof ANALYTICS_KINDS)[number];
