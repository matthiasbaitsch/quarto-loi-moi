// Runs the series on the examples; the output stays in tests/output/<example>/ to look at.
// One test per example; each aspect is checked in one example only, another one only if it behaves differently
// there.

import { assert, assertEquals, assertFalse, assertStringIncludes } from "@std/assert";
import { join } from "@std/path";
import { readLibrary } from "../_extensions/loimoi/library.ts";
import { Series } from "../_extensions/loimoi/series.ts";
import { outputFolder } from "./utilities.ts";

// Runs the series on an example and returns the output folder.
function run(example: string): string {
  const root = new URL(`../examples/${example}/bausteine`, import.meta.url).pathname;
  const folder = outputFolder(example);
  new Series(readLibrary(root, ["aufgaben", "folien", "skript"])).run(folder);
  return folder;
}

// Whether a file exists.
function exists(file: string): boolean {
  try {
    Deno.statSync(file);
    return true;
  } catch {
    return false;
  }
}

// --- julia-parts: grouped by topic ------------------------------------------------------------------------------

Deno.test("julia-parts", () => {
  const folder = run("julia-parts");
  const sheet = join(folder, "01-bohrpfahl-finite-elemente-aufgaben.qmd");

  assert(exists(sheet));
  const text = Deno.readTextFileSync(sheet);

  // header with number, group title and block title
  assertStringIncludes(text, "title: Aufgabenblatt 1");
  assertStringIncludes(text, 'subtitle: "Bohrpfahl: Finite Elemente"');

  assertFalse(Deno.readTextFileSync(sheet).includes(".lm-solution"));
  assertFalse(Deno.readTextFileSync(sheet).includes(".lm-scaffold"));

  // no more than one blank line in a row, none before the end of a div
  assertFalse(text.includes("\n\n\n"));
  assertFalse(text.includes("\n\n:::\n"));
});

// --- python-flat: flat ------------------------------------------------------------------------------------------

Deno.test("python-flat", () => {
  const folder = run("python-flat");

  // sheet named with block only
  assert(exists(join(folder, "01-loesungsverfahren-aufgaben.qmd")));
});

// --- r-subjects: grouped by purpose -----------------------------------------------------------------------------

Deno.test("r-subjects", () => {
  const folder = run("r-subjects");

  const sheet = join(folder, "01-r-einzelne-merkmale-aufgaben.qmd");

  // sheet named with group and block
  assert(exists(sheet));

  // the setup cells are merged into one
  assertEquals(Deno.readTextFileSync(sheet).split("label: setup").length - 1, 1);
});
