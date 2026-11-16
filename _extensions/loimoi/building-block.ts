import { Folder } from "./folder.ts";
import { mergeYamlAlongPath } from "./utilities.ts";

export class BuildingBlock extends Folder {
  
  readonly title?: string;
  readonly groupTitle?: string;

  constructor(root: string, path: string) {
    super(root, path);
    const about = mergeYamlAlongPath(root, path, "about.yml");
    this.title = about["block-title"] as string | undefined;
    this.groupTitle = about["group-title"] as string | undefined;
  }
}
