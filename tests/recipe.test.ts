import { assert, assertEquals, assertThrows } from "@std/assert";
import { ensureDirSync, existsSync } from "@std/fs";
import { join } from "@std/path";
import { unzipSync } from "fflate";
import { BuildingBlockTree } from "../_extensions/loimoi/building-block-tree.ts";
import { CodeReplacement } from "../_extensions/loimoi/code-replacement.ts";
import { QuartoFile } from "../_extensions/loimoi/actions/quarto-file.ts";
import { ProductFolder } from "../_extensions/loimoi/product-folder.ts";
import { Recipe } from "../_extensions/loimoi/recipe.ts";
import { readYaml } from "../_extensions/loimoi/utilities.ts";

const examples = new URL("../examples/", import.meta.url).pathname;
const exercises = new URL("../_extensions/loimoi/config/recipes/exercises.yml", import.meta.url).pathname;

const replacements = CodeReplacement.read(
  new URL("../_extensions/loimoi/config/code-replacements.yml", import.meta.url).pathname,
);

const words = readYaml(new URL("../_extensions/loimoi/config/words/en.yml", import.meta.url).pathname);

const placeholders = {
  ...words as Record<string, string>,
  "n": "1",
  "nn": "01",
  "nn-name": "01-convergence-sequences",
  "file-name": "01-convergence-sequences-exercises",
  "name": "convergence-sequences",
  "hash": "2094a057",
  "group-title": "Convergence",
  "product-title": "Sequences",
  "full-title": "Convergence: Sequences",
};

Deno.test("exercises recipe, notebook: julia-parts, sheet, solution, preview, zipped notebook only, images, code replacements", () => {
  const folder = Deno.makeTempDirSync();
  const tree = new BuildingBlockTree(examples + "julia-parts/building-blocks");
  const basket = tree.ingredients(["10-convergence/10-sequences/exercises"]);
  Recipe.read(exercises, {}, folder, replacements).run(basket, placeholders);
  const product = join(folder, "01-convergence-sequences");

  const sheet = Deno.readTextFileSync(join(product, "01-convergence-sequences-exercises.qmd"));
  assert(sheet.includes("title: Exercise sheet 1"));
  assert(sheet.includes("subtitle: 'Convergence: Sequences'"));
  assert(sheet.includes("[work files](01-convergence-sequences-exercises.zip)"));
  const solution = Deno.readTextFileSync(join(product, "01-convergence-sequences-exercises-solution-2094a057.qmd"));
  assert(solution.includes("subtitle: 'Convergence: Sequences'"));
  assert(solution.includes("function fibonacci_ratios(n)"));
  assert(solution.includes("filters:\n  - loimoi"));
  assert(solution.includes('include("src/fibonacci.jl")'));
  const preview = Deno.readTextFileSync(join(product, "01-convergence-sequences-exercises-preview-2094a057.qmd"));
  assert(preview.includes("Compute $q_1, \\ldots, q_5$"));
  assert(preview.includes("::: {.lm-scaffold}"));
  assert(preview.includes("::: {.lm-solution}"));
  assert(preview.includes("### `src/fibonacci.jl`"));
  assert(existsSync(join(product, "images/sequence.svg")));

  const zip = unzipSync(Deno.readFileSync(join(product, "01-convergence-sequences-exercises.zip")));
  assertEquals(Object.keys(zip), ["01-convergence-sequences-exercises.ipynb"]);
  const notebook = new TextDecoder().decode(zip["01-convergence-sequences-exercises.ipynb"]);
  assert(notebook.includes('# includet(\\"src/fibonacci.jl\\")'));

  const scaffold = new QuartoFile({ name: "work-files/exercises", process: ["exercise-scaffold"] }, []);
  scaffold.run(basket, placeholders, new ProductFolder(product));
  assert(existsSync(join(product, "src/fibonacci.jl")));
  assert(existsSync(join(product, "work-files/images/sequence.svg")));
  assert(!existsSync(join(product, "work-files/src")));
});

Deno.test("exercises recipe, folder: r-topics, project with qmd, data and templates, extra download", () => {
  const folder = Deno.makeTempDirSync();
  const tree = new BuildingBlockTree(examples + "r-topics/building-blocks");
  const basket = tree.ingredients(["theory/sequences/exercises", "programming/sequences/exercises"]);
  const values = {
    ...placeholders,
    "nn-name": "01-sequences",
    "name": "sequences",
    "file-name": "01-sequences-exercises",
  };
  Recipe.read(exercises, { "work-files": "folder" }, folder, []).run(basket, values);
  const product = join(folder, "01-sequences");

  const zip = unzipSync(Deno.readFileSync(join(product, "01-sequences-exercises.zip")));
  assertEquals(Object.keys(zip).sort(), [
    "01-sequences-exercises/_quarto.yml",
    "01-sequences-exercises/data/fibonacci.csv",
    "01-sequences-exercises/sequences-exercises.code-workspace",
    "01-sequences-exercises/sequences-exercises.qmd",
  ]);
  assert(!existsSync(join(product, "01-sequences-exercises")));
  assert(existsSync(join(product, "data/fibonacci.csv")));
  assert(!existsSync(join(product, "data/_fibonacci.R")));

  const extra = unzipSync(Deno.readFileSync(join(product, "fibonacci-table.zip")));
  assertEquals(Object.keys(extra), ["fibonacci-table/fibonacci-table.txt"]);
  assert(!existsSync(join(product, "zip")));
});

Deno.test("files of the same name with different content are an error", () => {
  const root = Deno.makeTempDirSync();
  for (const [name, content] of [["a", "1\n"], ["b", "2\n"]]) {
    ensureDirSync(join(root, name, "exercises/data"));
    Deno.writeTextFileSync(join(root, name, "exercises/text.qmd"), `Text ${name}\n`);
    Deno.writeTextFileSync(join(root, name, "exercises/data/values.csv"), content);
  }
  const basket = new BuildingBlockTree(root).ingredients(["a/exercises", "b/exercises"]);
  const sheet = new QuartoFile({ name: "sheet", process: [] }, []);
  assertThrows(
    () => sheet.run(basket, placeholders, new ProductFolder(Deno.makeTempDirSync())),
    Error,
    "data/values.csv",
  );
});

Deno.test("exercises recipe: unknown option or value is an error", () => {
  assertThrows(() => Recipe.read(exercises, { "work-files": "project" }, ".", []), Error, "project");
  assertThrows(() => Recipe.read(exercises, { "format": "a" }, ".", []), Error, "format");
  assertThrows(() => Recipe.read(exercises.replace("exercises.yml", "missing.yml"), {}, ".", []), Error, "not found");
});
