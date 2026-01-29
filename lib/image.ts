import { join, dirname } from "@std/path";
import { ensureDir } from "@std/fs";
import { startSpinner } from "./ui.ts";
import { promptSelect } from "./prompt.ts";
import { yellow } from "@std/fmt/colors";

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

async function getImageDimensions(imagePath: string): Promise<{ width: number; height: number } | null> {
  try {
    const command = new Deno.Command("ffprobe", {
      args: [
        "-v", "error",
        "-select_streams", "v:0",
        "-show_entries", "stream=width,height",
        "-of", "csv=p=0",
        imagePath,
      ],
      stdout: "piped",
      stderr: "null",
    });
    const { success, stdout } = await command.output();
    if (!success) return null;

    const output = new TextDecoder().decode(stdout).trim();
    const [width, height] = output.split(",").map(Number);
    if (isNaN(width) || isNaN(height)) return null;

    return { width, height };
  } catch {
    return null;
  }
}

type ScaleMode = "stretch" | "fit";

export async function processLogo(logoPath: string, destDir: string) {
  if (!(await isFfmpegAvailable())) {
    console.log("  ⚠️  FFMPEG not found. Skipping logo conversion.");
    return;
  }

  // Check if the image is square
  let scaleMode: ScaleMode = "stretch";
  const dimensions = await getImageDimensions(logoPath);

  if (dimensions) {
    const isSquare = dimensions.width === dimensions.height;
    if (!isSquare) {
      console.log(yellow(`\n  ⚠️  Image is not square (${dimensions.width}x${dimensions.height})`));
      scaleMode = await promptSelect("📐 How should the image be resized?", [
        { label: "🔲 Fit (preserve aspect ratio, add transparent background)", value: "fit" as ScaleMode },
        { label: "↔️  Stretch (distort to fill)", value: "stretch" as ScaleMode },
      ]);
      console.log("");
    }
  }

  // Ask if user wants a monochrome version
  const includeMonochrome = await promptSelect("🖤 Include a monochrome (grayscale) 512x512 version?", [
    { label: "❌ No", value: false },
    { label: "✅ Yes", value: true },
  ]);
  console.log("");

  const spinner = startSpinner("🎨 Converting logo to multiple sizes...");
  const publicDir = join(destDir, "public");

  try {
    const totalIcons = ICONS.length + (includeMonochrome ? 1 : 0);

    for (const [index, icon] of ICONS.entries()) {
      spinner.update(`🎨 Converting logo to multiple sizes (${index + 1}/${totalIcons})...`);
      const outputPath = join(publicDir, icon.src);
      await ensureDir(dirname(outputPath));

      const [width, height] = icon.sizes.split("x").map(Number);

      let filterChain: string;
      if (scaleMode === "fit") {
        // Scale to fit within bounds, then pad with transparent background
        filterChain = `scale=w=${width}:h=${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=0x00000000`;
      } else {
        // Stretch to exact size
        filterChain = `scale=${width}:${height}`;
      }

      const args = [
        "-i", logoPath,
        "-vf", filterChain,
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

    // Generate monochrome version if requested
    if (includeMonochrome) {
      spinner.update(`🎨 Converting logo to multiple sizes (${totalIcons}/${totalIcons})...`);
      const monoOutputPath = join(publicDir, "img/brand/pwa-512x512-mono.png");
      await ensureDir(dirname(monoOutputPath));

      let monoFilterChain: string;
      if (scaleMode === "fit") {
        monoFilterChain = `scale=w=512:h=512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000,format=gray`;
      } else {
        monoFilterChain = `scale=512:512,format=gray`;
      }

      const monoArgs = [
        "-i", logoPath,
        "-vf", monoFilterChain,
        "-y",
        monoOutputPath
      ];

      const monoCommand = new Deno.Command("ffmpeg", {
        args: monoArgs,
        stdout: "null",
        stderr: "null",
      });

      const { success, code } = await monoCommand.output();
      if (!success) {
        console.error(`  ⚠️  Failed to convert logo to monochrome (exit code ${code})`);
      }
    }

    spinner.stop(true);
  } catch (err) {
    spinner.stop(false);
    console.error(`  ⚠️  Error during logo conversion: ${err instanceof Error ? err.message : String(err)}`);
  }
}
