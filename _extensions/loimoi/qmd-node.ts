import { parse as parseYaml } from "jsr:@std/yaml@1";
import { Yaml } from "./utilities.ts";

export abstract class QmdNode {
  abstract text(): string;

  // A new node with `f` applied to each line of text, also in the children; code cells stay as they are, as their
  // code may use `${…}` itself (shell, JavaScript)
  abstract transformText(f: (line: string) => string): QmdNode;

  map(f: (node: QmdNode) => QmdNode[]): QmdNode[] {
    return f(this);
  }

  forEach(f: (node: QmdNode) => void): void {
    f(this);
  }

  isText(): this is QmdText {
    return false;
  }

  isDiv(): this is QmdDiv {
    return false;
  }

  // An exercise is a div with an id `exr-…`
  isExercise(): this is QmdDiv {
    return false;
  }

  hasClass(_name: string): this is QmdDiv {
    return false;
  }

  isExecutable(): this is QmdCodeCell {
    return false;
  }

  isSetup(): this is QmdCodeCell {
    return false;
  }
}

export class QmdText extends QmdNode {
  readonly lines: string[];

  constructor(lines: string[]) {
    super();
    this.lines = lines;
  }

  text(): string {
    return this.lines.join("\n");
  }

  transformText(f: (line: string) => string): QmdNode {
    return new QmdText(this.lines.map(f));
  }

  override isText(): this is QmdText {
    return true;
  }

  // Text in an exercise reduced to its headings, the title and subheadings; blank lines keep the remaining parts
  // apart
  headings(): QmdText {
    return new QmdText(this.lines.filter((line) => line.startsWith("#") || isBlank(line)));
  }

  blankLines(): QmdText {
    return new QmdText(this.lines.filter(isBlank));
  }
}

export class QmdCodeCell extends QmdNode {
  readonly lines: string[];
  readonly language: string;
  readonly executable: boolean;

  constructor(lines: string[], language: string, executable: boolean) {
    super();
    this.lines = lines;
    this.language = language;
    this.executable = executable;
  }

  // From the `#|` lines
  get options(): Yaml {
    const options = this.lines.filter((line) => line.startsWith("#|")).map((line) => line.slice(2).trim());
    return (parseYaml(options.join("\n")) ?? {}) as Yaml;
  }

  text(): string {
    return this.lines.join("\n");
  }

  transformText(_f: (line: string) => string): QmdNode {
    return this;
  }

  override isExecutable(): this is QmdCodeCell {
    return this.executable;
  }

  override isSetup(): this is QmdCodeCell {
    return this.options.label === "setup";
  }
}

export class QmdDiv extends QmdNode {
  readonly open: string;
  readonly close: string;
  readonly id: string;
  readonly classes: string[];
  readonly children: QmdNode[];

  constructor(open: string, close: string, id: string, classes: string[], children: QmdNode[]) {
    super();
    this.open = open;
    this.close = close;
    this.id = id;
    this.classes = classes;
    this.children = children;
  }

  text(): string {
    return [this.open, ...this.children.map((child) => child.text()), this.close].join("\n");
  }

  // Only the children: the opening line holds fixed things (exercise id, markers, Quarto classes)
  transformText(f: (line: string) => string): QmdNode {
    return this.withChildren(this.children.map((child) => child.transformText(f)));
  }

  withChildren(children: QmdNode[]): QmdDiv {
    return new QmdDiv(this.open, this.close, this.id, this.classes, children);
  }

  override map(f: (node: QmdNode) => QmdNode[]): QmdNode[] {
    return f(this.withChildren(this.children.flatMap((child) => child.map(f))));
  }

  override forEach(f: (node: QmdNode) => void): void {
    this.children.forEach((child) => child.forEach(f));
    f(this);
  }

  override isDiv(): this is QmdDiv {
    return true;
  }

  override isExercise(): this is QmdDiv {
    return this.id.startsWith("exr-");
  }

  override hasClass(name: string): this is QmdDiv {
    return this.classes.includes(name);
  }
}

export function isBlank(line: string): boolean {
  return line.trim() === "";
}
