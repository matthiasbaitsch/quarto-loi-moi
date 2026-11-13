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
  const ingredient = new Ingredient(root, "01-kreis/01-grundlagen/aufgaben");
  const folder = `${root}/01-kreis/01-grundlagen/aufgaben`;

  assertEquals(ingredient.name(), "aufgaben");
  assertEquals(ingredient.name({ full: true }), "kreis/grundlagen/aufgaben");
  assertEquals(ingredient.name({ full: true, separator: "-" }), "kreis-grundlagen-aufgaben");

  assertEquals(ingredient.fullPath(), folder);
  assertEquals(ingredient.fullPath("src/kreis.jl"), `${folder}/src/kreis.jl`);

  assertEquals(ingredient.files("*.qmd"), ["01-sechseck.qmd", "02-vieleck.qmd"]);
  assertEquals(ingredient.files("src/*.jl"), ["src/kreis.jl", "src/vieleck.jl"]);
  assertEquals(ingredient.files("src/*.jl", { full: true }), [`${folder}/src/kreis.jl`, `${folder}/src/vieleck.jl`]);
});

Deno.test("Library.read: grouped by topic (julia-parts)", () => {
  const library = Library.read(bausteine("julia-parts"), ingredientNames);
  const blocks = library.groups.flatMap((group) => group.blocks);

  assertEquals(library.groups.map((group) => group.name()), ["kreis", "kugel"]);
  assertEquals(library.groups.map((group) => group.title()), ["Kreis", "Kugel"]);
  assertEquals(blocks.map((block) => block.name({ full: true })), [
    "kreis/grundlagen",
    "kreis/konvergenz",
    "kugel/grundlagen",
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
  assertEquals(library.groups[0].blocks.map((block) => block.name()), ["zinsen", "sparplan"]);
  assertEquals(library.groups[0].blocks.map((block) => block.title()), ["Zinsen", "Sparplan"]);
});

Deno.test("Library.read: grouped by purpose (r-subjects)", () => {
  const library = Library.read(bausteine("r-subjects"), ingredientNames);
  const blocks = library.groups.flatMap((group) => group.blocks);

  assertEquals(library.groups.map((group) => group.name()), ["r", "statistik"]);
  assertEquals(library.groups.map((group) => group.title()), [undefined, undefined]);
  assertEquals(blocks.map((block) => block.name({ full: true })), [
    "r/haeufigkeiten",
    "statistik/haeufigkeiten",
  ]);
});
