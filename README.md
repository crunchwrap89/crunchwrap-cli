# @crunchwrap/cli

A CLI tool to quickly initialize new Crunchwrap projects from templates.

## Installation

You can run it directly using Deno without installation:

```bash
deno run -A jsr:@crunchwrap/cli init
```

Or install it globally:

```bash
deno install -g -A jsr:@crunchwrap/cli
```

## Usage

To start a new project:

```bash
crunchwrap init
```

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
