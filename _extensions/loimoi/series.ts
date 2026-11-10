// A series of products, e.g. the exercise sheets (DESIGN, section "Recipes").
// For now: one exercise sheet per building block with aufgaben/, in library order.

import { Library } from "./library.ts";
import { ExerciseSheet } from "./recipes/exercise-sheet.ts";
import { Recipe } from "./recipes/recipe.ts";

export class Series {
  constructor(readonly library: Library) {}

  // One recipe per product, numbered from 1.
  products(): Recipe[] {
    const products: Recipe[] = [];
    for (const group of this.library.groups) {
      for (const block of group.blocks) {
        const ingredient = block.ingredients.find((ingredient) => ingredient.name() === "aufgaben");
        if (ingredient !== undefined) {
          products.push(new ExerciseSheet([ingredient], products.length + 1, group.title(), block.title()));
        }
      }
    }
    return products;
  }

  // Writes all products into folder.
  run(folder: string): void {
    for (const product of this.products()) product.run(folder);
  }
}
