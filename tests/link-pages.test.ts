import { assert } from "@std/assert";
import { BuildingBlockTree } from "../_extensions/loimoi/building-block-tree.ts";
import { LinkPages } from "../_extensions/loimoi/link-pages.ts";

const examples = new URL("../examples/", import.meta.url).pathname;

Deno.test("link pages: r-topics, files with a link, local and published", () => {
  const tree = new BuildingBlockTree(`${examples}r-topics/building-blocks`);
  const pages = new LinkPages(`${examples}r-topics/learning-material`, tree);
  const path = "r-topics/exercises/c/01-sequences/01-sequences-exercises-solution-50eb9d34.html";

  const local = pages.localPage();
  assert(local.includes("01 Sequences"));
  assert(local.includes(`<a href="../../../__output/${path}">Solution</a>`));
  assert(!local.includes(".zip"));

  const site = pages.sitePage();
  assert(site.includes(`<a href="https://teacher.github.io/calculus/${path}">Solution</a>`));
  assert(!site.includes(".zip"));
});
