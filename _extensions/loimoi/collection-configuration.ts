import { existsSync } from "jsr:@std/fs@1";
import { basename, dirname, join } from "jsr:@std/path@1";
import { BuildingBlockTree } from "./building-block-tree.ts";
import { ProductNaming } from "./product-configuration.ts";
import { conventions, gitHubPages, mergeYamlAlongPath, readYaml, resolve, Yaml } from "./utilities.ts";

const settingsFile = new URL("./config/settings.yml", import.meta.url).pathname;

// The configuration of a collection: `loimoi.yml` merged along the path, every default filled in; all checks here
export class CollectionConfiguration {
  readonly output: string;
  readonly firstNumber: number;
  readonly fileName: string;
  readonly productNaming: ProductNaming;
  readonly options: Record<string, string>;
  readonly lang: string;
  readonly site: string;
  readonly buildingBlocksFolder: string;
  readonly recipe: string;
  readonly products: Yaml[];

  constructor(collectionFolder: string) {
    const learningMaterialFolder = dirname(collectionFolder);
    const name = basename(collectionFolder);
    const rules = conventions();
    const defaults = readYaml(settingsFile);
    const own = mergeYamlAlongPath(learningMaterialFolder, name, "loimoi.yml");

    const unknown = Object.keys(own).filter((key) => !(key in defaults));
    if (unknown.length > 0) throw new Error(`Unknown settings in loimoi.yml: ${unknown.join(", ")}`);

    const yaml = { ...defaults, ...own };

    this.output = yaml.output as string;
    this.firstNumber = yaml["first-number"] as number;
    this.fileName = yaml["file-name"] as string;
    this.options = yaml.options as Record<string, string>;

    this.productNaming = yaml["product-naming"] as ProductNaming;
    if (this.productNaming !== "path" && this.productNaming !== "titles") {
      throw new Error(`product-naming must be path or titles, not ${this.productNaming}`);
    }

    const languages = (rules["collection-languages"] ?? {}) as Record<string, string>;
    this.lang = (yaml.lang ?? languages[name] ?? "en") as string;

    this.site = (yaml.site ?? gitHubPages(collectionFolder) ?? "site-not-set") as string;

    if (yaml["building-blocks"] === null) {
      this.buildingBlocksFolder = resolve("building-blocks", collectionFolder);
    } else {
      this.buildingBlocksFolder = join(learningMaterialFolder, yaml["building-blocks"] as string);
      if (!existsSync(this.buildingBlocksFolder)) {
        throw new Error(`building-blocks in loimoi.yml: no folder ${this.buildingBlocksFolder}`);
      }
    }

    const recipes = (rules["collection-recipes"] ?? {}) as Record<string, string>;
    const recipe = (yaml.recipe as string | null) ?? recipes[name];
    if (recipe === undefined) throw new Error(`No recipe for collection ${name} in conventions.yml`);
    this.recipe = recipe;

    if (yaml.products !== null) {
      this.products = yaml.products as Yaml[];
    } else {
      const folders = (rules["ingredient-folders"] ?? {}) as Record<string, Record<string, string>>;
      const ingredientFolder = folders[recipe]?.[name];
      if (ingredientFolder === undefined) {
        throw new Error(`No ingredient folder for collection ${name} in conventions.yml`);
      }
      const paths = new BuildingBlockTree(this.buildingBlocksFolder).defaultPaths(ingredientFolder);
      this.products = paths.map((ingredients) => ({ ingredients }));
    }
  }
}
