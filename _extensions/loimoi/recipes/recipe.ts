// A recipe makes one product from its ingredients (DESIGN, section "Recipes").
export interface Recipe {
  // Writes the product into folder.
  run(folder: string): void;
}
