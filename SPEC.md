# Specification

## Introduction

Quarto compiles Markdown source files into various target formats. Processing of multiple files is configured on a per-folder basis. However, for a teacher, it is most practical to organize the content of different forms (e.g. notes, exercises) for a course (e.g. calculus) by topic (e.g. sequences, power series). This means that within one source tree, there are files which need to be processed differently. Configuring Quarto to handle this situation is tedious.

The Quarto extension loi-moi (from Vietnamese for 'new path') maps a source material tree organized by topic (the *building blocks*) onto a learning material tree organized by kind of product (the *collections*). Along the way, it can create archives with work files (e.g. C# projects, Positron projects for R) and generate exercise sheets, notebooks (Jupyter, Quarto) and reference solutions from a single source.

Using loi-moi:

1. The teacher
    1. maintains source material in the form of building blocks organized by topic
    1. specifies how loi-moi makes a collection from building blocks
    1. configures Quarto for each collection
1. loi-moi makes the products in the collections
1. Quarto renders the collections into what the students get

Project structure of a fictional math course:

```
source-material/                                     learning-material/
├── 10-convergence/                  folder          ├── _loimoi.yml
│   ├── _about.yml                                   ├── exercises/       collection
│   ├── 10-sequences/                building block  │   ├── _collection.yml
│   │   ├── _about.yml                               │   ├── _quarto.yml
│   │   ├── exercises/               compartment     │   └── …
│   │   │   ├── 10-golden-ratio.qmd                  ├── slides/          collection
│   │   │   ├── 20-fibonacci.qmd                     │   └── …
│   │   │   ├── images/sequence.svg                  └── …
│   │   │   └── src/
│   │   │       ├── fibonacci.jl
│   │   │       └── …
│   │   ├── slides/                  compartment
│   │   │   └── …
│   │   └── …
│   └── 20-series/                   building block
│       └── …
└── 20-functions/                    folder
    ├── _about.yml
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
│   │   ├── 01-convergence-sequences-exercises.zip                   │
│   │   ├── 01-convergence-sequences-exercises-solution-2094a057.qmd │ product
│   │   ├── 01-convergence-sequences-exercises-preview-2094a057.qmd  │
│   │   └── images/sequence.svg                                      ┘
│   ├── 02-convergence-series/                                       ┐ product
│   │   └── …                                                        ⋮
│   └── …
├── slides/c/
│   └── …
└── …

                                │
                             Quarto
                                ▼

__output/exercises/c/
├── 01-convergence-sequences/
│   ├── 01-convergence-sequences-exercises.html
│   └── …
└── …
```

## The overall procedure

How to make products in a collection from the source material

1. Get the recipe for the kind of product in this collection
1. Collect a source kit for each product
1. Use the recipe to make product k from kit k, for k = 1 to N

Remarks:

- The recipe says how to name things; the values come from the product sheet

## Terms

### Source material (crafted by the teacher)

- **Source material** (`source-material/`): folder containing building blocks for one course
- **Building block** (`10-sequences/`): folder for one topic, with one compartment per kind of parts
- **Compartment** (`exercises/`): folder in a building block containing parts of one kind, usable for certain kinds of products
- **Group title** (`group-title`): title shared by several related building blocks

Remarks:

- Building blocks can be arranged in folders, to keep them in order

### Learning material (provided to the students)

- **Learning material** (`learning-material/`): folder containing collections for one course
- **Collection** (`exercises/`): folder containing products of one kind
- **Shelf** (`c/`): folder in a collection where loi-moi puts the products
- **Product** (`c/01-convergence-sequences/`): folder containing related `.qmd` files and supporting material
- **Work files** (e.g. `…-exercises.zip`): supporting material students work with

### Procedure

- **Source kit**: the parts for one product, from the matching compartment of each of its building blocks; provides default values for name and titles
- **Recipe** (`exercises.yml`): sequence of actions that make a product from its source kit
- **Action**: performs one specific task
- **Product sheet**: the values for one product (number, name, titles, …), from k, the source kit and the collection; used in recipes and parts as `${…}`

## Product types

### Exercises

- **Exercise product:** exercise sheet, work files (e.g. a notebook), reference solution and a preview for the teacher
- **Exercise sheet:** several exercises, plus structuring text
- **Exercise:** a task with a title and text, optionally with solution and scaffold

## Source material

Examples for folder layout

```         
flat                    by part                     by subject

source-material/        source-material/            source-material/
├── _templates/         ├── 10-convergence/         ├── theory/
├── 10-sequences/       │   ├── _about.yml          │   ├── sequences/
│   ├── _about.yml      │   ├── 10-sequences/       │   │   ├── exercises/
│   ├── exercises/      │   │   ├── _about.yml      │   │   └── notes/
│   └── slides/         │   │   ├── exercises/      │   └── …
├── 20-series/          │   │   └── notes/          └── programming/
└── …                   │   └── 20-series/              ├── sequences/
                        └── 20-functions/               │   ├── exercises/
                            ├── _about.yml              │   └── slides/
                            └── 10-power-series/        └── …
```

Example for an `_about.yml` file

```yml
group-title: "Convergence"
block-title: "Sequences"
```

Remarks:

- Titles in `_about.yml` (merged along path, optional)
- Building blocks identified by their path in the source material, with numbers (e.g. `10-convergence/10-sequences`)
- Leading numbers stripped in names derived from it (e.g. `${block-path}`: `convergence-sequences`)
- Compartment names in English or German, e.g. `exercises/` or `aufgaben/`
- Folders and files starting with `_` or `.` ignored, also Quarto's `…_files` folders
- Folders of a compartment (e.g. `images/`, `data/`) copied into the folder of the product (a zipped notebook contains only the notebook); error if two compartments of the product have a file of the same name that differs. Special folders, not in work files: `src/` (code of the solution, copied) and `zip/<name>/` (extra download, becomes `<name>.zip`)

## Learning material

Examples for folder layout

```         
learning-material/
├── _loimoi.yml             settings for the course (optional)
├── exercises/              collection, by convention
│   ├── _collection.yml     empty
│   ├── _quarto.yml
│   └── c/                  shelf
├── theory-slides/          collection, with configuration
│   ├── _collection.yml
│   ├── _quarto.yml
│   └── c/
├── handout/                Quarto project, not a collection
│   └── _quarto.yml
└── …
```

Example for `learning-material/_loimoi.yml`

```yml
site: https://teacher.github.io/calculus            # defaults to the Git remote
name: "${title-slug}"                               # for all collections
```

Example for `learning-material/exercises/_collection.yml`

```yml
first-number: 1                                     # number of the first product
products:                                           # one entry per product
  - blocks: [10-convergence/10-sequences]           # name and titles from the building block
  - blocks: [10-convergence/20-series]
  - blocks: [20-functions/10-power-series, 20-functions/20-continuity]
    name: functions-power-series-continuity         # name and titles set
    product-title: Power series and continuity
    group-title: Functions
```

Remarks:

- Products put on the shelf `c/` (in `.gitignore`)
- A collection is a folder with a `_collection.yml`, which may be empty
- Settings for the course in `_loimoi.yml`, for a collection in `_collection.yml`; some may be in both, then the collection's value applies (see the appendix)
- Sensible defaults for all settings
- `.qmd` files of a compartment combined in name order, compartments of a product in the given order
- Product `name` used in file names; `product-title` and `group-title` used in titles

### Quarto configuration

Each collection is a Quarto project of its own type (e.g. `default` for exercises, `book` for course notes), with `_extensions` as a symlink to the extensions folder at the top (Quarto finds extensions only inside the project). Settings shared by collections in a file, e.g. `learning-material/_common.yml`:

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

loi-moi uses the collection's Quarto configuration as Quarto resolves it (with `metadata-files`): `lang` and `output-dir`.

### Link pages

On every render of a collection, loi-moi writes two pages with the links to the products of all collections of the learning material (folders with a `_collection.yml`), not published, in `.gitignore`:

- `links.html`: links to the local output, to check
- `links-site.html`: links to the published site

### Recipes

A recipe is a YAML file with the sequence of actions that make a product from its source kit.

The recipe is selected in `_collection.yml`, otherwise by convention:

```yml
recipe: exercises
options:
  work-files: folder
```

Example for a recipe with an option

```yml
options:
  variant:
    values: [a, b, c]
    default: a

actions:
  - quarto-file:
      name: "${base-name}-always"                  # for every value
      process: [...]

  - quarto-file:
      when: {variant: a}
      name: "${base-name}-only-a"
      process: [...]

  - quarto-file:
      when: {variant: b}
      name: "${base-name}-only-b"
      process: [...]
```

Remarks:

- Own files (`conventions.yml`, `recipes/`, `words/`, `code-replacements.yml`) in `_loimoi/`, the first one found upward from the collection folder
- Recipe and compartment of each collection from `conventions.yml` (e.g. `aufgaben/` uses the recipe `exercises` and the compartments `aufgaben/`); own conventions in `_loimoi/conventions.yml`
- Source material folder set with `source-material` in `_loimoi.yml`, otherwise found upward from the collection folder, named after one of the names in `conventions.yml` (`source-material/` or `bausteine/`); error if there is none, or several in the same folder
- Predefined recipes come with loi-moi; own recipes in `_loimoi/recipes/` override them by name
- A recipe might declare options
- Use options with care (readability, maintenance)

### Exercises

#### Writing exercises

````markdown
::: {#exr-fibonacci}
## How fast do the ratios converge?

Implement the function `fibonacci_ratios(F)`, …

::: {.lm-scaffold}
```{python}
def fibonacci_ratios(F):
    ...
```
:::

::: {.lm-solution}
```{python}
from src.fibonacci import fibonacci_ratios
```
:::
:::
````

- An exercise is a Quarto div with an id `exr-…` (Quarto's cross-reference prefix, so `@exr-fibonacci` works); its title is the first heading inside
- Several exercises per `.qmd` file are possible; text outside exercises is structuring text for the sheet
- What goes where: see the principle in the appendix, under Actions

#### Products

Example for an exercises collection

```
learning-material/exercises/c/
├── 01-convergence-sequences/                                        product
│   ├── 01-convergence-sequences-exercises.qmd                       exercise sheet
│   ├── 01-convergence-sequences-exercises.zip                       work files
│   ├── 01-convergence-sequences-exercises-solution-2094a057.qmd     reference solution
│   ├── 01-convergence-sequences-exercises-preview-2094a057.qmd      preview for the teacher
│   └── images/sequence.svg                                          folders of the compartments
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

actions:
  - quarto-file:
      name: "${base-name}-${exercises}"
      title: "${exercise-sheet} ${n}"
      subtitle: "${full-title}"
      process: [exercise-sheet]
      link: "${exercise-sheet}"

  - quarto-file:
      name: "${base-name}-${exercises}-${solution}-${hash}"
      title: "${solutions-to-exercise-sheet} ${n}"
      subtitle: "${full-title}"
      process: [exercise-solution, attach-src, show-markers]
      link: "${solution-label}"

  - quarto-file:                                 # what the teacher writes, scaffold and solution marked
      name: "${base-name}-${exercises}-${preview}-${hash}"
      title: "${exercise-sheet} ${n}"
      subtitle: "${full-title}"
      process: [attach-src, show-markers]
      link: "${preview-label}"

  - quarto-file:                                 # single Jupyter notebook
      when: {work-files: notebook}
      name: "${base-name}-${exercises}"
      title: "${exercise-sheet} ${n}"
      process: [exercise-scaffold]
      format: ipynb
      zip: true                                  # notebook deleted after zip
      provides: work-files

  - quarto-file:                                 # folder, e.g. a project
      when: {work-files: folder}
      name: "${base-name}-${exercises}/${name}-${exercises}"
      title: "${exercise-sheet} ${n}"
      process: [exercise-scaffold]

  - archive:                                     # folder deleted after zip
      when: {work-files: folder}
      name: "${base-name}-${exercises}"
      provides: work-files
      add:
        - /_templates/exercises/_quarto.yml
        - /_templates/exercises/exercises.code-workspace: "${name}-${exercises}.code-workspace"
```

### Slides

The predefined recipe `slides.yml`, one slide set per product; format and subtitle from the collection's Quarto configuration (e.g. `_metadata.yml`):

```yml
actions:
  - quarto-file:
      name: "${base-name}"
      title: "${full-title}"
      link: "${slides-label}"
```

E.g. `01-convergence-sequences.qmd`; for slides rendered as PDF, `link-format: pdf`.

## Usage

- `quarto render` in a collection folder makes and renders that collection.
- loi-moi runs before every render, also for a single file or a preview, so nothing is stale.
- The shelf is cleared first.
- An error stops processing with a message naming the file.

## Appendix

### Settings

In: `course` for `learning-material/_loimoi.yml`, `collection` for `_collection.yml`, `both` where the collection's value overrides the course's.

| Setting | In | Meaning | Default |
|---|---|---|---|
| `site` | course | URL of the published site | from the Git remote |
| `source-material` | course | path to the source material folder, relative to the learning material folder | found upward from the collection folder |
| `lang` | both | language of the words in file names and titles (`en`, `de`) | Quarto's `lang`, otherwise from the collection's name via `conventions.yml` (`aufgaben`: `de`), otherwise `en` |
| `name` | both | default name of the products, with placeholders (e.g. `${block-folder}`, `${title-slug}`) | `${block-path}` |
| `folder-name` | both | name of the product folder, with placeholders (e.g. `blatt-${nn}`) | `${nn}-${name}` |
| `base-name` | both | base name of the product's files, with placeholders (e.g. `aufgabenblatt-${nn}`); the recipe adds its suffix (e.g. `-${exercises}`) | `${folder-name}` |
| `link-format` | both | extension of the linked files on the link pages (`html`, `pdf`), e.g. `pdf` for slides rendered with Typst | `html` |
| `shelf` | both | folder for the products | `c` |
| `recipe` | collection | recipe that makes the products | from `conventions.yml` |
| `options` | collection | options of the recipe | see the recipe |
| `compartment` | collection | compartment used in each building block (e.g. `slides`) | from `compartments` in `conventions.yml`, by recipe and collection folder name (`aufgaben` with recipe `exercises`: `aufgaben`); error if there is none |
| `products` | collection | one entry per product: `blocks` (paths of building blocks, relative to the source material folder), optional `name`, `product-title`, `group-title` | one product per building block that has the compartment, in folder order |
| `first-number` | collection | number of the first product | `1` |

Other keys are an error, as is a setting in the wrong file, a setting with an invalid value or a missing recipe; checked when the files are read.

### Actions

Keys of every action:

| Key | Meaning | Default |
|---|---|---|
| `name` | file written, relative to the product folder, without extension, with placeholders | required |
| `when` | option values for which the action runs, e.g. `{work-files: folder}` | always |
| `provides` | placeholder filled with the URL of the file, e.g. `work-files` | – |

`quarto-file`: combines the `.qmd` files of the compartments, runs the processing steps and writes a Quarto file or a Jupyter notebook; the folders of the compartments are copied next to it.

| Key | Meaning | Default |
|---|---|---|
| `title`, `subtitle` | title and subtitle in the header, with placeholders | from the parts |
| `process` | processing steps, in this order | none |
| `format` | `qmd` or `ipynb` | `qmd` |
| `zip` | file zipped, the original deleted | `false` |
| `link` | label on the link pages, with placeholders | not linked |

`archive`: copies the files of `add` into the folder `name`, zips it and deletes the folder.

| Key | Meaning | Default |
|---|---|---|
| `add` | files and folders to add (see below) | none |

Entries of `add`:

- `path`: relative to the compartments of the product, taken from every compartment that has it
- `/path`: relative to the source material folder, for files shared by all products (e.g. `/_templates/…`)
- `path: new-name`: copied under a new name

Processing steps (`process`):

| Step | Does |
|---|---|
| `exercise-sheet` | keeps what belongs on the exercise sheet |
| `exercise-scaffold` | keeps what belongs into the work files |
| `exercise-solution` | keeps what belongs into the solution |
| `attach-src` | adds the files of `src/` as code blocks (not executed, with line numbers) in an appendix, headed e.g. `src/truss.py`; not the files with `lm-no-attach` in the first line (e.g. `# lm-no-attach`), such as copies of code from an earlier sheet |
| `show-markers` | marks in HTML what goes into the scaffold, the solution, or both (given code): a colored line on the left with a label |

After each step, the code replacements from `code-replacements.yml` for that step and the language of the cell are applied to the code of executable cells. Predefined: for Julia in the scaffold, `include("src/` becomes `# includet("src/` (Quarto renders with `include`, students use Revise). Own replacements in `_loimoi/code-replacements.yml` replace the predefined ones:

```yml
replacements:
  - scope:                      # all steps or all languages if missing
      steps: [exercise-scaffold]
      languages: [julia]
    replace: 'include("src/'
    with: '# includet("src/'
```

What the three exercise steps keep:

**Principle:** text is for the sheet, code is for the scaffold and the solution, headings in exercises are for all three. Markers override this: `.lm-sheet`, `.lm-scaffold`, `.lm-solution` put their content into exactly that document, wherever they are. Unmarked code is *given code*: students run it but don't write it. In the solution, given code runs but is not shown (`include: false`, unless the cell sets `include` itself).

- The setup cell (`#| label: setup`) goes into all three. It stands at the top level, never inside a div. Setup cells are merged into one, each line once, so they may only contain single-line statements in one language.
- In the scaffold, an exercise with nothing left but headings is dropped; the divs of exercises and of `.lm-scaffold` are left out, only their content stays.
- Errors: a setup cell inside a div, a setup cell with a statement over several lines (checked once per product on the `.qmd` files read together, as mistakes seen in practice; other misuse is not checked).

Code in `src/` growing from sheet to sheet: each building block has the code as of its point in the course (e.g. `src/truss.py`), the students extend their own copy from sheet to sheet.

### Placeholders

Filled in per product when the recipe runs: in recipes (names, titles, links) and in the header and text of the parts; not in the opening lines of divs (fixed: exercise ids, markers, Quarto classes) and not in code cells, whose code may use `${…}` itself (shell, JavaScript).

Configurable globally:

| Placeholder | Usage | Default | Example |
|---|---|---|---|
| `${exercise-sheet}`, `${exercises}`, … | words in names, titles and text added by steps | `words/<lang>.yml`, overridable in `_loimoi/words/` | `Aufgabenblatt`, `aufgaben` |

Configurable in `_loimoi.yml` or `_collection.yml`:

| Placeholder | Usage | Default | Example |
|---|---|---|---|
| `${site}` | links to the published site in the text | from the Git remote | `https://teacher.github.io/calculus` |
| `${group-title}` | titles | `group-title` in `_about.yml` | `Convergence` |
| `${product-title}` | titles | `block-title` in `_about.yml` | `Sequences` |
| `${name}` | part of names | `${block-path}` | `convergence-sequences` |
| `${folder-name}` | product folder | `${nn}-${name}` | `01-convergence-sequences` |
| `${base-name}` | file names, recipe adds suffix | `${folder-name}` | `01-convergence-sequences` |

Remarks:

- `${product-title}` is required: `product-title` in the product or `block-title` in `_about.yml`.
- `${group-title}` is optional.
- The setting `name` is the default for all products, with placeholders (e.g. `${block-folder}`, `${title-slug}`); `name` in a product sets its name.

Derived:

| Placeholder | Usage | Value | Example |
|---|---|---|---|
| `${n}` | titles | number of the product | `1` |
| `${nn}` | names | `${n}` with two digits | `01` |
| `${full-title}` | titles, link pages | `${group-title}: ${product-title}` | `Convergence: Sequences` |
| `${block-path}` | `name` | path of the first building block, leading numbers stripped, `/` as `-` | `convergence-sequences` |
| `${block-folder}` | `name` | last folder of that path, leading number stripped | `sequences` |
| `${title-slug}` | `name` | slug of `${full-title}` | `convergence-sequences` |
| `${hash}` | names students can't guess | from `${nn}-${name}` | `2094a057` |
| `${work-files}` | download link in the sheet | URL of the file of the action with `provides: work-files` | `…/01-convergence-sequences/01-convergence-sequences-exercises.zip` |

Remarks:

- Without `${group-title}`, `${full-title}` is only `${product-title}`.
