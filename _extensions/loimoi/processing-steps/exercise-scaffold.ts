import { QmdDocument } from "../qmd-document.ts";
import { QmdDiv, QmdNode, QmdText } from "../qmd-node.ts";
import { ProcessingStep } from "./processing-step.ts";

export class ExerciseScaffold implements ProcessingStep {
  run(doc: QmdDocument): QmdDocument {
    return new QmdDocument(doc.header, scaffold(doc.nodes)).tidy();
  }
}

function scaffold(nodes: QmdNode[]): QmdNode[] {
  return nodes.flatMap((node): QmdNode[] => {
    if (node.isExercise()) return exercise(node);
    if (node.isExecutable()) return [node];
    if (node.hasClass("lm-scaffold")) return node.children;
    if (node.isText()) return [node.blankLines()];
    return [];
  });
}

// Only the content, after a blank line instead of the div; an exercise with nothing left but headings is dropped,
// e.g. one on paper
function exercise(div: QmdDiv): QmdNode[] {
  const children = inExercise(div);
  return children.some((node) => !node.isText()) ? [new QmdText([""]), ...children] : [];
}

function inExercise(exercise: QmdDiv): QmdNode[] {
  return exercise.children.flatMap((node): QmdNode[] => {
    if (node.isText()) return [node.headings()];
    if (node.isExecutable()) return [node];
    if (node.hasClass("lm-scaffold")) return node.children;
    return [];
  });
}
