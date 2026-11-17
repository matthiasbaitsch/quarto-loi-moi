import { QmdDocument } from "../qmd-document.ts";
import { removeLmStep } from "../utilities.ts";
import { ProcessingStep } from "./processing-step.ts";

export class RemoveLmStep implements ProcessingStep {
  run(doc: QmdDocument): QmdDocument {
    const parsed = QmdDocument.parse(removeLmStep(doc.text()));
    return new QmdDocument(parsed.header, parsed.nodes, { ...doc.output });
  }
}
