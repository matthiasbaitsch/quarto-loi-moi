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
