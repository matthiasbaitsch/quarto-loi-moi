// Recipe for one exercise sheet with work files and solution (SPEC, section "Exercise sheets").

import { join } from "@std/path";
import { Ingredient } from "../library.ts";
import { CodeCell, Div, Node, QmdDocument } from "../qmd-document.ts";
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
    const text = forSheet(document.nodes).map((node) => node.text()).join("\n");
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
