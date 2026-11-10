// Tests for the document model in qmd-document.ts.

import { assert, assertEquals } from "@std/assert";
import { CodeCell, Div, Node, QmdDocument, Text } from "../_extensions/loimoi/qmd-document.ts";

// The nodes without blank lines between them.
function content(nodes: Node[]): Node[] {
  return nodes.filter((node) => !(node instanceof Text && node.text().trim() === ""));
}

const input = `## Teil 1

\`\`\`{r}
#| label: setup
library(tidyverse)
\`\`\`

::: {#exr-a}
## A

\`\`\`{.r}
mean(x)
\`\`\`

::: {.lm-solution}
\`\`\`{r}
x <- 1
\`\`\`
:::
:::
`;

Deno.test("QmdDocument", () => {
  const document = QmdDocument.parse(input);

  // top level: text, setup cell, exercise
  const [text, setup, exercise] = content(document.nodes);
  assertEquals(content(document.nodes).length, 3);
  assert(text instanceof Text);

  // the setup cell
  assert(setup instanceof CodeCell);
  assertEquals(setup.language, "r");
  assert(setup.executable);
  assertEquals(setup.options.label, "setup");

  // the exercise with code that is only shown and a solution
  assert(exercise instanceof Div);
  assertEquals(exercise.id, "exr-a");
  const [, shown, solution] = content(exercise.children);
  assert(shown instanceof CodeCell);
  assert(!shown.executable);
  assert(solution instanceof Div);
  assertEquals(solution.classes, ["lm-solution"]);
  assert(solution.children.some((node) => node instanceof CodeCell && node.executable));

  // nothing lost: the nodes give back the original text
  assertEquals(document.text(), input);
});
