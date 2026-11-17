# TODO

## Next

- Rewrite the code from SPEC and DESIGN: done up to `CollectionConfiguration` and `ProductConfiguration`.
- `pre-render.ts`: runs in the collection folder (`Deno.cwd()`), building blocks at `../../building-blocks`; empty
  the output folder, then for each product create the basket, compute the placeholders
  (`ProductConfiguration.placeholders(site)`: `n`, `nn-name`, `name`, `hash`, `product-title`, `group-title`,
  `site`) and run the recipe.
- Examples: one `_quarto.yml` with `project: type: loimoi` per collection; adapt `_extension.yml` (still
  `lernpfad/`).
- Render the examples.
- Then numPDE: groups by topic in folders, `about.yml`, `.lm-` markers, code from `notebook.qmd` into the
  exercises, `${notebook}` → `${work-files}`; compare `c/` with today's.

## Later

- Selection of building blocks by subtree (e.g. `folien-r-alle` only the R building blocks of Mathe B).
- Mathe B: solution sheet with executed code.
- Recipes for slides, course notes, all slides, course slides; Informatik (C#); numMat's extra downloads.
- Several collections in one render.
- Version check for copied recipes, if needed.
- `make render` target, so nobody has to remember `QUARTO_PYTHON`.
- Vendor the imports into the extension, so no network is needed.
- SPEC introduction: sharpen the core idea (two axes, topic and form, decoupled by loi-moi).
