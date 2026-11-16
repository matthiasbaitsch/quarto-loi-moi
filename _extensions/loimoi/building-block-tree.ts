import { dirname, relative } from "@std/path";
import { walkSync } from "@std/fs";
import { Basket } from "./basket.ts";
import { BuildingBlock } from "./building-block.ts";
import { Folder } from "./folder.ts";

export class BuildingBlockTree {
  
  constructor(readonly root: string) {}

  ingredients(paths: string[]): Basket {
    const ingredients = paths.map((path) => new Folder(this.root, path));
    const blocks = paths.map((path) => new BuildingBlock(this.root, dirname(path)));
    return new Basket(blocks, ingredients);
  }

  defaultPaths(folderName: string): string[][] {
    const hidden = /\/[_.][^/]*$/; // last part of the path starts with `_` or `.`
    const paths: string[] = [];
    for (const folder of walkSync(this.root, { includeFiles: false, skip: [hidden] })) {
      if (folder.name === folderName) paths.push(relative(this.root, folder.path));
    }
    return paths.sort().map((path) => [path]);
  }
}
