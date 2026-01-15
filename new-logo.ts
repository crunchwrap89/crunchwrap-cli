import { blue, bold, cyan, red, yellow } from "@std/fmt/colors";
import { promptInput, promptSelect } from "./lib/prompt.ts";
import { generateLogo } from "./lib/ai.ts";
import { join } from "@std/path";
import { exists } from "@std/fs";

export async function newLogoCommand() {
  console.log(yellow(bold(`
  _____                        _                                
 / ____|                      | |                               
| |     _ __ _   _ _ __   ___ | |__ __      __ _ __ __ _ _ __  
| |    | '__| | | | '_ \\ / __| '_ \\\\ \\ /\\ / / '__/ _\` | '_ \\ 
| |____| |  | |_| | | | | (__| | | |\\ V  V /| | | (_| | |_) |
 \\_____|_|   \\__,_|_| |_|\\___|_| |_| \\_/\\_/ |_|  \\__,_| .__/ 
                                                      | |    
                                                      |_|    
  `)));
  console.log(cyan(bold("  Generate a new logo for your project! 🎨\n")));

  const destDir = Deno.cwd();
  const publicDir = join(destDir, "public");
  const logoPathExists = await exists(join(publicDir, "logo.png"));

  if (logoPathExists) {
    console.log(yellow(bold("  ⚠️  Warning: Existing logo files found in /public directory.")));
    const confirm = await promptSelect("  Do you want to overwrite them?", [
      { label: "❌ No, cancel", value: false },
      { label: "✅ Yes, overwrite", value: true },
    ]);

    if (!confirm) {
      console.log(blue("\n  Operation cancelled. No files were changed."));
      return;
    }
    console.log("");
  }

  const logoPrompt = promptInput(
    "✨ Enter a prompt for your logo",
    "",
    { required: true }
  );

  const envApiKey = Deno.env.get("GEMINI_API_KEY");
  const geminiApiKey = envApiKey || promptInput("🔑 Enter your Google Gemini API key", "", {
    required: true,
  });

  const logoPath = await generateLogo(logoPrompt, geminiApiKey, destDir);

  if (logoPath) {
    console.log(blue(`\n  ✅ All done!`));
    console.log(`  📂 Files updated in: ${bold(destDir + "/public")}`);
  } else {
    console.log(red(`\n  ❌ Failed to generate logo.`));
  }
}
