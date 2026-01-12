# @crunchwrap/cli

A CLI tool to quickly initialize new Crunchwrap projects from templates.

## Installation

You can run it directly using Deno without installation:

```bash
deno run -A jsr:@crunchwrap/cli init
```

Or install it globally:

```bash
deno install -g -A --name crunchwrap jsr:@crunchwrap/cli
```

### Updating

To update the CLI to the latest version, run the installation command with the `--force` (or `-f`) flag:

```bash
deno install -g -A --force --name crunchwrap jsr:@crunchwrap/cli
```

### Verifying Version

To check which version of the CLI you have installed, run:

```bash
crunchwrap --version
```

**Note:** Ensure that your Deno bin directory is in your `PATH`. If the command is not found after installation, add this to your shell profile (e.g., `~/.zshrc` or `~/.bashrc`):

```bash
export PATH="$HOME/.deno/bin:$PATH"
```

Then restart your terminal or run `source ~/.zshrc` (or the appropriate file for your shell).

## Usage

To start a new project, use the installed command directly:

```bash
crunchwrap init
```

(Do not use `deno crunchwrap init` once installed globally.)

Follow the interactive prompts to set up your project name, metadata, and select a template.

### Example

```bash
$ crunchwrap init
Welcome to crunchwrap app CLI! Let's get going.

Project name (the-example-app): my-new-app
Short name (optional) (Example): My App
...
Select which template to use:
> Nuxt Tailwind Firebase
  TBD
  TBD

Generating repository...
Project successfully generated in: my-new-app
```

## Features

- Interactive project setup.
- Multiple template support.
- Automatic placeholder replacement (Project name, Slug, Email, etc.).
- Fast cloning using `degit`.
