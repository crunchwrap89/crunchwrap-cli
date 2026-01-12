function normalizeToDegitSource(repoUrl: string): string {
    // Accept:
    //  https://github.com/owner/repo
    //  https://github.com/owner/repo.git
    // Output:
    //  owner/repo
    const m = repoUrl.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+)(\/.*)?$/);
    if (!m) throw new Error("Invalid GitHub repo URL.");

    const owner = m[1];
    const repo = m[2].replace(/\.git$/, "");
    return `${owner}/${repo}`;
}

async function run(cmd: string[], cwd?: string) {
    const p = new Deno.Command(cmd[0], {
        args: cmd.slice(1),
        cwd,
        stdout: "null",
        stderr: "piped",
    });

    const res = await p.output();
    if (!res.success) {
        throw new Error(new TextDecoder().decode(res.stderr));
    }
}

async function commandExists(name: string): Promise<boolean> {
    try {
        const p = new Deno.Command(name, {
            args: ["--version"],
            stdout: "null",
            stderr: "null",
        });
        const res = await p.output();
        return res.success;
    } catch {
        return false;
    }
}

export async function degitRepoToDir(repoUrl: string, destDir: string) {
    const source = normalizeToDegitSource(repoUrl);

    // Prefer bunx (faster) if available, else fallback to npx
    const hasBun = await commandExists("bun");

    // Option flags:
    // --force: overwrite target if exists (we already prevent this, but ok)
    // --cache: keep cache (faster for repeated)
    // --mode=tar: tarball fetch (fast and clean)
    const runner = hasBun ? ["bunx"] : ["npx", "--yes"];

    await run([
        ...runner,
        "degit",
        source,
        destDir,
        "--mode=tar",
    ]);
}
