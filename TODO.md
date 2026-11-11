# TODO

## Next

- `Configuration` class (DESIGN, "Series and recipes" 3); `output` and `site` move there from `pre-render.ts`.
- Finish the review of `c38da51`: `series.ts`, `recipes/exercise-sheet.ts`, the tests.
- `markers.lua` and `markers.css` do not exist yet; `bausteine/_quarto.yml` in the examples still references the
  prototype's filter.
- Slim down `CLAUDE.md`: decisions and technical results are now in DESIGN.

## Code quality (review of `c38da51`)

- `recipes/exercise-sheet.ts` is too big; split off at least the notebook functions and the filters.
- Images and the ingredient with a setup cell are found in the text, bypassing `QmdDocument`.
- `run(folder, url, site)`: parameters that belong together; one object would be clearer.
- Simplified rules: the empty code cell for every solution with code if the exercise has no scaffold at all;
  Julia's `include` made absolute with a regular expression.

## Before numPDE and numMat

- `pre-render` runs on every render, also for a single file and on each change during `quarto preview`
  (`QUARTO_PROJECT_RENDER_ALL`, `QUARTO_PROJECT_INPUT_FILES`); SPEC's `quarto render lernpfad/<folder>`.
- Without git installed, `gitHubPages()` throws; should fall back to relative links.
- `${site}` assumes `lernpfad/` is the root of the published site.
- `make render` target, so nobody has to remember `QUARTO_PYTHON`.
- In the courses: groups by topic in folders (numPDE: rename `02-variationsprobleme` to
  `02-lineare-raeume-und-variationsprobleme` so the Moodle link stays), `about.yml` with `title`, `.lm-` markers,
  code from `notebook.qmd` into the exercises, `${notebook}` → `${work-files}`. Compare `d/` with today's `c/`.

## Later (Mathe B)

- `loimoi.yml`: selection and order of building blocks, titles, output folder, URL, work-file format and files.
- Work files as `.qmd` in a folder, with data and workspace; names inside the zip file.
- Vendor the imports into the extension, so no network is needed.
- `${site}` for other roots than `lernpfad/`.
