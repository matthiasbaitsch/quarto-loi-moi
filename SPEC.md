# Specification

## Introduction

Quarto compiles Markdown source files into various target formats. Processing of multiple files is configured on a per-folder basis. However, for a teacher, it is most practical to organize the content of different forms (e.g. notes, exercises) for a course (e.g. calculus) by topic (e.g. sequences, power series). This means that within one source tree, there are files which need to be processed differently. Configuring Quarto to handle this situation is tedious.

The Quarto extension loi-moi (from Vietnamese for 'new path') maps a source tree organized by topic (the *building blocks*) onto several source trees organized by target form (the *collections*). Along the way, it can create archives with work files (e.g. C# projects, Positron projects for R) and generate exercise sheets, notebooks (Jupyter, Quarto) and reference solutions from a single source.

Using loi-moi:

1.  the teacher
    1. maintains building blocks of content, organized by topic
    1. specifies the mapping from the building blocks onto collections
    1. configures Quarto for each collection
1.  loi-moi prepares the products in the collections
1.  Quarto renders each collection into what the students get

Project structure of a fictional math course:

```
building-blocks/                                     learning-material/
├── 10-convergence/                  group           ├── loimoi.yml
│   ├── about.yml                                    ├── exercises/       collection
│   ├── 10-sequences/                building block  │   ├── loimoi.yml
│   │   ├── about.yml                                │   ├── _quarto.yml
│   │   ├── exercises/               ingredient      │   └── …
│   │   │   ├── 10-golden-ratio.qmd                  ├── slides/          collection
│   │   │   ├── 20-fibonacci.qmd                     │   └── …
│   │   │   ├── images/sequence.svg                  └── …
│   │   │   └── src/
│   │   │       ├── fibonacci.jl
│   │   │       └── …
│   │   ├── slides/                  ingredient
│   │   │   └── …
│   │   └── …
│   └── 20-series/                   building block
│       └── …
└── 20-functions/                    group
    ├── about.yml
    ├── 10-power-series/             building block
    │   └── …
    └── …

          │                                          │
          └──────────────── loi-moi ─────────────────┘
                               ▼

learning-material/
├── exercises/c/
│   ├── 01-convergence-sequences/                                    ┐
│   │   ├── 01-convergence-sequences-exercises.qmd                   │
│   │   ├── 01-convergence-sequences-exercises.zip                   │ product
│   │   ├── 01-convergence-sequences-exercises-solution-2094a057.qmd │
│   │   └── images/sequence.svg                                      ┘
│   ├── 02-convergence-series/                                       ┐ product
│   │   └── …                                                        ┘
│   └── …
├── slides/c/
│   └── …
└── …

                                │
                             Quarto
                                ▼

…/__output/c/
├── 01-convergence-sequences/
│   ├── 01-convergence-sequences-exercises.html
│   └── …
└── …
```

## Terms

Maintained by the teacher:

- **Building blocks** (`building-blocks/`): available content
- **Group** (e.g. `10-convergence/`): related building blocks
- **Building block** (`10-sequences/`): content on one topic
- **Ingredient** (`exercises/`): content of one form

Prepared for the students:

- **Learning material** (`learning-material/`): all collections for one course
- **Collection** (`exercises/`): set of products of one form
- **Product** (a folder in `c/`): set of related files
- **Work files** (e.g. `…-exercises.zip`): material students work with

Exercises:

- **Exercise product:** exercise sheet, work files (e.g. a notebook) and reference solution
- **Exercise sheet:** several exercises, plus structuring text
- **Exercise:** a task with a title and text, optionally with solution and scaffold

## Building blocks

Examples for folder layout

```         
flat                    by part                     by subject

building-blocks/        building-blocks/            building-blocks/
├── _templates/         ├── 10-convergence/         ├── theory/
├── 10-sequences/       │   ├── about.yml           │   ├── sequences/
│   ├── about.yml       │   ├── 10-sequences/       │   │   ├── exercises/
│   ├── exercises/      │   │   ├── about.yml       │   │   └── notes/
│   └── slides/         │   │   ├── exercises/      │   └── …
├── 20-series/          │   │   └── notes/          └── programming/
└── …                   │   └── 20-series/              ├── sequences/
                        └── 20-functions/               │   ├── exercises/
                            ├── about.yml               │   └── slides/
                            └── 10-power-series/        └── …
```

Example for an `about.yml` file

```yml
group-title: "Sequences and Series: Convergence"
block-title: "Sequences"
```

Remarks:

- Building block content described by `about.yml` (merged along path, optional)
- Building blocks identified by path
- Leading numbers in names stripped
- Folder names in English or German, e.g. `exercises/` or `aufgaben/`
- Folders and files starting with `_` or `.` ignored, also Quarto's `…_files` folders
- Folders of an ingredient (e.g. `images/`, `data/`) copied into the folder of the product (a zipped notebook
  contains only the notebook); error if two ingredients of the product have a file of the same name that differs. Special folders, not in work files:
  `src/` (code of the solution, copied) and `zip/<name>/` (extra download, becomes `<name>.zip`)

## Learning material

Examples for folder layout

```         
by convention               with configuration

learning-material/          learning-material/
├── exercises/              ├── loimoi.yml
│   └── c/                  ├── exercises/
├── slides/                 │   ├── loimoi.yml
│   └── c/                  │   └── c/
├── notes/                  ├── theory-slides/
│   └── c/                  │   ├── loimoi.yml
├── slides-all/             │   └── c/
│   └── c/                  └── …
└── …
```

Example for general section of a `loimoi.yml` file

```yml
output: c                                           # folder for the prepared material
first-number: 1                                     # number of the first product
site: https://teacher.github.io/calculus            # defaults to github remote

products:                                           # one entry per product
  - ingredients: [convergence/sequences/exercises]  # name and titles from the building block
  - ingredients: [convergence/series/exercises]
  - ingredients: [functions/power-series/exercises, functions/continuity/exercises]
    name: functions-power-series-continuity         # name and titles set
    product-title: Power series and continuity
    group-title: Functions

...
```

Remarks:

- Material processed by loi-moi into folder `c/` (in `.gitignore`)
- Configuration in `loimoi.yml` (optional, merged along path)
- Sensible defaults for all settings
- `.qmd` files of an ingredient combined in name order, ingredients of a product in the given order
- Product `name` used in file names; `product-title` and `group-title` used in titles; all default to the first
  building block, the name from its path or, with `product-naming: titles`, as slug of `group-title` and
  `product-title` (`Stabtragwerke`, `Stabendkräfte`: `stabtragwerke-stabendkraefte`)

### Quarto configuration

Each collection is a Quarto project of its own type (e.g. `default` for exercises, `book` for course notes), with
`_extensions` as a symlink to the extensions folder at the top (Quarto finds extensions only inside the project).
Settings shared by collections in a file, e.g. `learning-material/_common.yml`:

```yml
project:
  pre-render: _extensions/loimoi/pre-render.ts
  render:
    - c/**/*.qmd
lang: en
```

`learning-material/exercises/_quarto.yml`:

```yml
project:
  type: default
  output-dir: ../../__output/exercises
metadata-files:
  - ../_common.yml
```

### Link pages

On every render of a collection, loi-moi writes two pages with the links to the products of all collections of the learning material (folders with a `_quarto.yml` and a recipe in `conventions.yml`; other Quarto projects are skipped), not published, in `.gitignore`:

- `links.html`: links into the rendered output (`output-dir` of each collection), to check locally
- `links-site.html`: the same with the published URLs, to copy into Moodle; `site` is the folder `__output/` in `output-dir`, e.g. `__output/aufgaben/c/…` becomes `<site>/aufgaben/c/…`

Grouped by collection and product (number and `${full-title}`); per product the files of the recipe with a `link`, e.g. in `exercises.yml`:

```yml
  - name: "${nn-name}-${exercises}-${solution}-${hash}"
    link: "${solution-label}"
```

### Recipes

A recipe is a YAML file with the actions that make a product from its ingredients. 

The recipe is selected in `loimoi.yml`:

```yml
recipe: exercises
options:
  work-files: folder
```

Example for a recipe with an option

```yml
options:
  format:
    values: [a, b, c]
    default: a

quarto-files:
  - name: "${nn-name}-always"                    # for every value
    process: [...]

  - when: {format: a}
    name: "${nn-name}-only-a"
    process: [...]

  - when: {format: b}
    name: "${nn-name}-only-b"
    process: [...]
```

Remarks:

- Recipe and ingredient folder of each collection from `conventions.yml` (e.g. `aufgaben/` uses the recipe
  `exercises` and the ingredient folders `aufgaben/`); own conventions in `_loimoi/conventions.yml`, the first one
  found upward from the collection folder
- Building blocks folder set with `building-blocks` in `loimoi.yml`, otherwise found upward from the collection folder, named after one of the names in `conventions.yml` (`building-blocks/` or `bausteine/`)
- Predefined recipes come with loi-moi; own recipes in `learning-material/_loimoi/recipes/` override them by name
- A recipe might declare options
- `name` is relative to the folder of the product (`${nn-name}/`)
- Use options with care (readability, maintenance)

### Exercises

#### Series

Example for exercise series

```
learning-material/exercises/c/
├── 01-convergence-sequences/                                        product
│   ├── 01-convergence-sequences-exercises.qmd                       exercise sheet
│   ├── 01-convergence-sequences-exercises.zip                       work files
│   ├── 01-convergence-sequences-exercises-solution-2094a057.qmd     reference solution
│   ├── 01-convergence-sequences-exercises-preview-2094a057.qmd      preview for the teacher
│   └── images/sequence.svg                                          folders of the ingredients
├── 02-convergence-series/                                           product
│   └── …
└── …
```

Examples for work files

```
single notebook (as in numPDE)                  Positron project (as in Mathematik B)

01-convergence-sequences-exercises.zip          01-convergence-sequences-exercises.zip
└── 01-convergence-sequences-exercises.ipynb    └── 01-convergence-sequences-exercises/
                                                    ├── convergence-sequences-exercises.code-workspace
                                                    ├── convergence-sequences-exercises.qmd
                                                    ├── _quarto.yml
                                                    └── data/fibonacci.csv
```

#### Recipe

The predefined recipe `exercises.yml`:

```yml
options:
  work-files:
    values: [notebook, folder]
    default: notebook

quarto-files:
  - name: "${file-name}"
    title: "${exercise-sheet} ${n}"
    subtitle: "${full-title}"
    process: [exercise-sheet]
    link: "${exercise-sheet}"

  - name: "${file-name}-${solution}-${hash}"
    title: "${solutions-to-exercise-sheet} ${n}"
    subtitle: "${full-title}"
    process: [exercise-solution, attach-src, show-markers]
    link: "${solution-label}"

  - name: "${file-name}-${preview}-${hash}"   # what the teacher writes, scaffold and solution marked
    title: "${exercise-sheet} ${n}"
    subtitle: "${full-title}"
    process: [attach-src, show-markers]
    link: "${preview-label}"

  - when: {work-files: notebook}                 # single Jupyter notebook
    name: "${file-name}"
    title: "${exercise-sheet} ${n}"
    process: [exercise-scaffold]
    format: ipynb
    zip: true                                    # notebook deleted after zip
    provides: work-files

  - when: {work-files: folder}                   # folder, e.g. a project
    name: "${file-name}/${name}-${exercises}"
    title: "${exercise-sheet} ${n}"
    process: [exercise-scaffold]

archives:                                        # folder deleted after zip
  - when: {work-files: folder}
    name: "${file-name}"
    provides: work-files
    add:                                         # see "Paths in add"
      - /_templates/exercises/_quarto.yml
      - /_templates/exercises/exercises.code-workspace: "${name}-${exercises}.code-workspace"
```

### Slides

The predefined recipe `slides.yml`, one slide set per product; format and subtitle from the collection's Quarto configuration (e.g. `_metadata.yml`):

```yml
quarto-files:
  - name: "${file-name}"
    title: "${full-title}"
    link: "${slides-label}"
```

With `file-name: "${nn-name}"` in `loimoi.yml`, e.g. `01-convergence-sequences.qmd`; for slides rendered as PDF, `link-format: pdf`.

## Usage

- `quarto render` in a collection folder prepares and renders that collection.
- loi-moi runs before every render, also for a single file or a preview, so nothing is stale.
- `c/` is cleared first.
- An error stops processing with a message naming the file.

## Appendix

### Settings in `loimoi.yml`

| Setting | Meaning | Default |
|---|---|---|
| `output` | folder for the prepared material | `c` |
| `first-number` | number of the first product | `1` |
| `lang` | language of the words in file names and titles (`en`, `de`) | from the collection's name via `conventions.yml` (`aufgaben`: `de`), otherwise `en` |
| `site` | URL of the published site | from the Git remote |
| `building-blocks` | path to the building blocks folder, relative to the learning material folder | found upward from the collection folder |
| `products` | one entry per product: `ingredients`, optional `name`, `product-title`, `group-title` | one product per building block with the ingredient folder from `conventions.yml`, in folder order |
| `file-name` | base name of the product's files, with placeholders (e.g. `aufgabenblatt-${nn}`) | `${nn-name}-${exercises}` |
| `product-naming` | default product names from the path of the first building block (`path`) or from the titles (`titles`) | `path` |
| `link-format` | extension of the linked files on the link pages (`html`, `pdf`), e.g. `pdf` for slides rendered with Typst | `html` |
| `recipe` | recipe that makes the products | from `conventions.yml` |
| `options` | options of the recipe | see the recipe |

Other keys are an error, as is a setting with an invalid value or a missing recipe; checked when `loimoi.yml` is read.

### Actions

Defined by the recipe, run per product in this order:

| Action | Makes | Keys |
|---|---|---|
| `quarto-files` | Quarto files or Jupyter notebooks | `name`, `title`, `subtitle`, `process`, `format` (`qmd`, `ipynb`), `zip`, `when`, `provides`, `link` |
| `archives` | zip files from a folder | `name`, `add`, `when`, `provides` |

Paths in `add`:

- `path`: relative to the ingredients of the product, i.e. `path` from every ingredient folder that has one (the
  folders of the ingredients are already there)
- `/_templates/…`: a leading `/` means relative to `building-blocks/`, for files shared by all products
- `path: new-name` copies under a new name

Processing steps (`process`):

| Step | Does |
|---|---|
| `exercise-sheet` | keeps what belongs on the exercise sheet |
| `exercise-scaffold` | keeps what belongs into the work files |
| `exercise-solution` | keeps what belongs into the solution |
| `attach-src` | adds the files of `src/` as code blocks (not executed, with line numbers) in an appendix, headed e.g. `src/truss.py`; not the files with `lm-no-attach` in the first line (e.g. `# lm-no-attach`), such as copies of code from an earlier sheet |
| `show-markers` | marks in HTML what goes into the scaffold, the solution, or both (given code): a colored line on the left with a label |

After each step, the code replacements from `code-replacements.yml` for that step and the language of the cell, in the code of executable cells. Predefined: for Julia in the scaffold, `include("src/` becomes `# includet("src/` (Quarto renders with `include`, students use Revise). Own replacements in `learning-material/_loimoi/code-replacements.yml` replace the predefined ones:

```yml
replacements:
  - scope:                      # all steps or all languages if missing
      steps: [exercise-scaffold]
      languages: [julia]
    replace: 'include("src/'
    with: '# includet("src/'
```

What the three exercise steps keep:

**Principle:** text is for the sheet, code is for the scaffold and the solution, headings in exercises are for all
three. Markers override this: `.lm-sheet`, `.lm-scaffold`, `.lm-solution` put their content into exactly that
document, wherever they are. Unmarked code is *given code*: students run it but don't write it. In the solution, given code runs but is not
shown (`include: false`, unless the cell sets `include` itself).

- The setup cell (`#| label: setup`) goes into all three. Setup cells are merged into one, each line once, so they may
  only contain single-line statements in one language.
- In the scaffold, an exercise with nothing left but headings is dropped; the divs of exercises and of `.lm-scaffold` are left out, only their content stays.
- Errors: a marker or setup cell inside a marker, an exercise inside another div.

Code in `src/` growing from sheet to sheet: each building block has the code as of its point in the course (e.g. `src/truss.py`), the students extend their own copy from sheet to sheet.

### Placeholders

Filled in per product when the recipe runs:

| Placeholder | Value | Example |
|---|---|---|
| `${n}` | number of the product | `1` |
| `${name}` | identifies the product in file names; `name` of the product, default: path of the first building block, leading numbers stripped, `/` as `-` | `convergence-sequences` |
| `${nn}` | `${n}` with two digits | `01` |
| `${nn-name}` | `${nn}-${name}` | `01-convergence-sequences` |
| `${hash}` | first 8 hex digits of `sha1("87362-" + nn-name)`, for names that cannot be guessed | `2094a057` |
| `${group-title}` | `group-title` of the product, default: `group-title` of the first building block | `Convergence` |
| `${product-title}` | `product-title` of the product, default: `block-title` of the first building block | `Sequences` |
| `${full-title}` | `${group-title}: ${product-title}`, or only `${product-title}` if the product has no group title | `Convergence: Sequences` |
| `${file-name}` | `file-name` from `loimoi.yml`, its placeholders replaced | `01-convergence-sequences-exercises` |
| `${site}` | URL of the published site | `https://teacher.github.io/calculus` |
| `${work-files}` | URL of the file of the action with `provides: work-files` | `…/01-convergence-sequences/01-convergence-sequences-exercises.zip` |
| `${exercise-sheet}`, `${exercises}`, … | words in the language of the collection (`collection-languages` in `conventions.yml`, `aufgaben` German, otherwise English), from `words/<language>.yml` | `Aufgabenblatt`, `aufgaben` |
