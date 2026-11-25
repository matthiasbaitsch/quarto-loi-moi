import { assertEquals, assertThrows } from "@std/assert";
import { ensureDirSync } from "@std/fs";
import { join } from "@std/path";
import { resolve, slug } from "../_extensions/loimoi/utilities.ts";

Deno.test("slug: lowercase, umlauts, other characters as one hyphen", () => {
  assertEquals(slug("Stabtragwerke", "Stabendkräfte"), "stabtragwerke-stabendkraefte");
  assertEquals(slug("Größe & Maß: Übung!"), "groesse-mass-uebung");
});

Deno.test("resolve: upward from the given folder, exactly one of the names", () => {
  const course = Deno.realPathSync(Deno.makeTempDirSync());
  const collectionFolder = join(course, "lernpfad/aufgaben");
  ensureDirSync(collectionFolder);
  assertThrows(() => resolve(["bausteine", "building-blocks"], collectionFolder), Error, "found 0");

  ensureDirSync(join(course, "bausteine"));
  assertEquals(resolve(["bausteine", "building-blocks"], collectionFolder), join(course, "bausteine"));

  ensureDirSync(join(course, "building-blocks"));
  assertThrows(() => resolve(["bausteine", "building-blocks"], collectionFolder), Error, "found 2");
});
