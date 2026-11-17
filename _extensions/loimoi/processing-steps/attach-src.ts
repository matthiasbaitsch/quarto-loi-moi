import { basename, extname } from "jsr:@std/path@1";
import { QmdDocument } from "../qmd-document.ts";
import { ProcessingStep } from "./processing-step.ts";

const languages: Record<string, string> = { ".jl": "julia", ".py": "python", ".R": "r", ".r": "r" };

export class AttachSrc implements ProcessingStep {
  readonly files: string[]; // absolute paths

  constructor(files: string[]) {
    this.files = files;
  }

  run(doc: QmdDocument): QmdDocument {
    if (this.files.length === 0) return doc;
    const sections = this.files.map((file) => {
      const language = languages[extname(file)];
      if (language === undefined) throw new Error(`Unknown language of ${file}`);
      const code = Deno.readTextFileSync(file).replace(/\n?$/, "\n");
      return `### \`${basename(file)}\`\n\n\`\`\`{.${language}}\n${code}\`\`\``;
    });
    const parsed = QmdDocument.parse(`${doc.text()}\n## Appendix\n\n${sections.join("\n\n")}\n`);
    return new QmdDocument(parsed.header, parsed.nodes, { ...doc.output });
  }
}
