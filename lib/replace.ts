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

export async function replacePlaceholdersInRepo(
    rootDir: string,
    meta: Record<string, string>,
) {
    const replacements = new Map<string, string>([
        ["{{PROJECT_NAME}}", meta.projectname],
        ["{{PROJECT_SLUG}}", meta.slug],
        ["{{SHORT_NAME}}", meta.shortname],
        ["{{DOMAIN_NAME}}", meta.domainname],
        ["{{TITLE}}", meta.title],
        ["{{DESCRIPTION}}", meta.description],
        ["{{EMAIL}}", meta.email],
        ["{{PHONE}}", meta.phone],
    ]);

    for await (const entry of walk(rootDir, { includeDirs: false })) {
        const p = entry.path;

        if (SKIP_EXT.has(extname(p).toLowerCase())) continue;

        // skip directories in path
        const parts = p.split(/[\\/]/g);
        if (parts.some((x) => SKIP_DIRS.has(x))) continue;

        let content: string;
        try {
            content = await Deno.readTextFile(p);
        } catch {
            continue;
        }

        let out = content;
        for (const [needle, value] of replacements.entries()) {
            out = out.split(needle).join(value ?? "");
        }

        if (out !== content) {
            await Deno.writeTextFile(p, out);
        }
    }
}
