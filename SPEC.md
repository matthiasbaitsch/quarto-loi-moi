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
│   ├── 01-convergence-sequences-exercises.qmd                    ┐
│   ├── 01-convergence-sequences-exercises.zip                    │ product
│   ├── 01-convergence-sequences-exercises-solution-2094a057.qmd  ┘
│   ├── 02-convergence-series-exercises.qmd                       ┐ product
│   ├── …
│   ├── images/sequence.svg
│   └── …
├── slides/c/
│   └── …
└── …

                                │
                             Quarto
                                ▼

…/__output/c/
├── 01-convergence-sequences-exercises.html
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
- **Product** (in `c/`): set of related files
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
- Folders starting with `_` ignored

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
  building block

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

- Default recipe selected by the name of the collection
- Predefined recipes come with loi-moi; own recipes in `learning-material/_recipes/` override them by name
- A recipe might declare options
- Use options with care (readability, maintenance)

### Exercises

#### Series

Example for exercise series

```
learning-material/exercises/c/
├── 01-convergence-sequences-exercises.qmd                       exercise sheet
├── 01-convergence-sequences-exercises.zip                       work files
├── 01-convergence-sequences-exercises-solution-2094a057.qmd     reference solution
├── 02-convergence-series-exercises.qmd                          exercise sheet
├── …
├── images/sequence.svg                                          used by exercise sheet
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
  - name: "${nn-name}-exercises"
    title: "Exercise sheet ${n}"
    subtitle: "${group-title}: ${product-title}"
    process: [exercise-sheet]

  - name: "${nn-name}-exercises-solution-${hash}"
    title: "Solutions to exercise sheet ${n}"
    process: [exercise-solution]

  - when: {work-files: notebook}                 # single Jupyter notebook
    name: "${nn-name}-exercises"
    title: "Exercise sheet ${n}"
    process: [exercise-scaffold, jupyter, zip]   # source deleted after zip
    provides: work-files

  - when: {work-files: folder}                   # folder, e.g. a project
    name: "${nn-name}-exercises/${name}-exercises"
    title: "Exercise sheet ${n}"
    process: [exercise-scaffold]

archives:                                        # folder deleted after zip
  - when: {work-files: folder}
    name: "${nn-name}-exercises"
    provides: work-files
    add:                                         # see "Paths in add"
      - data/
      - /_templates/exercises/_quarto.yml
      - /_templates/exercises/exercises.code-workspace: "${name}-exercises.code-workspace"
```

## Usage

- `quarto render learning-material` prepares and renders all collections.
- `quarto render learning-material/<collection>` prepares and renders only that collection.
- loi-moi runs before every render, also for a single file or a preview, so nothing is stale.
- `c/` is cleared first.
- An error stops processing with a message naming the file.

## Appendix

### Settings in `loimoi.yml`

| Setting | Meaning | Default |
|---|---|---|
| `output` | folder for the prepared material | `c` |
| `first-number` | number of the first product | `1` |
| `site` | URL of the published site | from the Git remote |
| `products` | one entry per product: `ingredients`, optional `name`, `product-title`, `group-title` | one product per building block with an ingredient named like the collection, in folder order |
| `recipe` | recipe that makes the products | name of the collection |
| `options` | options of the recipe | see the recipe |

### Actions

Defined by the recipe, run per product in this order:

| Action | Makes | Keys |
|---|---|---|
| `quarto-files` | Quarto files | `name`, `title`, `subtitle`, `process`, `when`, `provides` |
| `archives` | zip files from a folder | `name`, `add`, `when`, `provides` |

Paths in `add`:

- `data/`: relative to the ingredients of the product, i.e. `data/` from every ingredient folder that has one
- `/_templates/…`: a leading `/` means relative to `building-blocks/`, for files shared by all products
- `path: new-name` copies under a new name

Processing steps (`process`):

| Step | Does |
|---|---|
| `exercise-sheet` | keeps what belongs on the exercise sheet |
| `exercise-scaffold` | keeps what belongs into the work files |
| `exercise-solution` | keeps what belongs into the solution |
| `jupyter` | converts to a Jupyter notebook, without running it |
| `zip` | zips the file and deletes it |

What the three exercise steps keep:

| Content | `exercise-sheet` | `exercise-scaffold` | `exercise-solution` |
|---|---|---|---|
| exercise title | ✓ | ✓ | ✓ |
| `setup` cell | ✓ | ✓ | ✓ |
| text outside exercises (e.g. headings) | ✓ | – | – |
| unmarked text (exercise text) | ✓ | – | – |
| unmarked code (given code, e.g. loading data) | – | ✓ | ✓ |
| `.lm-sheet` | ✓ | – | – |
| `.lm-scaffold` | – | ✓ | – |
| `.lm-solution` | – | empty code cell (1) | ✓ |

(1) Only if the solution has code and the exercise has no scaffold.

### Placeholders

Filled in per product when the recipe runs:

| Placeholder | Value | Example |
|---|---|---|
| `${n}` | number of the product | `1` |
| `${name}` | identifies the product in file names; `name` of the product, default: path of the first building block, leading numbers stripped, `/` as `-` | `convergence-sequences` |
| `${nn-name}` | `${n}` with two digits, then `${name}` | `01-convergence-sequences` |
| `${hash}` | first 8 hex digits of `sha1("87362-" + nn-name)`, for names that cannot be guessed | `2094a057` |
| `${group-title}` | `group-title` of the product, default: `group-title` of the first building block | `Convergence` |
| `${product-title}` | `product-title` of the product, default: `block-title` of the first building block | `Sequences` |
| `${site}` | URL of the published site | `https://teacher.github.io/calculus` |
| `${work-files}` | URL of the file of the action with `provides: work-files` | `…/01-convergence-sequences-exercises.zip` |
