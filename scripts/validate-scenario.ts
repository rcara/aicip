import { readFileSync } from "node:fs";

import { parseScenario } from "../src/modules/scenarios/schema";

const file = process.argv[2] ?? "docs/05_SCENARIO_PILOTE.json";
const scenario = parseScenario(JSON.parse(readFileSync(file, "utf8")));
const decisions = scenario.nodes.filter((node) => node.type === "decision").length;
const endings = scenario.nodes.filter((node) => node.type === "ending").length;
console.log(
  `${scenario.slug} valide — ${decisions} décisions, ${endings} fins, ${scenario.competencies.length} compétences.`,
);
