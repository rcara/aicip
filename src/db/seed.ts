import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

import { parseScenario } from "@/modules/scenarios/schema";

import { seedScenario } from "./repository";

export async function seedPilot(): Promise<{ inserted: boolean; hash: string }> {
  const raw = JSON.parse(readFileSync(new URL("../../docs/05_SCENARIO_PILOTE.json", import.meta.url), "utf8"));
  return seedScenario(parseScenario(raw));
}

const isDirect = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirect) {
  seedPilot()
    .then((result) => {
      console.log(result.inserted ? `Scénario pilote inséré (${result.hash})` : "Scénario pilote déjà présent");
      process.exit(0);
    })
    .catch((error: unknown) => {
      console.error(error instanceof Error ? error.message : error);
      process.exit(1);
    });
}
