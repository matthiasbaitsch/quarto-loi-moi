import { existsSync } from "@std/fs";
import { join } from "@std/path";
import { parse } from "@std/yaml";

export type Yaml = Record<string, unknown>;

export function readYaml(file: string): Yaml {
  return existsSync(file) ? parse(Deno.readTextFileSync(file)) as Yaml : {};
}

// Merges the files with the given name from `rootFolder` down to `rootFolder/path`; later ones override earlier ones
export function mergeYamlAlongPath(rootFolder: string, path: string, fileName: string): Yaml {
  let folder = rootFolder;
  let merged = readYaml(join(folder, fileName));
  for (const part of path.split("/")) {
    folder = join(folder, part);
    merged = { ...merged, ...readYaml(join(folder, fileName)) };
  }
  return merged;
}

// `${key}` replaced by its value; unknown keys stay unchanged
export function replacePlaceholders(text: string, values: Record<string, string>): string {
  return text.replace(/\$\{([\w-]+)\}/g, (match, key) => values[key] ?? match);
}

const builtInConfig = new URL("./config/", import.meta.url).pathname;

// The user's file in `learning-material/_loimoi/` if it exists, otherwise the built-in one
export function configFile(path: string, learningMaterialFolder: string): string {
  const own = join(learningMaterialFolder, "_loimoi", path);
  return existsSync(own) ? own : join(builtInConfig, path);
}

// `git@github.com:user/repo.git` or `https://github.com/user/repo` → `https://user.github.io/repo`;
// undefined without Git or without a GitHub remote
export function gitHubPages(folder: string): string | undefined {
  try {
    const output = new Deno.Command("git", { args: ["remote", "get-url", "origin"], cwd: folder }).outputSync();
    const url = new TextDecoder().decode(output.stdout).trim();
    const match = url.match(/github\.com[:/]([^/]+)\/(.+?)(\.git)?$/);
    return output.success && match !== null ? `https://${match[1]}.github.io/${match[2]}` : undefined;
  } catch {
    return undefined;
  }
}
