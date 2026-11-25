# TODO

## Next

- Products name building blocks, not ingredient folders: key `blocks` in `products` with short paths (`10-convergence/10-sequences`, numbers kept), the ingredient folder added from the conventions; the same short paths everywhere (default products, tests, SPEC example).
- Slides in a public example (e.g. `julia-parts/learning-material/slides/`), so the snapshot covers the recipe `slides`, link pages with several collections, and a Quarto project without a recipe that the link pages skip (e.g. `learning-material/handout/` with only a `_quarto.yml`).
- `isSetup` twice: in `qmd-document.ts` (for `validate`) and in `processing-steps/exercise.ts` (sheet, `MergeSetupCells`); one copy in `qmd-node.ts`, which both use.
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
- Check for files kept identical on purpose (e.g. `src/` code across building blocks), error if they diverge; as in Informatik (`skripte/duplikate.txt`, pre-commit hook).
- SPEC introduction: sharpen the core idea (two axes, topic and form, decoupled by loi-moi).

## Done

- Snapshot tests: per example the pre-render output in `tests/expected/<example>/` (zips compared by content), `deno task update-expected`; the examples extended until they cover all functionality, each aspect in one example only; invalid input as files in `tests/invalid/` (`QmdDocument.validate`); unit tests only for what neither covers (test code from 727 to 146 lines).
- Performance: each parse started `quarto pandoc` (about 200 ms), 4–5 times per `QuartoFile`. Now one parse per product: `Basket.document()` reads the `.qmd` files together once and validates them, for all actions; `ReplacePlaceholders` replaces in the nodes (also ids, classes, cell options), `AttachSrc` appends nodes; the rule "setup cell before the first div" dropped (only checkable per file). Snapshot test from about 50 s to 4 s.
