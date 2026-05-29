// Zips dist/ into applyd-extension-<version>.zip for store submission.
// Uses PowerShell's Compress-Archive (available on Windows; no extra deps).
import { readFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);

const pkg = JSON.parse(
  await readFile(new URL("../package.json", import.meta.url), "utf8")
);
const out = `applyd-extension-${pkg.version}.zip`;

await run("powershell", [
  "-NoProfile",
  "-Command",
  `Compress-Archive -Path dist/* -DestinationPath ${out} -Force`,
]);

console.log(`Wrote ${out}`);
