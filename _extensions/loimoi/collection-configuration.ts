import { basename, dirname, join } from "@std/path";
import { BuildingBlockTree } from "./building-block-tree.ts";
import { ProductConfiguration } from "./product-configuration.ts";
import { Recipe } from "./recipe.ts";
import { configFile, gitHubPages, mergeYamlAlongPath, readYaml, Yaml } from "./utilities.ts";

export class CollectionConfiguration {
  private readonly collectionFolder: string;

  private readonly mappings: Yaml;
  private readonly settings: Yaml;

  private readonly firstNumber: number;
  private readonly outputFolderName: string;
  private readonly tree: BuildingBlockTree;

  constructor(collectionFolder: string, tree: BuildingBlockTree) {
    this.collectionFolder = collectionFolder;
    this.mappings = readYaml(configFile("mappings.yml", this.learningMaterialFolder()));
    this.settings = mergeYamlAlongPath(this.learningMaterialFolder(), this.collectionFolderName(), "loimoi.yml");
    this.firstNumber = (this.settings["first-number"] ?? 1) as number;
    this.outputFolderName = (this.settings.output ?? "c") as string;
    this.tree = tree;
  }

  outputFolder(): string {
    return join(this.collectionFolder, this.outputFolderName);
  }

  site(): string | undefined {
    return (this.settings.site as string | undefined) ?? gitHubPages(this.collectionFolder);
  }

  recipe(): Recipe {
    const file = configFile(`recipes/${this.recipeName()}.yml`, this.learningMaterialFolder());
    const options = (this.settings.options ?? {}) as Record<string, string>;
    return Recipe.read(file, options, this.outputFolder());
  }

  productConfigurations(): ProductConfiguration[] {
    const entries = this.productEntries();
    return entries.map((entry, i) => new ProductConfiguration(entry, this.firstNumber + i, this.tree));
  }

  private productEntries(): Yaml[] {
    if (this.settings.products !== undefined) {
      return this.settings.products as Yaml[];
    } else {
      const paths = this.tree.defaultPaths(this.ingredientFolderName());
      return paths.map((ingredients) => ({ ingredients }));
    }
  }

  private ingredientFolderName(): string {
    const mappings = (this.mappings["ingredient-folders"] ?? {}) as Record<string, Record<string, string>>;
    const name = mappings[this.recipeName()]?.[this.collectionFolderName()];
    if (name === undefined) {
      throw new Error(`No ingredient folder for collection ${this.collectionFolderName()} in mappings.yml`);
    }
    return name;
  }

  private collectionFolderName(): string {
    return basename(this.collectionFolder);
  }

  private learningMaterialFolder(): string {
    return dirname(this.collectionFolder);
  }

  private recipeName(): string {
    const collectionRecipes = (this.mappings["collection-recipes"] ?? {}) as Record<string, string>;
    const name = (this.settings.recipe as string | undefined) ?? collectionRecipes[this.collectionFolderName()];
    if (name === undefined) throw new Error(`No recipe for collection ${this.collectionFolderName()} in mappings.yml`);
    return name;
  }
}
