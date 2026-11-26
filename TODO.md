# TODO

## Next

- [ ] Course notes as a book (numMat `skript` first): one product per collection (recipe `series: false`), named after the collection folder; the book's chapters belong to the product; default `index.qmd`, the building blocks with one part per `group-title`, the other `.qmd` files in name order, setting `chapters` to override; one chapter per building block with a heading from the recipe; chapter list written into a file Quarto reads via `metadata-files` (tested: arrays concatenated with `_quarto.yml`'s, `index.qmd` not duplicated); link page links to the book's `index.html`. Decide with it: series settings (`first-number`, `name`, `folder-name`, `base-name`, `products`) under a top-level `series:` in `_collection.yml`, missing for a book instead of `series: false`.
- [ ] numPDE: groups by topic in folders, `_about.yml`, `.lm-` markers, code from `notebook.qmd` into the exercises, `${notebook}` → `${work-files}`; compare `c/` with today's.
- [ ] Mathe B, solutions: headings inside exercises now shown (old: only title and solution).
- [ ] Mathe B: move from `examples/mathe-b` into the real `lernpfad/aufgaben`; commit loi-moi and the `loimoi` branches of the submodules.

- [ ] Recipes as one list `actions` (entries `quarto-file:` or `archive:`), run in the order of the recipe, as in SPEC: `Recipe.read`, predefined recipes, recipes of the examples and courses.
- [ ] All own files (`recipes/`, `words/`, `code-replacements.yml`, not only `conventions.yml`) from the first `_loimoi/` found upward from the collection folder, as in SPEC (`utilities.ts`).
- [ ] The collection's Quarto configuration resolved by `quarto inspect` (`metadata-files`; about 0.7 s): `output-dir` from there (now read from `_quarto.yml` only), `lang` defaults to Quarto's `lang`, as in SPEC.

- [ ] "Ingredient" renamed to "compartment", as in SPEC and DESIGN: setting `ingredient-folder` → `compartment`, `ingredient-folders` in `conventions.yml` → `compartments`; code, examples, courses.
- [ ] Code names as in DESIGN "Model of the source material": `BuildingBlockTree` → `SourceMaterial`, `Basket` → `SourceKit`, `ingredients(paths)` → `kit(paths)`, `ingredients` → `compartments`, `ingredientFolder` → `compartment`, `Basket.name()`/`title()` → `SourceKit.blockName()`/`blockTitle()`, `Collection.placeholders()` → `productSheet()`, recipe read before the shelf is cleared (DESIGN "Process").
- [ ] Settings in two files, as in SPEC: `learning-material/_loimoi.yml` for the course, `_collection.yml` per collection (marks a collection, may be empty); no merge along the path; a setting in the wrong file is an error; link pages find collections by `_collection.yml`; `about.yml` → `_about.yml`. Code, examples, courses, `tests/invalid/`.
- [ ] Link pages handled differently, maybe as a program of its own with an entry in the Makefile (e.g. `make links`), instead of on every render of a collection: today each render builds the products of all collections, and an error in one collection stops the render of another. SPEC, DESIGN (Process, Link pages), code.
- [ ] `c/` named "shelf", as in SPEC and DESIGN: setting `output` → `shelf`, code (`output`, `outputFolder()` → `shelfFolder()`), examples, courses.

## Later

- [ ] Selection of building blocks by subtree, products in folder order, so no product list is needed (e.g. `folien-r-alle` only the R building blocks of Mathe B; r-topics `theory-slides` and `programming-slides`). Not needed yet: Mathe B, the only course with several subtrees, lists its products by hand.
- [ ] Mathe B: solution sheet with executed code.
- [ ] Recipes for slides, course notes, all slides, course slides; Informatik (C#).
- [ ] Several collections in one render.
- [ ] Version check for copied recipes, if needed.
- [ ] Vendor the imports into the extension, so no network is needed.
- [ ] Check for files kept identical on purpose (e.g. `src/` code across building blocks), error if they diverge; as in Informatik (`skripte/duplikate.txt`, pre-commit hook).
- [ ] Jupyter notebook along with the slides, as in numPDE: from `folien/projekt/notebook.qmd` the scaffold (`<slug>-folien.zip`, filled in live in class) and the final state (`<slug>-folien-loesung-<hash>.zip`), linked on the slide "Material"; see ANALYSIS.
- [ ] Render the public examples on GitHub (workflow: pre-render, `quarto render`, tests) and publish them on GitHub Pages.

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
- [x] Simplify `loimoi.yml` for slides, `file-name`: every slides collection needed `file-name: "${nn-name}"`, because the default `${nn-name}-${exercises}` only fit exercises. Now `base-name` (placeholder `${base-name}`), the base of all files of a product, default `${nn-name}` for all recipes; the recipe adds its suffix (`exercises.yml`: `${base-name}-${exercises}`, …; `slides.yml`: `${base-name}`). python-flat's `sheet-${nn}` now gives `sheet-01-aufgaben`.
- [x] Names of products configurable with placeholders: `nn-name` replaced by `folder-name` (setting, default `${nn}-${name}`); `${hash}` from `${nn}-${name}`, independent of `folder-name` and `base-name`; `product-naming` replaced by the setting `name` (default for all products, default `${block-path}`) with the new placeholders `${block-path}`, `${block-folder}`, `${title-slug}`; r-topics slides use `name: "${block-folder}"`, python-flat and the courses `name: "${title-slug}"`. Placeholder tables in SPEC split into configurable globally, configurable in `loimoi.yml` and derived.
- [x] Simplify `loimoi.yml` for slides, `name` and `product-title`: `name` now from `name: "${block-folder}"` (r-topics slides); `product-title` stays in `loimoi.yml` on purpose: with the layout by subject (r-topics, Mathe B) `about.yml` would repeat each title per subject.
- [x] Current extension in the courses (`make update-extension` in numMat, numPDE, Mathe B); `loimoi.yml` with `name: "${title-slug}"`, numMat `folien` without `file-name`; pre-render of all four collections gives the same output paths as before.
- [x] Products name building blocks, not ingredient folders: key `blocks` in `products` with short paths (`10-convergence/10-sequences`, numbers kept); the ingredient folder from the new setting `ingredient-folder`, default from `ingredient-folders` in `conventions.yml` by recipe and collection folder name (r-topics slides set `ingredient-folder: slides`); default products, r-topics, Mathe B's `lernpfad/aufgaben` and the SPEC example with the short paths.
- [x] A Quarto project without a recipe in a public example: r-topics `learning-material/handout/` (`_quarto.yml`, `index.qmd`); the snapshot of the link pages covers that they skip it.
- [x] `isSetup` twice (`qmd-document.ts`, `processing-steps/exercise.ts`): the helpers of `exercise.ts` became methods (`QmdNode`: `isText`, `isDiv`, `isExercise`, `hasClass`, `isExecutable`, `isSetup` as type checks, `false` by default, no `instanceof Qmd…` left outside `qmd-node.ts`; `QmdDiv.withChildren`; `QmdText.headings`, `blankLines`), `tidy` a method of `QmdDocument`; `exercise.ts` removed; unused `QmdDocument.parse` removed.
- [x] Classes: merge `CollectionConfiguration` into `Collection`, rename `ProductConfiguration` to `Product`. Superseded by the new DESIGN: lean `Collection`, entries as plain data, `NamingConventions` fills the `ProductSheet` (code: see "Code names as in DESIGN").
- [x] SPEC introduction: sharpen the core idea. Section "The overall procedure" (recipe, source kit, product sheet), terms reworked, collections "organized by kind of product".
