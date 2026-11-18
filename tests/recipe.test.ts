import { assert, assertEquals, assertThrows } from "@std/assert";
import { ensureDirSync, existsSync } from "@std/fs";
import { join } from "@std/path";
import { unzipSync } from "fflate";
import { BuildingBlockTree } from "../_extensions/loimoi/building-block-tree.ts";
import { QuartoFile } from "../_extensions/loimoi/actions/quarto-file.ts";
import { Recipe } from "../_extensions/loimoi/recipe.ts";
import { readYaml } from "../_extensions/loimoi/utilities.ts";

const examples = new URL("../examples/", import.meta.url).pathname;
const exercises = new URL("../_extensions/loimoi/config/recipes/exercises.yml", import.meta.url).pathname;

const words = readYaml(new URL("../_extensions/loimoi/config/words/en.yml", import.meta.url).pathname);

const placeholders = {
  ...words as Record<string, string>,
  "n": "1",
  "nn-name": "01-convergence-sequences",
  "name": "convergence-sequences",
  "hash": "2094a057",
  "group-title": "Convergence",
  "product-title": "Sequences",
};

Deno.test("exercises recipe, notebook: julia-parts, sheet, solution, preview, zipped notebook only, images", () => {
  const folder = Deno.makeTempDirSync();
  const tree = new BuildingBlockTree(examples + "julia-parts/building-blocks");
  const basket = tree.ingredients(["10-convergence/10-sequences/exercises"]);
  Recipe.read(exercises, {}, folder).run(basket, placeholders);

  const sheet = Deno.readTextFileSync(join(folder, "01-convergence-sequences-exercises.qmd"));
  assert(sheet.includes("title: Exercise sheet 1"));
  assert(sheet.includes("subtitle: 'Convergence: Sequences'"));
  assert(sheet.includes("[work files](01-convergence-sequences-exercises.zip)"));
  const solution = Deno.readTextFileSync(join(folder, "01-convergence-sequences-exercises-solution-2094a057.qmd"));
  assert(solution.includes("function fibonacci_ratios(n)"));
  const preview = Deno.readTextFileSync(join(folder, "01-convergence-sequences-exercises-preview-2094a057.qmd"));
  assert(preview.includes("Compute $q_1, \\ldots, q_5$"));
  assert(preview.includes("::: {.lm-scaffold}"));
  assert(preview.includes("::: {.lm-solution}"));
  assert(preview.includes("### `src/fibonacci.jl`"));
  assert(existsSync(join(folder, "images/sequence.svg")));

  const zip = unzipSync(Deno.readFileSync(join(folder, "01-convergence-sequences-exercises.zip")));
  assertEquals(Object.keys(zip), ["01-convergence-sequences-exercises.ipynb"]);

  const scaffold = new QuartoFile({ name: "work-files/exercises", process: ["exercise-scaffold"] });
  scaffold.run(basket, placeholders, folder);
  assert(existsSync(join(folder, "src/fibonacci.jl")));
  assert(existsSync(join(folder, "work-files/images/sequence.svg")));
  assert(!existsSync(join(folder, "work-files/src")));
});

Deno.test("exercises recipe, folder: r-topics, project with qmd, data and templates, extra download", () => {
  const folder = Deno.makeTempDirSync();
  const tree = new BuildingBlockTree(examples + "r-topics/building-blocks");
  const basket = tree.ingredients(["theory/sequences/exercises", "programming/sequences/exercises"]);
  const values = { ...placeholders, "nn-name": "01-sequences", "name": "sequences" };
  Recipe.read(exercises, { "work-files": "folder" }, folder).run(basket, values);

  const zip = unzipSync(Deno.readFileSync(join(folder, "01-sequences-exercises.zip")));
  assertEquals(Object.keys(zip).sort(), [
    "01-sequences-exercises/_quarto.yml",
    "01-sequences-exercises/data/fibonacci.csv",
    "01-sequences-exercises/sequences-exercises.code-workspace",
    "01-sequences-exercises/sequences-exercises.qmd",
  ]);
  assert(!existsSync(join(folder, "01-sequences-exercises")));
  assert(existsSync(join(folder, "data/fibonacci.csv")));
  assert(!existsSync(join(folder, "data/_fibonacci.R")));

  const extra = unzipSync(Deno.readFileSync(join(folder, "fibonacci-table.zip")));
  assertEquals(Object.keys(extra), ["fibonacci-table/fibonacci-table.txt"]);
  assert(!existsSync(join(folder, "zip")));
});

Deno.test("files of the same name with different content are an error", () => {
  const root = Deno.makeTempDirSync();
  for (const [name, content] of [["a", "1\n"], ["b", "2\n"]]) {
    ensureDirSync(join(root, name, "exercises/data"));
    Deno.writeTextFileSync(join(root, name, "exercises/text.qmd"), `Text ${name}\n`);
    Deno.writeTextFileSync(join(root, name, "exercises/data/values.csv"), content);
  }
  const basket = new BuildingBlockTree(root).ingredients(["a/exercises", "b/exercises"]);
  const sheet = new QuartoFile({ name: "sheet", process: [] });
  assertThrows(() => sheet.run(basket, placeholders, Deno.makeTempDirSync()), Error, "data/values.csv");
});

Deno.test("exercises recipe: unknown option or value is an error", () => {
  assertThrows(() => Recipe.read(exercises, { "work-files": "project" }, "."), Error, "project");
  assertThrows(() => Recipe.read(exercises, { "format": "a" }, "."), Error, "format");
  assertThrows(() => Recipe.read(exercises.replace("exercises.yml", "slides.yml"), {}, "."), Error, "not found");
});
