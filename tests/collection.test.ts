import { assertEquals, assertObjectMatch, assertThrows } from "@std/assert";
import { ensureDirSync } from "@std/fs";
import { dirname, join, relative } from "@std/path";
import { Collection } from "../_extensions/loimoi/collection.ts";

const examples = new URL("../examples/", import.meta.url).pathname;

const read = (example: string, collectionName: string) =>
  new Collection(`${examples}${example}/learning-material/${collectionName}`);

// `building-blocks` in `loimoi.yml` of `collectionFolder`: the building blocks of `example`, relative to the learning material
const buildingBlocks = (collectionFolder: string, example: string) =>
  `building-blocks: ${relative(dirname(collectionFolder), `${examples}${example}/building-blocks`)}\n`;

Deno.test("julia-parts: everything from defaults", () => {
  const collection = read("julia-parts", "exercises");
  assertEquals(collection.outputFolder(), `${examples}julia-parts/learning-material/exercises/c`);
  assertEquals(collection.configuration.site, "https://matthiasbaitsch.github.io/quarto-loi-moi");
  assertEquals(collection.recipe().actions.map((action) => action.name), [
    "${file-name}",
    "${file-name}-${solution}-${hash}",
    "${file-name}-${preview}-${hash}",
    "${file-name}",
  ]);
  assertEquals(collection.words()["exercise-sheet"], "Exercise sheet");
  assertEquals(collection.configuration.products.length, 4);
  assertObjectMatch(collection.configuration.products[0], {
    number: 1,
    ingredients: ["10-convergence/10-sequences/exercises"],
    name: "convergence-sequences",
    title: "Sequences",
    groupTitle: "Convergence",
  });
  assertObjectMatch(collection.placeholders(collection.configuration.products[0]), {
    "exercise-sheet": "Exercise sheet",
    "n": "1",
    "nn": "01",
    "name": "convergence-sequences",
    "nn-name": "01-convergence-sequences",
    "hash": "2094a057",
    "product-title": "Sequences",
    "group-title": "Convergence",
    "full-title": "Convergence: Sequences",
    "site": "https://matthiasbaitsch.github.io/quarto-loi-moi",
    "file-name": "01-convergence-sequences-exercises",
  });
});

Deno.test("python-flat: recipe from the conventions, lang from loimoi.yml, ingredient folders named like the collection, product names from the titles, full title without group title, file-name from loimoi.yml", () => {
  const collection = read("python-flat", "aufgaben");
  assertEquals(collection.recipe().actions.length, 5);
  assertEquals(collection.words()["exercise-sheet"], "Exercise sheet");
  assertEquals(collection.configuration.products.map((product) => product.ingredients), [
    ["10-sequences/aufgaben"],
    ["20-series/aufgaben"],
    ["30-power-series/aufgaben"],
    ["40-continuity/aufgaben"],
  ]);
  assertEquals(collection.configuration.products[1].name, "infinite-series");
  const placeholders = collection.placeholders(collection.configuration.products[1]);
  assertEquals(placeholders["full-title"], "Infinite series");
  assertEquals(placeholders["group-title"], undefined);
  assertEquals(placeholders["file-name"], "sheet-02");
});

Deno.test("r-topics: loimoi.yml files merged along the path", () => {
  const collection = read("r-topics", "exercises");
  assertEquals(collection.configuration.site, "https://teacher.github.io/calculus");
  assertEquals(collection.recipe().actions.map((action) => action.constructor.name), [
    "QuartoFile",
    "QuartoFile",
    "QuartoFile",
    "QuartoFile",
    "Archive",
  ]);
  assertObjectMatch(collection.configuration.products[0], {
    ingredients: ["theory/sequences/exercises", "programming/sequences/exercises"],
    name: "sequences",
    title: "Sequences",
  });
  assertEquals(collection.configuration.products.length, 4);
});

Deno.test("product without product-title and without block-title is an error", () => {
  const collectionFolder = join(Deno.makeTempDirSync(), "learning-material/exercises");
  ensureDirSync(collectionFolder);
  Deno.writeTextFileSync(
    join(collectionFolder, "loimoi.yml"),
    `${buildingBlocks(collectionFolder, "r-topics")}products:\n  - ingredients: [theory/sequences/exercises]\n`,
  );
  assertThrows(() => new Collection(collectionFolder), Error, "theory-sequences");
});

Deno.test("collection aufgaben without lang: German words", () => {
  const collectionFolder = join(Deno.makeTempDirSync(), "learning-material/aufgaben");
  ensureDirSync(collectionFolder);
  Deno.writeTextFileSync(join(collectionFolder, "loimoi.yml"), buildingBlocks(collectionFolder, "python-flat"));
  assertEquals(new Collection(collectionFolder).words()["exercise-sheet"], "Aufgabenblatt");
});

Deno.test("building-blocks in loimoi.yml: relative to the learning material folder, error if missing", () => {
  const course = Deno.realPathSync(Deno.makeTempDirSync());
  const collectionFolder = join(course, "learning-material/exercises");
  ensureDirSync(collectionFolder);
  Deno.writeTextFileSync(join(course, "learning-material/loimoi.yml"), "building-blocks: ../shared/blocks\n");
  assertThrows(() => new Collection(collectionFolder), Error, "no folder");

  ensureDirSync(join(course, "shared/blocks"));
  assertEquals(new Collection(collectionFolder).configuration.tree.rootFolder, join(course, "shared/blocks"));
});

Deno.test("loimoi.yml: unknown key, no recipe, unknown product-naming or link-format are errors", () => {
  const collectionFolder = join(Deno.makeTempDirSync(), "learning-material/exercises");
  ensureDirSync(collectionFolder);
  const write = (text: string) =>
    Deno.writeTextFileSync(join(collectionFolder, "loimoi.yml"), buildingBlocks(collectionFolder, "r-topics") + text);
  write("buiding-blocks: x\n");
  assertThrows(() => new Collection(collectionFolder), Error, "buiding-blocks");
  write("recipe: slides\n");
  assertThrows(() => new Collection(collectionFolder), Error, "No ingredient folder");
  write("product-naming: folders\n");
  assertThrows(() => new Collection(collectionFolder), Error, "product-naming");
  write("link-format: docx\n");
  assertThrows(() => new Collection(collectionFolder), Error, "link-format");

  const other = join(Deno.makeTempDirSync(), "learning-material/other");
  ensureDirSync(other);
  Deno.writeTextFileSync(join(other, "loimoi.yml"), buildingBlocks(other, "r-topics"));
  assertThrows(() => new Collection(other), Error, "No recipe");
});
