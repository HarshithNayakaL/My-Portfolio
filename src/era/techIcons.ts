/**
 * The logo for a tech name, from the set the site already ships in /icons.
 * Matched on a word in the name, so "Google Gemini 2.5 Flash" and "Gemini API"
 * both find the Gemini mark. `mono` logos are black and get inverted in dark
 * mode. Names with no logo here simply render without one.
 */
const marks: { match: RegExp; src: string; mono?: boolean }[] = [
  { match: /\bpython\b/i, src: "/icons/python.svg" },
  { match: /\btypescript\b/i, src: "/icons/typescript.svg" },
  { match: /\breact\b/i, src: "/icons/react.svg" },
  { match: /\bnode(\.js)?\b/i, src: "/icons/nodedotjs.svg" },
  { match: /\bn8n\b/i, src: "/icons/n8n.svg" },
  { match: /\bgemini\b/i, src: "/icons/googlegemini.svg" },
  { match: /\bopenai\b/i, src: "/icons/openai.svg", mono: true },
  { match: /\bpostgres(ql)?\b|\bpgvector\b/i, src: "/icons/postgresql.svg" },
  { match: /model context protocol|\bmcp\b/i, src: "/icons/mcp.svg", mono: true },
  { match: /\brust\b/i, src: "/icons/rust.svg", mono: true },
  { match: /\bmongodb\b/i, src: "/icons/mongodb.svg" },
  { match: /\bollama\b/i, src: "/icons/ollama.svg" },
  { match: /hugging ?face/i, src: "/icons/huggingface.svg" },
  { match: /google cloud|\bgcp\b/i, src: "/icons/googlecloud.svg" },
  { match: /\bbun\b/i, src: "/icons/bun.svg", mono: true },
  { match: /\bastro\b/i, src: "/icons/astro.svg" },
  { match: /\bclaude\b/i, src: "/icons/claude.svg" },
];

export const techIcon = (name: string) => marks.find((m) => m.match.test(name)) ?? null;
