// Tests for the recipe ExerciseSheet, using the Julia example as input.

import { assert, assertStringIncludes } from "@std/assert";
import { join } from "@std/path";
import { Ingredient } from "../_extensions/loimoi/library.ts";
import { ExerciseSheet } from "../_extensions/loimoi/recipes/exercise-sheet.ts";
import { outputFolder } from "./utilities.ts";

const root = new URL("../examples/julia-parts/bausteine", import.meta.url).pathname;

Deno.test("ExerciseSheet: sheet() writes header and exercises", () => {
  const ingredient = new Ingredient(root, "01-bohrpfahl/01-finite-elemente/aufgaben");
  const recipe = new ExerciseSheet([ingredient], 1, "Bohrpfahl", "Finite Elemente");
  const folder = outputFolder("exercise-sheet");

  recipe.sheet(folder);

  const text = Deno.readTextFileSync(join(folder, "01-bohrpfahl-finite-elemente-aufgaben.qmd"));
  assertStringIncludes(text, "title: Aufgabenblatt 1");
  assertStringIncludes(text, 'subtitle: "Bohrpfahl: Finite Elemente"');

  // both exercises, in the order of the files
  const first = text.indexOf("## Elementsteifigkeitsmatrix und Elementlastvektor");
  const second = text.indexOf("## Bohrpfahl mit finiten Elementen");
  assert(first >= 0 && second > first);
});
