import { join, relative } from "@std/path";
import { existsSync, expandGlobSync } from "@std/fs";

export interface NameOptions {
  // Use full path or folder name only
  full?: boolean;
  // Seperator
  sep?: string;
}

export interface PathOptions {
  absolute?: boolean;
}

export class Folder {

  constructor(
    readonly root: string, 
    readonly path: string
  ) {
    if (!existsSync(this.fullPath())) throw new Error(`Folder not found: ${path}`);
  }

  fullPath(file = ""): string {
    return join(this.root, this.path, file);
  }

  name({ full = true, sep = "-" }: NameOptions = {}): string {
    const parts = this.path.split("/").map((part) => part.replace(/^\d+-/, ""));
    const used = full ? parts : parts.slice(-1);
    return used.join(sep);
  }

  files(pattern: string, options: PathOptions = {}): string[] {
    return this.find(pattern, false, options);
  }

  folders(pattern: string, options: PathOptions = {}): string[] {
    return this.find(pattern, true, options);
  }

  private find(pattern: string, directories: boolean, { absolute = false }: PathOptions): string[] {
    const paths: string[] = [];
    for (const entry of expandGlobSync(pattern, { root: this.fullPath() })) {
      const path = absolute ? entry.path : relative(this.root, entry.path);
      if (entry.isDirectory === directories) paths.push(path);
    }
    return paths.sort();
  }
}
