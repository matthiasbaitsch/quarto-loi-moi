import { ensureDirSync, existsSync } from "@std/fs";
import { dirname, join } from "@std/path";
import { expected, preRender, snapshots } from "./snapshot.ts";

for (const example of Object.keys(snapshots)) {
  const folder = join(expected, example);
  if (existsSync(folder)) Deno.removeSync(folder, { recursive: true });
  for (const [path, content] of Object.entries(preRender(example))) {
    ensureDirSync(dirname(join(folder, path)));
    Deno.writeTextFileSync(join(folder, path), content);
  }
}
