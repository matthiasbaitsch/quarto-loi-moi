// Recipe for one exercise sheet with work files and solution (SPEC, section "Exercise sheets").

import { join } from "@std/path";
import { Ingredient } from "../library.ts";
import { CodeCell, Div, Node, QmdDocument, Text } from "../qmd-document.ts";
import { Recipe } from "./recipe.ts";

export class ExerciseSheet implements Recipe {
  constructor(
    readonly ingredients: Ingredient[], // the aufgaben/ folders of the building blocks
    readonly number: number, // position in the series, from 1
    readonly groupTitle?: string, // e.g. "Bohrpfahl"
    readonly blockTitle?: string, // e.g. "Finite Elemente"
  ) {}

  run(folder: string): void {
    this.sheet(folder);
  }

  // Writes the exercise sheet, e.g. 01-bohrpfahl-finite-elemente-aufgaben.qmd.
  sheet(folder: string): void {
    const header = [
      "---",
      `title: Aufgabenblatt ${this.number}`,
      `subtitle: "${this.subtitle()}"`,
      "---",
    ].join("\n");
    const document = QmdDocument.parse(this.combine());
    const text = tidy(forSheet(mergeSetup(document.nodes))).map((node) => node.text()).join("\n");
    Deno.writeTextFileSync(join(folder, `${this.slug()}-aufgaben.qmd`), header + "\n\n" + text);
  }

  // The .qmd files of all ingredients, one after the other.
  combine(): string {
    const texts = this.ingredients.flatMap((ingredient) =>
      ingredient.files("*.qmd", { full: true }).map((file) => Deno.readTextFileSync(file))
    );
    return texts.join("\n\n");
  }

  // Group title and building block title, e.g. "Bohrpfahl: Finite Elemente".
  subtitle(): string {
    return [this.groupTitle, this.blockTitle].filter((title) => title !== undefined).join(": ");
  }

  // Number and name of the first building block, e.g. "01-bohrpfahl-finite-elemente" (SPEC, section "Products").
  slug(): string {
    const parts = this.ingredients[0].name({ full: true }).split("/");
    const blockName = parts.slice(0, -1).join("-"); // without the ingredient, e.g. "aufgaben"
    return `${String(this.number).padStart(2, "0")}-${blockName}`;
  }
}

// What goes on the exercise sheet (SPEC, "Processing"): without solutions, scaffolds and executable code outside
// the divs, except the setup cell. The content of .lm-sheet stays as it is.
function forSheet(nodes: Node[]): Node[] {
  return nodes.filter(onSheet).map((node) => {
    if (node instanceof Div && !node.classes.includes("lm-sheet")) {
      return new Div(node.open, node.close, node.id, node.classes, forSheet(node.children));
    }
    return node;
  });
}

// Whether a node stays on the exercise sheet.
function onSheet(node: Node): boolean {
  if (node instanceof Div) return !node.classes.includes("lm-solution") && !node.classes.includes("lm-scaffold");
  if (node instanceof CodeCell) return !node.executable || node.options.label === "setup";
  return true;
}

// The setup cells merged into one at the beginning (SPEC, "Processing"): fence and #| options from the first
// cell, then the code lines of all cells, each line only once.
function mergeSetup(nodes: Node[]): Node[] {
  const cells = setupCells(nodes);
  if (cells.length === 0) return nodes;
  const first = cells[0];
  const options = first.lines.filter((line) => line.startsWith("#|"));
  const code = cells.flatMap((cell) => cell.lines.slice(1, -1).filter((line) => !line.startsWith("#|")));
  const lines = [first.lines[0], ...options, ...new Set(code), first.lines[first.lines.length - 1]];
  const merged = new CodeCell(lines, first.language, first.executable, first.options);
  return [merged, new Text([""]), ...withoutSetup(nodes)];
}

// All setup cells, also inside divs.
function setupCells(nodes: Node[]): CodeCell[] {
  return nodes.flatMap((node): CodeCell[] => {
    if (node instanceof Div) return setupCells(node.children);
    if (isSetup(node)) return [node as CodeCell];
    return [];
  });
}

// The nodes without setup cells, also inside divs.
function withoutSetup(nodes: Node[]): Node[] {
  return nodes.filter((node) => !isSetup(node)).map((node) => {
    if (node instanceof Div) return new Div(node.open, node.close, node.id, node.classes, withoutSetup(node.children));
    return node;
  });
}

function isSetup(node: Node): boolean {
  return node instanceof CodeCell && node.options.label === "setup";
}

// Removing nodes leaves blank lines behind: adjacent texts are joined and runs of blank lines become one. Code
// cells stay as they are.
function tidy(nodes: Node[]): Node[] {
  const result: Node[] = [];
  for (const node of nodes) {
    const last = result[result.length - 1];
    if (node instanceof Text && last instanceof Text) {
      result[result.length - 1] = new Text([...last.lines, ...node.lines]);
    } else if (node instanceof Div) {
      result.push(
        new Div(node.open, node.close, node.id, node.classes, withoutTrailingBlankLines(tidy(node.children))),
      );
    } else {
      result.push(node);
    }
  }
  return result.map((node) => node instanceof Text ? new Text(singleBlankLines(node.lines)) : node);
}

// Lines with runs of blank lines reduced to one blank line.
function singleBlankLines(lines: string[]): string[] {
  return lines.filter((line, i) => line.trim() !== "" || i === 0 || lines[i - 1].trim() !== "");
}

// The nodes of a div without blank lines before its closing fence.
function withoutTrailingBlankLines(nodes: Node[]): Node[] {
  const last = nodes[nodes.length - 1];
  if (!(last instanceof Text)) return nodes;
  const lines = [...last.lines];
  while (lines.length > 0 && lines[lines.length - 1].trim() === "") lines.pop();
  const rest = nodes.slice(0, -1);
  return lines.length === 0 ? rest : [...rest, new Text(lines)];
}
