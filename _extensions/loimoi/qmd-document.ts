// Document model of a Quarto Markdown file: text, divs and code cells, each with its original lines
// (DESIGN, section "Document model"). Knows nothing about exercises.

import { parse as parseYaml } from "jsr:@std/yaml@1";

// A part of the document with its original lines.
export abstract class Node {
  abstract text(): string;
}

// Lines between divs and code cells.
export class Text extends Node {
  constructor(readonly lines: string[]) {
    super();
  }

  text(): string {
    return this.lines.join("\n");
  }
}

// A code cell: ```{r} is executable, ```{.r} is only shown. options are the #| lines.
export class CodeCell extends Node {
  constructor(
    readonly lines: string[],
    readonly language: string,
    readonly executable: boolean,
    readonly options: Record<string, unknown>,
  ) {
    super();
  }

  text(): string {
    return this.lines.join("\n");
  }
}

// A div ::: {#id .class}, with the fence lines and the nodes in between.
export class Div extends Node {
  constructor(
    readonly open: string, // e.g. "::: {#exr-a}"
    readonly close: string, // ":::"
    readonly id: string,
    readonly classes: string[],
    readonly children: Node[],
  ) {
    super();
  }

  text(): string {
    return [this.open, ...this.children.map((child) => child.text()), this.close].join("\n");
  }
}

export class QmdDocument {
  constructor(readonly nodes: Node[]) {}

  // The whole document, as read.
  text(): string {
    return this.nodes.map((node) => node.text()).join("\n");
  }

  // Reads a document. Pandoc finds divs and code cells with their line ranges; the lines are cut from the text.
  static parse(text: string): QmdDocument {
    const lines = text.split("\n");
    return new QmdDocument(nodes(lines, 0, lines.length, blocks(pandoc(text))));
  }
}

// ---------------------------------------------------------------------------------------------------------------
// Divs and code cells from Pandoc

// A div or code cell found by Pandoc: lines from (first) to (end, exclusive), counted from 0.
interface Block {
  kind: "div" | "code";
  first: number;
  end: number;
  id: string;
  classes: string[];
  children: Block[]; // only divs
}

// Pandoc's JSON of a document, with the line range of every block in the attribute data-pos.
function pandoc(text: string): PandocBlock[] {
  const file = Deno.makeTempFileSync({ suffix: ".md" });
  Deno.writeTextFileSync(file, text);
  const output = new Deno.Command("quarto", {
    args: ["pandoc", "-f", "commonmark_x+sourcepos", "-t", "json", file],
  }).outputSync();
  Deno.removeSync(file);
  if (!output.success) throw new Error(`pandoc failed: ${new TextDecoder().decode(output.stderr)}`);
  return JSON.parse(new TextDecoder().decode(output.stdout)).blocks;
}

// A block in Pandoc's JSON, e.g. { t: "Div", c: [[id, classes, attributes], blocks] }.
interface PandocBlock {
  t: string;
  c: unknown;
}

type PandocAttr = [string, string[], [string, string][]];

// The divs and code cells among Pandoc's blocks. Divs without id and class are Pandoc's own wrappers for the
// positions; their content counts as if it stood outside.
function blocks(pandocBlocks: PandocBlock[]): Block[] {
  return pandocBlocks.flatMap((block): Block[] => {
    if (block.t === "CodeBlock") {
      const [attr] = block.c as [PandocAttr, string];
      return [{ kind: "code", ...range(attr), id: attr[0], classes: attr[1], children: [] }];
    }
    if (block.t === "Div") {
      const [attr, content] = block.c as [PandocAttr, PandocBlock[]];
      const children = blocks(content);
      if (attr[0] === "" && attr[1].length === 0) return children; // wrapper
      return [{ kind: "div", ...range(attr), id: attr[0], classes: attr[1], children }];
    }
    return [];
  });
}

// The line range from data-pos, e.g. "file.md@10:1-44:1" → first 9, end 43 (counted from 0, end exclusive).
function range(attr: PandocAttr): { first: number; end: number } {
  const position = attr[2].find(([key]) => key === "data-pos")?.[1] ?? "";
  const match = position.match(/@(\d+):\d+-(\d+):\d+$/);
  if (match === null) throw new Error(`no position: ${position}`);
  return { first: Number(match[1]) - 1, end: Number(match[2]) - 1 };
}

// ---------------------------------------------------------------------------------------------------------------
// Nodes from the lines

// The nodes for the lines from first to end: the blocks, and text in between.
function nodes(lines: string[], first: number, end: number, found: Block[]): Node[] {
  const result: Node[] = [];
  let line = first;
  for (const block of found) {
    if (block.first > line) result.push(new Text(lines.slice(line, block.first)));
    result.push(node(lines, block));
    line = block.end;
  }
  if (end > line) result.push(new Text(lines.slice(line, end)));
  return result;
}

// The node for a block.
function node(lines: string[], block: Block): Node {
  if (block.kind === "div") {
    const close = block.end - 1;
    return new Div(
      lines[block.first],
      lines[close],
      block.id,
      block.classes,
      nodes(lines, block.first + 1, close, block.children),
    );
  }
  const cellLines = lines.slice(block.first, block.end);
  const info = block.classes[0] ?? ""; // "{r}" for an executable cell, "r" for ```{.r}
  const executable = info.startsWith("{");
  const language = info.replace(/[{}]/g, "");
  return new CodeCell(cellLines, language, executable, options(cellLines));
}

// The #| options of a code cell, e.g. { label: "setup" }.
function options(cellLines: string[]): Record<string, unknown> {
  const yaml = cellLines.filter((line) => line.startsWith("#|")).map((line) => line.slice(2).trim()).join("\n");
  return (parseYaml(yaml) ?? {}) as Record<string, unknown>;
}
