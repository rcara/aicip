import { getNode, type DecisionNode, type Scenario } from "@/modules/scenarios/schema";

import { computeFeedback, type Feedback } from "@/modules/learning/feedback";
import { positionAfter, type AttemptEvent, type AttemptState } from "./engine";

export type TimelineItem =
  | { kind: "line"; speaker: string; text: string }
  | { kind: "choice"; label: string; prompt: string };

export type ReplayPoint = {
  fromSequence: number;
  prompt: string;
  choiceLabel: string;
};

export type AttemptProjection = {
  id: string;
  status: AttemptState["status"];
  scenarioVersionId: string;
  contentHash: string;
  parentAttemptId: string | null;
  branchedFromSequence: number | null;
  timeline: TimelineItem[];
  current: {
    type: "dialogue" | "decision" | "ending";
    speaker: string;
    text: string;
    choices?: Array<{ id: string; label: string }>;
  } | null;
  progress: {
    phase: "reading" | "decision" | "debrief";
    decisionIndex: number;
    decisionTotal: number;
  };
  debrief: Feedback | null;
  replayPoints: ReplayPoint[];
  exerciseIndicator: number | null;
};

function speakerOf(node: { speaker?: string }): string {
  return node.speaker ?? "Narrateur";
}

export function buildTimeline(scenario: Scenario, state: AttemptState): TimelineItem[] {
  const items: TimelineItem[] = [];
  let cursor = scenario.initialNodeId;
  for (const event of state.events) {
    if (event.type !== "advanced" && event.type !== "choice_committed") continue;
    const leaving = getNode(scenario, cursor);
    if (leaving.type === "dialogue") {
      items.push({ kind: "line", speaker: speakerOf(leaving), text: leaving.text });
    }
    if (event.type === "choice_committed" && event.choiceId && leaving.type === "decision") {
      const choice = leaving.choices.find((item) => item.id === event.choiceId);
      items.push({
        kind: "choice",
        label: choice?.label ?? event.choiceId,
        prompt: leaving.text,
      });
    }
    cursor = event.nodeId;
  }
  if (state.status === "completed") {
    const ending = getNode(scenario, state.currentNodeId);
    if (ending.type === "ending") {
      items.push({ kind: "line", speaker: speakerOf(ending), text: ending.text });
    }
  }
  return items;
}

export function replayPoints(scenario: Scenario, events: AttemptEvent[]): ReplayPoint[] {
  const points: ReplayPoint[] = [];
  for (let index = 0; index < events.length; index += 1) {
    const event = events[index];
    if (!event || event.type !== "choice_committed" || !event.choiceId) continue;
    const prior = events[index - 1];
    if (!prior) continue;
    const decision = scenario.nodes.find(
      (node): node is DecisionNode =>
        node.type === "decision" && node.choices.some((choice) => choice.id === event.choiceId),
    );
    if (!decision) continue;
    const choice = decision.choices.find((item) => item.id === event.choiceId);
    points.push({
      fromSequence: prior.sequence,
      prompt: decision.text,
      choiceLabel: choice?.label ?? event.choiceId,
    });
  }
  return points;
}

export function projectAttempt(scenario: Scenario, state: AttemptState): AttemptProjection {
  const feedback = computeFeedback(scenario, state);
  const currentNode = getNode(scenario, positionAfter(scenario, state.events));
  const decisionTotal = scenario.nodes.filter((node) => node.type === "decision").length;
  const made = feedback.decisionCount;
  const phase =
    state.status === "completed"
      ? "debrief"
      : currentNode.type === "decision"
        ? "decision"
        : "reading";
  const decisionIndex =
    phase === "decision" ? Math.min(decisionTotal, made + 1) : Math.min(decisionTotal, made);

  const current =
    state.status === "completed"
      ? null
      : {
          type: currentNode.type,
          speaker: speakerOf(currentNode),
          text: currentNode.text,
          choices:
            currentNode.type === "decision"
              ? currentNode.choices.map((choice) => ({ id: choice.id, label: choice.label }))
              : undefined,
        };

  return {
    id: state.id,
    status: state.status,
    scenarioVersionId: state.scenarioVersionId,
    contentHash: state.contentHash,
    parentAttemptId: state.parentAttemptId,
    branchedFromSequence: state.branchedFromSequence,
    timeline: buildTimeline(scenario, state),
    current,
    progress: { phase, decisionIndex, decisionTotal },
    debrief: state.status === "completed" ? feedback : null,
    replayPoints: replayPoints(scenario, state.events),
    exerciseIndicator: feedback.exerciseIndicator,
  };
}
