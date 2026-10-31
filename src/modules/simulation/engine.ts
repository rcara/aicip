import { findChoice, getNode, type Scenario } from "@/modules/scenarios/schema";

export type AttemptEventType =
  | "attempt_started"
  | "advanced"
  | "choice_committed"
  | "attempt_completed";

export type AttemptEvent = {
  sequence: number;
  type: AttemptEventType;
  nodeId: string;
  choiceId: string | null;
  idempotencyKey: string;
  effects: Record<string, number> | null;
};

export type AttemptStatus = "in_progress" | "completed";

export type AttemptState = {
  id: string;
  scenarioVersionId: string;
  scenarioId: string;
  scenarioVersion: number;
  contentHash: string;
  status: AttemptStatus;
  currentNodeId: string;
  events: AttemptEvent[];
  parentAttemptId: string | null;
  branchedFromSequence: number | null;
};

export class SimulationError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "SimulationError";
  }
}

export type TransitionResult = {
  state: AttemptState;
  idempotent: boolean;
};

function nextSequence(events: AttemptEvent[]): number {
  return events.reduce((max, event) => Math.max(max, event.sequence), 0) + 1;
}

function withCopy(state: AttemptState, events: AttemptEvent[]): AttemptState {
  return { ...state, events };
}

function matchIdempotency(
  state: AttemptState,
  idempotencyKey: string,
  expected: { type: AttemptEventType; choiceId: string | null },
): "missing" | "match" {
  const existing = state.events.find((event) => event.idempotencyKey === idempotencyKey);
  if (!existing) return "missing";
  if (existing.type !== expected.type || existing.choiceId !== expected.choiceId) {
    throw new SimulationError(
      "IDEMPOTENCY_CONFLICT",
      "Cette clé d'idempotence a déjà servi pour une autre action.",
    );
  }
  return "match";
}

function completeIfEnding(scenario: Scenario, state: AttemptState, key: string): AttemptState {
  const node = getNode(scenario, state.currentNodeId);
  if (node.type !== "ending") return state;
  if (state.events.some((event) => event.type === "attempt_completed")) {
    return { ...state, status: "completed" };
  }
  return {
    ...state,
    status: "completed",
    events: [
      ...state.events,
      {
        sequence: nextSequence(state.events),
        type: "attempt_completed",
        nodeId: node.id,
        choiceId: null,
        idempotencyKey: `${key}:completed`,
        effects: null,
      },
    ],
  };
}

export function startAttempt(input: {
  id: string;
  scenario: Scenario;
  scenarioVersionId: string;
  contentHash: string;
}): AttemptState {
  const initial = getNode(input.scenario, input.scenario.initialNodeId);
  const state: AttemptState = {
    id: input.id,
    scenarioVersionId: input.scenarioVersionId,
    scenarioId: input.scenario.id,
    scenarioVersion: input.scenario.version,
    contentHash: input.contentHash,
    status: "in_progress",
    currentNodeId: initial.id,
    parentAttemptId: null,
    branchedFromSequence: null,
    events: [
      {
        sequence: 1,
        type: "attempt_started",
        nodeId: initial.id,
        choiceId: null,
        idempotencyKey: `start:${input.id}`,
        effects: null,
      },
    ],
  };
  return completeIfEnding(input.scenario, state, `start:${input.id}`);
}

export function positionAfter(scenario: Scenario, events: AttemptEvent[]): string {
  let cursor = scenario.initialNodeId;
  for (const event of events) {
    if (event.type === "advanced" || event.type === "choice_committed") {
      cursor = event.nodeId;
    }
  }
  return cursor;
}

export function advance(
  state: AttemptState,
  scenario: Scenario,
  idempotencyKey: string,
): TransitionResult {
  if (state.contentHash.length === 0) {
    throw new SimulationError("UNBOUND_VERSION", "La tentative n'est pas liée à une version.");
  }
  const match = matchIdempotency(state, idempotencyKey, {
    type: "advanced",
    choiceId: null,
  });
  if (match === "match") return { state, idempotent: true };
  if (state.status === "completed") {
    throw new SimulationError("ALREADY_COMPLETE", "Cette tentative est déjà terminée.");
  }
  const node = getNode(scenario, state.currentNodeId);
  if (node.type !== "dialogue") {
    throw new SimulationError(
      "NOT_DIALOGUE",
      "On ne peut avancer que depuis une réplique.",
    );
  }
  const next = getNode(scenario, node.nextNodeId);
  const moved = withCopy(state, [
    ...state.events,
    {
      sequence: nextSequence(state.events),
      type: "advanced",
      nodeId: next.id,
      choiceId: null,
      idempotencyKey,
      effects: null,
    },
  ]);
  moved.currentNodeId = next.id;
  return { state: completeIfEnding(scenario, moved, idempotencyKey), idempotent: false };
}

export function commitChoice(
  state: AttemptState,
  scenario: Scenario,
  choiceId: string,
  idempotencyKey: string,
): TransitionResult {
  const match = matchIdempotency(state, idempotencyKey, {
    type: "choice_committed",
    choiceId,
  });
  if (match === "match") return { state, idempotent: true };
  if (state.status === "completed") {
    throw new SimulationError("ALREADY_COMPLETE", "Cette tentative est déjà terminée.");
  }
  const node = getNode(scenario, state.currentNodeId);
  if (node.type !== "decision") {
    throw new SimulationError(
      "NOT_A_DECISION",
      "Aucun choix n'est attendu à cette étape.",
    );
  }
  const choice = node.choices.find((item) => item.id === choiceId);
  if (!choice) {
    throw new SimulationError("INVALID_CHOICE", "Ce choix n'appartient pas à l'étape en cours.");
  }
  const next = getNode(scenario, choice.nextNodeId);
  const moved = withCopy(state, [
    ...state.events,
    {
      sequence: nextSequence(state.events),
      type: "choice_committed",
      nodeId: next.id,
      choiceId: choice.id,
      idempotencyKey,
      effects: { ...choice.effects },
    },
  ]);
  moved.currentNodeId = next.id;
  return { state: completeIfEnding(scenario, moved, idempotencyKey), idempotent: false };
}

export function replayFrom(
  source: AttemptState,
  scenario: Scenario,
  fromSequence: number,
  newAttemptId: string,
): AttemptState {
  const marker = source.events.find((event) => event.sequence === fromSequence);
  if (!marker) {
    throw new SimulationError(
      "INVALID_REPLAY_POINT",
      "Ce point de reprise n'existe pas dans la tentative.",
    );
  }
  const prefix = source.events
    .filter((event) => event.sequence <= fromSequence)
    .map((event) => ({
      ...event,
      effects: event.effects ? { ...event.effects } : null,
    }));
  const currentNodeId = positionAfter(scenario, prefix);
  const node = getNode(scenario, currentNodeId);
  if (node.type !== "decision") {
    throw new SimulationError(
      "INVALID_REPLAY_POINT",
      "On ne rejoue qu'à partir d'un point de décision.",
    );
  }
  return {
    id: newAttemptId,
    scenarioVersionId: source.scenarioVersionId,
    scenarioId: source.scenarioId,
    scenarioVersion: source.scenarioVersion,
    contentHash: source.contentHash,
    status: "in_progress",
    currentNodeId,
    events: prefix,
    parentAttemptId: source.id,
    branchedFromSequence: fromSequence,
  };
}

export function choiceIds(state: AttemptState): string[] {
  return state.events
    .filter((event) => event.type === "choice_committed" && event.choiceId)
    .map((event) => event.choiceId as string);
}

export function assertChoiceKnown(scenario: Scenario, choiceId: string): void {
  if (!findChoice(scenario, choiceId)) {
    throw new SimulationError("INVALID_CHOICE", "Choix inconnu dans cette version du scénario.");
  }
}
