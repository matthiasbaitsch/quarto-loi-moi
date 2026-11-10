// Reading the learning path: lernpfad/loimoi.yml and about.yaml of the building blocks.

import { parse } from "jsr:@std/yaml@1.0.10";
import { DEFAULT_NAMES, fillPattern, slugify, solutionHash } from "./names.ts";

// A sheet of the learning path with everything needed to generate it
export interface Sheet {
  number: number; // position in loimoi.yml, starting at 1
  title: string; // e.g. "Bohrpfahl: Numerische Lösung", subtitle of sheet and solution
  bausteine: string[]; // folders relative to the project, e.g. "bausteine/01-loesungsverfahren"
  names: Record<string, string>; // file names without extension: sheet, solution, material
}

export interface LearningPath {
  url?: string; // address of the published lernpfad folder, for absolute links (relative ones fail in PDF)
  lang: string; // from _quarto.yml, default "de"
  engine?: string; // from _quarto.yml, e.g. "julia"
  material?: string; // working file for the students: "ipynb" or "qmd", none if missing
  sheets: Sheet[];
}

// Read a YAML file, error with the file name if it is missing
function readYaml(path: string): Record<string, unknown> {
  let text: string;
  try {
    text = Deno.readTextFileSync(path);
  } catch {
    throw new Error(`File not found: ${path}`);
  }
  return (parse(text) ?? {}) as Record<string, unknown>;
}

// about.yaml of the first building block of a sheet that has one, with the number of its folder (e.g. "02" from
// "02-stabendkraefte")
function firstAbout(bausteine: string[]): { number?: string; teil: string; titel: string } | undefined {
  for (const folder of bausteine) {
    let about;
    try {
      about = readYaml(`${folder}/about.yaml`);
    } catch {
      continue; // no about.yaml in this building block, try the next one
    }
    const number = folder.split("/").pop()!.match(/^\d+/)?.[0];
    return { number, teil: String(about.teil), titel: String(about.titel) };
  }
  return undefined;
}

// Keys allowed in loimoi.yml, anything else is an error (catches typos such as "sheet:" for "sheets:")
const KEYS = ["url", "material", "names", "sheets"];
const SHEET_KEYS = ["bausteine", "title", "key"];
const NAME_KEYS = ["sheet", "solution", "material"];
const MATERIALS = ["ipynb", "qmd"];

function checkKeys(object: Record<string, unknown>, allowed: string[], where: string): void {
  for (const key of Object.keys(object)) {
    if (!allowed.includes(key)) {
      throw new Error(`Unknown key "${key}" ${where} in lernpfad/loimoi.yml, allowed: ${allowed.join(", ")}`);
    }
  }
}

// Check the structure of loimoi.yml before using it
function checkConfig(config: Record<string, unknown>): void {
  checkKeys(config, KEYS, "at the top");
  if (config.names !== undefined) {
    checkKeys(config.names as Record<string, unknown>, NAME_KEYS, "in names");
  }
  if (config.material !== undefined && !MATERIALS.includes(String(config.material))) {
    throw new Error(`material in lernpfad/loimoi.yml must be ${MATERIALS.join(" or ")}, not ${config.material}`);
  }
  if (!Array.isArray(config.sheets)) {
    throw new Error("lernpfad/loimoi.yml needs a list sheets");
  }
  for (const [i, sheet] of (config.sheets as Record<string, unknown>[]).entries()) {
    checkKeys(sheet, SHEET_KEYS, `in sheet ${i + 1}`);
    if (!Array.isArray(sheet.bausteine) || sheet.bausteine.length === 0) {
      throw new Error(`Sheet ${i + 1} in lernpfad/loimoi.yml needs a list bausteine`);
    }
  }
}

// Read lernpfad/loimoi.yml in the project folder (the current working directory of pre-render scripts)
export async function readLearningPath(): Promise<LearningPath> {
  const config = readYaml("lernpfad/loimoi.yml");
  checkConfig(config);
  const quarto = readYaml("_quarto.yml");
  const patterns = { ...DEFAULT_NAMES, ...(config.names as Record<string, string> ?? {}) };
  const sheets: Sheet[] = [];

  const entries = (config.sheets ?? []) as Record<string, unknown>[];
  for (const [i, entry] of entries.entries()) {
    const number = i + 1;
    const nn = String(number).padStart(2, "0");
    const bausteine = (entry.bausteine as string[]).map((b) => `bausteine/${b}`);
    const about = firstAbout(bausteine);

    // Title: from loimoi.yml if given there, otherwise "teil: titel" from about.yaml
    let title: string;
    if (entry.title !== undefined) {
      title = String(entry.title);
    } else if (about) {
      title = `${about.teil}: ${about.titel}`;
    } else {
      throw new Error(`Sheet ${number} in lernpfad/loimoi.yml needs a title (no about.yaml in its bausteine)`);
    }

    // Slug as in make-learning-path.jl of numPDE: number of the building block folder, then part and title from
    // its about.yaml, e.g. "02-stabtragwerke-stabendkraefte". Without about.yaml: number and title of the sheet.
    const slug = about
      ? (about.number ?? nn) + "-" + slugify(`${about.teil} ${about.titel}`)
      : nn + "-" + slugify(title);

    // Variables for the file name patterns
    const variables = {
      nn,
      slug,
      hash: await solutionHash(slug),
      name: slugify(entry.title !== undefined ? String(entry.title) : about!.titel),
      key: entry.key === undefined ? undefined : String(entry.key),
    };
    const names: Record<string, string> = {};
    for (const [kind, pattern] of Object.entries(patterns)) {
      names[kind] = fillPattern(pattern, variables);
    }
    sheets.push({ number, title, bausteine, names });
  }

  return {
    url: config.url === undefined ? undefined : String(config.url).replace(/\/$/, ""),
    lang: String(quarto.lang ?? "de"),
    engine: quarto.engine === undefined ? undefined : String(quarto.engine),
    material: config.material === undefined ? undefined : String(config.material),
    sheets,
  };
}
