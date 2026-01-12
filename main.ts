/**
 * @module
 *
 * This module is the entry point for the crunchwrap CLI.
 * It handles command-line arguments and dispatches to the appropriate commands.
 *
 * @example
 * ```bash
 * deno run -A main.ts init
 * ```
 */

import { red } from "@std/fmt/colors";
import { parseArgs } from "@std/cli/parse-args";
import { initCommand } from "./init.ts";
import denoConfig from "./deno.json" with { type: "json" };

const args = parseArgs(Deno.args, {
  boolean: ["version", "help"],
  alias: {
    version: "v",
    help: "h",
  },
});

if (args.version) {
  console.log(denoConfig.version);
  Deno.exit(0);
}

if (args.help || args._.length === 0) {
  console.log(`
crunchwrap — Crunchwrap App CLI (v${denoConfig.version})

Usage:
  crunchwrap init

Options:
  -v, --version  Show version
  -h, --help     Show help

Commands:
  init    Initialize a new Crunchwrap project
`);
  Deno.exit(0);
}

const cmd = args._[0];

if (cmd === "init") {
  await initCommand();
  Deno.exit(0);
}

console.error(red(`Unknown command: ${cmd}`));
Deno.exit(1);
