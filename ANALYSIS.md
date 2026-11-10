# Analysis

What the teacher supplies and what the students see in the four courses today. This is the survey of the current
state and, at the same time, the requirement: in the long run, loi-moi has to handle all of it.

**Basis:** latest version of each course, `make clean render` on 2026-11-06, files in `__output/lernpfad/`
(published on GitHub Pages, linked from Moodle), plus the building blocks, scripts and `CLAUDE.md` of each course. The state is marked with the Git tag
`loimoi-analysis` in each course (the last commit before the analysis; uncommitted changes are not included).
Hashes and keys are written as `<hash>` and `<key>`.

**Not included:** further material (`weitere-unterlagen`), the term paper (`studienarbeit`) and the templates for
project folders (`00-templates`) – different problems.

Section 1 gives the findings, section 2 describes each course (what the teacher supplies, what the students see)
and sums them up side by side, section 3 lists the tasks.

## 1. Findings

### 1.1 Terms

- **Building block:** material on one topic, maintained by the teacher: `.qmd` documents and supporting files;
  folders distinguish the purpose, e.g.:
  - `folien/`
  - `aufgaben/`
  - `skript/`
- **Product:** a set of related files the students get together, e.g.:
  - slides and their downloads
  - exercise sheet, material and solution
  - course notes as HTML pages and PDF
- **Series:** products of the same kind in a fixed order, numbered (e.g. slide sets, sheets). A product is either
  part of a series or stands alone (e.g. course notes, all slides in one document, course slides).
- **Learning path:** all products of a course.
- **Learning unit:** a grouping of products on Moodle.

### 1.2 Properties of the products

1. The files are linked from outside (Moodle), so names and locations stay stable. Solutions have names that
   cannot be guessed (hash or key).
2. The students work either in one folder set up once (the material is only the working file) or in a complete
   folder that comes with every download.
3. In numPDE, numMat and Informatik, the series are aligned: slides and sheet of a building block share number
   and slug. In Mathematik B, the series are independent (statistics slides, R slides, sheets); many R building
   blocks are for reference only (slides, no sheet).

### 1.3 How products are made today

1. Building blocks can be shared with other courses (Git submodules). Files that exist several times on purpose
   are checked (`duplikate.txt`).
2. Documents load shared setup code (`_setup.jl`, `_setup.py`, `_bcd-setup.R`).
3. The teacher sets up a folder structure (`lernpfad/`, one folder per task) with instructions how to map the
   content of the building blocks onto the products:
   - which content goes where, explicitly (`content.yml`) or by convention
   - settings per task (`_metadata.yml`)
   - books as projects of their own (`_quarto.yml`, `index.qmd`, `literatur.qmd`)
   - templates for generated settings (`quarto-template.yml`)
   - content that belongs to no building block (course slides, folder to download)
4. A script collects all required files (`.qmd` documents and supporting files, setup code) into a folder that is
   not under version control (`c/`), sometimes also into the task folder itself. It puts exercise files together
   into sheets, writes the headers and replaces placeholders (`${notebook}`, `${zipfile}`, `${slug}`).
5. Quarto renders the collected `.qmd` files into the files for the students (HTML, PDF, `.ipynb`); a filter of
   tinh selects content per target (e.g. solutions, scaffold). Zip files and PDFs of HTML slides come from other
   tools.

## 2. Courses today

### 2.1 numPDE – Numerik partieller Differentialgleichungen (Julia)

`../numPDE_2.1/unterlagen`, published at `matthiasbaitsch.github.io/numPDE2`.

#### What the teacher supplies

**In each building block** (`bausteine/NN-<name>/`, grouped into parts Bohrpfahl and Wärmeleitung by `teil`)

| Item                     | Location                                         | Notes                                     |
|--------------------------|--------------------------------------------------|-------------------------------------------|
| Description              | `about.yaml`                                     | `titel`, `teil`, `inhalt`, `dauer`, `target` (`scaffold`/`blank`: which notebook the students get) |
| Slides                   | `folien/folien.qmd`, `folien/notizen/*.pdf`      | Embeds the pages of handwritten notes (`#notiz(…)`); own slides in between |
| Notebook for the slides  | `folien/projekt/notebook.qmd`                    | Final state; the scaffold is generated from it (`.tinh-scaffold`) |
| Exercises                | `aufgaben/NN-<name>.qmd`                         | One file per exercise; paper solution in `::: {.tinh-solution}`; handwritten solutions as images from `aufgaben/notizen/` |
| Solution code            | `aufgaben/projekt/notebook.qmd`, `aufgaben/projekt/src/` | Solutions and scaffold of all programming exercises (`.tinh-solution`/`.tinh-scaffold`); `src/` as of this building block |
| Not delivered            | `aufgaben/reserve/`, `aufgaben/projekt-playground/` | Exercises set aside, notebooks for trying things out |

**In `lernpfad/`** (one folder per task; `c/` is generated)

| Item                     | Location                                         | Notes                                     |
|--------------------------|--------------------------------------------------|-------------------------------------------|
| Settings of the sheets   | `aufgaben/_metadata.yml`                         | Format, logo, literature; copied to `c/`  |
| Settings of the slides   | `folien/_metadata.yml`                           | Format, `#notiz(…)` for the pages of the notes |
| Course slides            | `veranstaltung/<name>/folien.qmd`                | One folder per slide set, with images; a folder `zip/<name>/` in it becomes `<name>.zip` (folder structure for the students) |

**Elsewhere in the project**

| Item                     | Location                                         | Notes                                     |
|--------------------------|--------------------------------------------------|-------------------------------------------|
| Common settings          | `_quarto.yml`                                    | Author, `resources`, engine               |
| Shared setup code        | `_setup.jl`                                      | Loaded by the first executed cell of a file (packages, look of the plots) |
| Script                   | `skripte/make-learning-path.jl` (`make prepare-render`) | Assembles everything into `lernpfad/*/c/`, renders and zips the notebooks |

- Placeholders in the exercises: `${notebook}` (link to the material), `${slug}`.

#### What the students see

**Slides** – per building block

| Product                    | File names                                         | Notes                                        |
|----------------------------|-----------------------------------------------|----------------------------------------------|
| Slides                     | `<slug>.pdf`                         | Slide "Material" with download link          |
| Notebook for the slides    | `<slug>-folien.zip`                  | Scaffold `.ipynb`, filled in live in class; if the building block has one |
| Notebook, solution         | `<slug>-folien-loesung-<hash>.zip`   | Final state `.ipynb`                         |

**Exercises** – per building block, one sheet each

| Product           | File names                                                  | Notes                                       |
|-------------------|--------------------------------------------------------|---------------------------------------------|
| Exercise sheet    | `<slug>-aufgaben.{html,pdf}`                |                                             |
| Material          | `<slug>-aufgaben.zip`                       | `.ipynb` scaffold or blank (`target` in `about.yaml`); none without `target` |
| Solution sheet    | `<slug>-aufgaben-loesung-<hash>.{html,pdf}` | Only where there are paper solutions; title and solution of each exercise |
| Solution notebook | `<slug>-aufgaben-loesung-<hash>.zip`        | `.ipynb` with the solution code, if there is any |

**Course**

| Product          | File names                                    |
|------------------|-----------------------------------------------|
| Course slides    | `einfuehrung.pdf`, `ordner-einrichten.html`   |
| Folder structure | `numerik-partieller-dgln.zip`                 |

**General**

- The students set up one folder once (empty folders with `Project.toml`, `instantiate.jl`, workspace); `src/`
  grows in `projekt-aufgaben/` over the sheets.
- Notebooks are zipped because GitHub Pages serves `.ipynb` as text.
- Slug `NN-<teil>-<titel>`: NN is the number of the building block folder (two digits), `teil` and `titel` from
  `about.yaml` in lower case, umlauts as ae/oe/ue/ss, everything else as `-`; e.g.
  `10-waermeleitung-instationaere-probleme`. Hash: `sha1("87362-" + slug)`, first 8 hex digits.

### 2.2 numMat – Numerische Mathematik (Python)

`../numMat_2.1/unterlagen`, published at `matthiasbaitsch.github.io/numMat2`, not on Moodle yet.

#### What the teacher supplies

As numPDE (parts Stabtragwerke, Anfangswertprobleme, Wärmeleitung), with these differences:

**In each building block** (`bausteine/NN-<name>/`)

| Item              | Location                                   | Notes                                              |
|-------------------|--------------------------------------------|----------------------------------------------------|
| Description       | `about.yaml`                               | additionally `videos` (title, duration, link)      |
| Course notes      | `skript/skript.qmd`                        | One chapter per building block with text           |
| Exercises         | `aufgaben/NN-<name>.qmd`                   | Split by files: `00-grundlagen.qmd` ("Teil 1"), paper exercises, `10-umsetzung-in-python.qmd` ("Teil 2", download link), programming exercises |
| Extra downloads   | `aufgaben/zip/<name>/`                     | Becomes `<name>.zip`                               |

**In `lernpfad/`**: as numPDE, additionally

| Item              | Location                                   | Notes                                              |
|-------------------|--------------------------------------------|----------------------------------------------------|
| Course notes      | `skript/index.qmd`, `skript/literatur.qmd`, `skript/quarto-template.yml` | Front page, bibliography and settings of the book; the template becomes `c/_quarto.yml` |

**Elsewhere in the project**

| Item              | Location                                   | Notes                                              |
|-------------------|--------------------------------------------|----------------------------------------------------|
| Shared setup code | `_setup.py`                                | as numPDE                                          |
| Script            | `skripte/make-learning-path.jl`            | Copy of numPDE's                                   |

#### What the students see

**Slides** – per building block

| Product | File names                    | Notes                                     |
|---------|--------------------------|-------------------------------------------|
| Slides  | `<slug>.pdf`    |                                           |

**Exercises** – per building block, one sheet each

| Product           | File names                                                  | Notes                              |
|-------------------|--------------------------------------------------------|------------------------------------|
| Exercise sheet    | `<slug>-aufgaben.{html,pdf}`                | Part 1 paper, part 2 Python        |
| Material          | `<slug>-aufgaben.zip`                       | `.ipynb`                           |
| Solution sheet    | `<slug>-aufgaben-loesung-<hash>.{html,pdf}` |                                    |
| Solution notebook | `<slug>-aufgaben-loesung-<hash>.zip`        | `.ipynb`                           |
| Extra download    | `displacement-game.zip`                     | Mathematica notebook, linked from an exercise |

**Course**

| Product          | File names                                                        |
|------------------|-------------------------------------------------------------------|
| Course notes     | `index.html`, `<slug>.html`, `skript-numerische-mathematik.pdf`   |
| Course slides    | `einfuehrung.pdf`, `ordner-einrichten.html`                       |
| Folder structure | `numerische-mathematik.zip`                                       |

**General**

- As numPDE (one folder set up once, with `pyproject.toml`/`uv.lock` and `uv sync`, `src/` grows, notebooks
  zipped, names).

### 2.3 Informatik – Informatik im Master Bauingenieurwesen (C#)

`../informatik-master_2.0/unterlagen`.

#### What the teacher supplies

**In each building block** (`bausteine/NN-<name>/`)

| Item                  | Location                                       | Notes                                        |
|-----------------------|------------------------------------------------|----------------------------------------------|
| Description           | `about.yaml`                                   | `titel`, `inhalt`, `dauer`                   |
| Slides                | `folien/folien.qmd`                            |                                              |
| Project for the slides| `folien/projekt/`                              | C# solution with the examples                |
| Exercises             | `aufgaben/NN-<name>.qmd`                       | One file per exercise; no solutions in the text |
| Start code            | `aufgaben/projekt/`                            | C# solution (`.slnx`, projects, workspace)   |
| Sample solution       | `aufgaben/projekt-musterloesung/`              | The same, solved                             |

**In `lernpfad/`** (one folder per task; `c/` is generated)

| Item                   | Location                                       | Notes                                        |
|------------------------|------------------------------------------------|----------------------------------------------|
| Settings of the sheets | `aufgaben/_metadata.yml`                       | Format                                       |
| Settings of the slides | `folien/_metadata.yml`                         | Format                                       |
| All slides             | `folien-alle/_quarto.yml`, `folien-alle/index.qmd` | Book of its own; extension and brand linked |

**Elsewhere in the project**

| Item                  | Location                                       | Notes                                        |
|-----------------------|------------------------------------------------|----------------------------------------------|
| Common settings       | `_quarto.yml`, `_brand.yml`                    |                                              |
| Script                | `skripte/lernpfad-zusammenstellen.jl`          | Assembles everything into `lernpfad/*/c/` and zips the projects |

- Placeholders in the exercises: `${slug}`, `${slug-nn}` (link to the start code, name of the workspace).
- Files that exist several times on purpose (start code and sample solution) are listed in `skripte/duplikate.txt`
  and checked by a pre-commit hook.

#### What the students see

**Slides** – per building block

| Product                | File names                        | Notes                                                       |
|------------------------|------------------------------|-------------------------------------------------------------|
| Slides                 | `<slug>.{html,pdf}` | PDF made from the HTML with decktape                        |
| Project for the slides | `<slug>-folien.zip` | C# solution with the examples from the slides; linked on the slides |

**Exercises** – per building block, one sheet each

| Product               | File names                                       | Notes                                              |
|-----------------------|---------------------------------------------|----------------------------------------------------|
| Exercise sheet        | `<slug>-aufgaben.{html,pdf}`     |                                                    |
| Material (start code) | `<slug>.zip`                     | Folder with a C# solution (`.slnx`, projects, workspace, `.vscode`, `.editorconfig`) |
| Sample solution       | `<slug>-musterloesung-<key>.zip` | The same as a solved C# solution; no solution sheet |

- Key of the sample solution: 5 random letters with a fixed random seed (`87362`), so it depends on the order of
  the building blocks.
- Slug `NN-<titel>`: NN from the name of the building block folder, `titel` from `about.yaml` in lower case,
  spaces as `-` (umlauts are not replaced). `${slug-nn}` is the slug without the number.

**Course**

| Product     | File names                    |
|-------------|-------------------------------|
| All slides  | `index.html`, `<slug>.html`   |

**General**

- No notebooks; every download is a folder with a C# solution that opens in VS Code.

### 2.4 Mathematik B – Statistik und Datenanalyse (R)

`~/sciebo/mathematik-fbb/mathematik-b_2.0/unterlagen`, published at
`bausteine-der-datenanalyse.github.io/bcd-modul-bo-mathematik-b`.

#### What the teacher supplies

**In each statistics building block** (`bausteine/bcd-bausteine-statistik/m-<name>/`, Git submodule, no
`about.yaml`)

| Item                   | Location                                         | Notes                                     |
|------------------------|--------------------------------------------------|-------------------------------------------|
| Course notes           | `skript/skript.qmd`                              | With data in `01-daten/`                  |
| Slides                 | `folien/folien.qmd`                              |                                           |
| Exercises              | `aufgaben/NN-<name>.qmd`                         | One file per exercise; solution in `::: {.tinh-solution}`; `00-abschnitt.qmd` with "Teil 1" |

**In each R building block** (`bausteine/bcd-bausteine-r/w-<name>/`, Git submodule, no `about.yaml`)

| Item                   | Location                                         | Notes                                     |
|------------------------|--------------------------------------------------|-------------------------------------------|
| Slides                 | `folien/folien.qmd`                              | With data, scripts, images, workspace     |
| Exercises              | `aufgaben/NN-<name>.qmd`                         | One file per exercise; solution code in `::: {.tinh-solution}`, setup in `::: {.tinh-work}`; `00-abschnitt.qmd` with "Teil 2" |
| Working file           | `aufgaben/aufgaben.qmd`                          | Maintained by hand, with data, scripts, workspace next to it |

**In `lernpfad/`** (one folder per task; `c/` is generated)

| Item                   | Location                                         | Notes                                     |
|------------------------|--------------------------------------------------|-------------------------------------------|
| Jobs of a task         | `<task>/content.yml`                             | In every task folder: which files from which building blocks, which sheet, which zip, sheet number, key |
| Settings of a task     | `{aufgaben,r-folien,statistik-folien,veranstaltung}/_metadata.yml` | Format                  |
| Settings of the material | `aufgaben/quarto-template.yml`                 | Becomes `_quarto.yml` in every material folder |
| All R slides           | `r-folien-alle/_quarto.yml`, `r-folien-alle/index.qmd` | Book of its own                     |
| Course notes           | `statistik-skript/_quarto.yml`, `statistik-skript/index.qmd`, `statistik-skript/literatur.qmd` | Book of its own |

- In the books, the script links extension and brand and copies `_bcd-setup.*` and the bibliography.

**Elsewhere in the project**

| Item                   | Location                                         | Notes                                     |
|------------------------|--------------------------------------------------|-------------------------------------------|
| Common settings        | `_quarto.yml`                                    | `render` limited to the task folders without their own `_quarto.yml` |
| Shared setup code      | `_bcd-setup.R` in each collection                | Loaded by a setup cell in every slide set and chapter (found with `rprojroot`) |
| Course slides          | `bausteine/veranstaltung/<name>/folien/`         | Like a building block                     |
| Script                 | `bausteine/bcd-bausteine-montieren/collect-content.R` | Runs the jobs of a `content.yml`, fills `c/` |

- Placeholder in the exercises: `${zipfile}` (link to the material).
- `_bcd-setup.R` is copied wherever it is needed, also into the zip files of the R slides.

#### What the students see

**Slides** – per building block (statistics and R separately)

| Product             | File names                                         | Notes                                     |
|---------------------|-----------------------------------------------|-------------------------------------------|
| Statistics slides   | `NN-<name>.pdf`     |                                           |
| R slides            | `NN-<name>.{html,pdf}` | PDF made from the HTML with decktape |
| R slides as project | `NN-<name>.zip`                    | Folder with the slides as `.qmd`, data, images, workspace, `_quarto.yml`, extension and brand – the students can render them |

**Exercises** – per sheet, composed in `content.yml`

A sheet is made from one or more building blocks: a statistics block, an R block, a statistics and an R block
(often with the same name, but not necessarily), or two R blocks. Exercises are selected by file (e.g. only
`10.*.qmd`), and files of two blocks can alternate.

| Product        | File names                                                  | Notes                                             |
|----------------|--------------------------------------------------------|---------------------------------------------------|
| Exercise sheet | `aufgabenblatt-NN.{html,pdf}`               | Statistics exercises (paper) and R exercises      |
| Material       | `NN-<name>-aufgaben.zip`                    | Folder with the working file `.qmd`, data, scripts, workspace, `_quarto.yml` |
| Solution sheet | `aufgabenblatt-NN-loesung-<key>.{html,pdf}` | Title and solution of each exercise, R code executed with output |

- Sheet numbers come from `content.yml`, not from counting.
- Key of the solution: fixed per sheet in `content.yml`.
- No slug. Names `NN-<name>`: NN is a running index in `content.yml` (gaps possible), `name` is the folder
  name of the building block without the prefix `m-`/`w-`. Sheets: `aufgabenblatt-NN`.

**Course**

| Product          | File names                                                  |
|------------------|-------------------------------------------------------------|
| Course notes     | `index.html`, `NN-<name>.html`, `skript-mathematik-b.pdf`   |
| All R slides     | `index.html`, `NN-<name>.html`                              |
| Course slides    | `01-einfuehrung.{html,zip}`                                 |

**General**

- The environment is in every downloaded folder (R project with workspace); no folder set up once.

### 2.5 Summary

The four courses side by side.

| | numPDE | numMat | Informatik | Mathematik B |
|---|---|---|---|---|
| Language | Julia | Python | C# | R |
| **Teacher supplies** | | | | |
| Building blocks | with `about.yaml` | as numPDE | as numPDE | two collections (Git submodules), no `about.yaml` |
| Exercises | one file each, paper solution marked | as numPDE | one file each, no solution | one file each, solution and setup marked |
| Solution code | notebook `.qmd` with markers, `src/` | as numPDE | C# solution | in the exercises |
| Working file | generated from the notebook | as numPDE | start code | maintained by hand |
| Setup code | `_setup.jl` | `_setup.py` | – | `_bcd-setup.R` per collection |
| Configuration | `_metadata.yml`, `target` in `about.yaml` | as numPDE | `_metadata.yml` | `content.yml` |
| Script | `make-learning-path.jl` | copy of numPDE's | `lernpfad-zusammenstellen.jl` | `collect-content.R` |
| **Students see** | | | | |
| Series | slides, sheets (aligned) | as numPDE | as numPDE | statistics slides, R slides, sheets (independent) |
| Material | notebook | notebook | C# solution | R project |
| Solution | sheet (if paper solutions), notebook | sheet, notebook | C# solution | sheet with executed code |
| Standalone products | course slides, folder structure | as numPDE, plus course notes | all slides | course notes, all R slides, course slides |
| Names | slug, hash | slug, hash | slug, random key | index, key from `content.yml` |
| Environment | one folder set up once, `src/` grows | as numPDE | in every folder | in every folder |

## 3. Products made together

A task produces a set of output files together from the same input. Each table shows which output files the task
produces in which course ("–" means none) and what has to be provided for it in `lernpfad/`. "HTML→PDF" means
that the PDF is made from the HTML.

### 3.1 Slides

Once per building block. Input: the slide source of the building block, with images, data, handwritten notes and
a project folder.

| Course | Format | Download for the slides | In `lernpfad/` |
|---|---|---|---|
| numPDE | Typst | scaffold notebook (zip), solution notebook (zip) | `folien/_metadata.yml` |
| numMat | Typst | – | `folien/_metadata.yml` |
| Informatik | HTML→PDF | C# project (zip) | `folien/_metadata.yml` |
| Mathematik B, R | HTML→PDF | R project of the slides (zip) | `r-folien/content.yml`, `r-folien/_metadata.yml` |
| Mathematik B, statistics | Typst | – | `statistik-folien/content.yml`, `statistik-folien/_metadata.yml` |

### 3.2 Exercises

Once per sheet. Input: the exercise files of one or more building blocks, with solution code, start code or working
file, and data.

| Course | Format | Material | Solution sheet | Solution code | Other | In `lernpfad/` |
|---|---|---|---|---|---|---|
| numPDE | HTML + Typst | notebook (zip), only with `target` | HTML + Typst, only with paper solutions | notebook (zip) | – | `aufgaben/_metadata.yml` |
| numMat | HTML + Typst | notebook (zip) | HTML + Typst | notebook (zip) | extra downloads (zip) | `aufgaben/_metadata.yml` |
| Informatik | HTML + Typst | C# start code (zip) | – | C# sample solution (zip) | – | `aufgaben/_metadata.yml` |
| Mathematik B | HTML + Typst | folder with working file (zip) | HTML + Typst, code executed | – (in the solution sheet) | – | `aufgaben/content.yml`, `aufgaben/_metadata.yml`, `aufgaben/quarto-template.yml` |

### 3.3 Course notes

Once per course. Input: the course notes chapters of all building blocks.

| Course | Book | In `lernpfad/` |
|---|---|---|
| numMat | HTML pages + Typst | `skript/index.qmd`, `skript/literatur.qmd`, `skript/quarto-template.yml` |
| Mathematik B | HTML pages + PDF | `statistik-skript/content.yml`, `statistik-skript/_quarto.yml`, `statistik-skript/index.qmd`, `statistik-skript/literatur.qmd` |

### 3.4 All slides

Once per course. Input: the slide sources of all building blocks.

| Course | Document | In `lernpfad/` |
|---|---|---|
| Informatik | HTML pages | `folien-alle/_quarto.yml`, `folien-alle/index.qmd` |
| Mathematik B, R | HTML pages | `r-folien-alle/content.yml`, `r-folien-alle/_quarto.yml`, `r-folien-alle/index.qmd` |

### 3.5 Course slides

Once per slide set of the course. Input: the slide source of the course, with an optional folder to download.

| Course | Format | Download | In `lernpfad/` |
|---|---|---|---|
| numPDE | Typst or HTML | folder structure (zip), only for "setting up the folder" | the source itself: `veranstaltung/<name>/folien.qmd`, `veranstaltung/<name>/zip/<name>/` |
| numMat | Typst or HTML | folder structure (zip), only for "setting up the folder" | as numPDE |
| Informatik | – (the introduction is a building block) | – | – |
| Mathematik B | HTML | project of the slides (zip) | `veranstaltung/content.yml`, `veranstaltung/_metadata.yml` (source in `bausteine/veranstaltung/`) |
