import { blue, bold, cyan, red, yellow } from "@std/fmt/colors";
import { promptSelect } from "./lib/prompt.ts";
import { processLogo } from "./lib/image.ts";
import { walk } from "@std/fs";
import { extname } from "@std/path";

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp"]);
const SKIP_DIRS = new Set(["node_modules", ".git", ".output", "dist", ".nuxt", ".cache"]);

async function findImages(rootDir: string): Promise<string[]> {
  const images: string[] = [];

  for await (const entry of walk(rootDir, { includeDirs: false })) {
    const ext = extname(entry.path).toLowerCase();
    if (!IMAGE_EXTENSIONS.has(ext)) continue;

    const pathParts = entry.path.split(/[\\/]/g);
    if (pathParts.some((part) => SKIP_DIRS.has(part))) continue;

    // Get relative path from rootDir
    const relativePath = entry.path.slice(rootDir.length + 1);
    images.push(relativePath);
  }

  return images.sort();
}

export async function newPwaImagesCommand() {
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
  console.log(cyan(bold("  Generate PWA images from an existing image! 📱\n")));

  const destDir = Deno.cwd();

  console.log(cyan("  Scanning for images..."));
  const images = await findImages(destDir);

  if (images.length === 0) {
    console.log(red("\n  ❌ No images found in this directory."));
    console.log(yellow("  Supported formats: .png, .jpg, .jpeg, .webp"));
    return;
  }

  console.log(cyan(`  Found ${images.length} image(s).\n`));

  const selectedImage = await promptSelect(
    "📷 Select an image to use as source",
    images.map((img) => ({ label: img, value: img }))
  );

  const sourcePath = `${destDir}/${selectedImage}`;

  console.log(cyan(`\n  Using: ${selectedImage}`));

  await processLogo(sourcePath, destDir);

  console.log(blue(`\n  ✅ All done!`));
  console.log(`  📂 PWA images generated in: ${bold(destDir + "/public")}`);
}
