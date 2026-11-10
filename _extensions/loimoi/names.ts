// File names of the generated documents.
//
// The names must stay exactly as they are today, because they are linked from Moodle. The default patterns
// reproduce the scheme of numPDE and numMat; a course can override them in lernpfad/loimoi.yml (Mathematik B).

// Default patterns, ${...} are replaced by the variables below
export const DEFAULT_NAMES: Record<string, string> = {
  sheet: "${slug}-aufgaben",
  solution: "${slug}-aufgaben-loesung-${hash}",
  material: "${slug}-aufgaben",
};

// Text for file names: lower case, umlauts transcribed, everything else becomes a dash.
// Example: "Wärmeleitung Grundlagen" -> "waermeleitung-grundlagen"
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replaceAll("ä", "ae")
    .replaceAll("ö", "oe")
    .replaceAll("ü", "ue")
    .replaceAll("ß", "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Hash in the name of the solution: cannot be guessed, but stays the same as long as the slug does.
// Same computation as in make-learning-path.jl: first 8 hex digits of sha1("87362-" + slug).
export async function solutionHash(slug: string): Promise<string> {
  const bytes = new TextEncoder().encode("87362-" + slug);
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-1", bytes));
  const hex = Array.from(digest, (b) => b.toString(16).padStart(2, "0")).join("");
  return hex.slice(0, 8);
}

// Replace ${name} in a pattern by the value of the variable, error if a variable is unknown
export function fillPattern(pattern: string, variables: Record<string, string | undefined>): string {
  return pattern.replace(/\$\{([a-z]+)\}/g, (_, name) => {
    const value = variables[name];
    if (value === undefined) {
      throw new Error(`Unknown variable \${${name}} in file name pattern "${pattern}"`);
    }
    return value;
  });
}
