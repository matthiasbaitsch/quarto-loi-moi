// Tests for the model of the building block source tree, on the example projects

import { assertEquals } from "@std/assert";
import { BuildingBlockTree } from "../_extensions/loimoi/building-block-tree.ts";

// Absolute path of the folder with the example projects
const examples = new URL("../examples/", import.meta.url).pathname;

Deno.test("julia-parts: default paths, names and titles", () => {
  const tree = new BuildingBlockTree(examples + "julia-parts/building-blocks");
  assertEquals(tree.defaultPaths("exercises"), [
    ["10-convergence/10-sequences/exercises"],
    ["10-convergence/20-series/exercises"],
    ["20-functions/10-power-series/exercises"],
    ["20-functions/20-continuity/exercises"],
  ]);

  const basket = tree.ingredients(["10-convergence/10-sequences/exercises"]);
  assertEquals(basket.name(), "convergence-sequences");
  assertEquals(basket.title(), "Sequences");
  assertEquals(basket.groupTitle(), "Convergence");
  assertEquals(basket.files("*.qmd"), [
    "10-convergence/10-sequences/exercises/10-golden-ratio.qmd",
    "10-convergence/10-sequences/exercises/20-fibonacci.qmd",
  ]);
});

Deno.test("python-flat: German folder names", () => {
  const tree = new BuildingBlockTree(examples + "python-flat/building-blocks");
  assertEquals(tree.defaultPaths("aufgaben"), [
    ["10-sequences/aufgaben"],
    ["20-series/aufgaben"],
    ["30-power-series/aufgaben"],
    ["40-continuity/aufgaben"],
  ]);
});

Deno.test("r-topics: folders starting with _ ignored, basket with two ingredients", () => {
  const tree = new BuildingBlockTree(examples + "r-topics/building-blocks");
  assertEquals(tree.defaultPaths("exercises"), [
    ["programming/continuity/exercises"],
    ["programming/power-series/exercises"],
    ["programming/sequences/exercises"],
    ["programming/series/exercises"],
    ["theory/continuity/exercises"],
    ["theory/power-series/exercises"],
    ["theory/sequences/exercises"],
    ["theory/series/exercises"],
  ]);

  const basket = tree.ingredients(["theory/sequences/exercises", "programming/sequences/exercises"]);
  assertEquals(basket.name(), "theory-sequences");
  assertEquals(basket.title(), undefined);
  assertEquals(basket.groupTitle(), undefined);
  assertEquals(basket.files("*.qmd"), [
    "theory/sequences/exercises/01-golden-ratio.qmd",
    "programming/sequences/exercises/01-fibonacci.qmd",
  ]);
});
