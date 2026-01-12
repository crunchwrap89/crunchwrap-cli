import { red } from "@std/fmt/colors";
import { initCommand } from "./init.ts";

const [cmd] = Deno.args;

if (!cmd || cmd === "-h" || cmd === "--help") {
  console.log(`
crunchwrap — Crunchwrap App CLI

Usage:
  crunchwrap init

Commands:
  init    Initialize a new Crunchwrap project
`);
  Deno.exit(0);
}

if (cmd === "init") {
  await initCommand();
  Deno.exit(0);
}

console.error(red(`Unknown command: ${cmd}`));
Deno.exit(1);
