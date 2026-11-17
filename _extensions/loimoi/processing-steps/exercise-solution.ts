import { QmdDocument } from "../qmd-document.ts";
import { QmdNode, QmdText } from "../qmd-node.ts";
import {
  blankLines,
  checkStructure,
  hasClass,
  isExecutable,
  isExercise,
  tidy,
  title,
  withChildren,
} from "./exercise.ts";
import { ProcessingStep } from "./processing-step.ts";

export class ExerciseSolution implements ProcessingStep {
  run(doc: QmdDocument): QmdDocument {
    checkStructure(doc.nodes);
    return new QmdDocument(doc.header, tidy(solution(doc.nodes)), { ...doc.output });
  }
}

function solution(nodes: QmdNode[]): QmdNode[] {
  return nodes.flatMap((node): QmdNode[] => {
    if (isExercise(node)) return [withChildren(node, inExercise(node.children))];
    if (isExecutable(node) || hasClass(node, "lm-solution")) return [node];
    if (node instanceof QmdText) return [blankLines(node)];
    return [];
  });
}

function inExercise(nodes: QmdNode[]): QmdNode[] {
  return nodes.flatMap((node): QmdNode[] => {
    if (node instanceof QmdText) return [title(node, nodes)];
    if (isExecutable(node) || hasClass(node, "lm-solution")) return [node];
    return [];
  });
}
