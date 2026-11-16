import { QmdDocument } from "../qmd-document.ts";
import { ProcessingStep } from "./processing-step.ts";

export class Zip implements ProcessingStep {
  run(doc: QmdDocument): QmdDocument {
    return new QmdDocument(doc.header, doc.nodes, { ...doc.output, zip: true });
  }
}
