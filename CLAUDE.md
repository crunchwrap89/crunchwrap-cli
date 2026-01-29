# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**@crunchwrap/cli** is a Deno-based CLI tool that initializes new Crunchwrap web projects from templates. It provides interactive setup with template selection, GitHub repo creation, Firebase integration, and AI-powered logo generation.

- **Runtime:** Deno v2.x (not Node.js)
- **Published to:** JSR (JavaScript Registry)

## Commands

```bash
# Run development version
deno task dev              # Runs: deno run -A main.ts init

# Run any command directly
deno run -A main.ts init
deno run -A main.ts new-logo
```

## Architecture

```
main.ts           # Entry point - command router
init.ts           # Main `cw init` wizard
new-logo.ts       # Standalone `cw new-logo` command

lib/
├── ui.ts         # Spinner animation
├── prompt.ts     # Interactive input/selection prompts (stdin-based)
├── degit.ts      # Template cloning via degit
├── replace.ts    # Placeholder replacement in templates
├── validate.ts   # Input validation & slugification
├── ai.ts         # Gemini AI logo generation
└── image.ts      # Image processing via ffmpeg
```

## Template System

Templates use placeholder strings that get replaced with user input:
- `template-projectname-placeholder` → project name
- `template-shortname-placeholder` → short name
- `template-title-placeholder` → title
- `template-description-placeholder` → description
- `template-email-placeholder` → email
- `template-phone-placeholder` → phone
- `template.com` → domain name

Replacement skips: `node_modules`, `.git`, `.output`, `dist`, `.nuxt`, and binary files.

## External Dependencies

The CLI shells out to these tools (must be installed separately):
- **degit** - Template cloning (uses bunx or npx)
- **firebase-tools** - Firebase project initialization
- **gh** - GitHub repository creation/management
- **ffmpeg** - Logo image processing (optional)

## Environment Variables

- `GEMINI_API_KEY` - Google Gemini API key (optional, prompts if needed for logo generation)

## Publishing

Auto-publishes to JSR on push to main via `.github/workflows/publish.yml`. Version bumps and changelog updates happen automatically via `.github/workflows/changelog.yml`.
