// The material for the students: the working file with the scaffold, as a zip file in the output folder.
//
//   ipynb (Julia, Python): the zip file contains only the notebook <material>.ipynb
//   qmd (R):               the zip file contains a folder <material>/ with <material>.qmd and everything the
//                          exercises need (all other files of the building block with setup except src/), plus
//                          the files in lernpfad/aufgaben/material/ (e.g. _quarto.yml), if that folder exists
//
// The working file is assembled like sheet and solution and rendered to a notebook without running any code.
// For qmd, the notebook is converted back with quarto convert: rendering qmd to qmd directly would turn the
// executable cells into plain code blocks.

import { exerciseFiles, findCells, isSetup, OUTPUT_FOLDER, sheetBody } from "./assemble.ts";
import type { LearningPath, Sheet } from "./learning-path.ts";

// Work folder, Quarto skips folders starting with "_" when it renders the project
const WORK_FOLDER = "lernpfad/aufgaben/_material";

// Optional extra files for the material folder (qmd only)
const EXTRA_FOLDER = "lernpfad/aufgaben/material";

const ZIP_SCRIPT = new URL("zip.lua", import.meta.url).pathname;
const FILTER = new URL("markers.lua", import.meta.url).pathname;

// Run quarto with arguments, error with its output if it fails
function quarto(args: string[]): void {
  const result = new Deno.Command("quarto", { args, stdout: "piped", stderr: "piped" }).outputSync();
  if (!result.success) {
    const decoder = new TextDecoder();
    throw new Error(`quarto ${args.join(" ")} failed:\n${decoder.decode(result.stdout)}${decoder.decode(result.stderr)}`);
  }
}

// Folder and language of the first building block with a setup cell (see assemble.ts)
function setupBaustein(sheet: Sheet): { folder: string; language: string } | undefined {
  for (const folder of sheet.bausteine) {
    for (const file of exerciseFiles(folder)) {
      const setup = findCells(Deno.readTextFileSync(file).split("\n")).find(isSetup);
      if (setup) {
        return { folder: `${folder}/aufgaben`, language: setup.language };
      }
    }
  }
  return undefined;
}

// All files below a folder, relative to it
function filesBelow(folder: string, prefix = ""): string[] {
  const files: string[] = [];
  for (const entry of Deno.readDirSync(`${folder}/${prefix}`)) {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    files.push(...(entry.isDirectory ? filesBelow(folder, path) : [path]));
  }
  return files.sort();
}

function copy(from: string, to: string): void {
  Deno.mkdirSync(to.substring(0, to.lastIndexOf("/")), { recursive: true });
  Deno.copyFileSync(from, to);
}

// Notebook without the local path of the kernel (it is stored by Jupyter, but only makes sense on this machine)
function removeKernelPath(notebook: string): void {
  const json = JSON.parse(Deno.readTextFileSync(notebook));
  delete json.metadata?.kernelspec?.path;
  Deno.writeTextFileSync(notebook, JSON.stringify(json, null, 1) + "\n");
}

export function writeMaterial(path: LearningPath, sheet: Sheet): void {
  const name = sheet.names.material;
  const setup = setupBaustein(sheet);
  if (!path.material || !setup) {
    return; // no material for this course or no code on this sheet
  }

  // Assembled working file, rendered to a notebook without running any code
  Deno.mkdirSync(WORK_FOLDER, { recursive: true });
  const header = [
    "---",
    `title: ${JSON.stringify(sheet.title)}`,
    "lm-target: material",
    `lang: ${path.lang}`,
    ...(path.engine ? [`engine: ${path.engine}`] : []),
    "execute:",
    "  eval: false",
    "filters:",
    `  - path: ${JSON.stringify(FILTER)}`,
    "    at: pre-ast",
    "---",
    "",
  ].join("\n");
  Deno.writeTextFileSync(`${WORK_FOLDER}/${name}.qmd`, header + "\n" + sheetBody(sheet, path.url, "material"));
  quarto(["render", `${WORK_FOLDER}/${name}.qmd`, "--to", "ipynb"]);
  removeKernelPath(`${WORK_FOLDER}/${name}.ipynb`);

  const zip = Deno.realPathSync(OUTPUT_FOLDER) + `/${name}.zip`;
  if (path.material === "ipynb") {
    quarto(["pandoc", "lua", ZIP_SCRIPT, zip, WORK_FOLDER, `${name}.ipynb`]);
    return;
  }
  if (path.material !== "qmd") {
    throw new Error(`material must be ipynb or qmd, not ${path.material}`);
  }

  // Folder with the working file as qmd and everything the exercises need
  const folder = `${WORK_FOLDER}/${name}`;
  try {
    Deno.removeSync(folder, { recursive: true }); // left over from the last run
  } catch (e) {
    if (!(e instanceof Deno.errors.NotFound)) throw e;
  }
  Deno.mkdirSync(folder, { recursive: true });
  quarto(["convert", `${WORK_FOLDER}/${name}.ipynb`, "--output", `${folder}/${name}.qmd`]);

  // quarto convert takes the language of the cells from the notebook kernel, which is not always right, and adds
  // a jupyter entry to the header: use the language of the exercises and drop that entry
  const qmd = Deno.readTextFileSync(`${folder}/${name}.qmd`)
    .replace(/^```\{\w+\}/gm, "```{" + setup.language + "}")
    .replace(/^jupyter: .*\n/m, "")
    .replace(/^---\n([\s\S]*?)---\n\s*/, "---\n$1---\n\n");
  Deno.writeTextFileSync(`${folder}/${name}.qmd`, qmd);

  for (const file of filesBelow(setup.folder)) {
    const top = file.split("/")[0];
    if (file.endsWith(".qmd") || top === "src" || top.startsWith("_")) {
      continue;
    }
    const target = file.endsWith(".code-workspace") && !file.includes("/") ? `${name}.code-workspace` : file;
    copy(`${setup.folder}/${file}`, `${folder}/${target}`);
  }
  try {
    for (const file of filesBelow(EXTRA_FOLDER)) {
      copy(`${EXTRA_FOLDER}/${file}`, `${folder}/${file}`);
    }
  } catch (e) {
    if (!(e instanceof Deno.errors.NotFound)) throw e;
  }

  const files = filesBelow(folder).map((file) => `${name}/${file}`);
  quarto(["pandoc", "lua", ZIP_SCRIPT, zip, WORK_FOLDER, ...files]);
}
