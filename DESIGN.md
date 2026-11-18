# Design

How loi-moi does what SPEC describes.

## Overview

Running `quarto render` in a collection folder triggers execution of loi-moi's `pre-render` script (named in the
collection's `_quarto.yml`, run in the collection folder) which

1. collects required information, most importantly
    1. a representation of the `building-blocks` tree
    1. the configuration from `loimoi.yml`
    1. the list of products
    1. the recipe
1. clears `c/`
1. runs the recipe's actions for each product

Remarks:

- any error stops execution

## Tools

### Model of the building block source tree

Provide simple access to ingredients.

```mermaid
classDiagram
  direction LR
  BuildingBlockTree "1" --> "*" BuildingBlock
  BuildingBlockTree ..> Basket : creates
  Basket "1" --> "*" BuildingBlock
  Folder <|-- BuildingBlock
  class BuildingBlockTree {
    rootFolder: string
    ingredients(paths: string[]) Basket
    defaultPaths(folderName: string) string[][]
  }
  class Folder {
    rootFolder: string
    path: string
    name(options) string
    files(pattern, options) string[]
    folders(pattern, options) string[]
  }
  class BuildingBlock {
    title: string?
    groupTitle: string?
  }
  class Basket {
    name(options) string
    title() string?
    groupTitle() string?
    isEmpty() bool
    files(pattern, options) string[]
    folders(pattern, options) string[]
  }
```

Remarks:

- `Basket`: the ingredients for one product; `name()`, `title()`, `groupTitle()` are the defaults for the product,
  from the first building block
- `rootFolder`: absolute path to building block tree; `Folder` needs it to read from disk and to return paths
  relative to it
- `name(options)`: derived from file system path, leading numbers stripped, options `full`, `sep`
- `files(pattern, options)`, `folders(pattern, options)`: paths relative to `rootFolder`, option `absolute`

### Quarto document processing

Make processing of Quarto files simple

#### Model of Quarto document

```mermaid
classDiagram
  direction TD
  QmdDocument "1" --> "*" QmdNode
  QmdNode <|-- QmdText
  QmdNode <|-- QmdDiv
  QmdNode <|-- QmdCodeCell
  QmdDiv "1" --> "*" QmdNode
  class QmdDocument {
    header: Record
    nodes: QmdNode[]
    parse(text: string)$ QmdDocument
    read(...files: string[])$ QmdDocument
    text() string
    ipynb() string
    write(file: string)
    map(f: QmdNode → QmdNode[]) QmdDocument
    forEach(f: QmdNode → void)
  }
  class QmdNode {
    <<abstract>>
    text() string
    map(f: QmdNode → QmdNode[]) QmdNode[]
    forEach(f: QmdNode → void)
  }
  class QmdText {
    lines: string[]
  }
  class QmdDiv {
    open: string
    close: string
    id: string
    classes: string[]
    children: QmdNode[]
  }
  class QmdCodeCell {
    lines: string[]
    language: string
    options: Record
    executable: boolean
  }
```

Remarks:

- `read(...files)`: headers merged, error if values clash
- `write(file)`: a Jupyter notebook for `.ipynb`, otherwise Quarto
- `map(f)`: each node replaced by `f(node)` (none, itself, or several); a `QmdDiv` maps its children first

#### Processing steps

```mermaid
classDiagram
  direction TD
  Pipeline "1" --> "*" ProcessingStep
  ProcessingStep <|-- ReplacePlaceholders
  ProcessingStep <|-- MergeSetupCells
  ProcessingStep <|-- ExerciseSheet
  ProcessingStep <|-- ExerciseScaffold
  ProcessingStep <|-- ExerciseSolution
  ProcessingStep <|-- AttachSrc
  ProcessingStep <|-- RemoveLmStep
  class Pipeline {
    steps: ProcessingStep[]
    addStep(step: ProcessingStep)
    addStep(name: string)
    run(doc: QmdDocument) QmdDocument
  }
  class ProcessingStep {
    <<interface>>
    run(doc: QmdDocument) QmdDocument
  }
  class ReplacePlaceholders {
    values: Record
  }
  class AttachSrc {
    files: string[]
  }
```

Remarks:

- `ReplacePlaceholders` also replaces in the header
- `AttachSrc` puts the files of `src/` into an appendix of the document, as code blocks (not executed); `files` from
  `basket.files("src/*")`

## Process

The pre-render script runs the whole process:

1. Create `CollectionConfiguration` from the collection folder and the building block tree
1. Clear the `c/` folder
1. For each product:
    1. get its `Basket` from the building block tree
    1. compute the placeholders: `n`, `nn-name`, `name`, `hash`, `product-title`, `group-title`, `site`
    1. run the recipe

In detail.

### Configuration of one collection

```mermaid
classDiagram
  direction LR
  CollectionConfiguration "1" --> "*" ProductConfiguration
  class CollectionConfiguration {
    constructor(collectionFolder: string, tree: BuildingBlockTree)
    outputFolder() string
    site() string?
    recipe() Recipe
    words() Record
    productConfigurations() ProductConfiguration[]
  }
  class ProductConfiguration {
    number: number
    name: string
    title: string
    groupTitle: string?
    ingredients: string[]
    constructor(entry: Record, number: number, tree: BuildingBlockTree)
  }
```

The constructor merges the `loimoi.yml` files along the path and reads `conventions.yml`. The methods derive what
is missing:

- `site()`: from the Git remote
- `recipe()`: either from `recipe` in `loimoi.yml` or default via `conventions.yml`
- `words()`: words for recipes and steps from `words/<language>.yml`, the language of the collection via
  `conventions.yml`; added to the placeholders
- `productConfigurations()`: either from `products` in `loimoi.yml` or one per ingredient via `conventions.yml`

YAML configuration (e.g. `recipes/exercises.yml`) in `_extensions/loimoi/config/`; a file with the same path in `learning-material/_loimoi/` replaces it (`configFile()` in `utilities.ts`). Exception: `conventions.yml`, the first
`_loimoi/conventions.yml` upward from the working directory (`conventions()`).

`resolve(logicalName)` in `utilities.ts` finds a file or folder by a logical name (e.g. `building-blocks`): upward
from the working directory, the first folder containing one of the names listed under `names` in
`conventions.yml`; error if none or several in the same folder.

### Recipe and Action classes

```mermaid
classDiagram
  direction TD
  Recipe "1" --> "*" Action
  Action <|-- QuartoFile
  Action <|-- Archive
  class Recipe {
    folder: string
    actions: Action[]
    read(file: string, options: Record, folder: string)$ Recipe
    run(basket: Basket, placeholders: Record)
  }
  class Action {
    <<abstract>>
    name: string
    provides: string?
    file(placeholders: Record) string
    run(basket: Basket, placeholders: Record, folder: string)
  }
  class QuartoFile {
    title: string
    subtitle: string
    process: string[]
    format: string
    zip: boolean
  }
  class Archive {
    add: Record[]
  }
```

Remarks:

- `QuartoFile` copies the folders of the ingredients next to the written file (not into a zip; special folders
  `src/` and `zip/<name>/` → `<name>.zip`, both not into work files), without names starting with `_` or `.` and
  `…_files` (`studentFiles()` in `utilities.ts`); an `Archive` copies folders in `add` the same way
- `QuartoFile` copies the files referenced in the document (e.g. `images/a.svg` to `c/images/a.svg`); error if a
  file of the same name differs
- `Recipe.run`: adds the placeholders from `provides` (`file()` of the action), runs the actions in order

## Decisions

- **Pandoc finds the structure, loi-moi cuts the original text.** Cells stay exactly as written; `pandoc.write`
  would turn ` ```{julia} ` into a plain code block.
- **Everything before Quarto, no filter.** A filter runs per document, loi-moi needs the whole collection.
- **Names from folders, not from `about.yml`.** Renaming a folder is deliberate, retyping a title is not.
- **No project type.** A Quarto project has one type, collections need different ones (`book` for course notes);
  so `_quarto.yml` names the pre-render script, shared settings via `metadata-files`. Quarto requires an extension
  to contribute something: loi-moi contributes the metadata `loimoi: true`.
- **Code runs on copies.** The folders of the ingredients are copied into `c/`, so code reading `data/…` runs there
  as in the work files; no folder name fixed, no working directory changed per language (as in the prototype).
- **Steps only change content.** How a file is written (`format`, `zip`) is a setting of `QuartoFile`, not a step.
- **Jupyter notebooks written as JSON, not with `quarto convert`.** `quarto convert` needs a Jupyter kernel for
  the language installed on the machine (Julia and R run with other engines in Quarto) and has no option to set
  it; without one, code cells end up as text.

## Development

- One file per class, named after the class (`qmd-document.ts`); free functions in `utilities.ts`
- Names for paths: `…Folder`, `…File` absolute (`outputFolder`); `path`, `…Path` relative to a base folder named in
  the class or a comment (`Folder.path`); `…Name` only the last part (`collectionFolderName`); always "folder", not "dir"
- Tests: assertion first; unit tests for `BuildingBlockTree`, `QmdDocument` and the steps; each example one test,
  each aspect in one example only
- `deno task test`, `deno task check`, `make examples`
- Simple; comments sparingly, only where the code doesn't say it; no `continue`/`break`; no environment variables
