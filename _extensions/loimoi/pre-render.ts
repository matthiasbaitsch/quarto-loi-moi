// Pre-render script of the project type loimoi: Quarto runs it in the project folder before rendering. It
// generates the products into lernpfad/; Quarto then renders them.
//
// For now in code: the output folder (later in loimoi.yml; e.g. d/ to compare with the output of today's
// scripts). The site is GitHub Pages of the Git remote; lernpfad/ is its root.

import { Library } from "./library.ts";
import { Series } from "./series.ts";
import { gitHubPages } from "./utilities.ts";

const output = "c";
const site = gitHubPages();

const ingredients = ["aufgaben", "folien", "skript"];
const library = Library.read("bausteine", ingredients);
for (const name of ["aufgaben"]) { // only exercise sheets so far
  new Series(library, name).run("lernpfad", output, site);
}
console.log(`loimoi: generated into ${output}/${site === undefined ? " (no Git remote: relative links)" : ""}`);
