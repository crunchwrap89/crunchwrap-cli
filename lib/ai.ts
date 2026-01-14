import { startSpinner } from "./ui.ts";
import { join } from "@std/path";
import { ensureDir } from "@std/fs";

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
    // Note: Using imagen-4.0-generate-001 model via Gemini API
    const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:generateImages?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: prompt,
        config: {
          numberOfImages: 1,
          aspectRatio: "1:1",
          outputMimeType: "image/png",
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || `API request failed with status ${response.status}`;
      spinner.stop(false);
      console.log(`  ⚠️  Failed to generate logo: ${errorMessage}`);
      return null;
    }

    const data = await response.json();
    const base64Image = data.generatedImages?.[0]?.image?.imageBytes;

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
    return logoPath;
  } catch (err) {
    spinner.stop(false);
    console.log(`  ⚠️  An unexpected error occurred: ${err instanceof Error ? err.message : String(err)}`);
    return null;
  }
}
