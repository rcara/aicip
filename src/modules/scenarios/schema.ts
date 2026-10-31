import { z } from "zod";

export const EFFECT_CEILING = 4;

export const competencySchema = z.object({
  id: z.string().min(1).max(64).regex(/^[a-z0-9_]+$/),
  label: z.string().min(1).max(120),
  weight: z.number().int().min(1).max(100),
});

export const choiceSchema = z.object({
  id: z.string().min(1).max(64).regex(/^[a-z0-9_]+$/),
  label: z.string().min(1).max(500),
  nextNodeId: z.string().min(1).max(64),
  evidence: z.string().min(1).max(500),
  effects: z.record(z.string(), z.number().int().min(0).max(EFFECT_CEILING)),
});

const speakerSchema = z.string().min(1).max(80);

export const dialogueNodeSchema = z.object({
  id: z.string().min(1).max(64),
  type: z.literal("dialogue"),
  speaker: speakerSchema,
  text: z.string().min(1).max(2000),
  nextNodeId: z.string().min(1).max(64),
});

export const decisionNodeSchema = z.object({
  id: z.string().min(1).max(64),
  type: z.literal("decision"),
  speaker: speakerSchema.optional(),
  text: z.string().min(1).max(2000),
  choices: z.array(choiceSchema).min(2).max(4),
});

export const endingNodeSchema = z.object({
  id: z.string().min(1).max(64),
  type: z.literal("ending"),
  speaker: speakerSchema.optional(),
  text: z.string().min(1).max(2000),
  outcome: z.enum(["constructive", "unclear", "tense"]),
});

export const nodeSchema = z.discriminatedUnion("type", [
  dialogueNodeSchema,
  decisionNodeSchema,
  endingNodeSchema,
]);

export const scenarioSchema = z.object({
  schemaVersion: z.literal(1),
  id: z.string().min(1).max(80),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  version: z.number().int().positive(),
  title: z.string().min(1).max(200),
  durationMinutes: z.number().int().min(1).max(60),
  difficulty: z.enum(["foundational", "intermediate", "advanced"]),
  audience: z.string().min(1).max(200),
  objective: z.string().min(1).max(500),
  disclaimer: z.string().min(1).max(500),
  briefing: z.string().min(1).max(2000),
  competencies: z.array(competencySchema).min(1).max(8),
  initialNodeId: z.string().min(1).max(64),
  nodes: z.array(nodeSchema).min(2),
  feedback: z.object({
    scoringHint: z.string().min(1).max(2000),
    coachGuidelines: z.array(z.string().min(1).max(500)).max(12),
  }),
});

export type Competency = z.infer<typeof competencySchema>;
export type Choice = z.infer<typeof choiceSchema>;
export type ScenarioNode = z.infer<typeof nodeSchema>;
export type DialogueNode = z.infer<typeof dialogueNodeSchema>;
export type DecisionNode = z.infer<typeof decisionNodeSchema>;
export type EndingNode = z.infer<typeof endingNodeSchema>;
export type Scenario = z.infer<typeof scenarioSchema>;

export type GraphIssue = {
  code: string;
  message: string;
};

export class ScenarioValidationError extends Error {
  readonly issues: GraphIssue[];

  constructor(issues: GraphIssue[]) {
    super(issues.map((issue) => issue.message).join(" "));
    this.name = "ScenarioValidationError";
    this.issues = issues;
  }
}

export function validateScenarioGraph(scenario: Scenario): GraphIssue[] {
  const issues: GraphIssue[] = [];
  const weight = scenario.competencies.reduce((sum, item) => sum + item.weight, 0);
  if (weight !== 100) {
    issues.push({
      code: "WEIGHTS",
      message: `La somme des poids doit être 100 (reçu ${weight}).`,
    });
  }

  const competencyIds = new Set<string>();
  for (const competency of scenario.competencies) {
    if (competencyIds.has(competency.id)) {
      issues.push({
        code: "DUPLICATE_COMPETENCY",
        message: `Compétence en double : ${competency.id}.`,
      });
    }
    competencyIds.add(competency.id);
  }

  const nodes = new Map<string, ScenarioNode>();
  const choiceIds = new Set<string>();
  for (const node of scenario.nodes) {
    if (nodes.has(node.id)) {
      issues.push({
        code: "DUPLICATE_NODE",
        message: `Nœud en double : ${node.id}.`,
      });
    }
    nodes.set(node.id, node);
    if (node.type === "decision") {
      for (const choice of node.choices) {
        if (choiceIds.has(choice.id)) {
          issues.push({
            code: "DUPLICATE_CHOICE",
            message: `Choix en double : ${choice.id}.`,
          });
        }
        choiceIds.add(choice.id);
        for (const key of Object.keys(choice.effects)) {
          if (!competencyIds.has(key)) {
            issues.push({
              code: "UNKNOWN_EFFECT",
              message: `Effet inconnu « ${key} » sur le choix ${choice.id}.`,
            });
          }
        }
      }
    }
  }

  if (!nodes.has(scenario.initialNodeId)) {
    issues.push({
      code: "MISSING_INITIAL",
      message: `Le nœud initial « ${scenario.initialNodeId} » n'existe pas.`,
    });
  }

  for (const node of scenario.nodes) {
    const targets =
      node.type === "dialogue"
        ? [node.nextNodeId]
        : node.type === "decision"
          ? node.choices.map((choice) => choice.nextNodeId)
          : [];
    for (const target of targets) {
      if (!nodes.has(target)) {
        issues.push({
          code: "BROKEN_TRANSITION",
          message: `Transition invalide : ${node.id} → ${target}.`,
        });
      }
    }
  }

  if (issues.length > 0) return issues;

  const visiting = new Set<string>();
  const visited = new Set<string>();

  const walk = (nodeId: string) => {
    if (visiting.has(nodeId)) {
      issues.push({
        code: "CYCLE",
        message: `Cycle non autorisé passant par ${nodeId}.`,
      });
      return;
    }
    if (visited.has(nodeId)) return;
    visiting.add(nodeId);
    const node = nodes.get(nodeId);
    if (!node) return;
    const targets =
      node.type === "dialogue"
        ? [node.nextNodeId]
        : node.type === "decision"
          ? node.choices.map((choice) => choice.nextNodeId)
          : [];
    for (const target of targets) walk(target);
    visiting.delete(nodeId);
    visited.add(nodeId);
  };

  walk(scenario.initialNodeId);

  for (const node of scenario.nodes) {
    if (!visited.has(node.id)) {
      issues.push({
        code: "UNREACHABLE",
        message: `Nœud inatteignable : ${node.id}.`,
      });
    }
  }

  const endings = scenario.nodes.filter((node) => node.type === "ending");
  if (endings.length < 1) {
    issues.push({
      code: "NO_ENDING",
      message: "Le scénario doit contenir au moins une fin.",
    });
  }
  for (const ending of endings) {
    if (!visited.has(ending.id)) {
      issues.push({
        code: "UNREACHABLE_ENDING",
        message: `Fin inatteignable : ${ending.id}.`,
      });
    }
  }

  const decisions = scenario.nodes.filter((node) => node.type === "decision");
  if (decisions.length < 1) {
    issues.push({
      code: "NO_DECISION",
      message: "Le scénario doit contenir au moins un point de décision.",
    });
  }

  return issues;
}

export function parseScenario(input: unknown): Scenario {
  const parsed = scenarioSchema.safeParse(input);
  if (!parsed.success) {
    throw new ScenarioValidationError(
      parsed.error.issues.map((issue) => ({
        code: "SCHEMA",
        message: `${issue.path.join(".") || "scenario"} : ${issue.message}`,
      })),
    );
  }
  const graphIssues = validateScenarioGraph(parsed.data);
  if (graphIssues.length > 0) {
    throw new ScenarioValidationError(graphIssues);
  }
  return parsed.data;
}

export function getNode(scenario: Scenario, nodeId: string): ScenarioNode {
  const node = scenario.nodes.find((item) => item.id === nodeId);
  if (!node) {
    throw new ScenarioValidationError([
      { code: "MISSING_NODE", message: `Nœud introuvable : ${nodeId}.` },
    ]);
  }
  return node;
}

export function findChoice(
  scenario: Scenario,
  choiceId: string,
): { node: DecisionNode; choice: Choice } | null {
  for (const node of scenario.nodes) {
    if (node.type !== "decision") continue;
    const choice = node.choices.find((item) => item.id === choiceId);
    if (choice) return { node, choice };
  }
  return null;
}

export function decisionCount(scenario: Scenario): number {
  return scenario.nodes.filter((node) => node.type === "decision").length;
}
