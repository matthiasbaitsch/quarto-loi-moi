import { assertEquals, assertObjectMatch, assertThrows } from "@std/assert";
import { ensureDirSync } from "@std/fs";
import { join } from "@std/path";
import { BuildingBlockTree } from "../_extensions/loimoi/building-block-tree.ts";
import { CollectionConfiguration } from "../_extensions/loimoi/collection-configuration.ts";

const examples = new URL("../examples/", import.meta.url).pathname;

const read = (example: string, collection: string) => {
  const tree = new BuildingBlockTree(`${examples}${example}/building-blocks`);
  return new CollectionConfiguration(`${examples}${example}/learning-material/${collection}`, tree);
};

Deno.test("julia-parts: everything from defaults", () => {
  const configuration = read("julia-parts", "exercises");
  assertEquals(configuration.outputFolder(), `${examples}julia-parts/learning-material/exercises/c`);
  assertEquals(configuration.site(), "https://matthiasbaitsch.github.io/quarto-loi-moi");
  assertEquals(configuration.recipe().actions.map((action) => action.name), [
    "${nn-name}-${exercises}",
    "${nn-name}-${exercises}-${solution}-${hash}",
    "${nn-name}-${exercises}-${preview}-${hash}",
    "${nn-name}-${exercises}",
  ]);
  assertEquals(configuration.words()["exercise-sheet"], "Exercise sheet");
  assertEquals(configuration.productConfigurations().length, 4);
  assertObjectMatch(configuration.productConfigurations()[0], {
    number: 1,
    ingredients: ["10-convergence/10-sequences/exercises"],
    name: "convergence-sequences",
    title: "Sequences",
    groupTitle: "Convergence",
  });
  assertEquals(configuration.productConfigurations()[0].placeholders("https://teacher.github.io/calculus"), {
    "n": "1",
    "name": "convergence-sequences",
    "nn-name": "01-convergence-sequences",
    "hash": "2094a057",
    "product-title": "Sequences",
    "group-title": "Convergence",
    "full-title": "Convergence: Sequences",
    "site": "https://teacher.github.io/calculus",
  });
});

Deno.test("python-flat: recipe from the conventions, lang from loimoi.yml, ingredient folders named like the collection, product names from the titles, full title without group title", () => {
  const configuration = read("python-flat", "aufgaben");
  assertEquals(configuration.recipe().actions.length, 5);
  assertEquals(configuration.words()["exercise-sheet"], "Exercise sheet");
  assertEquals(configuration.productConfigurations().map((product) => product.ingredients), [
    ["10-sequences/aufgaben"],
    ["20-series/aufgaben"],
    ["30-power-series/aufgaben"],
    ["40-continuity/aufgaben"],
  ]);
  assertEquals(configuration.productConfigurations()[1].name, "infinite-series");
  assertEquals(configuration.productConfigurations()[1].placeholders()["full-title"], "Infinite series");
});

Deno.test("r-topics: loimoi.yml files merged along the path", () => {
  const configuration = read("r-topics", "exercises");
  assertEquals(configuration.site(), "https://teacher.github.io/calculus");
  assertEquals(configuration.recipe().actions.map((action) => action.constructor.name), [
    "QuartoFile",
    "QuartoFile",
    "QuartoFile",
    "QuartoFile",
    "Archive",
  ]);
  assertObjectMatch(configuration.productConfigurations()[0], {
    ingredients: ["theory/sequences/exercises", "programming/sequences/exercises"],
    name: "sequences",
    title: "Sequences",
  });
  assertEquals(configuration.productConfigurations().length, 4);
});

Deno.test("product without product-title and without block-title is an error", () => {
  const collection = join(Deno.makeTempDirSync(), "learning-material/exercises");
  ensureDirSync(collection);
  Deno.writeTextFileSync(join(collection, "loimoi.yml"), "products:\n  - ingredients: [theory/sequences/exercises]\n");
  const tree = new BuildingBlockTree(`${examples}r-topics/building-blocks`);
  assertThrows(() => new CollectionConfiguration(collection, tree).productConfigurations(), Error, "theory-sequences");
});

Deno.test("collection aufgaben without lang: German words", () => {
  const collection = join(Deno.makeTempDirSync(), "learning-material/aufgaben");
  ensureDirSync(collection);
  const tree = new BuildingBlockTree(`${examples}python-flat/building-blocks`);
  assertEquals(new CollectionConfiguration(collection, tree).words()["exercise-sheet"], "Aufgabenblatt");
});
