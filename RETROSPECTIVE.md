# Retrospective

## Refactoring the tests (2026-11-25)

Result: tests against reference products (`tests/expected/`), examples covering all functionality, invalid input as files in `tests/invalid/`, test code from 727 to 146 lines (commit `c531a81`). The path there was long: Claude worked carefully but mostly in the wrong direction, and the user had to bring in the simplifications one by one.

### What went wrong

- **Keeping instead of questioning.** Almost every first proposal was to keep something: the step tests "because they show which step is responsible", the error tests, `collection.test`, the `checkStructure` checks (defended with a guess that they came from real cases). Each time the user had to ask "why do we need that?".
- **No goal stated at the start.** The principle that ended up carrying everything came from the user, piece by piece: the examples cover all functionality, code only for what cannot be covered and is not trivial, invalid input as data. It should have been proposed at the start as the end state; instead the work optimized locally, file by file.
- **Adding complexity.** For a `.lm-solution` in a callout, Claude proposed one more check against misuse, the opposite of simplifying. Test code was written compact rather than readable; the user had to ask for explicit code.
- **Side effects not watched.** Validating each file separately doubled the test runtime, noticed only when the user asked about the duration. A wrong assertion (`src/`) was copied from an old test; a line count was off; "8ff" was misread.
- **The same pattern before, with the course notes.** The book was built on a structure that was not clean yet, until the user stopped and went back.

### What worked

Execution: changes tested, results checked against the reference files, real problems named (a `.lm-solution` in a callout lost in the solution; Pandoc as the cause of the slow tests).

### Lesson

First ask what the simplest end state is and propose it; then look at what exists with the question "what can go?", not "what should stay?". Measure the effects of a change, not only its correctness.

## Performance of the pre-render (2026-11-25)

Result: one Pandoc run per product instead of 4–5 per `QuartoFile`; `Basket.document()` reads and validates the `.qmd` files once for all actions, `ReplacePlaceholders` and `AttachSrc` work on the nodes; the snapshot test from about 50 s to 4 s. The decisive questions came from the user ("who initiates the parsing?", "should it be one document?").

### What went wrong

- **A guess instead of a measurement.** The first idea, "pre-render as a function", assumed that starting Deno was slow. Only when the user asked how long the test runs was it measured: Pandoc, about 200 ms per run.
- **Treating the symptom.** Knowing that the same content was parsed several times, Claude made repeated parsing cheap (a cache keyed by the text) instead of asking why it happens. The cache was chosen because it was the smallest change, not because it was the right design.
- **Not following the data flow.** Claude had listed the three places that start Pandoc, but proposed a fix for each instead of seeing the common cause. The question "who owns the document?" leads directly to the solution: the basket is the source, it reads once, everyone else uses that document.
- **The existing division of work taken as given.** That each `QuartoFile` reads for itself and that `ReplacePlaceholders` goes through text was treated as fixed, not questioned.

### Lesson

Measure first. Then do not ask how to make the expensive thing cheaper, but why it happens more often than needed and where the data really belongs.

## Naming operations (2026-11-25)

In `AttachSrc`, the user proposed `QmdDocument.appendNode` for `new QmdDocument(doc.header, [...doc.nodes, node])`.

### What went wrong

- **Existing classes treated as fixed.** Claude solved the task inside the file being edited and avoided extending the interface of another class like `QmdDocument`, as that felt like a bigger change; the same pattern as with the cache: the smallest diff instead of the right place.
- **Generic even when looking.** Asked about the line, Claude found the pattern and proposed `withNodes`/`withHeader`, mechanics one level up; the user named the actual operation: `appendNode`.
