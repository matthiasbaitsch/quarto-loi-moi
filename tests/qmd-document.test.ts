import { assertThrows } from "@std/assert";
import { join } from "@std/path";
import { QmdDocument } from "../_extensions/loimoi/qmd-document.ts";

// Each entry of `tests/invalid/` has one malformation: a file, or a folder with files that are read together.
// Valid files are the building blocks of the examples.
const invalid = new URL("invalid/", import.meta.url).pathname;

// The files of an entry: the file itself, or the files in the folder in name order
function filesOf(entry: Deno.DirEntry): string[] {
  const path = join(invalid, entry.name);
  if (!entry.isDirectory) return [path];
  const names = [...Deno.readDirSync(path)].map((file) => file.name).sort();
  return names.map((name) => join(path, name));
}

Deno.test("read and validate: every entry in tests/invalid fails", () => {
  for (const entry of Deno.readDirSync(invalid)) {
    const files = filesOf(entry);
    assertThrows(() => QmdDocument.read(...files).validate(), Error, undefined, `${entry.name} does not fail`);
  }
});
