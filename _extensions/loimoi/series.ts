// A series of products, e.g. the exercise sheets (DESIGN, section "Recipes").
// For now: one exercise sheet per building block with aufgaben/, in library order.

import { join } from "jsr:@std/path@1";
import { Library } from "./library.ts";
import { ExerciseSheet } from "./recipes/exercise-sheet.ts";
import { Recipe } from "./recipes/recipe.ts";

export class Series {
  constructor(
    readonly library: Library,
    readonly name: string, // the folder of the series in lernpfad/ and the ingredient it takes, e.g. "aufgaben"
  ) {}

  // One recipe per product, numbered from 1.
  products(): Recipe[] {
    const products: Recipe[] = [];
    for (const group of this.library.groups) {
      for (const block of group.blocks) {
        const ingredient = block.ingredients.find((ingredient) => ingredient.name() === this.name);
        if (ingredient !== undefined) {
          products.push(new ExerciseSheet([ingredient], products.length + 1, group.title(), block.title()));
        }
      }
    }
    return products;
  }

  // Writes all products into lernpfad/aufgaben/<output>/ (site: the URL of the published site, whose root is
  // lernpfad/). The files generated before are removed first; they are listed in .loimoi-generated. Other files in
  // the folder stay.
  run(lernpfad: string, output: string, site?: string): void {
    const folder = join(lernpfad, this.name, output);
    const url = site === undefined ? undefined : `${site}/${this.name}/${output}`;
    Deno.mkdirSync(folder, { recursive: true });
    const list = join(folder, ".loimoi-generated");
    removeGenerated(folder, list);
    const files = this.products().flatMap((product) => product.run(folder, url, site));
    Deno.writeTextFileSync(list, files.join("\n") + "\n");
  }
}

// Removes the files in the list, and for a .qmd also what Quarto rendered from it (.html, .pdf, _files/).
function removeGenerated(folder: string, list: string) {
  const names = readLines(list).flatMap((name) => {
    const stem = name.replace(/\.qmd$/, "");
    return name.endsWith(".qmd") ? [name, `${stem}.html`, `${stem}.pdf`, `${stem}_files`] : [name];
  });
  for (const name of names) removeIfThere(join(folder, name));
}

// The non-empty lines of a file, or none if it does not exist.
function readLines(file: string): string[] {
  try {
    return Deno.readTextFileSync(file).split("\n").filter((line) => line !== "");
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return [];
    throw error;
  }
}

function removeIfThere(path: string) {
  try {
    Deno.removeSync(path, { recursive: true });
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) throw error;
  }
}
