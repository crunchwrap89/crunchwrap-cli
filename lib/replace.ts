import { walk } from "@std/fs";
import { extname } from "@std/path";

const SKIP_DIRS = new Set(["node_modules", ".git", ".output", "dist", ".nuxt"]);
const SKIP_EXT = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".ico",
  ".woff",
  ".woff2",
  ".ttf",
  ".pdf",
  ".zip",
]);

/**
 * Replaces placeholders in all files of a directory.
 */
export async function replacePlaceholdersInRepo(
  rootDir: string,
  meta: Record<string, string>,
) {
  const replacements: [string, string][] = [
    ["{{PROJECT_NAME}}", meta.projectname],
    ["{{PROJECT_SLUG}}", meta.slug],
    ["{{SHORT_NAME}}", meta.shortname],
    ["{{DOMAIN_NAME}}", meta.domainname],
    ["{{TITLE}}", meta.title],
    ["{{DESCRIPTION}}", meta.description],
    ["{{EMAIL}}", meta.email],
    ["{{PHONE}}", meta.phone],
    ["template-title-placeholder", meta.title],
    ["template-description-placeholder", meta.description],
    ["template-email-placeholder", meta.email],
    ["template-phone-placeholder", meta.phone],
    ["template.com", meta.domainname],
  ];

  for await (const entry of walk(rootDir, { includeDirs: false })) {
    const path = entry.path;
    const extension = extname(path).toLowerCase();

    // Skip binary files and specific directories
    if (SKIP_EXT.has(extension)) continue;

    const pathParts = path.split(/[\\/]/g);
    if (pathParts.some((part) => SKIP_DIRS.has(part))) continue;

    let content: string;
    try {
      content = await Deno.readTextFile(path);
    } catch {
      // Skip files that can't be read as text
      continue;
    }

    let updatedContent = content;
    for (const [placeholder, value] of replacements) {
      if (updatedContent.includes(placeholder)) {
        updatedContent = updatedContent.replaceAll(placeholder, value ?? "");
      }
    }

    if (updatedContent !== content) {
      await Deno.writeTextFile(path, updatedContent);
    }
  }
}
