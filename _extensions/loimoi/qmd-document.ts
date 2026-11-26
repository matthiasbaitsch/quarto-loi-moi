import { stringify as stringifyYaml } from "jsr:@std/yaml@1";
import { jupyterNotebook } from "./jupyter-notebook.ts";
import { isBlank, QmdCodeCell, QmdNode, QmdText } from "./qmd-node.ts";
import { parseBody, splitHeader } from "./qmd-parser.ts";
import { Yaml } from "./utilities.ts";

export class QmdDocument {
  readonly header: Yaml;
  readonly nodes: QmdNode[];

  constructor(header: Yaml, nodes: QmdNode[]) {
    this.header = header;
    this.nodes = nodes;
  }

  static read(...files: string[]): QmdDocument {
    const header: Yaml = {};
    const bodies: string[] = [];
    for (const file of files) {
      const parts = splitHeader(Deno.readTextFileSync(file));
      for (const [key, value] of Object.entries(parts.header)) {
        const clash = key in header && JSON.stringify(header[key]) !== JSON.stringify(value);
        if (clash) throw new Error(`Header value ${key} in ${file} clashes with a previous file`);
        header[key] = value;
      }
      bodies.push(parts.body.replace(/\n+$/, ""));
    }
    // A blank line between the files: a fence right after a paragraph would belong to the paragraph
    return new QmdDocument(header, parseBody(bodies.join("\n\n") + "\n"));
  }

  body(): string {
    return this.nodes.map((node) => node.text()).join("\n");
  }

  text(): string {
    if (Object.keys(this.header).length === 0) return this.body();
    return `---\n${stringifyYaml(this.header)}---\n\n${this.body()}`;
  }

  ipynb(): string {
    return JSON.stringify(jupyterNotebook(this.header, this.nodes), null, 1);
  }

  forEach(f: (node: QmdNode) => void): void {
    this.nodes.forEach((node) => node.forEach(f));
  }

  // Setup cells at top level, as they go into every document; merged line by line
  validate(): void {
    this.nodes.forEach((node) => {
      if (node.isSetup()) checkSingleLines(node);
      if (node.isDiv()) {
        node.forEach((inner) => {
          if (inner.isSetup()) throw new Error(`Setup cell inside ${node.open}, it belongs at the top level`);
        });
      }
    });
  }

  // Removing parts leaves blank lines behind: neighbouring texts joined, runs of blank lines reduced to one,
  // no blank lines at the start, none before the end of a div
  tidy(): QmdDocument {
    return new QmdDocument(this.header, tidy(this.nodes));
  }

  appendNode(node: QmdNode): QmdDocument {
    return new QmdDocument(this.header, [...this.nodes, node]);
  }

  map(f: (node: QmdNode) => QmdNode[]): QmdDocument {
    return new QmdDocument(this.header, this.nodes.flatMap((node) => node.map(f)));
  }

  // A Jupyter notebook for `.ipynb`, otherwise Quarto
  write(file: string): void {
    Deno.writeTextFileSync(file, file.endsWith(".ipynb") ? this.ipynb() : this.text());
  }
}

// Merging keeps each line once, which is only right for single-line statements; indented lines and lines that only
// close something (`end`, `)`, …) are a sign of a statement over several lines
function checkSingleLines(cell: QmdCodeCell): void {
  const code = cell.lines.slice(1, -1);
  const multiLine = code.find((line) => /^\s+\S/.test(line) || /^\s*(end|\)|\]|\})\s*$/.test(line));
  if (multiLine !== undefined) {
    throw new Error(`Setup cell: only single-line statements allowed: \`${multiLine}\``);
  }
}

function tidy(nodes: QmdNode[]): QmdNode[] {
  const joined: QmdNode[] = [];
  for (const node of nodes) {
    const last = joined.at(-1);
    if (node.isText() && last?.isText()) {
      joined[joined.length - 1] = new QmdText([...last.lines, ...node.lines]);
    } else if (node.isDiv()) {
      joined.push(node.withChildren(withoutTrailingBlankLines(tidy(node.children))));
    } else {
      joined.push(node);
    }
  }
  const tidied = joined.map((node) => node.isText() ? new QmdText(singleBlankLines(node.lines)) : node);
  return withoutLeadingBlankLines(tidied);
}

function singleBlankLines(lines: string[]): string[] {
  return lines.filter((line, i) => !isBlank(line) || i === 0 || !isBlank(lines[i - 1]));
}

function withoutLeadingBlankLines(nodes: QmdNode[]): QmdNode[] {
  const first = nodes[0];
  if (!first?.isText()) return nodes;
  const lines = [...first.lines];
  while (lines.length > 0 && isBlank(lines[0])) lines.shift();
  const rest = nodes.slice(1);
  return lines.length === 0 ? rest : [new QmdText(lines), ...rest];
}

function withoutTrailingBlankLines(nodes: QmdNode[]): QmdNode[] {
  const last = nodes.at(-1);
  if (!last?.isText()) return nodes;
  const lines = [...last.lines];
  while (lines.length > 0 && isBlank(lines.at(-1)!)) lines.pop();
  const rest = nodes.slice(0, -1);
  return lines.length === 0 ? rest : [...rest, new QmdText(lines)];
}
