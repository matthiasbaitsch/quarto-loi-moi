import { assertEquals } from "@std/assert";
import { ensureDirSync } from "@std/fs";
import { join } from "@std/path";
import { configFile } from "../_extensions/loimoi/utilities.ts";

const builtIn = new URL("../_extensions/loimoi/config/", import.meta.url).pathname;

Deno.test("config file: the user's file overrides the built-in one", () => {
  const learningMaterialFolder = Deno.makeTempDirSync();
  assertEquals(configFile("recipes/exercises.yml", learningMaterialFolder), join(builtIn, "recipes/exercises.yml"));

  const own = join(learningMaterialFolder, "_loimoi/recipes/exercises.yml");
  ensureDirSync(join(learningMaterialFolder, "_loimoi/recipes"));
  Deno.writeTextFileSync(own, "quarto-files: []\n");
  assertEquals(configFile("recipes/exercises.yml", learningMaterialFolder), own);
});
