import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import ESpeakNg from "espeak-ng";

import { compileProject } from "../src/modules/motion/compile";
import {
  incidentAudioSrc,
  incidentProject,
  incidentScripts,
  toAuthored,
} from "../src/modules/motion/fixtures/incident-authoring";
import { parseVideoProject } from "../src/modules/motion/schema";
import { inspectProject } from "../src/modules/motion/validate";

const root = new URL("..", import.meta.url).pathname;
const publicDir = join(root, "public");

function wavDurationMs(buffer: Buffer): number {
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  if (buffer.toString("ascii", 0, 4) !== "RIFF") throw new Error("WAV invalide");
  const channels = view.getUint16(22, true);
  const sampleRate = view.getUint32(24, true);
  const bits = view.getUint16(34, true);
  let offset = 12;
  while (offset + 8 <= buffer.length) {
    const id = buffer.toString("ascii", offset, offset + 4);
    const size = view.getUint32(offset + 4, true);
    if (id === "data") {
      const samples = size / (channels * (bits / 8));
      return Math.round((samples / sampleRate) * 1000);
    }
    offset += 8 + size + (size % 2);
  }
  throw new Error("Chunk data absent");
}

async function synthesize(text: string): Promise<Buffer> {
  const espeak = await ESpeakNg({
    arguments: ["-v", "fr", "-s", "138", "-w", "speech.wav", text],
  });
  return Buffer.from(espeak.FS.readFile("speech.wav"));
}

async function main() {
  await mkdir(join(publicDir, "motion/incident"), { recursive: true });
  const scenes = [];
  for (const script of incidentScripts) {
    const wav = await synthesize(script.narration);
    const audioAbs = join(publicDir, incidentAudioSrc(script.id));
    await writeFile(audioAbs, wav);
    const audioDurationMs = wavDurationMs(wav);
    scenes.push(toAuthored(script, audioDurationMs, []));
    console.log(`${script.id}\t${audioDurationMs}ms\tsegment`);
  }
  const project = parseVideoProject(compileProject({ ...incidentProject, scenes }));
  const issues = inspectProject(project);
  if (issues.length > 0) {
    console.error(issues);
    throw new Error(`Storyboard invalide (${issues.length})`);
  }
  const target = join(root, "src/modules/motion/fixtures/incident-it.json");
  await writeFile(target, `${JSON.stringify(project, null, 2)}\n`);
  const total = project.scenes.reduce((sum, scene) => sum + scene.durationMs, 0);
  console.log(`scenes=${project.scenes.length} durationMs=${total} file=${target}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
