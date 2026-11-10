// Pre-render script of the loimoi project type, runs in the project folder before Quarto renders anything.
//
// Generates sheet and solution of every sheet in lernpfad/loimoi.yml as .qmd files in lernpfad/aufgaben/c/
// (Quarto renders them afterwards) and the material for the students as a zip file next to them. What the last
// run generated there is removed first.

import { copyResources, OUTPUT_FOLDER, writeSheetAndSolution } from "./assemble.ts";
import { generatedFiles, removeGenerated, writeGeneratedList } from "./cleanup.ts";
import { readLearningPath } from "./learning-path.ts";
import { writeMaterial } from "./material.ts";

// Only when the whole project is rendered. For a single file or during preview (on every change) we do nothing,
// generating the sheets takes too long there.
if (!Deno.env.get("QUARTO_PROJECT_RENDER_ALL")) {
  Deno.exit(0);
}

const path = await readLearningPath();
console.log(`loimoi: ${path.sheets.length} sheet(s)`);
removeGenerated();
Deno.mkdirSync(OUTPUT_FOLDER, { recursive: true });

const generated: string[] = [];
for (const sheet of path.sheets) {
  console.log(`  ${sheet.number}. ${sheet.title}: ${sheet.names.sheet}, ${sheet.names.solution}`);
  writeSheetAndSolution(sheet, path.url, path.lang);
  generated.push(...generatedFiles(sheet), ...copyResources(sheet));
  writeMaterial(path, sheet);
}
writeGeneratedList(generated);
