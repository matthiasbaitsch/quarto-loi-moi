import { assertEquals } from "@std/assert";
import { ensureDirSync } from "@std/fs";
import { join } from "@std/path";
import { configFile } from "../_extensions/loimoi/utilities.ts";

const builtIn = new URL("../_extensions/loimoi/config/", import.meta.url).pathname;

Deno.test("config file: the user's file overrides the built-in one", () => {
  const learningMaterial = Deno.makeTempDirSync();
  assertEquals(configFile("recipes/exercises.yml", learningMaterial), join(builtIn, "recipes/exercises.yml"));

  const own = join(learningMaterial, "_loimoi/recipes/exercises.yml");
  ensureDirSync(join(learningMaterial, "_loimoi/recipes"));
  Deno.writeTextFileSync(own, "quarto-files: []\n");
  assertEquals(configFile("recipes/exercises.yml", learningMaterial), own);
});
