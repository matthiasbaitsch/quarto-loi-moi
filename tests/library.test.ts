// Tests for library.ts, using the examples as input.

import { assertEquals } from "@std/assert";
import { Ingredient, Library } from "../_extensions/loimoi/library.ts";

// The folder bausteine/ of an example.
function bausteine(example: string): string {
  return new URL(`../examples/${example}/bausteine`, import.meta.url).pathname;
}

const ingredientNames = ["aufgaben", "folien", "skript"];

Deno.test("Ingredient", () => {
  const root = bausteine("julia-parts");
  const ingredient = new Ingredient(root, "01-bohrpfahl/01-finite-elemente/aufgaben");
  const folder = `${root}/01-bohrpfahl/01-finite-elemente/aufgaben`;

  assertEquals(ingredient.name(), "aufgaben");
  assertEquals(ingredient.name({ full: true }), "bohrpfahl/finite-elemente/aufgaben");
  assertEquals(ingredient.name({ full: true, separator: "-" }), "bohrpfahl-finite-elemente-aufgaben");

  assertEquals(ingredient.fullPath(), folder);
  assertEquals(ingredient.fullPath("src/fem.jl"), `${folder}/src/fem.jl`);

  assertEquals(ingredient.files("*.qmd"), ["01-elementmatrix.qmd", "02-bohrpfahl.qmd"]);
  assertEquals(ingredient.files("src/*.jl"), ["src/fem.jl", "src/pile.jl"]);
  assertEquals(ingredient.files("src/*.jl", { full: true }), [`${folder}/src/fem.jl`, `${folder}/src/pile.jl`]);
});

Deno.test("Library.read: grouped by topic (julia-parts)", () => {
  const library = Library.read(bausteine("julia-parts"), ingredientNames);
  const blocks = library.groups.flatMap((group) => group.blocks);

  assertEquals(library.groups.map((group) => group.name()), ["bohrpfahl", "waermeleitung"]);
  assertEquals(library.groups.map((group) => group.title()), ["Bohrpfahl", "Wärmeleitung"]);
  assertEquals(blocks.map((block) => block.name({ full: true })), [
    "bohrpfahl/finite-elemente",
    "bohrpfahl/konvergenz",
    "waermeleitung/finite-elemente",
  ]);
  assertEquals(blocks.map((block) => block.ingredients.map((ingredient) => ingredient.name())), [
    ["aufgaben"],
    ["aufgaben"],
    ["aufgaben"],
  ]);
});

Deno.test("Library.read: flat (python-flat), _templates/ ignored", () => {
  const library = Library.read(bausteine("python-flat"), ingredientNames);

  assertEquals(library.groups.map((group) => group.name()), [""]);
  assertEquals(library.groups[0].blocks.map((block) => block.name()), ["loesungsverfahren", "genauigkeit"]);
  assertEquals(library.groups[0].blocks.map((block) => block.title()), ["Lösungsverfahren", "Genauigkeit"]);
});

Deno.test("Library.read: grouped by purpose (r-subjects)", () => {
  const library = Library.read(bausteine("r-subjects"), ingredientNames);
  const blocks = library.groups.flatMap((group) => group.blocks);

  assertEquals(library.groups.map((group) => group.name()), ["r", "statistik"]);
  assertEquals(library.groups.map((group) => group.title()), [undefined, undefined]);
  assertEquals(blocks.map((block) => block.name({ full: true })), [
    "r/einzelne-merkmale",
    "statistik/einzelne-merkmale",
  ]);
});
