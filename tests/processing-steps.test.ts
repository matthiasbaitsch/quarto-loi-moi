import { assertEquals, assertThrows } from "@std/assert";
import { join } from "@std/path";
import { QmdDocument } from "../_extensions/loimoi/qmd-document.ts";
import { Pipeline } from "../_extensions/loimoi/processing-steps/pipeline.ts";
import { AttachSrc } from "../_extensions/loimoi/processing-steps/attach-src.ts";
import { MergeSetupCells } from "../_extensions/loimoi/processing-steps/merge-setup-cells.ts";
import { ReplacePlaceholders } from "../_extensions/loimoi/processing-steps/replace-placeholders.ts";

const examples = new URL("../examples/", import.meta.url).pathname;

Deno.test("pipeline: steps by name and as objects, unknown name is an error", () => {
  const pipeline = new Pipeline();
  pipeline.addStep(new ReplacePlaceholders({ n: "1" }));
  pipeline.addStep("show-markers");
  const doc = pipeline.run(QmdDocument.parse("---\ntitle: Sheet ${n}\n---\n\nText\n"));
  assertEquals(doc.header, { title: "Sheet 1", filters: ["loimoi"] });
  assertThrows(() => pipeline.addStep("unknown"), Error, "unknown");
});

Deno.test("replace placeholders: in header, text and code; unknown ones unchanged", () => {
  const text = '---\ntitle: Sheet ${n}\n---\n\nAbout ${name}, ${other}.\n\n```{julia}\nx = "${name}"\n```\n';
  const expected = '---\ntitle: Sheet 1\n---\n\nAbout sequences, ${other}.\n\n```{julia}\nx = "sequences"\n```\n';
  const step = new ReplacePlaceholders({ n: "1", name: "sequences" });
  assertEquals(step.run(QmdDocument.parse(text)).text(), expected);
});

Deno.test("attach src: code blocks in an appendix, headed with the file name; not files marked lm-no-attach", () => {
  const folder = Deno.makeTempDirSync();
  const src = join(folder, "truss.py");
  Deno.writeTextFileSync(src, "x = 1\n");
  const copy = join(folder, "structures.py");
  Deno.writeTextFileSync(copy, "# lm-no-attach\ny = 2\n");
  const doc = new AttachSrc([src, copy], "Appendix").run(QmdDocument.parse("Text\n"));
  assertEquals(doc.text(), "Text\n\n## Appendix\n\n### `src/truss.py`\n\n```{.python .number-lines}\nx = 1\n```\n");
});

Deno.test("show markers: the filter of loi-moi added to the filters in the header", () => {
  const pipeline = new Pipeline();
  pipeline.addStep("show-markers");
  const doc = pipeline.run(QmdDocument.parse("---\nfilters: [other]\n---\n\nText\n"));
  assertEquals(doc.header.filters, ["other", "loimoi"]);
});

Deno.test("setup cells: only single-line statements", () => {
  const cell = (body: string) => `\`\`\`{julia}\n#| label: setup\n${body}\n\`\`\`\n`;
  assertThrows(
    () => new MergeSetupCells().run(QmdDocument.parse(cell("f(x) = 2x\nfunction g(x)\n  2x\nend"))),
    Error,
    "  2x",
  );
  assertThrows(() => new MergeSetupCells().run(QmdDocument.parse(cell("a = [\n1, 2]\n]"))), Error, "]");
  new MergeSetupCells().run(QmdDocument.parse(cell("# comment\n\nusing Plots")));
});

Deno.test("setup cells in different languages are an error", () => {
  const text = "```{python}\n#| label: setup\nimport numpy\n```\n\n```{r}\n#| label: setup\nlibrary(ggplot2)\n```\n";
  assertThrows(() => new MergeSetupCells().run(QmdDocument.parse(text)), Error, "r");
});

Deno.test("merge setup cells: one cell at the place of the first, lines once", () => {
  const text = [
    "```{julia}",
    "#| label: setup",
    "#| include: false",
    "using Plots",
    'include("src/a.jl")',
    "```",
    "",
    "Text",
    "",
    "```{julia}",
    "#| label: setup",
    "#| include: false",
    "using Plots",
    'include("src/b.jl")',
    "```",
    "",
  ].join("\n");
  const expected = [
    "```{julia}",
    "#| label: setup",
    "#| include: false",
    "using Plots",
    'include("src/a.jl")',
    'include("src/b.jl")',
    "```",
    "",
    "Text",
    "",
    "",
  ].join("\n");
  assertEquals(new MergeSetupCells().run(QmdDocument.parse(text)).text(), expected);
});

Deno.test("attach src: julia-parts, files of src/ as code blocks in an appendix", () => {
  const src = examples + "julia-parts/building-blocks/10-convergence/10-sequences/exercises/src/fibonacci.jl";
  const doc = new AttachSrc([src], "Appendix").run(QmdDocument.parse("Text\n"));
  const expected = "Text\n\n## Appendix\n\n### `src/fibonacci.jl`\n\n```{.julia .number-lines}\n" + Deno.readTextFileSync(src) +
    "```\n";
  assertEquals(doc.text(), expected);
});
