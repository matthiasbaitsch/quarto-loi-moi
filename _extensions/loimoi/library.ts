// Data model of the library (DESIGN, section "Data structure").

import { expandGlobSync } from "jsr:@std/fs@1";
import { join, relative, resolve } from "jsr:@std/path@1";
import { readAbout, stripNumber, subfolders } from "./utilities.ts";

// Content of an about.yml, as read; the keys are not checked.
export type About = Record<string, unknown>;

// Base class of everything in the library: a folder below bausteine/.
export class Item {
  constructor(
    readonly root: string, // the folder bausteine/
    readonly path: string, // relative to root, e.g. "01-bohrpfahl/01-grundlagen/aufgaben"
  ) {}

  // The folder name without leading number, e.g. "grundlagen". With full: true the path without numbers, e.g.
  // "bohrpfahl/grundlagen"; separator: "-" gives "bohrpfahl-grundlagen" for file names.
  name(options: { full?: boolean; separator?: string } = {}): string {
    const parts = this.path.split("/").map(stripNumber);
    if (!options.full) return parts[parts.length - 1];
    return parts.join(options.separator ?? "/");
  }

  // The full path of a file in the folder of the item; without file the folder itself.
  fullPath(file = ""): string {
    return join(this.root, this.path, file);
  }

  // The files matching a glob pattern, relative to the item and sorted by name, e.g. files("*.qmd").
  // With full: true the full paths.
  files(pattern: string, options: { full?: boolean } = {}): string[] {
    const folder = this.fullPath();
    const files = [];
    for (const entry of expandGlobSync(pattern, { root: folder, includeDirs: false })) {
      files.push(relative(folder, entry.path));
    }
    files.sort();
    if (!options.full) return files;
    return files.map((file) => this.fullPath(file));
  }
}

// An item with an about.yml: group or building block.
export class DescribedItem extends Item {
  constructor(root: string, path: string, readonly about: About) {
    super(root, path);
  }

  // The title from about.yml, or undefined if there is none.
  title(): string | undefined {
    return typeof this.about.title === "string" ? this.about.title : undefined;
  }
}

// Related building blocks; path "" if bausteine/ itself is the group.
export class Group extends DescribedItem {
  constructor(root: string, path: string, about: About, readonly blocks: BuildingBlock[]) {
    super(root, path, about);
  }
}

// Material on one topic.
export class BuildingBlock extends DescribedItem {
  constructor(root: string, path: string, about: About, readonly ingredients: Ingredient[]) {
    super(root, path, about);
  }
}

// The part of a building block for one kind of product, e.g. its exercises.
export class Ingredient extends Item {}

// All material maintained by the teacher.
export class Library {
  constructor(readonly root: string, readonly groups: Group[]) {}

  // Reads the library in folder (bausteine/). ingredientNames are the names of the ingredient folders, e.g.
  // ["aufgaben", "folien", "skript"]; a folder with at least one of them is a building block.
  static read(folder: string, ingredientNames: string[]): Library {
    const root = resolve(folder); // absolute, e.g. for changing into the folder of an exercise

    // Ingredients of the folder path, empty if it is no building block.
    function ingredients(path: string): Ingredient[] {
      return subfolders(join(root, path))
        .filter((name) => ingredientNames.includes(name))
        .map((name) => new Ingredient(root, join(path, name)));
    }

    // The building blocks in the folder path.
    function blocks(path: string): BuildingBlock[] {
      return subfolders(join(root, path)).map((name) => {
        const blockPath = join(path, name);
        return new BuildingBlock(root, blockPath, readAbout(join(root, blockPath)), ingredients(blockPath));
      });
    }

    const names = subfolders(root);
    // bausteine/ contains building blocks (then it is the group) or groups.
    if (names.some((name) => ingredients(name).length > 0)) {
      return new Library(root, [new Group(root, "", readAbout(root), blocks(""))]);
    }
    return new Library(root, names.map((name) => new Group(root, name, readAbout(join(root, name)), blocks(name))));
  }
}
