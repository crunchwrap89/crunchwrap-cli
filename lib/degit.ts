/**
 * Normalizes a GitHub URL to "owner/repo" format.
 */
function normalizeToDegitSource(repoUrl: string): string {
    const match = repoUrl.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+)(\/.*)?$/);
    if (!match) {
        throw new Error(`Invalid GitHub repository URL: ${repoUrl}`);
    }

    const owner = match[1];
    const repo = match[2].replace(/\.git$/, "");
    return `${owner}/${repo}`;
}

/**
 * Executes a shell command and returns the output.
 */
async function execCommand(command: string[], cwd?: string): Promise<void> {
    const cmd = new Deno.Command(command[0], {
        args: command.slice(1),
        cwd,
        stdout: "null",
        stderr: "piped",
    });

    const { success, stderr } = await cmd.output();
    if (!success) {
        throw new Error(new TextDecoder().decode(stderr));
    }
}

/**
 * Checks if a command exists in the system path.
 */
async function commandExists(name: string): Promise<boolean> {
    try {
        const cmd = new Deno.Command(name, {
            args: ["--version"],
            stdout: "null",
            stderr: "null",
        });
        const { success } = await cmd.output();
        return success;
    } catch {
        return false;
    }
}

/**
 * Clones a repository to a directory using degit.
 */
export async function degitRepoToDir(repoUrl: string, destDir: string) {
    const source = normalizeToDegitSource(repoUrl);

    // Use bunx if available (it's faster), otherwise fallback to npx
    const hasBun = await commandExists("bun");
    const runner = hasBun ? ["bunx"] : ["npx", "--yes"];

    await execCommand([
        ...runner,
        "degit",
        source,
        destDir,
        "--mode=tar",
    ]);
}
