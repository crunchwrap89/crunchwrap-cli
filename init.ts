/**
 * @module
 *
 * This module contains the logic for the `init` command, which interactive
 * initializes a new project from a template.
 */

import { blue, bold, cyan, green, magenta, red, yellow } from "@std/fmt/colors";
import { resolve } from "@std/path";
import { exists } from "@std/fs";

import { startSpinner } from "./lib/ui.ts";
import { promptInput, promptSelect } from "./lib/prompt.ts";
import { degitRepoToDir } from "./lib/degit.ts";
import { replacePlaceholdersInRepo } from "./lib/replace.ts";
import { isValidProjectName, slugifyProjectName } from "./lib/validate.ts";

export async function initCommand() {
  console.log(magenta(bold(`
  _____                               _                                
 / ____|                             | |                               
| |     _ __ _   _ _ __   ___ | |__ __      __ _ __ __ _ _ __  
| |    | '__| | | | '_ \\ / __| '_ \\\\ \\ /\\ / / '__/ _\` | '_ \\ 
| |____| |  | |_| | | | | (__| | | |\\ V  V /| | | (_| | |_) |
 \\_____|_|   \\__,_|_| |_|\\___|_| |_| \\_/\\_/ |_|  \\__,_| .__/ 
                                                      | |    
                                                      |_|    
  `)));
  console.log(cyan(bold("  Welcome to the crunchwrap app CLI! 🌯 Let's build something awesome.\n")));

  // ------------------------
  // Step 1: Collect Project Information
  // ------------------------
  const projectnameInput = promptInput("📂 Project name", "the-example-app", {
    required: true,
    validate: (v) => {
      if (!isValidProjectName(v)) {
        return red("  ❌ Use letters, numbers, and dashes only.");
      }
      return null;
    },
  });
  const projectname = projectnameInput.toLowerCase();

  const gitRepo = promptInput("🌐 Git repository URL (optional)", "");
  let gitVisibility = "public";
  if (gitRepo) {
    gitVisibility = await promptSelect("🔒 Repository visibility", [
      { label: "🔓 Public", value: "public" },
      { label: "🔒 Private", value: "private" },
    ]);
  }

  const shortname = promptInput("📝 Short name (optional)", "Example");
  const domainname = promptInput("🌍 Domain name (optional)", "example.com");
  const title = promptInput("👑 Title (optional)", "The Example Page");
  const description = promptInput(
    "📖 Description (optional)",
    "Find examples every day, anywhere, for example.",
  );
  const email = promptInput(
    "📧 Email contact (optional)",
    "hello@example.com",
  );
  const phone = promptInput("📞 Phone number (optional)", "+46 7182387123");

  const meta = {
    projectname: projectname.trim(),
    shortname: shortname.trim(),
    domainname: domainname.trim(),
    title: title.trim(),
    description: description.trim(),
    email: email.trim(),
    phone: phone.trim(),
    slug: slugifyProjectName(projectname),
  };

  console.log("");

  // ------------------------
  // Step 2: Select Template
  // ------------------------
  const templates: {
    label: string;
    value: { key: string; url: string | null };
  }[] = [
    {
      label: "🟢 Nuxt Tailwind",
      value: {
        key: "nuxt4-tw-template",
        url: "https://github.com/crunchwrap89/nuxt4-tw-template",
      },
    },
    {
      label: "🔥 Nuxt Tailwind (Firebase)",
      value: {
        key: "nuxt4-tw-fb-template",
        url: "https://github.com/crunchwrap89/nuxt4-tw-fb-template",
      },
    },
    { label: "🏗️  TBD", value: { key: "tbd-c", url: null } },
  ];

  const template = await promptSelect(
    "✨ Select which template to use:",
    templates,
  );

  if (!template.url) {
    console.log(yellow("\n🚧 That template is not available yet. Exiting."));
    return;
  }

  // ------------------------
  // Step 3: Generate Project
  // ------------------------
  const destDir = resolve(Deno.cwd(), meta.projectname);

  if (await exists(destDir)) {
    console.log(red(`\n💥 Error: Folder already exists: ${destDir}`));
    console.log(
      yellow(
        "💡 Please choose a different project name or remove the existing folder.\n",
      ),
    );
    Deno.exit(1);
  }

  const spinner = startSpinner("🚀 Generating repository...");

  try {
    // 1. Download template using degit
    await degitRepoToDir(template.url, destDir);

    // 2. Replace placeholders with project metadata
    await replacePlaceholdersInRepo(destDir, meta);

    spinner.stop(true);

    // ------------------------
    // Step 4: Firebase Init
    // ------------------------
    if (template.key.includes("-fb-")) {
      console.log(cyan("\n🔥 Running firebase init..."));
      try {
        const firebaseCmd = new Deno.Command("firebase", {
          args: ["init"],
          cwd: destDir,
          stdin: "inherit",
          stdout: "inherit",
          stderr: "piped",
        });

        const process = firebaseCmd.spawn();
        const { success, stderr } = await process.output();

        if (!success) {
          const errorMsg = new TextDecoder().decode(stderr);
          if (errorMsg.includes("firestore")) {
            console.log(
              yellow(
                "\n⚠️  It looks like Firestore is not yet enabled in your Firebase project.",
              ),
            );
            console.log(
              yellow("🔗 Please go to the Firebase Console to create it:"),
            );
            console.log(
              blue(bold("   https://console.firebase.google.com/project/_/firestore")),
            );
          } else {
            console.log(
              yellow("\n⚠️  Firebase initialization was not completed successfully."),
            );
            if (errorMsg.trim()) {
              console.log(red(errorMsg));
            }
          }
        }
      } catch (_err) {
        console.log(
          yellow(
            "⚠️  Could not run 'firebase init'. Make sure you have firebase-tools installed.",
          ),
        );
      }
    }

    // ------------------------
    // Step 5: Git Initialization and Publishing
    // ------------------------
    if (gitRepo) {
      console.log(cyan("\n🛠️  Initializing git repository and publishing..."));
      try {
        const runGit = async (args: string[]) => {
          const command = new Deno.Command("git", {
            args,
            cwd: destDir,
            stdout: "inherit",
            stderr: "inherit",
          });
          const { success } = await command.output();
          if (!success) {
            throw new Error(`Git command failed: git ${args.join(" ")}`);
          }
        };

        await runGit(["init"]);

        // If it's a GitHub repo, try to create it if it doesn't exist
        if (gitRepo.includes("github.com")) {
          try {
            // Extract repo name from URL (e.g., https://github.com/user/repo -> user/repo)
            const repoPath = gitRepo.split("github.com/")[1]?.replace(/\.git$/, "");
            if (repoPath) {
              console.log(cyan(`🐙 Ensuring GitHub repository exists: ${repoPath}`));
              const visibilityFlag = gitVisibility === "private" ? "--private" : "--public";
              
              const ghCommand = new Deno.Command("gh", {
                args: ["repo", "create", repoPath, visibilityFlag, "--confirm"],
                stdout: "inherit",
                stderr: "piped",
              });
              const { success, stderr } = await ghCommand.output();
              if (!success) {
                const errorMsg = new TextDecoder().decode(stderr);
                if (errorMsg.includes("already exists")) {
                  console.log(yellow("ℹ️  GitHub repository already exists."));
                } else {
                  console.log(yellow("⚠️  Could not create GitHub repository via 'gh' CLI. Proceeding assuming it exists."));
                }
              }
            }
          } catch (_e) {
            // gh CLI might not be installed or other error, ignore and proceed
          }
        }

        await runGit(["add", "."]);
        await runGit(["commit", "-m", "Initial commit from crunchwrap CLI"]);
        await runGit(["remote", "add", "origin", gitRepo]);
        await runGit(["push", "-u", "origin", "main"]);

        console.log(green("✅ Git repository initialized and pushed to remote."));
      } catch (err) {
        console.log(
          yellow(
            "\n⚠️  Failed to initialize or push to git repository. Please do it manually.",
          ),
        );
        if (err instanceof Error) {
          console.log(red(err.message));
        }
      }
    }

    console.log(
      green(bold(`\n🎉 Project successfully generated in: ${meta.projectname}`)),
    );
    console.log(green("🚀 Next steps:"));
    console.log(cyan(`  cd ${meta.projectname}`));
    console.log(cyan("  yarn install"));
    console.log(cyan("  yarn dev\n"));
    console.log(magenta(bold("Happy coding! 🌮🌯✨\n")));
  } catch (err) {
    spinner.stop(false);
    console.error(red("\n💥 Failed to generate project."));
    console.error(red(err instanceof Error ? err.message : String(err)));
    Deno.exit(1);
  }
}
