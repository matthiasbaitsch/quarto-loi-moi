# TODO

## Next

- German words for German courses: file names (`-aufgaben`, `-loesung`), titles ("Aufgabenblatt", "Lösungen zu …")
  and text added by steps (e.g. "Appendix").
- numPDE: groups by topic in folders, `about.yml`, `.lm-` markers, code from `notebook.qmd` into the
  exercises, `${notebook}` → `${work-files}`; compare `c/` with today's.

## Later

- Selection of building blocks by subtree (e.g. `folien-r-alle` only the R building blocks of Mathe B).
- Mathe B: solution sheet with executed code.
- Recipes for slides, course notes, all slides, course slides; Informatik (C#).
- Several collections in one render.
- Course notes (`type: book`): pre-render without the `render` list of `_common.yml`.
- Version check for copied recipes, if needed.
- Vendor the imports into the extension, so no network is needed.
- Snapshot tests: per example the expected `c/` in `tests/expected/<example>/` (zips compared by content),
  `deno task update-expected`; error cases stay unit tests; steps maybe as `input.qmd` → `expected.qmd`.
- SPEC introduction: sharpen the core idea (two axes, topic and form, decoupled by loi-moi).
