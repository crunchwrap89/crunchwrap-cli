async function main() {
  const denoJsonPath = "deno.json";
  const denoJson = JSON.parse(await Deno.readTextFile(denoJsonPath));
  let version = denoJson.version;
  const changelogPath = "CHANGELOG.md";
  let changelog = await Deno.readTextFile(changelogPath);

  // 1. Add the latest commit message to [Unreleased] section first
  try {
    const command = new Deno.Command("git", {
      args: ["log", "-1", "--pretty=%s"],
    });
    const { stdout } = await command.output();
    const lastCommitMsg = new TextDecoder().decode(stdout).trim();
    const skipMessages = [
      "Update version",
      "Update changelog",
      "chore:",
      "Merge branch",
      "Refactor",
      "docs: Update CHANGELOG.md",
    ];

    if (
      lastCommitMsg &&
      !skipMessages.some((skip) => lastCommitMsg.includes(skip))
    ) {
      console.log(`Adding commit to Unreleased: ${lastCommitMsg}`);

      const unreleasedIndex = changelog.indexOf("## [Unreleased]");
      const nextHeaderIndex = changelog.indexOf("## [", unreleasedIndex + 1);

      let sectionToAppend = "### Miscellaneous";
      if (lastCommitMsg.toLowerCase().startsWith("feat")) {
        sectionToAppend = "### Features";
      }
      if (lastCommitMsg.toLowerCase().startsWith("fix")) {
        sectionToAppend = "### Fixes";
      }

      const searchEndIndex = nextHeaderIndex !== -1
        ? nextHeaderIndex
        : changelog.length;
      const sectionContent = changelog.substring(
        unreleasedIndex,
        searchEndIndex,
      );

      if (!sectionContent.includes(lastCommitMsg)) {
        const headerIndex = changelog.indexOf(sectionToAppend, unreleasedIndex);
        if (
          headerIndex !== -1 && (nextHeaderIndex === -1 || headerIndex < nextHeaderIndex)
        ) {
          // Append to existing header
          const insertAt = headerIndex + sectionToAppend.length;
          changelog = changelog.substring(0, insertAt) + `\n\n- ${lastCommitMsg}` +
            changelog.substring(insertAt);
        } else {
          // Add header and commit at the start of Unreleased
          const insertAt = unreleasedIndex + "## [Unreleased]".length;
          changelog = changelog.substring(0, insertAt) +
            `\n\n${sectionToAppend}\n\n- ${lastCommitMsg}` +
            changelog.substring(insertAt);
        }
      }
    }
  } catch (e) {
    console.error("Failed to get git commit or update [Unreleased]:", e);
  }

  // 2. Bump version in deno.json IF it hasn't been manually bumped already
  if (changelog.includes(`## [${version}]`)) {
    const parts = version.split(".");
    if (parts.length === 3) {
      const patch = parseInt(parts[2], 10);
      if (!isNaN(patch)) {
        const newVersion = `${parts[0]}.${parts[1]}.${patch + 1}`;
        console.log(`Bumping version from ${version} to ${newVersion}...`);
        denoJson.version = newVersion;
        version = newVersion;
        await Deno.writeTextFile(
          denoJsonPath,
          JSON.stringify(denoJson, null, 2) + "\n",
        );
      }
    }
  } else {
    console.log(
      `Version ${version} not found in CHANGELOG.md. Assuming manual bump.`,
    );
  }

  // 3. Release the new version in the changelog
  const today = new Date().toISOString().split("T")[0];
  const versionHeader = `## [${version}] - ${today}`;

  if (!changelog.includes(`## [${version}]`)) {
    console.log(`Releasing version ${version} in changelog...`);

    const unreleasedIndex = changelog.indexOf("## [Unreleased]");
    if (unreleasedIndex === -1) {
      changelog = "# Crunchwrap CLI Changelog\n\n## [Unreleased]\n\n" +
        changelog.replace("# Crunchwrap CLI Changelog", "");
    }

    const nextHeaderIndex = changelog.indexOf("## [", unreleasedIndex + 1);

    let unreleasedContent: string;
    if (nextHeaderIndex !== -1) {
      unreleasedContent = changelog.substring(
        unreleasedIndex + "## [Unreleased]".length,
        nextHeaderIndex,
      ).trim();
    } else {
      unreleasedContent = changelog.substring(
        unreleasedIndex + "## [Unreleased]".length,
      ).trim();
    }

    const newUnreleasedSection = `## [Unreleased]\n\n### Features\n\n### Fixes\n\n`;

    if (nextHeaderIndex !== -1) {
      changelog = changelog.substring(0, unreleasedIndex) +
        newUnreleasedSection +
        versionHeader + "\n\n" + unreleasedContent + "\n\n" +
        changelog.substring(nextHeaderIndex);
    } else {
      changelog = changelog.substring(0, unreleasedIndex) +
        newUnreleasedSection +
        versionHeader + "\n\n" + unreleasedContent;
    }
  }

  // Clean up extra newlines
  changelog = changelog.replace(/\n{3,}/g, "\n\n").trim() + "\n";

  await Deno.writeTextFile(changelogPath, changelog);
  console.log("CHANGELOG.md updated.");
}

main().then();
