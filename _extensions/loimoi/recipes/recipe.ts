// A recipe makes one product from its ingredients (DESIGN, section "Recipes").
export interface Recipe {
  // Writes the product into folder and returns the names of the files it wrote. url is the URL of folder on the
  // published site and site the URL of the site, for absolute links (relative links fail in PDF); without them,
  // links are relative.
  run(folder: string, url?: string, site?: string): string[];
}
