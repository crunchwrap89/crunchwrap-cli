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
  _____                        _                                
 / ____|                      | |                               
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

  const gitRepoInput = promptInput(
    "🌐 Git repository URL or 'user/repo' (optional)",
    "",
  );
  let gitRepo = gitRepoInput.trim();

  // Handle shorthand user/repo format for GitHub
  if (gitRepo && !gitRepo.includes("://") && !gitRepo.includes("@")) {
    if (gitRepo.includes("/")) {
      const parts = gitRepo.split("/");
      const user = parts[0].trim();
      const repo = parts[1].trim();
      gitRepo = `git@github.com:${user}/${repo}.git`;
      console.log(cyan(`  🚀 Expanded to: ${gitRepo}`));
    }
  }

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
      console.log(cyan("\n🛠️  Initializing local git repository..."));
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

        await runGit(["add", "."]);
        await runGit(["commit", "-m", "Initial commit from crunchwrap CLI"]);
        await runGit(["branch", "-M", "main"]);

        // If it's a GitHub repo, try to create it if it doesn't exist
        if (gitRepo.includes("github.com")) {
          try {
            // Extract repo name from URL
            // Handle SSH: git@github.com:user/repo.git
            // Handle HTTPS: https://github.com/user/repo
            let repoPath = "";
            if (gitRepo.includes("github.com:")) {
              // SSH format: git@github.com:user/repo.git
              repoPath = gitRepo.split("github.com:")[1]
                ?.replace(/\.git$/, "")
                ?.trim();
            } else if (gitRepo.includes("github.com/")) {
              // HTTPS format: https://github.com/user/repo
              repoPath = gitRepo.split("github.com/")[1]
                ?.replace(/\.git$/, "")
                ?.trim();
            }

            if (repoPath) {
              // Ensure we don't have leading/trailing slashes
              repoPath = repoPath.replace(/^\/+|\/+$/g, "");

              console.log(cyan(`\n🐙 Ensuring GitHub repository exists: ${repoPath}`));

              // First, check if gh is installed and authenticated
              const authCheck = new Deno.Command("gh", {
                args: ["auth", "status"],
                stdout: "piped",
                stderr: "piped",
              });
              const authResult = await authCheck.output();

              if (!authResult.success) {
                console.log(red("\n❌ GitHub CLI (gh) is required but not authenticated."));
                console.log(
                  yellow(
                    "   Please run 'gh auth login' to authenticate and try again.",
                  ),
                );
                Deno.exit(1);
              }

              // Ensure git is configured to use gh for credentials
              try {
                const setupGit = new Deno.Command("gh", {
                  args: ["auth", "setup-git"],
                  stdout: "null",
                  stderr: "null",
                });
                await setupGit.output();
              } catch (_e) {
                // Ignore failures here
              }

              const visibilityFlag = gitVisibility === "private"
                ? "--private"
                : "--public";

              // Check if repo already exists using 'gh repo view'
              const viewCommand = new Deno.Command("gh", {
                args: ["repo", "view", repoPath],
                cwd: destDir,
                stdout: "piped",
                stderr: "piped",
              });
              const viewResult = await viewCommand.output();

              if (!viewResult.success) {
                // If it doesn't exist, create it and push
                console.log(cyan(`🚀 Creating ${gitVisibility} repository: ${repoPath}...`));

                // Use --source=. to link the current directory to the new repo
                // --remote=origin to set up the remote
                // --push to push the initial commit
                const ghCommand = new Deno.Command("gh", {
                  args: [
                    "repo",
                    "create",
                    repoPath,
                    visibilityFlag,
                    "--source=.",
                    "--remote=origin",
                    "--push",
                  ],
                  cwd: destDir,
                  stdout: "inherit",
                  stderr: "inherit",
                });
                const { success } = await ghCommand.output();

                if (!success) {
                  throw new Error(`Failed to create GitHub repository via 'gh' CLI.`);
                }

                console.log(green("✅ GitHub repository created and pushed successfully."));
              } else {
                console.log(
                  yellow("ℹ️  GitHub repository already exists. Linking and pushing..."),
                );

                // Link manually
                const remoteCommand = new Deno.Command("git", {
                  args: ["remote", "add", "origin", gitRepo],
                  cwd: destDir,
                  stdout: "null",
                  stderr: "null",
                });
                await remoteCommand.output();

                // Push manually
                await runGit(["push", "-u", "origin", "main"]);
                console.log(green(`✅ Pushed to existing repository: ${gitRepo}`));
              }
            }
          } catch (err) {
            console.log(yellow("\n⚠️  Failed to publish to GitHub."));
            if (err instanceof Error) {
              console.log(red(`   ${err.message}`));
            }
            console.log(
              yellow(
                "   Please ensure you have correct permissions and 'gh' is set up correctly.",
              ),
            );
          }
        } else {
          console.log(
            yellow(
              "\n⚠️  Only GitHub is supported for automated publishing via the 'gh' CLI.",
            ),
          );
          console.log(yellow("   Skipping remote publishing."));
        }
      } catch (err) {
        console.log(yellow("\n⚠️  Failed to initialize git repository."));
        if (err instanceof Error) {
          console.log(red(`   ${err.message}`));
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
