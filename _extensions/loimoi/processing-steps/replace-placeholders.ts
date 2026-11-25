import { parse as parseYaml, stringify as stringifyYaml } from "jsr:@std/yaml@1";
import { QmdDocument } from "../qmd-document.ts";
import { QmdCodeCell, QmdDiv, QmdNode, QmdText } from "../qmd-node.ts";
import { cellOptions } from "../qmd-parser.ts";
import { replacePlaceholders, Yaml } from "../utilities.ts";
import { ProcessingStep } from "./processing-step.ts";

// In the header and in every node, also in ids, classes and cell options
export class ReplacePlaceholders implements ProcessingStep {
  readonly values: Record<string, string>;

  constructor(values: Record<string, string>) {
    this.values = values;
  }

  run(doc: QmdDocument): QmdDocument {
    const replace = (text: string) => replacePlaceholders(text, this.values);
    const header = (parseYaml(replace(stringifyYaml(doc.header))) ?? {}) as Yaml;
    return new QmdDocument(header, doc.map((node) => [replaced(node, replace)]).nodes);
  }
}

function replaced(node: QmdNode, replace: (text: string) => string): QmdNode {
  if (node instanceof QmdText) return new QmdText(node.lines.map(replace));
  if (node instanceof QmdCodeCell) {
    const lines = node.lines.map(replace);
    return new QmdCodeCell(lines, node.language, node.executable, cellOptions(lines));
  }
  if (node instanceof QmdDiv) {
    const classes = node.classes.map(replace);
    return new QmdDiv(replace(node.open), replace(node.close), replace(node.id), classes, node.children);
  }
  return node;
}
