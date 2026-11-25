import { walkSync } from "@std/fs";
import { join, relative } from "@std/path";
import { unzipSync } from "fflate";
import { Collection } from "../_extensions/loimoi/collection.ts";

// The output of the pre-render of each example, compared with `tests/expected/<example>/`
// (`deno task update-expected` writes it)

const root = new URL("../", import.meta.url).pathname;
const preRenderScript = join(root, "_extensions/loimoi/pre-render.ts");

export const expected = join(root, "tests/expected");

// Example → its collections
export const snapshots: Record<string, string[]> = {
  "julia-parts": ["exercises", "slides"],
  "python-flat": ["aufgaben"],
  "r-topics": ["exercises", "theory-slides", "programming-slides"],
};

// Runs the pre-render in each collection folder, as Quarto does; returns the files of the output folder (path
// relative to the collection folder, without the output folder) and the link pages → content; a zip as a folder
// with its entries
export function preRender(example: string): Record<string, string> {
  const learningMaterial = join(root, "examples", example, "learning-material");
  const files: Record<string, string> = {};
  for (const collection of snapshots[example]) {
    const cwd = join(learningMaterial, collection);
    const output = new Deno.Command("deno", { args: ["run", "--allow-all", preRenderScript], cwd }).outputSync();
    if (!output.success) throw new Error(new TextDecoder().decode(output.stderr));
    for (const [path, content] of Object.entries(readFolder(new Collection(cwd).outputFolder()))) {
      files[join(collection, path)] = content;
    }
  }
  for (const page of ["links.html", "links-site.html"]) {
    files[page] = Deno.readTextFileSync(join(learningMaterial, page));
  }
  return files;
}

// Path relative to `folder` → content
export function readFolder(folder: string): Record<string, string> {
  const files: Record<string, string> = {};
  for (const entry of walkSync(folder, { includeDirs: false })) {
    const path = relative(folder, entry.path);
    if (path.endsWith(".zip")) {
      for (const [name, content] of Object.entries(unzipSync(Deno.readFileSync(entry.path)))) {
        if (!name.endsWith("/")) files[join(path, name)] = new TextDecoder().decode(content);
      }
    } else {
      files[path] = Deno.readTextFileSync(entry.path);
    }
  }
  return files;
}
