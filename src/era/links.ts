/**
 * What kind of place a project link points at. A card or case study reads
 * "Live" only when some link is a running deployment: a repository is code,
 * and a registry listing (Glama indexes Personal MCP OS) is a catalogue
 * entry, not the product running, so neither counts.
 */
export const isRepo = (href: string) => href.includes("github.com");
export const isListing = (href: string) => /^https:\/\/glama\.ai\/mcp\/servers\//.test(href);
export const isDeployment = (href: string) => !isRepo(href) && !isListing(href);
