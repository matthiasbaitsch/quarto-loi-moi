import { copySync, ensureDirSync, existsSync } from "jsr:@std/fs@1";
import { dirname, join, relative } from "jsr:@std/path@1";
import { Basket } from "../basket.ts";
import { AttachSrc } from "../processing-steps/attach-src.ts";
import { MergeSetupCells } from "../processing-steps/merge-setup-cells.ts";
import { Pipeline } from "../processing-steps/pipeline.ts";
import { ReplacePlaceholders } from "../processing-steps/replace-placeholders.ts";
import { QmdDocument } from "../qmd-document.ts";
import { replacePlaceholders, studentFiles, Yaml } from "../utilities.ts";
import { Action, Placeholders } from "./action.ts";

export class QuartoFile extends Action {
  readonly title?: string;
  readonly subtitle?: string;
  readonly process: string[];

  constructor(settings: Yaml) {
    super(settings);
    this.title = settings.title as string | undefined;
    this.subtitle = settings.subtitle as string | undefined;
    this.process = (settings.process ?? []) as string[];
  }

  file(placeholders: Placeholders): string {
    const zipped = this.process.includes("zip");
    const extension = zipped ? "zip" : this.process.includes("jupyter") ? "ipynb" : "qmd";
    return `${replacePlaceholders(this.name, placeholders)}.${extension}`;
  }

  run(basket: Basket, placeholders: Placeholders, folder: string): void {
    const pipeline = new Pipeline();
    pipeline.addStep(new ReplacePlaceholders(placeholders));
    pipeline.addStep(new MergeSetupCells());
    for (const step of this.process) {
      pipeline.addStep(step === "attach-src" ? new AttachSrc(basket.files("src/*", { absolute: true })) : step);
    }
    const doc = pipeline.run(QmdDocument.read(...basket.files("*.qmd", { absolute: true })));

    const header = { ...doc.header };
    if (this.title !== undefined) header.title = replacePlaceholders(this.title, placeholders);
    if (this.subtitle !== undefined) header.subtitle = replacePlaceholders(this.subtitle, placeholders);
    const path = join(folder, replacePlaceholders(this.name, placeholders));
    ensureDirSync(dirname(path));
    new QmdDocument(header, doc.nodes, doc.output).write(path);
    copyImages(doc, basket, dirname(path));
    // Work files never get `src/`: it holds the code of the solution
    const workFiles = this.process.includes("exercise-scaffold");
    for (const [filePath, source] of folderFiles(basket)) {
      if (!(workFiles && filePath.startsWith("src/"))) copyChecked(source, dirname(path), filePath);
    }
  }
}

// Images referenced with a relative path, e.g. `![](images/sequence.svg)`, copied next to the written file
function copyImages(doc: QmdDocument, basket: Basket, folder: string): void {
  for (const [, image] of doc.text().matchAll(/!\[[^\]]*\]\(([^)\s]+)/g)) {
    if (!image.includes("://") && !image.startsWith("/")) {
      const source = basket.ingredients.map((ingredient) => ingredient.absolutePath(image)).find((path) => existsSync(path));
      if (source === undefined) throw new Error(`Image not found: ${image}`);
      copyChecked(source, folder, image);
    }
  }
}

// The files in the folders of every ingredient as pairs (e.g. `data/fibonacci.csv`, absolute path), copied next to
// the written file so code like `read.csv("data/…")` runs there; not the files directly in the ingredient folder.
// Pairs, not a record: two ingredients may have a file with the same path
function folderFiles(basket: Basket): [string, string][] {
  return basket.ingredients.flatMap((ingredient) => {
    const root = ingredient.absolutePath();
    const paths = studentFiles(root).map((source): [string, string] => [relative(root, source), source]);
    return paths.filter(([path]) => dirname(path) !== ".");
  });
}

// `path` relative to `folder`; error if a different file with the same name is already there
function copyChecked(source: string, folder: string, path: string): void {
  const target = join(folder, path);
  if (existsSync(target) && !sameContent(source, target)) {
    throw new Error(`Different files with the same name: ${path}`);
  }
  ensureDirSync(dirname(target));
  copySync(source, target, { overwrite: true });
}

function sameContent(a: string, b: string): boolean {
  const bytesA = Deno.readFileSync(a);
  const bytesB = Deno.readFileSync(b);
  return bytesA.length === bytesB.length && bytesA.every((byte, i) => byte === bytesB[i]);
}
