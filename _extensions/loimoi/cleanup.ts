// Cleaning up the output folder: everything the extension generated there is listed in a file and removed before
// the next run. So nothing is left over from a sheet that was renamed or removed from loimoi.yml. Files in the
// output folder that the extension did not generate are not touched.

import { OUTPUT_FOLDER } from "./assemble.ts";
import type { Sheet } from "./learning-path.ts";

// List of generated files and folders, relative to the output folder, one per line
const LIST = "lernpfad/aufgaben/_material/generated.txt";

// Files and folders of a sheet in the output folder: generated .qmd, what Quarto renders from them, the zip file
export function generatedFiles(sheet: Sheet): string[] {
  const files: string[] = [];
  for (const name of [sheet.names.sheet, sheet.names.solution]) {
    files.push(`${name}.qmd`, `${name}.html`, `${name}.pdf`, `${name}_files`);
  }
  files.push(`${sheet.names.material}.zip`);
  return files;
}

// Remove everything listed from the last run
export function removeGenerated(): void {
  let list: string;
  try {
    list = Deno.readTextFileSync(LIST);
  } catch {
    return; // first run
  }
  for (const file of list.split("\n").filter((line) => line.trim() !== "")) {
    try {
      Deno.removeSync(`${OUTPUT_FOLDER}/${file}`, { recursive: true });
    } catch (e) {
      if (!(e instanceof Deno.errors.NotFound)) throw e;
    }
  }
}

// Remember what this run generated
export function writeGeneratedList(files: string[]): void {
  Deno.mkdirSync(LIST.substring(0, LIST.lastIndexOf("/")), { recursive: true });
  Deno.writeTextFileSync(LIST, [...new Set(files)].sort().join("\n") + "\n");
}
