import { cyan, green, red, yellow } from "@std/fmt/colors";
import { resolve } from "@std/path";
import { exists } from "@std/fs";

import { startSpinner } from "./lib/ui.ts";
import { promptInput, promptSelect } from "./lib/prompt.ts";
import { degitRepoToDir } from "./lib/degit.ts";
import { replacePlaceholdersInRepo } from "./lib/replace.ts";
import { isValidProjectName, slugifyProjectName } from "./lib/validate.ts";

export async function initCommand() {
    console.log(cyan("Welcome to crunchwrap app CLI! Let's get going.\n"));

    // ------------------------
    // Step 1: Collect Project Information
    // ------------------------
    const projectname = await promptInput("Project name", "the-example-app", {
        required: true,
        validate: (v) => {
            if (!isValidProjectName(v)) return "Use letters, numbers, and dashes only.";
            return null;
        },
    });

    const shortname = await promptInput("Short name (optional)", "Example");
    const domainname = await promptInput("Domain name (optional)", "example.com");
    const title = await promptInput("Title (optional)", "The Example Page");
    const description = await promptInput(
        "Description (optional)",
        "Find examples every day, anywhere, for example.",
    );
    const email = await promptInput("Email contact (optional)", "hello@example.com");
    const phone = await promptInput("Phone number (optional)", "+46 7182387123");

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
    const templates: { label: string; value: { key: string; url: string | null } }[] = [
        {
            label: "Nuxt Tailwind Firebase",
            value: {
                key: "nuxt4-tw-template",
                url: "https://github.com/crunchwrap89/nuxt4-tw-template",
            },
        },
        { label: "TBD", value: { key: "tbd-b", url: null } },
        { label: "TBD", value: { key: "tbd-c", url: null } },
    ];

    const template = await promptSelect("Select which template to use:", templates);

    if (!template.url) {
        console.log(yellow("\nThat template is not available yet. Exiting."));
        return;
    }

    // ------------------------
    // Step 3: Generate Project
    // ------------------------
    const destDir = resolve(Deno.cwd(), meta.projectname);

    if (await exists(destDir)) {
        console.log(red(`\nError: Folder already exists: ${destDir}`));
        console.log(yellow("Please choose a different project name or remove the existing folder.\n"));
        Deno.exit(1);
    }

    const spinner = startSpinner("Generating repository...");

    try {
        // 1. Download template using degit
        await degitRepoToDir(template.url, destDir);

        // 2. Replace placeholders with project metadata
        await replacePlaceholdersInRepo(destDir, meta);

        spinner.stop(true);

        console.log(green(`\nProject successfully generated in: ${meta.projectname}`));
        console.log(green("Next steps:"));
        console.log(cyan(`  cd ${meta.projectname}`));
        console.log(cyan("  npm install"));
        console.log(cyan("  npm run dev\n"));
    } catch (err) {
        spinner.stop(false);
        console.error(red("\nFailed to generate project."));
        console.error(red(err instanceof Error ? err.message : String(err)));
        Deno.exit(1);
    }
}
