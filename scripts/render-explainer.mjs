import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

function findChrome() {
  // Playwright's Chromium on this machine is missing libnspr4. Remotion's own browser build
  // carries its libraries. Set REMOTION_BROWSER_EXECUTABLE only for a known-good binary.
  if (process.env.REMOTION_BROWSER_EXECUTABLE && existsSync(process.env.REMOTION_BROWSER_EXECUTABLE)) {
    return process.env.REMOTION_BROWSER_EXECUTABLE;
  }
  return null;
}

const args = [
  "remotion",
  "render",
  "src/remotion/index.ts",
  "IncidentIt",
  "out/incident-it.mp4",
  "--concurrency=1",
  "--codec=h264",
  "--overwrite",
];
const chrome = findChrome();
if (chrome) args.push(`--browser-executable=${chrome}`);

const extraLibs = join(process.cwd(), "node_modules/.remotion/system-libs");
const env = { ...process.env };
if (existsSync(extraLibs)) {
  env.LD_LIBRARY_PATH = [extraLibs, env.LD_LIBRARY_PATH].filter(Boolean).join(":");
}

const child = spawn("npx", args, { stdio: "inherit", env });
child.on("exit", (code) => process.exit(code ?? 1));
