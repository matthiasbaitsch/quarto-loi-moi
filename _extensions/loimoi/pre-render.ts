// Pre-render script of the project type loimoi: Quarto runs it in the project folder before rendering. It
// generates the exercise sheets into lernpfad/aufgaben/c/; Quarto then renders them.
//
// For now in code: the output folder is c/, or the value of the environment variable LOIMOI_OUTPUT (e.g. d/ to
// compare with the output of today's scripts). The site is GitHub Pages of the Git remote; lernpfad/ is its root.

import { readLibrary } from "./library.ts";
import { Series } from "./series.ts";

const output = Deno.env.get("LOIMOI_OUTPUT") ?? "c";
const folder = `lernpfad/aufgaben/${output}`;
const site = gitHubPages();
const url = site === undefined ? undefined : `${site}/aufgaben/${output}`;

Deno.mkdirSync(folder, { recursive: true });
new Series(readLibrary("bausteine", ["aufgaben", "folien", "skript"])).run(folder, url, site);
console.log(`loimoi: exercise sheets in ${folder}/${url === undefined ? " (no Git remote: relative links)" : ""}`);

// The GitHub Pages address of the Git remote, e.g. git@github.com:user/repo.git → https://user.github.io/repo;
// undefined without a GitHub remote.
function gitHubPages(): string | undefined {
  const result = new Deno.Command("git", { args: ["remote", "get-url", "origin"], stderr: "null" }).outputSync();
  const remote = new TextDecoder().decode(result.stdout).trim();
  const match = remote.match(/github\.com[:/]([^/]+)\/([^/]+?)(\.git)?$/);
  return match === null ? undefined : `https://${match[1]}.github.io/${match[2]}`;
}
