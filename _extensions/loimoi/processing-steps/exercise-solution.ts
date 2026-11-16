import { QmdDocument } from "../qmd-document.ts";
import { QmdNode, QmdText } from "../qmd-node.ts";
import { blankLines, hasClass, headings, isExecutable, isExercise, tidy, withChildren } from "./exercise.ts";
import { ProcessingStep } from "./processing-step.ts";

export class ExerciseSolution implements ProcessingStep {
  run(doc: QmdDocument): QmdDocument {
    return new QmdDocument(doc.header, tidy(solution(doc.nodes)), { ...doc.output });
  }
}

function solution(nodes: QmdNode[]): QmdNode[] {
  return nodes.flatMap((node): QmdNode[] => {
    if (isExercise(node)) return [withChildren(node, inExercise(node.children))];
    if (isExecutable(node)) return [node];
    if (node instanceof QmdText) return [blankLines(node)];
    return [];
  });
}

function inExercise(nodes: QmdNode[]): QmdNode[] {
  return nodes.flatMap((node): QmdNode[] => {
    if (node instanceof QmdText) return [headings(node)];
    if (isExecutable(node) || hasClass(node, "lm-solution")) return [node];
    return [];
  });
}
