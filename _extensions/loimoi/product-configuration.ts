import { createHash } from "node:crypto";
import { Placeholders } from "./actions/action.ts";
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

  // Without `group-title` and `site` if they are missing, so `${site}` stays visible in the output
  placeholders(site?: string): Placeholders {
    const nnName = `${String(this.number).padStart(2, "0")}-${this.name}`;
    const values: Placeholders = {
      "n": String(this.number),
      "name": this.name,
      "nn-name": nnName,
      "hash": createHash("sha1").update(`87362-${nnName}`).digest("hex").slice(0, 8),
      "product-title": this.title,
    };
    if (this.groupTitle !== undefined) values["group-title"] = this.groupTitle;
    if (site !== undefined) values["site"] = site;
    return values;
  }
}
