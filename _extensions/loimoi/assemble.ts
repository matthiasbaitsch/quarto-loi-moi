// Assembling the documents of a sheet: the exercise files of all its building blocks one after the other, as
// text (pandoc.write would rewrite the Markdown, e.g. ```{python} would become a plain code block).
//
// The only structure we look at are executable code cells (```{python} ... ```), they are easy to recognize by
// their fences. All cells with "#| label: setup" are merged into one cell at the beginning.

import type { Sheet } from "./learning-path.ts";

// Where the generated documents go (links in Moodle point here)
export const OUTPUT_FOLDER = "lernpfad/aufgaben/c";

export type Target = "sheet" | "material" | "solution";

// Texts the extension writes into documents, by language
const LABELS: Record<string, Record<string, string>> = {
  de: { sheet: "Aufgabenblatt", solution: "Lösungen zu Aufgabenblatt", appendix: "Anhang: Code" },
  en: { sheet: "Exercise sheet", solution: "Solutions to exercise sheet", appendix: "Appendix: Code" },
};

// Language of a code file for the appendix, by extension
const LANGUAGES: Record<string, string> = { py: "python", jl: "julia", r: "r", R: "r" };

// ---------------------------------------------------------------------------------------------------------------
// Code cells
// ---------------------------------------------------------------------------------------------------------------

interface Cell {
  start: number; // index of the opening fence line
  end: number; // index of the closing fence line
  language: string;
  options: string[]; // lines "#| ..."
  code: string[]; // the other lines
}

// Executable code cells in a list of lines: ```{python} (not ```{.python}) up to the closing fence
export function findCells(lines: string[]): Cell[] {
  const cells: Cell[] = [];
  for (let i = 0; i < lines.length; i++) {
    const open = lines[i].match(/^(`{3,})\{([A-Za-z0-9_]+)\}\s*$/);
    if (!open) {
      continue;
    }
    const fence = open[1];
    let end = i + 1;
    while (end < lines.length && lines[end].trim() !== fence) {
      end++;
    }
    const body = lines.slice(i + 1, end);
    cells.push({
      start: i,
      end,
      language: open[2],
      options: body.filter((line) => line.startsWith("#|")),
      code: body.filter((line) => !line.startsWith("#|")),
    });
    i = end;
  }
  return cells;
}

export function isSetup(cell: Cell): boolean {
  return cell.options.some((line) => /^#\|\s*label:\s*setup\s*$/.test(line));
}

function cellText(language: string, options: string[], code: string[]): string {
  return ["```{" + language + "}", ...options, ...code, "```"].join("\n");
}

// Lines that make the code of an assembled document run in the folder of the building block (see CLAUDE.md:
// src/ and data are found relative to it). R needs a cell of its own, the setting holds from the next cell on.
function workingFolderCells(language: string, folder: string): { before: string[]; first: string[] } {
  switch (language) {
    case "python":
      return { before: [], first: ["import os", `os.chdir(${JSON.stringify(folder)})`] };
    case "julia":
      return { before: [], first: [`cd(${JSON.stringify(folder)})`] };
    case "r":
      return {
        before: [cellText("r", ["#| include: false"], [`knitr::opts_knit$set(root.dir = ${JSON.stringify(folder)})`])],
        first: [],
      };
    default:
      throw new Error(`Unknown language ${language}, cannot set the working folder`);
  }
}

// Julia's include looks for relative paths next to the document, not in the working folder: make them absolute
function absoluteIncludes(line: string, folder: string): string {
  return line.replace(/include\("([^"/][^"]*)"\)/, (_, path) => `include(${JSON.stringify(`${folder}/${path}`)})`);
}

// ---------------------------------------------------------------------------------------------------------------
// Assembling
// ---------------------------------------------------------------------------------------------------------------

// Exercise files of a building block: aufgaben/*.qmd sorted by name, without files starting with "_"
export function exerciseFiles(folder: string): string[] {
  const files: string[] = [];
  for (const entry of Deno.readDirSync(`${folder}/aufgaben`)) {
    if (entry.isFile && entry.name.endsWith(".qmd") && !entry.name.startsWith("_")) {
      files.push(`${folder}/aufgaben/${entry.name}`);
    }
  }
  return files.sort();
}

// Replace the placeholders ${...} that we know, leave everything else alone
function replacePlaceholders(text: string, values: Record<string, string>): string {
  return text.replace(/\$\{([a-z]+)\}/g, (match, name) => values[name] ?? match);
}

// Text of the exercises of a sheet for a target: placeholders replaced, setup cells merged into one at the
// beginning. In sheet and solution, the code runs in the folder of the first building block with setup; in the
// material, the students have everything next to the file and the setup cell is visible.
export function sheetBody(sheet: Sheet, url: string | undefined, target: Target): string {
  const material = `${sheet.names.material}.zip`;
  const values = { material: url ? `${url}/aufgaben/c/${material}` : material };

  const lines: string[] = [];
  let language: string | undefined;
  let codeFolder: string | undefined;
  const setupCode: string[] = [];

  for (const folder of sheet.bausteine) {
    for (const file of exerciseFiles(folder)) {
      const fileLines = replacePlaceholders(Deno.readTextFileSync(file).trim(), values).split("\n");
      const cells = findCells(fileLines);
      // The code runs in the folder of the first building block with a setup cell: that is where code needs
      // src/ or data (a table in .lm-sheet, for example, does not)
      const firstSetup = cells.find(isSetup);
      if (firstSetup && codeFolder === undefined) {
        codeFolder = Deno.realPathSync(`${folder}/aufgaben`);
        language = firstSetup.language;
      }
      // Collect the setup code and drop the setup cells (from the back, so the indices stay valid)
      for (const cell of cells.filter(isSetup).reverse()) {
        setupCode.unshift(...cell.code);
        fileLines.splice(cell.start, cell.end - cell.start + 1);
      }
      if (lines.length > 0) {
        lines.push("");
      }
      lines.push(...fileLines);
    }
  }

  // Setup code without repetitions and empty lines, in the order of first appearance
  const code = [...new Set(setupCode.filter((line) => line.trim() !== ""))];
  const cells: string[] = [];
  if (language && codeFolder) {
    if (target === "material") {
      cells.push(cellText(language, ["#| label: setup"], code));
    } else {
      const working = workingFolderCells(language, codeFolder);
      const setup = language === "julia" ? code.map((line) => absoluteIncludes(line, codeFolder!)) : code;
      cells.push(...working.before);
      cells.push(cellText(language, ["#| label: setup", "#| include: false"], [...working.first, ...setup]));
    }
  }

  const text = [...cells, lines.join("\n")].join("\n\n");
  return text.replace(/\n{3,}/g, "\n\n") + "\n";
}

// Appendix of the solution: all files in src/ of the building block with setup, shown (not executed)
function appendix(sheet: Sheet, title: string): string {
  let src: string | undefined;
  for (const folder of sheet.bausteine) {
    const hasSetup = exerciseFiles(folder).some((file) =>
      findCells(Deno.readTextFileSync(file).split("\n")).some(isSetup)
    );
    if (hasSetup) {
      src = `${folder}/aufgaben/src`;
      break;
    }
  }
  let files: string[];
  try {
    files = [...Deno.readDirSync(src!)].filter((e) => e.isFile && !e.name.startsWith(".")).map((e) => e.name).sort();
  } catch {
    return ""; // no building block with setup or no src/ folder
  }
  if (files.length === 0) {
    return "";
  }

  const parts = [`## ${title} {.unnumbered}`];
  for (const file of files) {
    const code = Deno.readTextFileSync(`${src}/${file}`).trimEnd();
    const language = LANGUAGES[file.split(".").pop() ?? ""];
    // The fence must be longer than any backtick sequence in the code
    const longest = Math.max(2, ...(code.match(/`+/g) ?? []).map((s) => s.length));
    const fence = "`".repeat(longest + 1);
    const attributes = (language ? `.${language} ` : "") + `filename="src/${file}"`;
    parts.push(`${fence}{${attributes}}\n${code}\n${fence}`);
  }
  return "\n" + parts.join("\n\n") + "\n";
}

// YAML header of a generated document
function header(entries: Record<string, unknown>): string {
  const lines = Object.entries(entries).map(([key, value]) => `${key}: ${JSON.stringify(value)}`);
  return ["---", ...lines, "---", ""].join("\n");
}

// The sheet and the solution as .qmd files in the output folder
export function writeSheetAndSolution(sheet: Sheet, url: string | undefined, lang: string): void {
  const labels = LABELS[lang.startsWith("en") ? "en" : "de"];

  // The sheet runs code only if there is code for it (.lm-sheet), the filter removes all other cells anyway
  const sheetBodyText = sheetBody(sheet, url, "sheet");
  const sheetHeader: Record<string, unknown> = {
    title: `${labels.sheet} ${sheet.number}`,
    subtitle: sheet.title,
    "lm-target": "sheet",
  };
  if (!sheetBodyText.includes(".lm-sheet")) {
    sheetHeader.execute = { enabled: false };
  }
  Deno.writeTextFileSync(`${OUTPUT_FOLDER}/${sheet.names.sheet}.qmd`, header(sheetHeader) + "\n" + sheetBodyText);

  const solutionHeader = {
    title: `${labels.solution} ${sheet.number}`,
    subtitle: sheet.title,
    "lm-target": "solution",
  };
  const solutionBody = sheetBody(sheet, url, "solution") + appendix(sheet, labels.appendix);
  Deno.writeTextFileSync(`${OUTPUT_FOLDER}/${sheet.names.solution}.qmd`, header(solutionHeader) + "\n" + solutionBody);
}

// Copy the folders next to the exercises (images etc.) into the output folder, except src/ (code runs in the
// folder of the building block). Returns the names of the copied folders.
export function copyResources(sheet: Sheet): string[] {
  const copied: string[] = [];
  for (const folder of sheet.bausteine) {
    for (const entry of Deno.readDirSync(`${folder}/aufgaben`)) {
      if (entry.isDirectory && entry.name !== "src") {
        copyFolder(`${folder}/aufgaben/${entry.name}`, `${OUTPUT_FOLDER}/${entry.name}`);
        copied.push(entry.name);
      }
    }
  }
  return copied;
}

function copyFolder(from: string, to: string): void {
  Deno.mkdirSync(to, { recursive: true });
  for (const entry of Deno.readDirSync(from)) {
    if (entry.isDirectory) {
      copyFolder(`${from}/${entry.name}`, `${to}/${entry.name}`);
    } else {
      Deno.copyFileSync(`${from}/${entry.name}`, `${to}/${entry.name}`);
    }
  }
}
