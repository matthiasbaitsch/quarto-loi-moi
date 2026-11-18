import { assert, assertThrows } from "@std/assert";
import { QmdDocument } from "../_extensions/loimoi/qmd-document.ts";
import { ExerciseScaffold } from "../_extensions/loimoi/processing-steps/exercise-scaffold.ts";
import { ExerciseSheet } from "../_extensions/loimoi/processing-steps/exercise-sheet.ts";
import { ExerciseSolution } from "../_extensions/loimoi/processing-steps/exercise-solution.ts";

const examples = new URL("../examples/", import.meta.url).pathname;
const blocks = (example: string) => `${examples}${example}/building-blocks/`;

// Paper exercise `exr-golden-ratio`, programming exercise `exr-fibonacci` with scaffold
const julia = () => {
  const folder = blocks("julia-parts") + "10-convergence/10-sequences/exercises/";
  return QmdDocument.read(folder + "10-golden-ratio.qmd", folder + "20-fibonacci.qmd");
};

Deno.test("exercise sheet: julia-parts, no solutions, no scaffolds, no code except setup", () => {
  const text = new ExerciseSheet().run(julia()).text();
  assert(text.includes("## Part 1: On paper"));
  assert(text.includes("1. Compute $q_1, \\ldots, q_5$."));
  assert(text.includes('include("src/fibonacci.jl")'));
  assert(!text.includes("lm-solution"));
  assert(!text.includes("lm-scaffold"));
  assert(!text.includes("fibonacci_ratios(20)"));
  assert(!text.includes("\n\n\n"));
});

Deno.test("exercise solution: julia-parts, titles, code and solutions", () => {
  const text = new ExerciseSolution().run(julia()).text();
  assert(text.includes("## The golden ratio"));
  assert(text.includes("$q_1 = 1$"));
  assert(text.includes("fibonacci_ratios(20)"));
  assert(text.includes('include("src/fibonacci.jl")'));
  assert(!text.includes("## Part 1: On paper"));
  assert(!text.includes("1. Compute $q_1, \\ldots, q_5$."));
  assert(!text.includes("lm-scaffold"));
  assert(!text.includes("\n\n\n"));
});

Deno.test("exercise scaffold: julia-parts, only programming exercises, with their scaffolds", () => {
  const text = new ExerciseScaffold().run(julia()).text();
  assert(text.includes('include("src/fibonacci.jl")'));
  assert(text.includes("## How fast do the ratios converge?"));
  assert(text.includes("# function fibonacci_ratios(n)"));
  assert(!text.includes("golden ratio"));
  assert(!text.includes("lm-solution"));
  assert(!text.includes("fibonacci_ratios(20)"));
});

Deno.test("markers outside exercises: .lm-solution only in the solution, .lm-scaffold only in the scaffold", () => {
  const text = [
    "::: {.lm-solution}",
    "```{python}",
    "#| eval: false",
    "from src.truss import *",
    "```",
    ":::",
    "",
    "::: {.lm-scaffold}",
    "Notes for the notebook",
    ":::",
    "",
    "::: {#exr-a}",
    "## A",
    "",
    "::: {.lm-scaffold}",
    "```{python}",
    "x = 1",
    "```",
    ":::",
    ":::",
    "",
  ].join("\n");
  const doc = () => QmdDocument.parse(text);
  assert(new ExerciseSolution().run(doc()).text().includes("from src.truss import *"));
  assert(!new ExerciseSheet().run(doc()).text().includes("from src.truss import *"));
  assert(!new ExerciseScaffold().run(doc()).text().includes("from src.truss import *"));
  assert(new ExerciseScaffold().run(doc()).text().includes("Notes for the notebook"));
  assert(!new ExerciseSheet().run(doc()).text().includes("Notes for the notebook"));
  assert(!new ExerciseSolution().run(doc()).text().includes("Notes for the notebook"));
});

Deno.test("nested markers are an error", () => {
  const text = "::: {.lm-sheet}\nOn the sheet\n\n::: {.lm-solution}\nSolution\n:::\n:::\n";
  for (const step of [new ExerciseSheet(), new ExerciseScaffold(), new ExerciseSolution()]) {
    assertThrows(() => step.run(QmdDocument.parse(text)), Error, ".lm-solution");
  }
});

Deno.test("exercise scaffold: an exercise with given code only is kept, one with nothing left but headings is dropped", () => {
  const text = "::: {#exr-a}\n## A\n\n```{python}\nx = load()\n```\n\n::: {.lm-solution}\nIn words.\n:::\n:::\n";
  const scaffold = new ExerciseScaffold().run(QmdDocument.parse(text)).text();
  assert(scaffold.includes("## A"));
  assert(scaffold.includes("x = load()"));
  const paper = "::: {#exr-b}\n## B\n\nOn paper.\n\n::: {.lm-solution}\nIn words.\n:::\n:::\n";
  assert(!new ExerciseScaffold().run(QmdDocument.parse(paper)).text().includes("## B"));
});

Deno.test("exercise solution: given code runs but is not shown, unless it sets include itself", () => {
  const text = [
    "::: {#exr-a}",
    "## A",
    "",
    "```{python}",
    "x = load()",
    "```",
    "",
    "```{python}",
    "#| include: true",
    "plot(x)",
    "```",
    "",
    "::: {.lm-solution}",
    "```{python}",
    "y = 2 * x",
    "```",
    ":::",
    ":::",
    "",
  ].join("\n");
  const solution = new ExerciseSolution().run(QmdDocument.parse(text)).text();
  assert(solution.includes("```{python}\n#| include: false\nx = load()"));
  assert(solution.includes("```{python}\n#| include: true\nplot(x)"));
  assert(solution.includes("```{python}\ny = 2 * x"));
});

Deno.test("exercise solution and scaffold: all headings of an exercise, without their text", () => {
  const text = "::: {#exr-a}\n## A\n\nText\n\n### Part\n\nMore\n\n```{python}\nx = 1\n```\n:::\n";
  for (const step of [new ExerciseScaffold(), new ExerciseSolution()]) {
    const result = step.run(QmdDocument.parse(text)).text();
    assert(result.includes("## A"));
    assert(result.includes("### Part"));
    assert(!result.includes("More"));
  }
});

Deno.test("setup cell inside a marker is an error", () => {
  const text = "::: {.lm-solution}\n```{python}\n#| label: setup\nimport numpy\n```\n:::\n";
  for (const step of [new ExerciseSheet(), new ExerciseScaffold(), new ExerciseSolution()]) {
    assertThrows(() => step.run(QmdDocument.parse(text)), Error, "Setup cell");
  }
});

Deno.test("exercise inside another div is an error", () => {
  const text = "::: {.columns}\n::: {#exr-a}\n## A\n:::\n:::\n";
  for (const step of [new ExerciseSheet(), new ExerciseScaffold(), new ExerciseSolution()]) {
    assertThrows(() => step.run(QmdDocument.parse(text)), Error, "exr-a");
  }
});

Deno.test("exercise scaffold: python-flat, an empty code cell for the students as .lm-scaffold", () => {
  const file = blocks("python-flat") + "40-continuity/aufgaben/11-bisection.qmd";
  const text = new ExerciseScaffold().run(QmdDocument.read(file)).text();
  assert(text.includes("## Bisection"));
  assert(text.includes("```{python}\n```"));
  assert(!text.includes("midpoints.append(m)"));
});

Deno.test("exercise sheet and solution: r-topics, .lm-sheet only on the sheet", () => {
  const file = blocks("r-topics") + "theory/power-series/exercises/01-radius.qmd";
  const sheet = new ExerciseSheet().run(QmdDocument.read(file)).text();
  const solution = new ExerciseSolution().run(QmdDocument.read(file)).text();
  assert(sheet.includes("kable(data.frame"));
  assert(!solution.includes("kable(data.frame"));
});
