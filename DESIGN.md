# Design

How loi-moi does what SPEC describes.

## Quarto integration

1. The project has the type `loimoi`. Before Quarto renders, the extension generates the content of `c/`.
2. `bausteine/` has its own `_quarto.yml` with the marker filter, so files there render on their own. The filter
   only marks solution (green) and scaffold (blue); it decides nothing.
3. **Open:** how the teacher views a file as one part of its product; it goes through loi-moi, not the filter.

## Processing

1. A data structure represents the building blocks: groups, building blocks, material subfolders, files and
   exercises.
2. A recipe (one per kind of product, in code) produces the content of `c/` from it.
3. Each recipe has a YAML file with its settings and their defaults. `loimoi.yml` overrides them: recipe →
   `lernpfad/loimoi.yml` → `lernpfad/<folder>/loimoi.yml`.
4. loi-moi does all processing before Quarto: it writes the finished `.qmd` of each part into `c/` (e.g. the
   exercise sheet without solution code), and Quarto only renders. Reasons: control (Quarto does not run code that
   is removed anyway) and all rules in one place.
5. loi-moi is written in TypeScript (Deno, comes with Quarto); the marker filter in Lua.

### Data structure

1. **Folders:** the tree of groups and building blocks: name, merged `about.yml`, material subfolders with their
   `.qmd` files and subfolders. Read once from `bausteine/`, the same for all kinds of products.
2. **Content:** a combined `.qmd` as a sequence of text, `setup` cells and exercises with their parts (text, code,
   `.lm-solution`, `.lm-scaffold`, `.lm-sheet`). Built by the recipe when needed; specific to exercise sheets.

### Recipes
