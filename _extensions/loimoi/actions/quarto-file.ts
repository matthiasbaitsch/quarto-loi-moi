import { copySync, ensureDirSync, existsSync } from "@std/fs";
import { dirname, join } from "@std/path";
import { Basket } from "../basket.ts";
import { AttachSrc } from "../processing-steps/attach-src.ts";
import { MergeSetupCells } from "../processing-steps/merge-setup-cells.ts";
import { Pipeline } from "../processing-steps/pipeline.ts";
import { ReplacePlaceholders } from "../processing-steps/replace-placeholders.ts";
import { QmdDocument } from "../qmd-document.ts";
import { replacePlaceholders, Yaml } from "../utilities.ts";
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
  }
}

// Images referenced with a relative path, e.g. `![](images/sequence.svg)`, copied next to the written file
function copyImages(doc: QmdDocument, basket: Basket, folder: string): void {
  for (const [, image] of doc.text().matchAll(/!\[[^\]]*\]\(([^)\s]+)/g)) {
    if (!image.includes("://") && !image.startsWith("/")) {
      const source = basket.ingredients.map((ingredient) => ingredient.fullPath(image)).find((path) => existsSync(path));
      if (source === undefined) throw new Error(`Image not found: ${image}`);
      const target = join(folder, image);
      if (existsSync(target) && !sameContent(source, target)) {
        throw new Error(`Different files with the same name: ${image}`);
      }
      ensureDirSync(dirname(target));
      copySync(source, target, { overwrite: true });
    }
  }
}

function sameContent(a: string, b: string): boolean {
  const bytesA = Deno.readFileSync(a);
  const bytesB = Deno.readFileSync(b);
  return bytesA.length === bytesB.length && bytesA.every((byte, i) => byte === bytesB[i]);
}
