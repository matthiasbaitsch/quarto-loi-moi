import { QmdDocument } from "../qmd-document.ts";
import { QmdCodeCell, QmdDiv, QmdNode, QmdText } from "../qmd-node.ts";
import { blankLines, hasClass, hasCode, headings, isExecutable, isExercise, tidy, withChildren } from "./exercise.ts";
import { ProcessingStep } from "./processing-step.ts";

export class ExerciseScaffold implements ProcessingStep {
  run(doc: QmdDocument): QmdDocument {
    return new QmdDocument(doc.header, tidy(scaffold(doc.nodes)), { ...doc.output });
  }
}

// Paper exercises are dropped
function scaffold(nodes: QmdNode[]): QmdNode[] {
  return nodes.flatMap((node): QmdNode[] => {
    if (isExercise(node)) return isProgramming(node) ? [withChildren(node, inExercise(node))] : [];
    if (isExecutable(node)) return [node];
    if (node instanceof QmdText) return [blankLines(node)];
    return [];
  });
}

function inExercise(exercise: QmdDiv): QmdNode[] {
  const hasScaffold = exercise.children.some((node) => hasClass(node, "lm-scaffold"));
  return exercise.children.flatMap((node): QmdNode[] => {
    if (node instanceof QmdText) return [headings(node)];
    if (isExecutable(node) || hasClass(node, "lm-scaffold")) return [node];
    if (hasClass(node, "lm-solution") && hasCode(node) && !hasScaffold) return [emptyCell(node)];
    return [];
  });
}

function isProgramming(exercise: QmdDiv): boolean {
  return exercise.children.some((node) =>
    hasClass(node, "lm-scaffold") || (hasClass(node, "lm-solution") && hasCode(node))
  );
}

// In the language of the first code cell of the solution
function emptyCell(solution: QmdDiv): QmdCodeCell {
  const code = solution.children.find(isExecutable)!;
  return new QmdCodeCell([code.lines[0], code.lines.at(-1)!], code.language, true, {});
}
