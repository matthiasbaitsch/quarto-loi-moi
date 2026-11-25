import { basename, extname } from "jsr:@std/path@1";
import { QmdDocument } from "../qmd-document.ts";
import { QmdCodeCell, QmdNode, QmdText } from "../qmd-node.ts";
import { ProcessingStep } from "./processing-step.ts";

const languages: Record<string, string> = { ".jl": "julia", ".py": "python", ".R": "r", ".r": "r" };

export class AttachSrc implements ProcessingStep {
  readonly files: string[]; // absolute paths
  readonly heading: string; // e.g. "Appendix"

  constructor(files: string[], heading: string) {
    this.files = files;
    this.heading = heading;
  }

  run(doc: QmdDocument): QmdDocument {
    const files = this.files.filter((file) => !Deno.readTextFileSync(file).split("\n", 1)[0].includes("lm-no-attach"));
    if (files.length === 0) return doc;
    const appendix: QmdNode[] = [new QmdText([`## ${this.heading}`, ""])];
    files.forEach((file, i) => {
      const language = languages[extname(file)];
      if (language === undefined) throw new Error(`Unknown language of ${file}`);
      const code = Deno.readTextFileSync(file).replace(/\n?$/, "").split("\n");
      if (i > 0) appendix.push(new QmdText([""]));
      appendix.push(new QmdText([`### \`src/${basename(file)}\``, ""]));
      appendix.push(new QmdCodeCell([`\`\`\`{.${language} .number-lines}`, ...code, "```"], language, false, {}));
    });
    appendix.push(new QmdText([""]));
    return new QmdDocument(doc.header, [...doc.nodes, ...appendix]);
  }
}
