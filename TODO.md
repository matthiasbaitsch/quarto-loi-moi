# TODO

## Next

- numPDE: groups by topic in folders, `about.yml`, `.lm-` markers, code from `notebook.qmd` into the
  exercises, `${notebook}` → `${work-files}`; compare `c/` with today's.
- Mathe B, solutions: headings inside exercises now shown (old: only title and solution).
- Mathe B: move from `examples/mathe-b` into the real `lernpfad/aufgaben`; commit loi-moi and the `loimoi` branches of the submodules.

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
- Check for files kept identical on purpose (e.g. `src/` code across building blocks), error if they diverge; as in Informatik (`skripte/duplikate.txt`, pre-commit hook).
- SPEC introduction: sharpen the core idea (two axes, topic and form, decoupled by loi-moi).
