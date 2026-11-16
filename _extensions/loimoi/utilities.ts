import { existsSync } from "@std/fs";
import { join } from "@std/path";
import { parse } from "@std/yaml";

export type Yaml = Record<string, unknown>;

export function readYaml(file: string): Yaml {
  return existsSync(file) ? parse(Deno.readTextFileSync(file)) as Yaml : {};
}

// Merges the files with the given name from `root` down to `root/path`; later ones override earlier ones
export function mergeYamlAlongPath(root: string, path: string, fileName: string): Yaml {
  let folder = root;
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
export function configFile(path: string, learningMaterial: string): string {
  const own = join(learningMaterial, "_loimoi", path);
  return existsSync(own) ? own : join(builtInConfig, path);
}
