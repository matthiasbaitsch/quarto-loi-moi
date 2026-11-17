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
  pipeline.addStep("jupyter");
  pipeline.addStep("zip");
  pipeline.addStep(new ReplacePlaceholders({ n: "1" }));
  const doc = pipeline.run(QmdDocument.parse("Sheet ${n}\n"));
  assertEquals(doc.output, { format: "ipynb", zip: true });
  assertEquals(doc.text(), "Sheet 1\n");
  assertThrows(() => pipeline.addStep("unknown"), Error, "unknown");
});

Deno.test("replace placeholders: in header, text and code; unknown ones unchanged", () => {
  const text = '---\ntitle: Sheet ${n}\n---\n\nAbout ${name}, ${other}.\n\n```{julia}\nx = "${name}"\n```\n';
  const expected = '---\ntitle: Sheet 1\n---\n\nAbout sequences, ${other}.\n\n```{julia}\nx = "sequences"\n```\n';
  const step = new ReplacePlaceholders({ n: "1", name: "sequences" });
  assertEquals(step.run(QmdDocument.parse(text)).text(), expected);
});

Deno.test("remove lm-step: versioned file names become the students' file name", () => {
  const text = "Use `src/truss.py`.\n\n```{python}\nfrom src.truss_lm_step04 import *\nstep_size = 2\n```\n";
  const expected = "Use `src/truss.py`.\n\n```{python}\nfrom src.truss import *\nstep_size = 2\n```\n";
  const pipeline = new Pipeline();
  pipeline.addStep("remove-lm-step");
  assertEquals(pipeline.run(QmdDocument.parse(text)).text(), expected);
});

Deno.test("attach src: heading without _lm_step", () => {
  const src = join(Deno.makeTempDirSync(), "truss_lm_step04.py");
  Deno.writeTextFileSync(src, "x = 1\n");
  const doc = new AttachSrc([src], "Appendix").run(QmdDocument.parse("Text\n"));
  assertEquals(doc.text(), "Text\n\n## Appendix\n\n### `src/truss.py`\n\n```{.python}\nx = 1\n```\n");
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
  const expected = "Text\n\n## Appendix\n\n### `src/fibonacci.jl`\n\n```{.julia}\n" + Deno.readTextFileSync(src) +
    "```\n";
  assertEquals(doc.text(), expected);
});
