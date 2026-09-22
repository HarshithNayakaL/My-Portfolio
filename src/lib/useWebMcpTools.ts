import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { projects, NAME, EMAIL } from "../data/projects";
import { caseStudies } from "../data/caseStudies";

/**
 * Registers this site's WebMCP tools with the browser.
 * https://developer.chrome.com/docs/ai/webmcp/imperative-api
 *
 * Two tools only, deliberately. Chrome's best-practices guidance is that every
 * tool costs context window and that overlapping tools make the agent's choice
 * harder — so this covers the two things an agent actually needs from a
 * portfolio (find the work, open a piece of it) and nothing else. Writing to a
 * human is handled by the declarative tool on the contact form, which fills
 * fields but never submits.
 *
 * WebMCP is a proposed standard in origin trial from Chrome 149, and behind
 * chrome://flags/#enable-webmcp-testing for local work. Everywhere else the
 * API is absent, so this is a progressive enhancement: with no modelContext
 * the hook does nothing at all.
 */

/**
 * Resolves once the case study for `title` is what's on screen, or after a
 * timeout. The route is lazy-loaded, so navigate() returns before the page
 * exists; Chrome's WebMCP guidance is that a tool returns after the UI has
 * updated, so an agent that reads the page next reads the right one.
 */
function whenHeadingShows(title: string, timeoutMs = 4000): Promise<boolean> {
  return new Promise((resolve) => {
    const start = performance.now();
    const check = () => {
      if (document.querySelector("h1")?.textContent?.trim() === title) return resolve(true);
      if (performance.now() - start > timeoutMs) return resolve(false);
      requestAnimationFrame(check);
    };
    check();
  });
}
export function useWebMcpTools() {
  const navigate = useNavigate();

  useEffect(() => {
    // document.modelContext from Chrome 150; navigator.modelContext is where
    // Chrome 149, the first origin-trial release, has it.
    const mc = document.modelContext ?? navigator.modelContext;
    if (!mc?.registerTool) return;

    const controller = new AbortController();
    const opts = { signal: controller.signal };

    const withCaseStudies = projects.filter(
      (p) => p.hasCaseStudy && caseStudies[p.slug],
    );
    const slugs = withCaseStudies.map((p) => p.slug);

    const register = async () => {
      await mc.registerTool(
        {
          name: "list_projects",
          description:
            `List the engineering projects ${NAME} has built, with a one-line outcome, ` +
            `the technologies used, and the case-study slug for each. Use this to answer ` +
            `questions about his work or to find the right slug before calling open_case_study.`,
          inputSchema: { type: "object", properties: {} },
          annotations: { readOnlyHint: true },
          execute: () =>
            withCaseStudies
              .map((p) => {
                const links = p.links.map((l) => `${l.label}: ${l.href}`).join(", ");
                return [
                  `${p.title} (slug: ${p.slug})`,
                  `  ${p.outcome}`,
                  `  Tech: ${p.tags.join(", ")}`,
                  links ? `  ${links}` : null,
                ]
                  .filter(Boolean)
                  .join("\n");
              })
              .join("\n\n"),
        },
        opts,
      );

      await mc.registerTool(
        {
          name: "open_case_study",
          description:
            `Navigate to the full case study for one of ${NAME}'s projects — the problem, ` +
            `the architecture, the engineering decisions, and the results. Call list_projects ` +
            `first if you do not already know the slug.`,
          inputSchema: {
            type: "object",
            properties: {
              slug: {
                type: "string",
                enum: slugs,
                description: "The case-study slug, as returned by list_projects.",
              },
            },
            required: ["slug"],
          },
          execute: async (params) => {
            const slug = (params as { slug?: string }).slug ?? "";
            const project = withCaseStudies.find((p) => p.slug === slug);
            if (!project) {
              return `No case study with slug "${slug}". Available: ${slugs.join(", ")}.`;
            }
            navigate(`/work/${slug}`);
            const shown = await whenHeadingShows(caseStudies[slug].title);
            return shown
              ? `Opened the ${project.title} case study; it is on screen now. Contact: ${EMAIL}`
              : `Navigating to the ${project.title} case study at /work/${slug}; the page is still loading. Contact: ${EMAIL}`;
          },
        },
        opts,
      );
    };

    // Registration is async and the page may unmount mid-flight; the abort
    // signal both unregisters the tools and rejects any in-flight call.
    register().catch(() => {
      /* API present but registration refused — stay silent, it's an enhancement */
    });

    return () => controller.abort();
  }, [navigate]);
}
