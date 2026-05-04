/**
 * Utility helpers for create-my-next-app.
 *
 * This module intentionally uses only built-in Node.js APIs. That keeps the
 * CLI small, quick to install through npx, and easy to audit.
 */

import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

/**
 * Ask for a project name when the user runs `npx create-my-next-app`
 * without an argument.
 */
export async function promptForProjectName() {
  const rl = readline.createInterface({ input, output });

  try {
    return await rl.question("Project name: ");
  } finally {
    rl.close();
  }
}

/**
 * Convert a folder name into an npm-safe package name.
 *
 * Examples:
 *   "My App"       -> "my-app"
 *   "@scope/App"   -> "@scope/app"
 *   "hello_world"  -> "hello_world"
 */
export function sanitizePackageName(projectName) {
  const normalized = projectName
    .trim()
    .replace(/\\/g, "/")
    .split("/")
    .filter(Boolean)
    .pop();

  if (!normalized) {
    throw new Error("Unable to derive a package name from the project name.");
  }

  return normalized
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Fail early if a required command is unavailable.
 */
export async function assertCommandAvailable(command) {
  try {
    await run(command, ["--version"], {
      stdio: "ignore",
    });
  } catch {
    throw new Error(
      `Required command "${command}" was not found. Please install ${command} and try again.`,
    );
  }
}

/**
 * Protect users from accidentally cloning into an existing folder.
 */
export async function assertDirectoryIsSafeToCreate(targetDir) {
  try {
    const entries = await fs.readdir(targetDir);

    if (entries.length > 0) {
      throw new Error(`Target directory already exists and is not empty: ${targetDir}`);
    }
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return;
    }

    throw error;
  }
}

/**
 * Clone the template with a shallow history for speed.
 */
export async function cloneTemplate({ repoUrl, targetDir }) {
  await run("git", ["clone", "--depth", "1", repoUrl, targetDir], {
    stdio: "inherit",
  });
}

/**
 * Remove the template repository history so the generated app starts fresh.
 */
export async function removeGitDirectory(projectDir) {
  await fs.rm(path.join(projectDir, ".git"), {
    recursive: true,
    force: true,
  });
}

/**
 * Rewrite package.json's `name` field to match the user's project.
 */
export async function rewritePackageName({ projectDir, packageName }) {
  const packageJsonPath = path.join(projectDir, "package.json");
  const raw = await fs.readFile(packageJsonPath, "utf8");
  const packageJson = JSON.parse(raw);

  packageJson.name = packageName;

  await fs.writeFile(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`, "utf8");
}

/**
 * Start a fresh Git repository for the generated application.
 */
export async function initializeGitRepository(projectDir) {
  await run("git", ["init"], {
    cwd: projectDir,
    stdio: "inherit",
  });
}

/**
 * Install dependencies after scaffolding. This uses npm because the requested
 * success instructions use `npm run dev`.
 */
export async function installDependencies(projectDir) {
  await run("npm", ["install"], {
    cwd: projectDir,
    stdio: "inherit",
  });
}

/**
 * Spawn a process and resolve/reject based on its exit code.
 */
export function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      shell: process.platform === "win32",
      ...options,
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(" ")} exited with code ${code}`));
    });
  });
}

/**
 * Lightweight output helper. Kept separate so adding colors later is easy.
 */
export function formatCommand(command) {
  return command;
}
