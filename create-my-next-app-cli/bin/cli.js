#!/usr/bin/env node

/**
 * kindredaistudio
 *
 * A small, dependency-free Node.js CLI for scaffolding a Next.js project from
 * a GitHub template repository.
 *
 * Publish this package to GitHub Packages, then users can run:
 *
 *   npx @ramdevcalope1995/kindredaistudio my-project
 *
 * Keep this file thin: it owns CLI orchestration, while filesystem/process
 * helpers live in ../lib/utils.js.
 */

import path from "node:path";
import process from "node:process";
import {
  assertCommandAvailable,
  assertDirectoryIsSafeToCreate,
  cloneTemplate,
  formatCommand,
  initializeGitRepository,
  installDependencies,
  promptForProjectName,
  removeGitDirectory,
  rewritePackageName,
  sanitizePackageName,
} from "../lib/utils.js";

/**
 * The clone is shallow (`--depth 1`) so startup is fast and history is not
 * downloaded. The `.git` folder is removed immediately after cloning.
 */
const TEMPLATE_REPO_URL = "https://github.com/ramdevcalope1995/kindredaistudio.git";

async function main() {
  const rawProjectName = process.argv[2] || (await promptForProjectName());
  const projectName = rawProjectName.trim();

  if (!projectName) {
    throw new Error("Project name is required.");
  }

  const targetDir = path.resolve(process.cwd(), projectName);
  const packageName = sanitizePackageName(projectName);

  console.log(`\nCreating a new Next.js app in ${targetDir}\n`);

  await assertCommandAvailable("git");
  await assertCommandAvailable("npm");
  await assertDirectoryIsSafeToCreate(targetDir);

  await cloneTemplate({
    repoUrl: TEMPLATE_REPO_URL,
    targetDir,
  });

  await removeGitDirectory(targetDir);
  await rewritePackageName({
    projectDir: targetDir,
    packageName,
  });
  await initializeGitRepository(targetDir);
  await installDependencies(targetDir);

  printSuccessMessage({
    projectName,
    packageName,
  });
}

function printSuccessMessage({ projectName, packageName }) {
  console.log("\nSuccess! Your project is ready.\n");
  console.log(`Package name: ${packageName}\n`);
  console.log("Next steps:");
  console.log(`  ${formatCommand(`cd ${projectName}`)}`);
  console.log(`  ${formatCommand("npm run dev")}`);
  console.log("\nHappy building.\n");
}

main().catch((error) => {
  console.error("\nFailed to create the project.");
  console.error(error instanceof Error ? error.message : String(error));
  console.error("");
  process.exitCode = 1;
});
