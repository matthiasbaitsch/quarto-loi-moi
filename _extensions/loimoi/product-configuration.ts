import { BuildingBlockTree } from "./building-block-tree.ts";
import { Yaml } from "./utilities.ts";

export class ProductConfiguration {
  readonly number: number;
  readonly name: string;
  readonly title: string;
  readonly groupTitle?: string;
  readonly ingredients: string[];

  // `entry`: an entry of `products` in `loimoi.yml`; name and titles not given come from the first building block
  constructor(entry: Yaml, number: number, tree: BuildingBlockTree) {
    this.number = number;
    this.ingredients = entry.ingredients as string[];
    const basket = tree.ingredients(this.ingredients);
    this.name = (entry.name as string | undefined) ?? basket.name();
    const title = (entry["product-title"] as string | undefined) ?? basket.title();
    if (title === undefined) {
      throw new Error(`No title for product ${this.name}: set product-title in loimoi.yml or block-title in about.yml`);
    }
    this.title = title;
    this.groupTitle = (entry["group-title"] as string | undefined) ?? basket.groupTitle();
  }
}
