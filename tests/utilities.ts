// Helpers for the tests.

// An empty folder tests/output/<name>/ for the output of a test; it stays after the test, to look at it.
export function outputFolder(name: string): string {
  const folder = new URL(`output/${name}`, import.meta.url).pathname;
  try {
    Deno.removeSync(folder, { recursive: true });
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) throw error; // not there yet: nothing to remove
  }
  Deno.mkdirSync(folder, { recursive: true });
  return folder;
}
