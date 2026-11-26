import { QmdDocument } from "../qmd-document.ts";
import { QmdCodeCell, QmdNode } from "../qmd-node.ts";
import { ProcessingStep } from "./processing-step.ts";

export class ExerciseSolution implements ProcessingStep {
  run(doc: QmdDocument): QmdDocument {
    return new QmdDocument(doc.header, solution(doc.nodes)).tidy();
  }
}

function solution(nodes: QmdNode[]): QmdNode[] {
  return nodes.flatMap((node): QmdNode[] => {
    if (node.isExercise()) return [node.withChildren(inExercise(node.children))];
    if (node.isExecutable()) return [hidden(node)];
    if (node.hasClass("lm-solution")) return [node];
    if (node.isText()) return [node.blankLines()];
    return [];
  });
}

function inExercise(nodes: QmdNode[]): QmdNode[] {
  return nodes.flatMap((node): QmdNode[] => {
    if (node.isText()) return [node.headings()];
    if (node.isExecutable()) return [hidden(node)];
    if (node.hasClass("lm-solution")) return [node];
    return [];
  });
}

// Given code: the students have it, the solution needs it to run
function hidden(cell: QmdCodeCell): QmdCodeCell {
  if ("include" in cell.options) return cell;
  const [fence, ...rest] = cell.lines;
  const lines = [fence, "#| include: false", ...rest];
  return new QmdCodeCell(lines, cell.language, cell.executable);
}
