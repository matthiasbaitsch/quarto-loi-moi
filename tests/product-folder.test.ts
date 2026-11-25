import { assertThrows } from "@std/assert";
import { ProductFolder } from "../_extensions/loimoi/product-folder.ts";

Deno.test("files of the same name: the same content is fine, different content is an error", () => {
  const folder = new ProductFolder(Deno.makeTempDirSync());
  const bytes = (text: string) => new TextEncoder().encode(text);
  folder.write(bytes("1\n"), "data/values.csv");
  folder.write(bytes("1\n"), "data/values.csv");
  assertThrows(() => folder.write(bytes("2\n"), "data/values.csv"), Error, "data/values.csv");
});
