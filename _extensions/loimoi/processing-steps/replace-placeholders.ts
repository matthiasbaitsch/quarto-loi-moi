import { QmdDocument } from "../qmd-document.ts";
import { replacePlaceholders } from "../utilities.ts";
import { ProcessingStep } from "./processing-step.ts";

export class ReplacePlaceholders implements ProcessingStep {
  readonly values: Record<string, string>;

  constructor(values: Record<string, string>) {
    this.values = values;
  }

  // Parsed again, so that ids, classes and cell options with placeholders are right
  run(doc: QmdDocument): QmdDocument {
    const text = replacePlaceholders(doc.text(), this.values);
    const parsed = QmdDocument.parse(text);
    return new QmdDocument(parsed.header, parsed.nodes, { ...doc.output });
  }
}
