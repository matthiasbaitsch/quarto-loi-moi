// Recipe for one exercise sheet with work files and solution (SPEC, section "Exercise sheets").

import { crypto } from "jsr:@std/crypto@1";
import { encodeHex } from "jsr:@std/encoding@1";
import { dirname, extname, join } from "jsr:@std/path@1";
import { strToU8, zipSync } from "npm:fflate@0.8";
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

  // The combined .qmd files, parsed once; used by all three parts.
  private parsed?: QmdDocument;

  // The URL of the output folder and of the site, for ${work-files} and ${site}; set by run().
  private url?: string;
  private site?: string;

  run(folder: string, url?: string, site?: string): string[] {
    this.url = url;
    this.site = site;
    return [this.sheet(folder), ...this.workFiles(folder), this.solution(folder), ...this.copyImages(folder)];
  }

  // Copies the images of the exercises into folder, keeping their paths, e.g. bilder/pfahl.svg.
  copyImages(folder: string): string[] {
    const paths = [...this.combine().matchAll(/!\[[^\]]*\]\(([^)\s]+)/g)].map((match) => match[1])
      .filter((path) => !path.includes("://") && !path.startsWith("/"));
    return paths.flatMap((path) => {
      const source = this.ingredients.map((ingredient) => ingredient.fullPath(path)).find(isFile);
      if (source === undefined) return [];
      Deno.mkdirSync(dirname(join(folder, path)), { recursive: true });
      Deno.copyFileSync(source, join(folder, path));
      return [path];
    });
  }

  // The nodes of the combined .qmd files, with the setup cells merged.
  nodes(): Node[] {
    this.parsed ??= QmdDocument.parse(this.replacePlaceholders(this.combine()));
    return mergeSetup(this.parsed.nodes);
  }

  // The nodes for the documents Quarto renders in c/ (sheet, solution): the setup cell changes into the folder of
  // the exercises, so the code finds src/ and data as when writing the exercise.
  renderedNodes(): Node[] {
    const ingredient = this.codeIngredient();
    if (ingredient === undefined) return this.nodes();
    return inFolder(this.nodes(), ingredient.fullPath());
  }

  // The ingredient whose exercises have a setup cell: the code runs in its folder, its src/ is in the appendix.
  codeIngredient(): Ingredient | undefined {
    return this.ingredients.find((ingredient) =>
      ingredient.files("*.qmd", { full: true }).some((file) => Deno.readTextFileSync(file).includes("label: setup"))
    );
  }

  // The appendix of the solution: every file in src/ as a code block that is only shown.
  appendix(): string {
    const files = this.codeIngredient()?.files("src/*") ?? [];
    if (files.length === 0) return "";
    const blocks = files.map((file) => {
      const content = Deno.readTextFileSync(this.codeIngredient()!.fullPath(file)).trimEnd();
      return `\`\`\`{.${languages[extname(file)] ?? "text"} filename="${file}"}\n${content}\n\`\`\``;
    });
    return ["", "# Anhang: Code {.unnumbered}", "", blocks.join("\n\n"), ""].join("\n");
  }

  // Writes the work files if there is a programming exercise: a zip file with the notebook, e.g.
  // 01-bohrpfahl-finite-elemente-aufgaben.zip with 01-bohrpfahl-finite-elemente-aufgaben.ipynb.
  workFiles(folder: string): string[] {
    const nodes = forWorkFiles(this.nodes());
    if (!nodes.some((node) => node instanceof Div)) return []; // no programming exercise
    const title = `# Aufgabenblatt ${this.number}\n\n${this.subtitle()}`;
    const notebook = JSON.stringify(notebookOf(title, nodes), null, 1);
    const zip = zipSync({ [`${this.slug()}-aufgaben.ipynb`]: strToU8(notebook) });
    Deno.writeFileSync(join(folder, `${this.slug()}-aufgaben.zip`), zip);
    return [`${this.slug()}-aufgaben.zip`];
  }

  // Writes the solution, e.g. 01-bohrpfahl-finite-elemente-aufgaben-loesung-830a5d95.qmd.
  solution(folder: string): string {
    const header = [
      "---",
      `title: Lösungen zu Aufgabenblatt ${this.number}`,
      `subtitle: "${this.subtitle()}"`,
      "---",
    ].join("\n");
    const file = `${this.slug()}-aufgaben-loesung-${this.hash()}.qmd`;
    const text = tidy(forSolution(this.renderedNodes())).map((node) => node.text()).join("\n");
    Deno.writeTextFileSync(join(folder, file), header + "\n\n" + text + "\n" + this.appendix());
    return file;
  }

  // Writes the exercise sheet, e.g. 01-bohrpfahl-finite-elemente-aufgaben.qmd.
  // Without .lm-sheet, the sheet runs no code (saves time; works for all languages, unlike --no-execute).
  sheet(folder: string): string {
    const nodes = tidy(forSheet(this.renderedNodes()));
    const execute = hasSheetCode(nodes) ? [] : ["execute:", "  eval: false"];
    const header = [
      "---",
      `title: Aufgabenblatt ${this.number}`,
      `subtitle: "${this.subtitle()}"`,
      ...execute,
      "---",
    ].join("\n");
    const text = nodes.map((node) => node.text()).join("\n");
    const file = `${this.slug()}-aufgaben.qmd`;
    Deno.writeTextFileSync(join(folder, file), header + "\n\n" + text);
    return file;
  }

  // The placeholders replaced (SPEC, "Products"); absolute if the URLs are known.
  replacePlaceholders(text: string): string {
    const workFiles = `${this.slug()}-aufgaben.zip`;
    return text
      .replaceAll("${slug}", this.slug())
      .replaceAll("${site}", this.site ?? "../..") // without the URL relative from lernpfad/aufgaben/c/ to lernpfad/
      .replaceAll("${work-files}", this.url === undefined ? workFiles : `${this.url}/${workFiles}`);
  }

  // The .qmd files of all ingredients, one after the other.
  combine(): string {
    const texts = this.ingredients.flatMap((ingredient) =>
      ingredient.files("*.qmd", { full: true }).map((file) => Deno.readTextFileSync(file))
    );
    return texts.join("\n\n");
  }

  // The first 8 hex digits of sha1("87362-" + slug): solution names that cannot be guessed (SPEC, "Products").
  hash(): string {
    const digest = crypto.subtle.digestSync("SHA-1", new TextEncoder().encode(`87362-${this.slug()}`));
    return encodeHex(digest).slice(0, 8);
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

// What goes into the solution (SPEC, "Processing"): the setup cell, executable code, and of each exercise its
// title, its executable code and its solution.
function forSolution(nodes: Node[]): Node[] {
  return nodes.flatMap((node): Node[] => {
    if (node instanceof Div && node.id.startsWith("exr-")) {
      return [new Div(node.open, node.close, node.id, node.classes, inExerciseForSolution(node.children))];
    }
    if (node instanceof CodeCell && node.executable) return [node];
    if (node instanceof Text) return [new Text(node.lines.filter(isBlank))]; // keeps the blocks apart
    return [];
  });
}

// The content of an exercise in the solution: title, executable code, solution.
function inExerciseForSolution(nodes: Node[]): Node[] {
  return nodes.flatMap((node): Node[] => {
    if (node instanceof Text) return [new Text(node.lines.filter((line) => line.startsWith("#") || isBlank(line)))];
    if (node instanceof CodeCell && node.executable) return [node];
    if (node instanceof Div && node.classes.includes("lm-solution")) return [node];
    return [];
  });
}

function isBlank(line: string): boolean {
  return line.trim() === "";
}

// What goes into the work files (SPEC, "Processing"): the setup cell, executable code, and of each programming
// exercise its title, its executable code and its scaffold; an empty code cell for a solution with code if the
// exercise has no scaffold. Paper exercises are dropped.
function forWorkFiles(nodes: Node[]): Node[] {
  return nodes.flatMap((node): Node[] => {
    if (node instanceof Div && node.id.startsWith("exr-")) {
      return isProgramming(node)
        ? [new Div(node.open, node.close, node.id, node.classes, inExerciseForWorkFiles(node))]
        : [];
    }
    if (node instanceof CodeCell && node.executable) return [node];
    return [];
  });
}

// The content of a programming exercise in the work files.
function inExerciseForWorkFiles(exercise: Div): Node[] {
  const hasScaffold = exercise.children.some((node) => hasClass(node, "lm-scaffold"));
  return exercise.children.flatMap((node): Node[] => {
    if (node instanceof Text) return [new Text(node.lines.filter((line) => line.startsWith("#")))];
    if (node instanceof CodeCell && node.executable) return [node];
    if (hasClass(node, "lm-scaffold")) return [node];
    if (hasClass(node, "lm-solution") && hasCode(node as Div) && !hasScaffold) return [emptyCell(node as Div)];
    return [];
  });
}

// A programming exercise has a scaffold or code in its solution (SPEC, "In the building blocks").
function isProgramming(exercise: Div): boolean {
  return exercise.children.some((node) =>
    hasClass(node, "lm-scaffold") || (hasClass(node, "lm-solution") && hasCode(node as Div))
  );
}

function hasClass(node: Node, name: string): boolean {
  return node instanceof Div && node.classes.includes(name);
}

function hasCode(div: Div): boolean {
  return div.children.some((node) => node instanceof CodeCell && node.executable);
}

// An empty code cell in the language of the first code cell of a solution.
function emptyCell(solution: Div): CodeCell {
  const code = solution.children.find((node) => node instanceof CodeCell) as CodeCell;
  return new CodeCell([code.lines[0], code.lines[code.lines.length - 1]], code.language, true, {});
}

// ---------------------------------------------------------------------------------------------------------------
// Jupyter notebook

interface Cell {
  cell_type: "markdown" | "code";
  metadata: Record<string, never>;
  source: string[];
  outputs?: never[];
  execution_count?: null;
}

// A notebook (nbformat 4) with a title cell and the cells of the nodes; divs are flattened.
function notebookOf(title: string, nodes: Node[]) {
  const cells = [markdownCell(title.split("\n")), ...cellsOf(nodes)];
  const language = nodes.find((node) => node instanceof CodeCell)?.language ?? "";
  const metadata = { kernelspec: kernels[language], language_info: { name: language } };
  return { cells, metadata, nbformat: 4, nbformat_minor: 5 };
}

function cellsOf(nodes: Node[]): Cell[] {
  return nodes.flatMap((node): Cell[] => {
    if (node instanceof Div) return cellsOf(node.children);
    if (node instanceof CodeCell) return [codeCell(node.lines.slice(1, -1).filter((line) => !line.startsWith("#|")))];
    const lines = (node as Text).lines.filter((line) => !isBlank(line));
    return lines.length > 0 ? [markdownCell(lines)] : [];
  });
}

// Jupyter stores the lines of a cell with their line breaks, except the last one.
function source(lines: string[]): string[] {
  return lines.map((line, i) => i < lines.length - 1 ? line + "\n" : line);
}

function markdownCell(lines: string[]): Cell {
  return { cell_type: "markdown", metadata: {}, source: source(lines) };
}

function codeCell(lines: string[]): Cell {
  return { cell_type: "code", metadata: {}, source: source(lines), outputs: [], execution_count: null };
}

// The nodes with the setup cell (the first node after mergeSetup) changing into folder: Python os.chdir, Julia cd
// (and include made absolute, since Julia looks for it relative to the file), R setwd for the setup cell itself and
// root.dir for the later chunks.
function inFolder(nodes: Node[], folder: string): Node[] {
  const [setup, ...rest] = nodes;
  if (!isSetup(setup)) return nodes;
  const cell = setup as CodeCell;
  const changeFolder: Record<string, string[]> = {
    python: ["import os", `os.chdir("${folder}")`],
    julia: [`cd("${folder}")`],
    r: [`setwd("${folder}")`, `knitr::opts_knit$set(root.dir = "${folder}")`],
  };
  const options = cell.lines.filter((line) => line.startsWith("#|"));
  const code = cell.lines.slice(1, -1).filter((line) => !line.startsWith("#|"))
    .map((line) => cell.language === "julia" ? line.replace(/include\("(?!\/)/, `include("${folder}/`) : line);
  const lines = [
    cell.lines[0],
    ...options,
    ...(changeFolder[cell.language] ?? []),
    ...code,
    cell.lines[cell.lines.length - 1],
  ];
  return [new CodeCell(lines, cell.language, cell.executable, cell.options), ...rest];
}

// The Jupyter kernel for a language.
const kernels: Record<string, { name: string; display_name: string; language: string }> = {
  python: { name: "python3", display_name: "Python 3", language: "python" },
  julia: { name: "julia", display_name: "Julia", language: "julia" },
  r: { name: "ir", display_name: "R", language: "R" },
};

// The language of a code file for its file extension.
const languages: Record<string, string> = { ".jl": "julia", ".py": "python", ".R": "r", ".r": "r" };

function isFile(path: string): boolean {
  try {
    return Deno.statSync(path).isFile;
  } catch {
    return false;
  }
}

// Whether there is a .lm-sheet div, also inside divs.
function hasSheetCode(nodes: Node[]): boolean {
  return nodes.some((node) =>
    node instanceof Div && (node.classes.includes("lm-sheet") || hasSheetCode(node.children))
  );
}
