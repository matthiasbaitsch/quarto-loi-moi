// Trivial test: shows that `deno task test` finds and runs the tests.

import { assertEquals } from "@std/assert";

Deno.test("setup works", () => {
  assertEquals(1 + 1, 2);
});
