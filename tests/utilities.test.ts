import { assertEquals, assertThrows } from "@std/assert";
import { ensureDirSync } from "@std/fs";
import { join } from "@std/path";
import { configFile, resolve, slug } from "../_extensions/loimoi/utilities.ts";

Deno.test("slug: lowercase, umlauts, other characters as one hyphen", () => {
  assertEquals(slug("Stabtragwerke", "Stabendkräfte"), "stabtragwerke-stabendkraefte");
  assertEquals(slug("Größe & Maß: Übung!"), "groesse-mass-uebung");
});

const builtIn = new URL("../_extensions/loimoi/config/", import.meta.url).pathname;

Deno.test("config file: the user's file overrides the built-in one", () => {
  const learningMaterialFolder = Deno.makeTempDirSync();
  assertEquals(configFile("recipes/exercises.yml", learningMaterialFolder), join(builtIn, "recipes/exercises.yml"));

  const own = join(learningMaterialFolder, "_loimoi/recipes/exercises.yml");
  ensureDirSync(join(learningMaterialFolder, "_loimoi/recipes"));
  Deno.writeTextFileSync(own, "quarto-files: []\n");
  assertEquals(configFile("recipes/exercises.yml", learningMaterialFolder), own);
});

Deno.test("resolve: upward from the working directory, exactly one of the candidates", () => {
  const course = Deno.realPathSync(Deno.makeTempDirSync());
  const collectionFolder = join(course, "lernpfad/aufgaben");
  ensureDirSync(collectionFolder);
  const workingFolder = Deno.cwd();
  Deno.chdir(collectionFolder);
  try {
    assertThrows(() => resolve("building-blocks"), Error, "found 0");

    ensureDirSync(join(course, "bausteine"));
    assertEquals(resolve("building-blocks"), join(course, "bausteine"));

    ensureDirSync(join(course, "building-blocks"));
    assertThrows(() => resolve("building-blocks"), Error, "found 2");
  } finally {
    Deno.chdir(workingFolder);
  }
});
