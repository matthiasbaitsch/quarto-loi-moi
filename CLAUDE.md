# quarto-loi-moi

## Context

Quarto extension that generates what the students get (exercise sheets, later slides and course notes) from
building blocks (*Bausteine*), for four courses: numPDE, numMat, Informatik, Mathematik B. It grew out of numPDE,
where exercise text and solution code lived in two files, and each course had its own scripts.

Git repository, public on GitHub: `matthiasbaitsch/quarto-loi-moi`.

## Where things are

- `SPEC.md`: what loi-moi does (terms, folders, products, processing rules, usage). Up to date.
- `DESIGN.md`: how loi-moi works: models, process, decisions.
- `TODO.md`: open points, next and later.
- `ANALYSIS.md`: how the four courses make their products today.
- `_extensions/loimoi/`: the code (TypeScript, Deno); `tests/`; `examples/` (`julia-parts`, `python-flat`,
  `r-topics`: a fictional calculus course with sequences, series, power series, continuity), which also serve as tests.
- The previous `CLAUDE.md` with all decisions and technical results of the prototype is in the Git history
  (`git show c38da51:CLAUDE.md`).

## Current work

1. Rewrite the code completely, from `SPEC.md` and `DESIGN.md`.
2. Then the courses (numPDE first).

## Development

- `deno task test`, `deno task check`; `make examples` copies the extension into the examples (Quarto does not
  follow symlinks); render an example with `quarto render` in its folder (Python:
  `QUARTO_PYTHON=$PWD/.venv/bin/python quarto render`).
- Test policy: assertion first; one test per example, each aspect in one example only.
- Code style: simple and commented (the user is learning TypeScript; explain new constructs in the review); file
  names follow class names; no `continue`/`break`; no environment variables; all strings in code until the
  configuration exists.

## Collaboration

- Informal (*du* in German). Conversation and texts in English.
- For questions, only explain first; change files only when explicitly asked; before every change, explain what
  is planned and wait for approval. Don't rush: the user reviews and approves step by step. One decision per step,
  one question at a time, also when the task is wide.
- Be critical: if something seems a bad idea, say so directly and explain why – before doing it.
- Concise answers; documents short, not verbose.
- Do nothing that was not asked for. No memory directory, notes go into this file.
- No Git commits, no GitHub repository without being asked.
