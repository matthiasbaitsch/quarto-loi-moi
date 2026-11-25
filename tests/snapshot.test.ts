import { assertEquals } from "@std/assert";
import { join } from "@std/path";
import { expected, preRender, readFolder, snapshots } from "./snapshot.ts";

for (const example of Object.keys(snapshots)) {
  Deno.test(`snapshot: ${example}`, () => {
    const actual = preRender(example);
    const files = readFolder(join(expected, example));
    assertEquals(Object.keys(actual).sort(), Object.keys(files).sort());
    for (const path of Object.keys(actual)) assertEquals(actual[path], files[path], path);
  });
}
