import { QmdDocument } from "../qmd-document.ts";
import { QmdNode } from "../qmd-node.ts";
import { ProcessingStep } from "./processing-step.ts";

export class ExerciseSheet implements ProcessingStep {
  run(doc: QmdDocument): QmdDocument {
    return new QmdDocument(doc.header, sheet(doc.nodes)).tidy();
  }
}

function sheet(nodes: QmdNode[]): QmdNode[] {
  return nodes.flatMap((node): QmdNode[] => {
    if (node.hasClass("lm-sheet")) return [node];
    if (node.hasClass("lm-solution") || node.hasClass("lm-scaffold")) return [];
    if (node.isDiv()) return [node.withChildren(sheet(node.children))];
    if (node.isExecutable() && !node.isSetup()) return [];
    return [node];
  });
}
