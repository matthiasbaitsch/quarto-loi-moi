// Runs the series on the examples; the output stays in tests/output/<example>/ to look at.
// One test per example; each aspect is checked in one example only, another one only if it behaves differently
// there.

import { assert, assertEquals, assertFalse, assertStringIncludes } from "@std/assert";
import { join } from "@std/path";
import { unzipSync } from "fflate";
import { Library } from "../_extensions/loimoi/library.ts";
import { Series } from "../_extensions/loimoi/series.ts";
import { outputFolder } from "./utilities.ts";

// The series of an example.
function series(example: string): Series {
  const root = new URL(`../examples/${example}/bausteine`, import.meta.url).pathname;
  return new Series(Library.read(root, ["aufgaben", "folien", "skript"]), "aufgaben");
}

// Runs the series on an example, with tests/output/<example>/ as lernpfad/, and returns the folder of the exercise
// sheets; site is the URL of the published site.
function run(example: string, site?: string): string {
  const lernpfad = outputFolder(example);
  series(example).run(lernpfad, "c", site);
  return join(lernpfad, "aufgaben", "c");
}

// The full path of a folder in the bausteine/ of an example.
function bausteine(example: string, path: string): string {
  return new URL(`../examples/${example}/bausteine/${path}`, import.meta.url).pathname;
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

  // a sheet without .lm-sheet runs no code
  assertStringIncludes(text, "execute:\n  eval: false");

  assertFalse(Deno.readTextFileSync(sheet).includes(".lm-solution"));
  assertFalse(Deno.readTextFileSync(sheet).includes(".lm-scaffold"));

  // no more than one blank line in a row, none before the end of a div
  assertFalse(text.includes("\n\n\n"));
  assertFalse(text.includes("\n\n:::\n"));

  // solution named with hash
  const solution = join(folder, "01-bohrpfahl-finite-elemente-aufgaben-loesung-830a5d95.qmd");
  assert(exists(solution));
  const solutionText = Deno.readTextFileSync(solution);

  // solution: title and solution of each exercise, not its text
  assertStringIncludes(solutionText, "title: Lösungen zu Aufgabenblatt 1");
  assertStringIncludes(solutionText, "## Elementsteifigkeitsmatrix und Elementlastvektor");
  assertStringIncludes(solutionText, "Mit $N_1' = -1/h$");
  assertFalse(solutionText.includes("Für den Bohrpfahl lauten"));

  // blank lines between the blocks of the solution
  assertStringIncludes(solutionText, "## Elementsteifigkeitsmatrix und Elementlastvektor\n\n");

  // code runs in the folder of the exercise; Julia's include is relative to the file, so it becomes absolute
  const aufgaben = bausteine("julia-parts", "01-bohrpfahl/01-finite-elemente/aufgaben");
  assertStringIncludes(solutionText, `cd("${aufgaben}")`);
  assertStringIncludes(solutionText, `include("${aufgaben}/src/pile.jl")`);

  // work files: a zip file with the notebook
  const zip = unzipSync(Deno.readFileSync(join(folder, "01-bohrpfahl-finite-elemente-aufgaben.zip")));
  assertEquals(Object.keys(zip), ["01-bohrpfahl-finite-elemente-aufgaben.ipynb"]);

  // appendix of the solution with the files from src/
  assertStringIncludes(solutionText, "# Anhang: Code {.unnumbered}");
  assertStringIncludes(solutionText, '```{.julia filename="src/fem.jl"}');

  // images are copied
  assert(exists(join(folder, "bilder/pfahl.svg")));

  // files generated before are removed, other files stay
  Deno.writeTextFileSync(join(folder, "old.qmd"), "");
  Deno.writeTextFileSync(join(folder, "old.html"), "");
  Deno.writeTextFileSync(join(folder, "other.txt"), "");
  Deno.writeTextFileSync(join(folder, ".loimoi-generated"), "old.qmd\n", { append: true });
  series("julia-parts").run(join(folder, "..", ".."), "c");
  assertFalse(exists(join(folder, "old.qmd")));
  assertFalse(exists(join(folder, "old.html")));
  assert(exists(join(folder, "other.txt")));
});

// --- python-flat: flat ------------------------------------------------------------------------------------------

Deno.test("python-flat", () => {
  const folder = run("python-flat", "https://example.org/kurs");

  const sheet = join(folder, "01-loesungsverfahren-aufgaben.qmd");

  // sheet named with block only
  assert(exists(sheet));

  // placeholders replaced: link to the work files, slug in the download name
  const text = Deno.readTextFileSync(sheet);
  assertStringIncludes(
    text,
    "[Arbeitsmaterial](https://example.org/kurs/aufgaben/c/01-loesungsverfahren-aufgaben.zip)" +
      '{download="01-loesungsverfahren-aufgaben.zip"}',
  );
  assertStringIncludes(text, "[Kursseite](https://example.org/kurs/index.html)");
  assertFalse(text.includes("${"));

  // code runs in the folder of the exercise
  assertStringIncludes(text, `os.chdir("${bausteine("python-flat", "01-loesungsverfahren/aufgaben")}")`);

  // the notebook names its kernel
  const zip = unzipSync(Deno.readFileSync(join(folder, "01-loesungsverfahren-aufgaben.zip")));
  const notebook = JSON.parse(new TextDecoder().decode(zip["01-loesungsverfahren-aufgaben.ipynb"]));
  assertEquals(notebook.metadata.kernelspec.name, "python3");
});

// --- r-subjects: grouped by purpose -----------------------------------------------------------------------------

Deno.test("r-subjects", () => {
  const folder = run("r-subjects");

  const sheet = join(folder, "01-r-einzelne-merkmale-aufgaben.qmd");

  // sheet named with group and block
  assert(exists(sheet));

  // code runs in the folder of the exercise, also in later chunks
  const aufgaben = bausteine("r-subjects", "r/einzelne-merkmale/aufgaben");
  assertStringIncludes(Deno.readTextFileSync(sheet), `setwd("${aufgaben}")`);
  assertStringIncludes(Deno.readTextFileSync(sheet), `knitr::opts_knit$set(root.dir = "${aufgaben}")`);

  // a sheet with .lm-sheet runs its code
  const statistik = Deno.readTextFileSync(join(folder, "02-statistik-einzelne-merkmale-aufgaben.qmd"));
  assertFalse(statistik.includes("eval: false"));

  // the setup cells are merged into one
  assertEquals(Deno.readTextFileSync(sheet).split("label: setup").length - 1, 1);
});
