// Small helpers for reading folders and files.

import { join } from "jsr:@std/path@1";
import { parse } from "jsr:@std/yaml@1";

// The subfolders of a folder, without those starting with "_" or ".", sorted by name.
export function subfolders(folder: string): string[] {
  const names = [];
  for (const entry of Deno.readDirSync(folder)) {
    if (entry.isDirectory && !entry.name.startsWith("_") && !entry.name.startsWith(".")) names.push(entry.name);
  }
  return names.sort();
}

// The content of about.yml in a folder, or {} if there is none.
export function readAbout(folder: string): Record<string, unknown> {
  const file = join(folder, "about.yml");
  try {
    return (parse(Deno.readTextFileSync(file)) ?? {}) as Record<string, unknown>;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return {};
    throw error;
  }
}

// "01-grundlagen" → "grundlagen": leading numbers only sort.
export function stripNumber(folderName: string): string {
  return folderName.replace(/^\d+-/, "");
}

// The GitHub Pages address of the Git remote, e.g. git@github.com:user/repo.git → https://user.github.io/repo;
// undefined without a GitHub remote.
export function gitHubPages(): string | undefined {
  const result = new Deno.Command("git", { args: ["remote", "get-url", "origin"], stderr: "null" }).outputSync();
  const remote = new TextDecoder().decode(result.stdout).trim();
  const match = remote.match(/github\.com[:/]([^/]+)\/([^/]+?)(\.git)?$/);
  return match === null ? undefined : `https://${match[1]}.github.io/${match[2]}`;
}
