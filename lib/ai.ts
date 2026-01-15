import { startSpinner } from "./ui.ts";
import { join } from "@std/path";
import { ensureDir } from "@std/fs";
import { GoogleGenAI } from "@google/genai";
import { processLogo } from "./image.ts";
import { promptInput } from "./prompt.ts";

/**
 * Generates a logo using Google's Gemini AI (Imagen model)
 */
export async function generateLogo(
  prompt: string,
  apiKey: string,
  destDir: string,
): Promise<string | null> {
  let spinner = startSpinner("🎨 Generating logo with AI...");

  try {
    const ai = new GoogleGenAI({ apiKey });

    const chat = ai.chats.create({
      model: "gemini-3-pro-image-preview",
      config: {
        imageConfig: {
          aspectRatio: "1:1",
        },
      },
    });

    let currentPrompt = prompt;

    while (true) {
      const response = await chat.sendMessage({ message: currentPrompt });

      let base64Image: string | undefined;
      const candidates = response.candidates;
      if (candidates && candidates.length > 0) {
        for (const part of candidates[0]?.content?.parts ?? []) {
          if (part.inlineData && (part.inlineData.mimeType === "image/png" || part.inlineData.mimeType === "image/jpeg")) {
            base64Image = part.inlineData.data;
            break;
          }
        }
      }

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

      const improvement = promptInput(
        "✨ Would you like to improve this logo? (enter your instructions, or leave empty to finish)",
        "",
      );

      if (!improvement) {
        return logoPath;
      }

      currentPrompt = improvement;
      spinner = startSpinner("🎨 Improving logo with AI...");
    }
  } catch (err) {
    spinner.stop(false);
    if (err instanceof Error && err.name === "ApiError") {
      console.log(`  ⚠️  Gemini API Error: ${err.message} (Status: ${(err as any).status})`);
    } else {
      console.log(`  ⚠️  An unexpected error occurred: ${err instanceof Error ? err.message : String(err)}`);
    }
    return null;
  }
}
