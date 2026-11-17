import { QmdDocument } from "../qmd-document.ts";
import { QmdCodeCell, QmdDiv, QmdNode, QmdText } from "../qmd-node.ts";
import {
  blankLines,
  checkStructure,
  hasClass,
  hasCode,
  isExecutable,
  isExercise,
  tidy,
  title,
  withChildren,
} from "./exercise.ts";
import { ProcessingStep } from "./processing-step.ts";

export class ExerciseScaffold implements ProcessingStep {
  run(doc: QmdDocument): QmdDocument {
    checkStructure(doc.nodes);
    return new QmdDocument(doc.header, tidy(scaffold(doc.nodes)), { ...doc.output });
  }
}

// Paper exercises are dropped
function scaffold(nodes: QmdNode[]): QmdNode[] {
  return nodes.flatMap((node): QmdNode[] => {
    if (isExercise(node)) return isProgramming(node) ? [withChildren(node, inExercise(node))] : [];
    if (isExecutable(node) || hasClass(node, "lm-scaffold")) return [node];
    if (node instanceof QmdText) return [blankLines(node)];
    return [];
  });
}

function inExercise(exercise: QmdDiv): QmdNode[] {
  const hasScaffold = exercise.children.some((node) => hasClass(node, "lm-scaffold"));
  return exercise.children.flatMap((node): QmdNode[] => {
    if (node instanceof QmdText) return [title(node, exercise.children)];
    if (isExecutable(node) || hasClass(node, "lm-scaffold")) return [node];
    if (hasClass(node, "lm-solution") && hasCode(node) && !hasScaffold) return [emptyCell(node)];
    return [];
  });
}

// Any code: given code, a scaffold, or code in the solution
function isProgramming(exercise: QmdDiv): boolean {
  return exercise.children.some((node) =>
    isExecutable(node) || hasClass(node, "lm-scaffold") || (hasClass(node, "lm-solution") && hasCode(node))
  );
}

// In the language of the first code cell of the solution
function emptyCell(solution: QmdDiv): QmdCodeCell {
  const code = solution.children.find(isExecutable)!;
  return new QmdCodeCell([code.lines[0], code.lines.at(-1)!], code.language, true, {});
}
