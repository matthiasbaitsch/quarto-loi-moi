# TODO

## Next

- Products name building blocks, not ingredient folders: key `blocks` in `products` with short paths (`10-convergence/10-sequences`, numbers kept), the ingredient folder added from the conventions; the same short paths everywhere (default products, tests, SPEC example).
- Classes: merge `CollectionConfiguration` into `Collection` (the split into data and logic is artificial, `Collection` only derives from it); rename `ProductConfiguration` to `Product` (it is the product, not configuration).
- Course notes as a book (numMat `skript` first): one product per collection (recipe `series: false`), named after the collection folder; the book's chapters belong to the `Product`; default `index.qmd`, the building blocks with one part per `group-title`, the other `.qmd` files in name order, setting `chapters` to override; one chapter per building block with a heading from the recipe; chapter list written into a file Quarto reads via `metadata-files` (tested: arrays concatenated with `_quarto.yml`'s, `index.qmd` not duplicated); link page links to the book's `index.html`.
- numPDE: groups by topic in folders, `about.yml`, `.lm-` markers, code from `notebook.qmd` into the
  exercises, `${notebook}` → `${work-files}`; compare `c/` with today's.
- Mathe B, solutions: headings inside exercises now shown (old: only title and solution).
- Mathe B: move from `examples/mathe-b` into the real `lernpfad/aufgaben`; commit loi-moi and the `loimoi` branches of the submodules.

## Later

- `file-name` default per recipe? Slides need `${nn-name}`, set in `loimoi.yml` for now (numMat); check with numPDE and Informatik.
- Selection of building blocks by subtree (e.g. `folien-r-alle` only the R building blocks of Mathe B).
- Mathe B: solution sheet with executed code.
- Recipes for slides, course notes, all slides, course slides; Informatik (C#).
- Several collections in one render.
- Version check for copied recipes, if needed.
- Vendor the imports into the extension, so no network is needed.
- Snapshot tests: per example the expected `c/` in `tests/expected/<example>/` (zips compared by content),
  `deno task update-expected`; error cases stay unit tests; steps maybe as `input.qmd` → `expected.qmd`.
- Check for files kept identical on purpose (e.g. `src/` code across building blocks), error if they diverge; as in Informatik (`skripte/duplikate.txt`, pre-commit hook).
- SPEC introduction: sharpen the core idea (two axes, topic and form, decoupled by loi-moi).
