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
import { initCommand } from "./init.ts";
import { newLogoCommand } from "./new-logo.ts";
import { newPwaImagesCommand } from "./new-pwa-images.ts";
import denoConfig from "./deno.json" with { type: "json" };

const args = Deno.args;

if (args.includes("--version") || args.includes("-v")) {
  console.log(denoConfig.version);
  Deno.exit(0);
}

if (args.includes("--help") || args.includes("-h") || args.length === 0) {
  console.log(`
Crunchwrap App CLI (v${denoConfig.version})

Usage:
  cw init
  cw new-logo
  cw new-pwa-images

Options:
  -v, --version  Show version
  -h, --help     Show help

Commands:
  init            Initialize a new Crunchwrap app
  new-logo        Generate a new logo with AI for an existing app
  new-pwa-images  Generate PWA images from an existing image
`);
  Deno.exit(0);
}

const cmd = args[0];

if (cmd === "init") {
  await initCommand();
  Deno.exit(0);
}

if (cmd === "new-logo") {
  await newLogoCommand();
  Deno.exit(0);
}

if (cmd === "new-pwa-images") {
  await newPwaImagesCommand();
  Deno.exit(0);
}

console.error(red(`Unknown command: ${cmd}`));
Deno.exit(1);
