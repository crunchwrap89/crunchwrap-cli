import { startSpinner } from "./ui.ts";
import { join } from "@std/path";
import { ensureDir } from "@std/fs";
import { GoogleGenAI } from "@google/genai";
import { processLogo } from "./image.ts";

/**
 * Generates a logo using Google's Gemini AI (Imagen model)
 */
export async function generateLogo(
  prompt: string,
  apiKey: string,
  destDir: string,
): Promise<string | null> {
  const spinner = startSpinner("🎨 Generating logo with AI...");

  try {
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateImages({
      model: "imagen-4.0-generate-001",
      prompt: prompt,
      config: {
        numberOfImages: 1,
        aspectRatio: "1:1",
        outputMimeType: "image/png",
      },
    });

    const base64Image = response.generatedImages?.[0]?.image?.imageBytes;

    if (!base64Image) {
      spinner.stop(false);
      console.log("  ⚠️  Failed to generate logo: No image data received from AI.");
      return null;
    }

    const imageBuffer = Uint8Array.from(atob(base64Image), (c) => c.charCodeAt(0));
    const publicDir = join(destDir, "public");
    await ensureDir(publicDir);
    const logoPath = join(publicDir, "logo.png");
    await Deno.writeFile(logoPath, imageBuffer);

    spinner.stop(true);

    // Process the logo into multiple sizes and formats
    await processLogo(logoPath, destDir);

    return logoPath;
  } catch (err) {
    spinner.stop(false);
    console.log(`  ⚠️  An unexpected error occurred: ${err instanceof Error ? err.message : String(err)}`);
    return null;
  }
}
