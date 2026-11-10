# quarto-loi-moi

## Context

New Quarto extension that generates a learning path with all its materials from building blocks (*Bausteine*);
goal and concept in `README.md`, requirements in `SPEC.md`, survey of the current courses in `ANALYSIS.md`.
It grew out of the work on numPDE (Numerik partieller Differentialgleichungen, Master Bau- und
Umweltingenieurwesen, Hochschule Bochum): exercise text and solution code lived in two files there
(`aufgaben/*.qmd` and `aufgaben/projekt/notebook.qmd`), so one always had to think in both. At the same time, the
courses are built almost the same way but each has its own scripts – this is to be handled in one place.
Long term, loi-moi is to produce everything the students get in all four courses (numPDE, numMat, Informatik,
Mathematik B), not only exercise sheets.

No Git repository yet, not on GitHub yet. Planned: `matthiasbaitsch/quarto-loi-moi`.

**Status:** The code in `_extensions/loimoi/` is a prototype that grew test by test without a design (hard-wired
strings, no data model). It is not to be refactored but rewritten from scratch, in this order: `SPEC.md`
(what), `ANALYSIS.md` (what the courses provide today), a design document (how), then code. The prototype and the
technical results below remain as a reference.

## Decisions

- **Own extension, not tinh.** tinh (`../quarto-tinh`, GitHub `matthiasbaitsch/quarto-tinh`) is a collection of
  formats and stays that. loi-moi uses tinh, not the other way round.
- **Extension instead of a script in every project**, not as a filter (runs per document, also on every
  preview), but as a project extension with a `pre-render` script for the orchestration (tested, see below).
- **Two languages:** TypeScript for housekeeping (learning path/YAML, files, names, calling `quarto render`), Lua
  for everything that touches a document (filters; scripts via `quarto pandoc lua`, called by TS as a process,
  interface files and arguments). Keep the Lua parts small. The user knows neither language – keep the code
  simple and commented.
- **English:** code, comments, keys in `loimoi.yml`, placeholders (`${material}`), README, SPEC, ANALYSIS, this
  CLAUDE.md and the conversation. Not the names of generated files: they must stay as they are today because of
  the links in Moodle (German, see below). Also German: the folders `bausteine/`, `aufgaben/` and `lernpfad/`
  (and the key `bausteine` in `loimoi.yml`), the content of the exercises. Texts the extension writes into
  documents ("Lösung") depend on `lang` (table `de`/`en` as in tinh).
- **`lernpfad/loimoi.yml`** (folder `lernpfad/` as in numPDE and Mathematik B, stays German) describes the learning
  path (selection, order, settings); the name shows who reads the file. Considered: `content.yml` (as in
  Mathematik B), a section `loimoi:` in `_quarto.yml`.
- **Generated exercise sheets in `lernpfad/aufgaben/c/`** as today: the links in Moodle are not to change.
  Therefore the file names must also be exactly as today (see "Names of the generated files" below).
- **Name patterns in `loimoi.yml`** (`names: {sheet, solution, material}` with `${slug}`, `${hash}`, `${nn}`,
  `${name}`, `${key}`). Default is the scheme of numPDE/numMat (hash computed as today); Mathematik B overrides it
  and gives a `key` per sheet. Test against today's files in `c/`.
- **Numbers from the order:** the number of a sheet (title and slug) is its position in the learning path, not
  the number of the building block folder. numPDE is only relevant up to building block 04, where both agree;
  numMat names change, which is fine because numMat is not on Moodle yet.
- **`about.yaml` in the building block stays** with German keys (`teil`, `titel`, …) – it belongs to the
  building block like `bausteine/` and `aufgaben/`. The slug comes from it.
- **Format of `loimoi.yml`** (README, section `lernpfad/loimoi.yml`): `url`, `material`, `names`, `sheets` with
  `bausteine`, `title`, `key`. Unknown keys and a wrong `material` are errors. `sheets` is optional: without it,
  every folder in `bausteine/` with `about.yaml` and exercises is a sheet, in the order of the folder names.
- **No duplicate titles:** header of the documents as in numPDE, `title` "Aufgabenblatt N" or "Lösungen zu
  Aufgabenblatt N" (N = number of the sheet), `subtitle` "teil: titel" from the first `about.yaml`. `title` per
  sheet in `loimoi.yml` only if no building block has an `about.yaml` (Mathematik B; then it also gives
  `${name}`). No title of the course in `loimoi.yml` as long as nothing needs it.
- **Think from the end:** first decide what the students get (SPEC).
- **First version: exercise sheets only** and everything that goes with them, for the building blocks of a
  learning path. The learning path is not a product but the frame (selection, order, settings); further products
  (slides, course notes) later.
- **One source per exercise:** text, paper solution, solution code, scaffold in one file, separated by markers
  (as in Mathematik B today, see below).
- **Markers with prefix `lm-`:** `.lm-solution`, `.lm-scaffold`, `.lm-sheet` (table in SPEC, columns sheet,
  material, solution). Basic rule: text on the sheet, executable code in material and solution, never on the
  sheet. No `.lm-work` any more (was unclear, mixed setup and given code; first it led to given code standing
  twice, in scaffold and solution). `.lm-sheet` is new (executable code for the sheet, e.g. tables in
  Mathematik B).
- **Exercises can be run while writing them without fiddling:** every exercise has its own setup cell
  (`#| label: setup`, `#| include: false`). The extension merges all `setup` cells of a document into one at the
  beginning (lines without repetition, in the order of first appearance) – needed anyway because Quarto requires
  unique labels. Setup per building block or per course rejected (an exercise would not run on its own).
- **Code in the scaffold is commented out** (as in numPDE today), the extension converts nothing. Reason
  (tested): otherwise running the whole exercise overwrites e.g. the imported `euler` from `src/` with
  `def euler(...): ...`. Rejected: scaffold as `{.python}` that the extension makes executable.
- **`src/` in the exercise folder of the building block** (`bausteine/…/aufgaben/src/`, as in numMat
  `projekt/src` today): code runs in the folder of the file without any setting, as later for the students. Every
  building block has its own state (a copy when `src/` grows) – accepted on purpose, fits the appendix "code" of
  the solution. Students do not get `src/` (they build it themselves); the user maintains the copies between
  building blocks. Rejected: `src/` in the project with `execute-dir: project` or `jupyter.notebookFileRoot` (in
  the editor `src/` was not found).
- **loi-moi draws the marking** (green "Lösung", blue "Gerüst": `markers.css`, Typst block in `markers.lua`).
  tinh is to know nothing about solutions, scaffolds etc., `lm-` does not appear there without a weighty reason.
  Long term, `solution-scaffold.lua`/`.css` disappears from tinh (do not touch for now).
- **Assembling as text** (TS): put the exercise files of a sheet one after the other, header with `lm-target` in
  front, replace placeholders, merge `setup` cells (small line scan for code cells only, unambiguous at the fence).
  Not via `pandoc.write` (turns ` ```{python}` into a plain code block, escapes shortcodes). Quarto renders
  `c/<sheet>.qmd` and `c/<solution>.qmd` itself; the script renders and zips the material.
- **Code in the assembled document runs in the exercise folder of the building block:** the generated setup cell
  changes the working directory (Python `os.chdir`, Julia `cd`, R `knitr::opts_knit$set(root.dir = …)`); images
  are copied to `c/` (as numPDE `c/bilder`). Limit: only one building block with code and its own `src/` per
  sheet. The first building block with a `setup` cell counts (not with any cell: in Mathematik B the statistics
  building block also has code, the table in `.lm-sheet`). Julia looks for `include("…")` relative to the file,
  not to the working directory (tested) – relative `include`s in the setup cell are therefore made absolute.
  Rejected: an own working folder `_build/<nn>/` per sheet with its own rendering.
- **A sheet without `.lm-sheet` is rendered without execution** (`execute: enabled: false`), otherwise all code
  runs (the filter removes it afterwards). Saves the time in numPDE/numMat. Can be added if needed: header
  `eval: false` and `#| eval: true` only in cells in `.lm-sheet`.
- **Placeholder `${material}` replaced as text** (as in numPDE/Mathematik B), by the absolute URL of the zip file
  (relative links fail in PDF) – hence `url:` in `loimoi.yml`. Rejected: `{{< meta … >}}`.
- **Splitting of the sheets stays with the building blocks** (`00-grundlagen.qmd`, `10-umsetzung.qmd` with heading
  and download text); the extension only puts them together. Rejected (for now): the extension sets the parts
  itself, or a common template in the learning path – only once the repetition gets in the way.
- **Code for `src/`** for now as separate files, not generated from the exercise.
- **Solution for reading only** (didactic reasons), one document with all solutions; no executable solution
  notebook any more. From each exercise only title, given code and solution; appendix with all files from `src/`
  (all for now, maybe only the changed ones later).
- **Example projects in `examples/`** for R, Julia, Python as use cases and tests – an advantage of an own
  extension: special cases can be rebuilt on purpose.
- Work with the Pandoc AST for structure in documents, not with text lines (divs, classes) – also possible
  outside a filter with `pandoc lua` (`pandoc.read`/`pandoc.write`). Caution: `pandoc.write` rewrites the
  Markdown, ` ```{julia}` becomes a plain code block.

## Existing solutions (starting point)

The four courses, each with its own `CLAUDE.md` (details in `ANALYSIS.md`):

- **numPDE** – `../numPDE_2.1/unterlagen` (GitHub `matthiasbaitsch/numPDE2`), Julia
  - Script `skripte/make-learning-path.jl` (`make prepare-render`): puts all `.qmd` in `aufgaben/` one after the
    other (`assemble_qmd`), replaces placeholders (`${notebook}`, `${slug}`), generates sheet
    (`tinh-target: blank`) and solution sheet (`tinh-target: solution`, `tinh-solution-task: title`, name with a
    hash from the slug), renders `aufgaben/projekt/notebook.qmd` with `quarto render --to tinh-notebook-ipynb` as
    scaffold and solution and zips every notebook separately. `target` in `about.yaml` (`scaffold`/`blank`)
    decides the notebook for the students.
  - Solution code in `aufgaben/projekt/notebook.qmd` and `src/` (grows over the building blocks).
- **numMat** – `../numMat_2.1/unterlagen` (GitHub `matthiasbaitsch/numMat2`), Python (uv)
  - `skripte/make-learning-path.jl` is a copy from numPDE.
  - Sheets split as in Mathematik B: `00-grundlagen.qmd` ("## Teil 1: Mathematische Grundlagen"), paper exercises
    `01-…`, `10-umsetzung-in-python.qmd` ("## Teil 2: Umsetzung in Python", download, workflow), programming
    exercises `11-…`.
- **Mathematik B** – `~/sciebo/mathematik-fbb/mathematik-b_2.0/unterlagen` (GitHub
  `bausteine-der-datenanalyse/bcd-modul-bo-mathematik-b`), R
  - Script `bausteine/bcd-bausteine-montieren/collect-content.R`, controlled by `lernpfad/*/content.yml` (jobs
    `assignment-paper`, `jobs-on-parts`, `zip`), documented in `bausteine/bcd-bausteine-montieren/README.md`.
  - Already one source per exercise: solution code in `::: {.tinh-solution}` in the exercise, setup in
    `::: {.tinh-work}`; on the sheet `{r}` becomes `{.r}` (shown only), `run-solutions: true` runs the solution.
    Recognizes blocks line by line with regular expressions.
  - Working file `aufgaben.qmd` still maintained by hand, delivered as a folder (with `daten/`, workspace,
    `_quarto.yml`) in the zip file.
  - Splitting: `00-abschnitt.qmd` in the statistics or R building block with "## Teil 1/2: …".
- **Informatik** – `../informatik-master_2.0/unterlagen`, C#: code in C# projects (start code and sample
  solution as projects), no notebooks. Script `skripte/lernpfad-zusammenstellen.jl`.
- **Names of the generated files** (in `lernpfad/aufgaben/c/`, linked from Moodle, must stay the same; for numPDE
  only relevant up to building block 04):
  - numPDE, numMat: slug `NN-<teil>-<titel>` from the number and `teil`/`titel` in `about.yaml` (lower case,
    umlauts ae/oe/ue/ss, everything else `-`), e.g. `02-stabtragwerke-stabendkraefte`. Files
    `<slug>-aufgaben.{html,zip}`, solution `<slug>-aufgaben-loesung-<hash>.{html,zip}` with
    `hash = sha1("87362-" * slug)[1:8]` (hex).
  - Mathematik B: `aufgabenblatt-NN` and `aufgabenblatt-NN-loesung-<sol>` (`sol` fixed per sheet in
    `content.yml`), material `NN-<name>-aufgaben.zip` plus folder.

Filter `solution-scaffold.lua` (in tinh, `_extensions/tinh-common/`): table of the markers (`.tinh-solution`,
`.tinh-scaffold`, `.tinh-work`) per `tinh-target` (none, `solution`, `scaffold`, `blank`) at the top of the file.
With `scaffold`, an empty code cell follows a solution block with code without a scaffold after it. Replaced in
loi-moi by `markers.lua` (with `lm-` names).

## Technical results (tested with Quarto 1.10.19, Pandoc 3.10, Deno 2.7.14)

- Project extension: `_extension.yml` with `contributes: project: project: {type: default, pre-render: [...]}`,
  in the project `project: type: loimoi`. Script paths relative to the extension, working directory is the
  project. A `pre-render` of the project is appended (extension first).
- `.ts` and `.lua` run directly as `pre-render`. Own location: TS `import.meta.url`, Lua `PANDOC_SCRIPT_FILE`.
- Environment: `quarto render` → `QUARTO_PROJECT_RENDER_ALL=1`; `quarto render x.qmd` → not set,
  `QUARTO_PROJECT_INPUT_FILES=x.qmd`. `quarto preview`: the script runs at the start (file list empty) and again
  on every change (with the changed file); `QUARTO_PREVIEW` not set. The script must then be fast or do nothing
  (compare time stamps).
- `pandoc.zip` available (`Archive`, `Entry`, `zip`, `read_entry`); calling it from TS with
  `new Deno.Command("quarto", {args: ["pandoc", "lua", "script.lua", ...]})` works, arguments in `arg`.
- TS imports work (`jsr:@std/yaml@1`, `npm:`, `https://deno.land/std@…`), also in `pre-render`; downloaded on the
  first run, so a network is needed. Maybe vendor them into the extension later.
- Lua filters (also `pre-ast`) only run after the code has been executed. Executable cells arrive as `Div.cell`
  (code as `CodeBlock.cell-code`, output as `Div.cell-output…`), also with `--no-execute`; `{.python}` stays a
  plain `CodeBlock`. `-M execute:false` does not switch off execution, `--no-execute` does.
- With `--to ipynb`, Quarto removes cells with `#| echo: false` completely (before the filter); a global
  `echo: true` does not help. Consequence: the setup cell for the material must be written without
  `echo`/`include` when assembling.
- Filter `markers.lua` (markers per `lm-target`) tested on the Python exercise: sheet, solution, material
  (`ipynb`, `--no-execute`) and without target correct. The filter runs from outside to inside
  (`traverse = "topdown"`) so that a marker decides before its content (otherwise the cell in `.lm-sheet`
  disappeared from the sheet); unwrapped content (exercise in the material) must then be selected explicitly.
  Pandoc also calls the `Blocks` filter for the content of a cell – parts of a cell stay in the material.
- If a file is not in `project: render:` (also when excluded with `!…`), Quarto treats it as a file outside the
  project when rendered on its own: without filter, `lang`, `engine`. Therefore (as in Mathematik B): the
  extension sets `render: lernpfad/**/*.qmd`, and `bausteine/_quarto.yml` is a project of its own for writing the
  exercises (`lang`, maybe `engine`, filter as the path `../_extensions/loimoi/markers.lua`). Tested in all three
  examples: a single exercise with filter and in German, `quarto render` generates only the sheets in `c/`.
- Material (`material.ts`): assembled with `lm-target: material`, rendered to `ipynb` in
  `lernpfad/aufgaben/_material/` (Quarto skips `_` folders); the filter is in the header with an absolute path
  (the file is not in `render:`). Quarto's Julia engine ignores `--no-execute` – hence `execute: eval: false` in
  the header (works for all languages). `ipynb`: zip file with only the notebook (as numPDE). `qmd` (R):
  `qmd`→`qmd` turns cells into plain code blocks, hence `ipynb` and `quarto convert` back; that takes the language
  from the kernel (wrongly `python` for R) and writes `jupyter:` into the header – both are corrected afterwards.
  Zip file with a folder `<material>/`: `.qmd`, the other files of the building block with setup (without `src/`,
  `_*`, `.qmd`), workspace renamed, plus optionally `lernpfad/aufgaben/material/*` (e.g. `_quarto.yml` as in
  Mathematik B). Zip via `zip.lua` (`pandoc.zip`). Tested in all three examples.
- Appendix of the solution ("Anhang: Code", unnumbered): every file from `src/` of the building block with setup
  as a non-executable code block with `filename=` (language from the extension). Tested: Python and Julia; R
  without `src/` has no appendix.
- Cleaning up (`cleanup.ts`): list `lernpfad/aufgaben/_material/generated.txt` with everything the extension
  generated in `c/` (`.qmd`, `.html`, `.pdf`, `_files`, zip, copied folders); removed before the next run. Other
  files in `c/` stay. Tested with a changed key in the R example.
- Material without paper exercises: headings with no code cell before the next heading are dropped (also
  "Teil 1/2"), the file starts with the first programming exercise. Placeholder `# ...` only if there is no
  scaffold directly before or after a solution with code (tinh only checked after).
- Quarto does not follow a symlink to an extension ("Unsupported project type"). Therefore `make examples` copies
  the extension into the examples (`examples/*/_extensions/loimoi`, later in `.gitignore`); run it after every
  change to the extension.
- Julia engine: if Quarto's server hangs ("`startpath` must be non-empty"), `quarto call engine julia kill`
  helps.

## Examples

- Every example has its own environment in the example folder: Python `examples/python/.venv` (uv, group
  `render` with `jupyter` only for rendering), Julia `examples/julia/Project.toml` and `instantiate.jl`.
- VS Code stays in the main folder; interpreter and Julia environment are set in `quarto-loi-moi.code-workspace`
  (`python.defaultInterpreterPath`, `julia.environmentPath`). Python tested by the user in the editor, works.

## Next steps

1. ~~Clarify technical questions~~ (done, see above).
2. ~~Choose the language~~: TypeScript + Lua (see decisions).
3. ~~Create example projects in `examples/`~~ (Python, Julia, R; each rendered in a copy).
4. ~~First version for exercise sheets~~ (prototype): sheet, solution (with appendix) and material with one
   `quarto render`, tested in all three examples (in copies).
5. Start again from the requirements: `SPEC.md` (what students get, what the teacher provides), `ANALYSIS.md`
   (what the four courses provide today, what is common and what differs), then a design document, then code.
6. Reference in numPDE: generate the sheets of building blocks 01–04 with the extension and compare with today.
   Then rework building block 05 (Elementweise Berechnung) (splitting the sheet, "Bohrpfahl elementweise" with
   the same code as in 04). Then numMat and Mathematik B.

## Collaboration

- Informal (*du* in German). Conversation and texts in English.
- For questions, only explain first; change files only when explicitly asked; before every change, explain what
  is planned and wait for approval. Don't rush: the user reviews and approves step by step.
- If the user asks for something to be done and it seems a bad idea, say so directly and explain why – before
  doing it.
- Do nothing that was not asked for. No memory directory, notes go into this file.
- No Git commits, no GitHub repository without being asked.
