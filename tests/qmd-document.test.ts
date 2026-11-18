import { assertEquals, assertThrows } from "@std/assert";
import { existsSync } from "@std/fs";
import { join } from "@std/path";
import { QmdDocument } from "../_extensions/loimoi/qmd-document.ts";
import { QmdCodeCell, QmdDiv, QmdNode, QmdText } from "../_extensions/loimoi/qmd-node.ts";

const examples = new URL("../examples/", import.meta.url).pathname;

const text = `---
title: Test
---

# Heading

::: {#exr-a}
## Exercise A

Text.

::: {.lm-solution}
Solution.
:::
:::

\`\`\`{julia}
#| echo: false
x = 1
\`\`\`

\`\`\`{.julia}
y = 2
\`\`\`
`;

Deno.test("parse and text: document written as read", () => {
  assertEquals(QmdDocument.parse(text).text(), text);
});

Deno.test("parse: header, divs and code cells", () => {
  const doc = QmdDocument.parse(text);
  assertEquals(doc.header, { title: "Test" });

  const [exercise, executable, shown] = doc.nodes.filter((node) => !(node instanceof QmdText));
  assertEquals((exercise as QmdDiv).id, "exr-a");
  assertEquals(((exercise as QmdDiv).children.find((child) => child instanceof QmdDiv) as QmdDiv).classes, [
    "lm-solution",
  ]);
  assertEquals((executable as QmdCodeCell).language, "julia");
  assertEquals((executable as QmdCodeCell).options, { echo: false });
  assertEquals((executable as QmdCodeCell).executable, true);
  assertEquals((shown as QmdCodeCell).executable, false);
});

Deno.test("map: remove solutions, also inside divs", () => {
  const removeSolution = (node: QmdNode) =>
    node instanceof QmdDiv && node.classes.includes("lm-solution") ? [] : [node];
  const expected = text.replace("::: {.lm-solution}\nSolution.\n:::\n", "");
  assertEquals(QmdDocument.parse(text).map(removeSolution).text(), expected);
});

Deno.test("read: files combined in order, headers merged, clash is an error", () => {
  const folder = Deno.makeTempDirSync();
  const a = join(folder, "a.qmd");
  const b = join(folder, "b.qmd");
  const c = join(folder, "c.qmd");
  Deno.writeTextFileSync(a, "---\ntitle: A\n---\n\nText A\n");
  Deno.writeTextFileSync(b, "---\nauthor: B\n---\n\nText B\n");
  Deno.writeTextFileSync(c, "---\ntitle: C\n---\n\nText C\n");

  const doc = QmdDocument.read(a, b);
  assertEquals(doc.header, { title: "A", author: "B" });
  assertEquals(doc.text(), "---\ntitle: A\nauthor: B\n---\n\nText A\n\nText B\n");
  assertThrows(() => QmdDocument.read(a, c), Error, "title");
});

Deno.test("read and write: julia-parts as qmd and ipynb, by the extension", () => {
  const exercises = examples + "julia-parts/building-blocks/10-convergence/10-sequences/exercises/";
  const doc = QmdDocument.read(exercises + "10-golden-ratio.qmd", exercises + "20-fibonacci.qmd");
  const folder = Deno.makeTempDirSync();

  doc.write(join(folder, "sheet.qmd"));
  assertEquals(Deno.readTextFileSync(join(folder, "sheet.qmd")), doc.text());

  doc.write(join(folder, "notebook.ipynb"));
  const notebook = JSON.parse(Deno.readTextFileSync(join(folder, "notebook.ipynb")));
  assertEquals(notebook.cells.some((cell: { cell_type: string }) => cell.cell_type === "code"), true);
});
