# TODO

## Next

- [ ] Products name building blocks, not ingredient folders: key `blocks` in `products` with short paths (`10-convergence/10-sequences`, numbers kept), the ingredient folder added from the conventions; the same short paths everywhere (default products, tests, SPEC example).
- [ ] Simplify `loimoi.yml` for slides: every slides collection needs `file-name: "${nn-name}"` (julia-parts, r-topics twice, numMat), so a `file-name` default per recipe; collections not named `slides` need `recipe: slides` and the full product list (r-topics), e.g. selection of building blocks by subtree.
- [ ] A Quarto project without a recipe in a public example (e.g. `learning-material/handout/` with only a `_quarto.yml`), so the snapshot covers that the link pages skip it.
- [ ] `isSetup` twice: in `qmd-document.ts` (for `validate`) and in `processing-steps/exercise.ts` (sheet, `MergeSetupCells`); one copy in `qmd-node.ts`, which both use.
- [ ] Classes: merge `CollectionConfiguration` into `Collection` (the split into data and logic is artificial, `Collection` only derives from it); rename `ProductConfiguration` to `Product` (it is the product, not configuration).
- [ ] Course notes as a book (numMat `skript` first): one product per collection (recipe `series: false`), named after the collection folder; the book's chapters belong to the `Product`; default `index.qmd`, the building blocks with one part per `group-title`, the other `.qmd` files in name order, setting `chapters` to override; one chapter per building block with a heading from the recipe; chapter list written into a file Quarto reads via `metadata-files` (tested: arrays concatenated with `_quarto.yml`'s, `index.qmd` not duplicated); link page links to the book's `index.html`.
- [ ] numPDE: groups by topic in folders, `about.yml`, `.lm-` markers, code from `notebook.qmd` into the exercises, `${notebook}` → `${work-files}`; compare `c/` with today's.
- [ ] Mathe B, solutions: headings inside exercises now shown (old: only title and solution).
- [ ] Mathe B: move from `examples/mathe-b` into the real `lernpfad/aufgaben`; commit loi-moi and the `loimoi` branches of the submodules.

## Later

- [ ] Selection of building blocks by subtree (e.g. `folien-r-alle` only the R building blocks of Mathe B).
- [ ] Mathe B: solution sheet with executed code.
- [ ] Recipes for slides, course notes, all slides, course slides; Informatik (C#).
- [ ] Several collections in one render.
- [ ] Version check for copied recipes, if needed.
- [ ] Vendor the imports into the extension, so no network is needed.
- [ ] Check for files kept identical on purpose (e.g. `src/` code across building blocks), error if they diverge; as in Informatik (`skripte/duplikate.txt`, pre-commit hook).
- [ ] SPEC introduction: sharpen the core idea (two axes, topic and form, decoupled by loi-moi).

## Done

- [x] Slim down `CLAUDE.md`: decisions and technical results are now in DESIGN.
- [x] `Configuration` class: `output` and `site` move there from `pre-render.ts` (now `CollectionConfiguration`).
- [x] `loimoi.yml`: selection and order of building blocks, titles, output folder, URL, work-file format and files.
- [x] Work files as `.qmd` in a folder, with data and workspace; names inside the zip file.
- [x] Folder names per ingredient type (`exercises`, `aufgaben`, …) from a YAML file (`conventions.yml`).
- [x] Rewrite the code from SPEC and DESIGN; tests and examples with the new names.
- [x] `pre-render.ts`: runs in the collection folder (`Deno.cwd()`); empty the output folder, then for each product create the basket, compute the placeholders and run the recipe.
- [x] Render the examples.
- [x] Test for the error "Different files with the same name" (images, folders).
- [x] julia-parts: the setup cell `include("src/fibonacci.jl")` also lands in the students' notebook, where it fails until they create the file (now commented out as `# includet`).
- [x] numMat's extra downloads (`zip/<name>/`).
- [x] `make render` target, so nobody has to remember `QUARTO_PYTHON`.
- [x] German words for German courses: file names (`-aufgaben`, `-loesung`), titles ("Aufgabenblatt", "Lösungen zu …") and text added by steps (e.g. "Appendix").
- [x] Snapshot tests: per example the pre-render output in `tests/expected/<example>/` (zips compared by content), `deno task update-expected`; the examples extended until they cover all functionality, each aspect in one example only; invalid input as files in `tests/invalid/` (`QmdDocument.validate`); unit tests only for what neither covers (test code from 727 to 146 lines).
- [x] Performance: each parse started `quarto pandoc` (about 200 ms), 4–5 times per `QuartoFile`. Now one parse per product: `Basket.document()` reads the `.qmd` files together once and validates them, for all actions; `ReplacePlaceholders` replaces in the nodes (`QmdNode.transformText`), `AttachSrc` appends its appendix as text; the rule "setup cell before the first div" dropped (only checkable per file). Snapshot test from about 50 s to 4 s.
- [x] Slides in the public examples: julia-parts one collection `slides`, r-topics `theory-slides` and `programming-slides` (recipe and products in `loimoi.yml`), all revealjs; link pages with several collections, a collection is a folder with a `_quarto.yml` and a recipe in `conventions.yml` or a `loimoi.yml` of its own.
