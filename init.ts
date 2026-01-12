import { cyan, green, red, yellow } from "@std/fmt/colors";
import { resolve } from "@std/path";
import { exists } from "@std/fs";

import { promptInput, promptSelect } from "./lib/prompt.ts";
import { degitRepoToDir } from "./lib/degit.ts";
import { replacePlaceholdersInRepo } from "./lib/replace.ts";
import { isValidProjectName, slugifyProjectName } from "./lib/validate.ts";

export async function initCommand() {
    console.log(cyan("Welcome to crunchwrap app CLI! Lets get going.\n"));

    // ------------------------
    // Step 1: Project info
    // ------------------------
    const projectname = await promptInput("Projectname", "The-Example-App", {
        required: true,
        validate: (v) => {
            if (!isValidProjectName(v)) return "Use letters/numbers/dashes only.";
            return null;
        },
    });

    const shortname = await promptInput("Shortname (optional)", "Example");
    const domainname = await promptInput("Domainname (optional)", "example.com");
    const title = await promptInput("Title (optional)", "The example page");
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
    // Step 2: Template select
    // ------------------------
    const template = await promptSelect("Select which template to use:", [
        {
            label: "Nuxt Tailwind Firebase",
            value: {
                key: "nuxt4-tw-template",
                // Keep your original URL here — we’ll transform it for degit
                url: "https://github.com/crunchwrap89/nuxt4-tw-template",
            },
        },
        { label: "TBD", value: { key: "tbd-b", url: null } },
        { label: "TBD", value: { key: "tbd-c", url: null } },
    ]);

    if (!template.url) {
        console.log(yellow("That template is not available yet. Exiting."));
        return;
    }

    // ------------------------
    // Step 3: Generate project using degit
    // ------------------------
    const destDir = resolve(Deno.cwd(), meta.projectname);

    if (await exists(destDir)) {
        console.log(red(`\nFolder already exists: ${destDir}`));
        console.log(red("Choose a different Projectname or remove the folder.\n"));
        Deno.exit(1);
    }

    const spin = startSpinner("Generating repository..");

    try {
        // 1) degit pulls repo contents without history
        await degitRepoToDir(template.url, destDir);

        // 2) Replace placeholders inside template
        await replacePlaceholdersInRepo(destDir, meta);

        spin.stop(true);
        console.log(green(`Repository generated: ${meta.projectname}\n`));
        console.log(green("Done! Next steps:"));
        console.log(`  cd ${meta.projectname}`);
        console.log("  npm install\n");
    } catch (err) {
        spin.stop(false);
        console.error(red("Failed to generate repository."));
        console.error(err?.message ?? err);
        Deno.exit(1);
    }
}

// Minimal spinner (no dependencies)
function startSpinner(text: string) {
    const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
    let i = 0;
    const timer = setInterval(() => {
        const frame = frames[i++ % frames.length];
        Deno.stdout.writeSync(new TextEncoder().encode(`\r${frame} ${text}`));
    }, 80);

    return {
        stop(success: boolean) {
            clearInterval(timer);
            const icon = success ? "✅" : "❌";
            Deno.stdout.writeSync(new TextEncoder().encode(`\r${icon} ${text}\n`));
        },
    };
}
