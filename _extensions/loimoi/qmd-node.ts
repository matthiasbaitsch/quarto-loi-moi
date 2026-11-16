import { Yaml } from "./utilities.ts";

export abstract class QmdNode {
  abstract text(): string;

  map(f: (node: QmdNode) => QmdNode[]): QmdNode[] {
    return f(this);
  }
}

export class QmdText extends QmdNode {
  constructor(readonly lines: string[]) {
    super();
  }

  text(): string {
    return this.lines.join("\n");
  }
}

export class QmdCodeCell extends QmdNode {
  constructor(
    readonly lines: string[],
    readonly language: string,
    readonly executable: boolean,
    readonly options: Yaml,
  ) {
    super();
  }

  text(): string {
    return this.lines.join("\n");
  }
}

export class QmdDiv extends QmdNode {
  constructor(
    readonly open: string,
    readonly close: string,
    readonly id: string,
    readonly classes: string[],
    readonly children: QmdNode[],
  ) {
    super();
  }

  text(): string {
    return [this.open, ...this.children.map((child) => child.text()), this.close].join("\n");
  }

  override map(f: (node: QmdNode) => QmdNode[]): QmdNode[] {
    const children = this.children.flatMap((child) => child.map(f));
    return f(new QmdDiv(this.open, this.close, this.id, this.classes, children));
  }
}
