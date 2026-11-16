import { assert } from "@std/assert";
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

Deno.test("exercise scaffold: python-flat, empty code cell for a solution with code and no scaffold", () => {
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
