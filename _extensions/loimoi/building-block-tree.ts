import { dirname, relative } from "jsr:@std/path@1";
import { walkSync } from "jsr:@std/fs@1";
import { Basket } from "./basket.ts";
import { BuildingBlock } from "./building-block.ts";
import { Folder } from "./folder.ts";

export class BuildingBlockTree {
  readonly rootFolder: string;

  constructor(rootFolder: string) {
    this.rootFolder = rootFolder;
  }

  ingredients(paths: string[]): Basket {
    const ingredients = paths.map((path) => new Folder(this.rootFolder, path));
    const blocks = paths.map((path) => new BuildingBlock(this.rootFolder, dirname(path)));
    return new Basket(blocks, ingredients);
  }

  // The building blocks with an ingredient folder `ingredientFolder`, in folder order
  defaultBlocks(ingredientFolder: string): string[] {
    const hidden = /\/[_.][^/]*$/; // last part of the path starts with `_` or `.`
    const blocks: string[] = [];
    for (const folder of walkSync(this.rootFolder, { includeFiles: false, skip: [hidden] })) {
      if (folder.name === ingredientFolder) blocks.push(relative(this.rootFolder, dirname(folder.path)));
    }
    return blocks.sort();
  }
}
