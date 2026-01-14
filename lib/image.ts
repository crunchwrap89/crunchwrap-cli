import { join, dirname } from "@std/path";
import { ensureDir } from "@std/fs";
import { startSpinner } from "./ui.ts";

export interface IconConfig {
  src: string;
  sizes: string;
  type: string;
  purpose?: string;
}

const ICONS: IconConfig[] = [
  { src: "android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
  { src: "favicon.ico", sizes: "32x32", type: "image/x-icon" },
  { src: "img/brand/pwa-72x72.png", sizes: "72x72", type: "image/png" },
  { src: "img/brand/pwa-96x96.png", sizes: "96x96", type: "image/png" },
  { src: "img/brand/pwa-120x120.png", sizes: "120x120", type: "image/png" },
  { src: "img/brand/pwa-152x152.png", sizes: "152x152", type: "image/png" },
  { src: "img/brand/pwa-167x167.png", sizes: "167x167", type: "image/png" },
  { src: "img/brand/pwa-180x180.png", sizes: "180x180", type: "image/png" },
  { src: "img/brand/pwa-192x192.png", sizes: "192x192", type: "image/png" },
  { src: "img/brand/pwa-384x384.webp", sizes: "384x384", type: "image/webp" },
  { src: "img/brand/pwa-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
  { src: "img/brand/maskable-icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
];

async function isFfmpegAvailable(): Promise<boolean> {
  try {
    const command = new Deno.Command("ffmpeg", {
      args: ["-version"],
      stdout: "null",
      stderr: "null",
    });
    const { success } = await command.output();
    return success;
  } catch {
    return false;
  }
}

export async function processLogo(logoPath: string, destDir: string) {
  if (!(await isFfmpegAvailable())) {
    console.log("  ⚠️  FFMPEG not found. Skipping logo conversion.");
    return;
  }

  const spinner = startSpinner("🎨 Converting logo to multiple sizes...");
  const publicDir = join(destDir, "public");

  try {
    for (const [index, icon] of ICONS.entries()) {
      spinner.update(`🎨 Converting logo to multiple sizes (${index + 1}/${ICONS.length})...`);
      const outputPath = join(publicDir, icon.src);
      await ensureDir(dirname(outputPath));

      const [width, height] = icon.sizes.split("x").map(Number);
      
      const args = [
        "-i", logoPath,
        "-vf", `scale=${width}:${height}`,
        "-y", // Overwrite output files without asking
        outputPath
      ];

      const command = new Deno.Command("ffmpeg", {
        args,
        stdout: "null",
        stderr: "null",
      });

      const { success, code } = await command.output();
      if (!success) {
        console.error(`  ⚠️  Failed to convert logo to ${icon.src} (exit code ${code})`);
      }
    }
    spinner.stop(true);
  } catch (err) {
    spinner.stop(false);
    console.error(`  ⚠️  Error during logo conversion: ${err instanceof Error ? err.message : String(err)}`);
  }
}
