/**
 * Agent skills — packaged capability, not application code.
 *
 * A skill is a set of instructions plus its own executable drivers, loaded by
 * a coding agent when the task matches. They sit in their own section rather
 * than among the case studies because they are a different kind of artifact:
 * nothing here is a deployed product, and each one is judged on whether its
 * method is sound rather than on whether it runs.
 *
 * `repo` is deliberately optional and deliberately not filled in with a URL
 * that does not resolve yet. A link that 404s is worse than no link — it is
 * the same class of defect the SEO Command Center's `doctor` check exists to
 * catch: a claim that something exists elsewhere when it does not.
 */
export type AgentSkill = {
  name: string;
  tagline: string;
  /** Why it exists — the failure mode it was built against. */
  premise: string;
  /** What is in the box, in the author's own terms. */
  contents: string;
  /** The methodological commitment that makes it worth trusting. */
  discipline: string;
  tags: string[];
  repo?: string;
};

export const agentSkills: AgentSkill[] = [
  {
    name: "x-algorithm-boost",
    tagline: "Read from the source, not from blog posts about the source",
    premise:
      "Almost every claim circulating about X's ranking is folklore repeated until it sounded official. The algorithm is open source, so the weights, the filter stack and the spam rules can simply be read.",
    contents:
      "Three drivers plus a playbook: one audits an account for its binding constraint, one reproduces a feed on a second account using the real interest thresholds, one scores a single post. Running the post scorer on a zero-follower account is treated as malpractice — the post is not the problem, the closed in-network surface is.",
    discipline:
      "Every weight, threshold and filter is read out of the published Rust and Scala source, down to the credibility model's actual formula. Where the source says nothing, the skill says nothing.",
    tags: ["Open-source ranking", "Retrieval & filters", "Account credibility", "Node, no deps"],
  },
  {
    name: "linkedin-boost",
    tagline: "Separates documented mechanism from folklore, and names which is which",
    premise:
      "LinkedIn is not one algorithm. Feed, follow recommendations, search, recruiter sourcing, applicant ranking and network growth are separately ranked surfaces with different inputs — so advice aimed at the wrong one is confidently useless. \"My posts get no reach\" and \"I get no interviews\" are different systems.",
    contents:
      "Four drivers: one routes a symptom to the surface that actually owns it, then a strategy driver, a profile auditor and a post scorer. Everything traces to LinkedIn Engineering's own published architecture.",
    discipline:
      "A three-tier honesty boundary is enforced throughout: documented, inference from mechanism, or folklore. LinkedIn has never published an objective weight, a link penalty, a hashtag rule or a posting-frequency rule — so when asked for one, the skill says it is not public rather than inventing it.",
    tags: ["Multi-surface ranking", "Honesty boundary", "Profile & post audit", "Node, no deps"],
  },
  {
    name: "humanizer",
    tagline: "Two different problems wearing the same complaint",
    premise:
      "Text reads as machine-written for two separable reasons. Register is surface — em dashes, uncontracted prose, uniformly mid-length sentences — and a script catches it more reliably than a careful read. Genericness is not surface: writing that commits to nothing and could have been about any company in any industry. Most requests to humanise are really about the second, but people notice the first.",
    contents:
      "A scorer and a fixer for the mechanical layer, safe to run on markdown — headings, tables and fenced code survive intact. It reports what it deliberately would not fix, because a regex attempting those would either mangle meaning or invent facts.",
    discipline:
      "Never invent specifics. The commonest way to raise a genericness score is to add a concrete detail, and the commonest way to ruin a piece is to make one up — so a fabricated statistic is treated as a strictly worse outcome than a bland sentence.",
    tags: ["Register vs genericness", "Markdown-safe", "Scored 0-100", "Python"],
  },
  {
    name: "ui-ux-taste",
    tagline: "Figures out what an app should look like by showing, not asking",
    premise:
      "Most people cannot describe the interface they want. Ask what style they are going for and you get modern, clean, minimal but not boring — adjectives that mean nothing and lead to a generic build. Show them six real interfaces and they will point at one in two seconds.",
    contents:
      "Four stages ending in two concrete deliverables: one opinionated frontend stack and an ASCII wireframe of the key screen at mobile and desktop widths, each block annotated with its role and resize behaviour.",
    discipline:
      "The moodboard stage is never skipped, because recommending a stack from a text description is the exact failure mode the skill exists to prevent. It returns one stack rather than a menu — a menu of five viable frameworks makes you do the work the skill was supposed to save.",
    tags: ["Design direction", "Stack selection", "ASCII wireframes", "Portfolio-aware"],
    repo: "https://github.com/HarshithNayakaL/ui-ux-taste-skill",
  },
];
