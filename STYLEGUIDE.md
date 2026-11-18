# Style guide

## Exercise sheets

How to write the ingredient `exercises/` (`aufgaben/`) so that loi-moi makes a good sheet, scaffold and solution from it. What loi-moi does is in `SPEC.md`.

### Files

```
exercises/
├── 00-on-paper.qmd          section text
├── 01-golden-ratio.qmd      one exercise per file
├── 10-in-python.qmd         section text
├── 11-fibonacci.qmd
├── images/
├── data/
└── src/                     code of the solution, see "Code growing across sheets"
```

- One exercise per file; leading numbers give the order. Leave gaps (`10`, `20`) or use tens for sections (`0x` on paper, `1x` in Python).
- Text between exercises (section headings, download instructions) in a file of its own, outside any exercise. It is on the sheet only.
- Each file needing packages or data starts with the setup cell (`#| label: setup`). The cells are merged into one, so use single-line statements in one language only.

### Skeleton

```markdown
::: {#exr-golden-ratio}
## The golden ratio

Text of the exercise.

::: {.lm-scaffold}
…
:::

::: {.lm-solution}
…
:::
:::
```

- Label `exr-` plus the file name without number; refer to it with `@exr-golden-ratio`.
- Title as `##`, the first line in the div.
- No exercise inside another div (e.g. a callout).

### What goes where

| Content                          | Sheet | Scaffold | Solution |
|----------------------------------|:-----:|:--------:|:--------:|
| Headings (`##`, `###`) in an exercise | ✓ | ✓        | ✓        |
| Text, images, non-executed code  | ✓     |          |          |
| Executed code cells              |       | ✓        | ✓        |
| Setup cell                       | ✓     | ✓        | ✓        |
| `.lm-sheet` / `.lm-scaffold` / `.lm-solution` | only there | only there | only there |

- Code the students start from (signature, `...`) goes into `.lm-scaffold`; code they get unchanged needs no marker.
- Text for the work files (e.g. "Complete the function") goes into `.lm-scaffold`.
- Exercises done on paper have no executed code: they are dropped from the scaffold.

### Short or long

- **Short:** subtasks as a numbered list, one solution at the end, numbered the same way.
- **Long:** when a subtask has its own text, code or solution, make it a `###` part.
- Don't mix: either a list or `###` parts. No numbered list inside a part; a part with subtasks becomes several parts.

### Long exercises

Each part brings its own scaffold and solution, directly below its text:

````markdown
::: {#exr-results}
## Displaying the results

The figures show possible ways to display the results.

![](images/deformation.png){width="45%"} ![](images/forces.png){width="45%"}

### Deformation

Write a function `draw_deformation(s, scale)` that plots the deformed structure.

::: {.lm-scaffold}
```{python}
def draw_deformation(s, scale):
    ...
```
:::

::: {.lm-solution}
```{python}
def draw_deformation(s, scale):
    …
```
:::

### Clothesline

Why does the wire of the clothesline have no stiffness across its axis?

::: {.lm-solution}
In the formulation for small deformations, …
:::
:::
````

- Each heading is written once and appears in all three documents, so they cannot drift apart.
- Don't put all solutions in one block at the end, repeating the headings.
- Intro text before the first `###`: on the sheet only.
- A part without code (like the clothesline) leaves its bare heading in the scaffold. Accept it: it keeps the structure the same in all three documents. Wrapping the part in `.lm-sheet` would also remove the heading from the solution, and a solution inside it is an error.
- Headings inside `.lm-solution` belong to the solution only; use them (`####`) to structure a long solution, not to repeat a part.
- Headings start at the beginning of a line; others are not recognised as headings.

### Code growing across sheets

- Code shared by several exercises in `src/`, e.g. `src/truss.py`; it appears in the appendix of the solution.
- A file that changes from sheet to sheet: one version per change, `src/truss_lm_step02.py`, `src/truss_lm_step04.py`. The solution imports the version it needs (`from src.truss_lm_step04 import …`), the work files get `src.truss`.
- Never change an older version: files of the same name must not differ.
- To work on a solution in its building block, copy the versions it imports into its `src/` and mark the copies with `# lm-copy` in the first line, e.g. `structures_lm_step03.py` in 04 and 05. Copies are not attached to the solution.
### Before publishing

- Check the preview product (`…-preview-<hash>`): what you wrote, with scaffold and solution marked.
- Check the scaffold: does every part the students program have something to start from?
- Check the solution: does every part have an answer under its heading?
