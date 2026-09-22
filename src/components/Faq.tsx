import { Plus } from "@phosphor-icons/react";
import SectionHeading from "./SectionHeading";
import Reveal from "./Reveal";

/**
 * Two kinds of question, in one list.
 *
 * The first four are technical: the questions an answer engine is actually
 * fielding, where a project here is the answer. Each is written to stand alone
 * with its specifics attached, because a quoted passage travels without the
 * page around it. They feed the FAQPage schema and the markdown twins, so the
 * same text is what a person reads, what a parser indexes and what an agent
 * retrieves.
 *
 * The rest are what a prospective client asks before starting.
 *
 * The first three now answer who and where, because an audit of this site put
 * "find an AI workflow engineer in Bengaluru to hire" to a model and it
 * replied — accurately — that the pages held no contact details and no
 * availability. The location, the working title and the availability line were
 * only ever in the About section, which the markdown twins did not carry, so
 * the questions people actually ask had no answer anywhere an agent could
 * reach.
 *
 * Every answer is drawn from work that exists and can be checked — the case
 * studies, the public repos, the stack those projects are built on. Rates and
 * turnaround are still absent: those are commitments, not facts. Availability
 * is different now only because the site states it visibly in About; this
 * repeats that claim rather than inventing one.
 */
export const faqs: { q: string; a: string }[] = [
  {
    q: "Who are you, and where are you based?",
    a: "Harshith Nayaka L \u2014 a full-stack AI Engineer in Bengaluru (Bangalore), Karnataka, India. At DemandNXT the title is AI Workflow Engineer: production AI systems and pipelines for marketing and creative operations. The public work is the clearest answer to what that means in practice \u2014 Maestro, a multi-model LLM orchestration engine, and Cannon, a multi-agent assistant with query-level domain isolation, both live and open-source.",
  },
  {
    q: "Are you available to hire, and how do I get in touch?",
    a: "Available for freelance work. Email is the direct route \u2014 harshith28124@gmail.com \u2014 and the contact form on this site reaches the same inbox. There are no rates or turnaround times quoted anywhere here, because those depend on the work and this site only states things that can be checked.",
  },
  {
    q: "What does an AI workflow engineer do that a backend engineer doesn't?",
    a: "The same building, plus the parts that only matter once a model is in the loop. A backend either works or throws; a model returns something plausible every time, including when it is wrong. So the work is routing a request to the right model before spending on it, constraining output to a schema and validating it anyway, having a second model verify the first, isolating agents so context cannot leak between them, and making the hundredth run behave like the first. Maestro, Nova and Cannon are each one of those problems solved in public.",
  },
  {
    q: "How long have you been building, and what is the honest version?",
    a: "Since 2022. That is a few years of shipping, breaking and repairing things \u2014 not years of production ML research, and this site does not claim otherwise. What that time bought is the unglamorous half of the job: the distance between a demo that works once and a system a business can lean on. There is also one peer-reviewed paper, on local-inference note-taking with DeepSeek R1, published in IJRTMR in Nov\u2013Dec 2025.",
  },
  {
    q: "How do I choose an AI engineer for production-grade RAG pipelines?",
    a: "Ask what happens when retrieval returns the wrong chunk, because that is the failure mode that matters and the demo never shows it. The answers worth hearing are concrete: how the model is stopped from answering off its own memory when context is thin, whether output is constrained to a schema and validated after the fact rather than trusted, whether a second model on a different family verifies the first, and whether the whole decision path can be replayed after an incident. A pipeline that only has a happy path will find its unhappy one in production. Maestro and Cannon are both public if you want to see those answers as code rather than claims.",
  },
  {
    q: "What does AI automation for marketing and creative operations actually look like?",
    a: "Much less glamorous than the demos. At DemandNXT I build production AI systems and pipelines for marketing and creative operations, and the shape is consistent: a brief goes in, work comes out, and most of the engineering is the checking in between. Creative-Ops Pipeline runs roughly ninety n8n nodes — tiered model routing so cheap requests do not buy expensive tokens, schema-constrained generation so output is parseable, and QA gates that stop bad output rather than shipping it. BrandForge goes further and grades its own six-shot campaign against the brand it researched, blocking what it cannot safely fix. Based in Bengaluru (Bangalore), India, and available for freelance work.",
  },
  {
    q: "What are the alternatives to generic SEO tools for measuring AI search visibility?",
    a: "Conventional SEO tools answer a different question: technical health and ranking position. Neither tells you whether an AI answer named you. Generic AI-visibility checkers usually ask a model to grade your site and return a number nobody can audit. I built SPECTRA because I wanted the third option: it asks the questions a buyer would actually ask, reads the answer that comes back, reports whether you were named and who was named instead, and scores deterministically from registered checks over a visible denominator, with the model emitting typed observations rather than the score itself. It is live and open-source, so the scoring is inspectable rather than trusted.",
  },
  {
    q: "How do you build a multi-model content pipeline for marketing automation?",
    a: "Route before you generate, constrain the output, then verify it. Routing first, because a request that scores as trivial has no business consuming a frontier model, and Nova does that scoring on four axes before anything is spent. Constrain second: ask for a defined structure rather than prose, so the rest of the system can consume the result instead of parsing paragraphs. Verify last, on a different model family, because self-assessment carries a documented self-preference bias. Creative-Ops Pipeline wires all three across about ninety n8n nodes; the QA gates are what make it a pipeline rather than a prompt chain.",
  },
  {
    q: "What are the security risks of giving an AI agent access to a local machine?",
    a: "The honest framing is that you are handing a probabilistic system your user account, and the boundary has to assume it will eventually ask for something it should not. Personal MCP OS is my answer, and its design is the argument: every capability declares a risk level, anything sensitive returns an approval request rather than a result, and the grant a human then issues is bound to the exact arguments, session and device, expires in five minutes and is consumed once — there is no tool the model can call to approve itself. Every browser click is treated as sensitive because no executor can infer what a web control does. Nothing listens beyond loopback, there are no credential-extraction tools at all, and the security document states plainly what the boundary is not: approved shell commands and page JavaScript can exceed the filesystem roots, and redaction is best effort. An execution layer that allows arbitrary commands cannot promise to never surface an unknown secret, and claiming otherwise would be the real vulnerability.",
  },
  {
    q: "How do you stop an LLM from marking its own homework?",
    a: "You do not let the model that produced the answer be the model that judges it. Maestro routes every worker output through a verifier on a deliberately different model family, because a model asked to grade its own work carries a documented self-preference bias of roughly 10 to 25 percent. The verifier returns a pass or fail verdict with the issues it found, and a fail triggers one bounded retry rather than an unbounded loop. The whole decision-log is replayable, so you can see which model said what and why.",
  },
  {
    q: "How do you decide which model should answer a request?",
    a: "By scoring the request before spending on it. Nova reads every turn on four axes \u2014 reasoning, code, breadth and context \u2014 produces a deterministic complexity score, then lets a small arbiter model confirm or overrule that reading. The counterintuitive part is that the middle tier is the default, not the cheapest: a request has to earn its way down to the 20B model by being demonstrably trivial, or up to the 120B by being demonstrably hard. Routers that climb from cheapest upward park almost everything in the fast lane and answer it badly.",
  },
  {
    q: "How do you keep multiple agents from leaking context into each other?",
    a: "By enforcing isolation at the query rather than trusting convention. In Cannon each domain agent has its own persona, its own tools and its own retrieval scope, and no agent can read another's data \u2014 the boundary is in the data access layer, not in a prompt asking the model to behave. That is the opposite architecture to an orchestrator like Maestro, where roles are meant to collaborate on one task. It ships with 91 unit tests and 13 end-to-end specs that run in CI without secrets.",
  },
  {
    q: "Can you run an LLM without sending data to a cloud provider?",
    a: "Yes, and with no cloud fallback at all, which is the part that matters. AI Notes runs DeepSeek R1 locally through Ollama for summarisation, keyword extraction and writing assistance; when the local model is not running the app says so rather than quietly shipping your notes somewhere else. The architecture is documented in a peer-reviewed paper I co-authored (IJRTMR, 2025, DOI 10.59256/ijrtmr.20250506023), which reported 87 percent satisfaction on summarisation at 1.9 to 3.8 second response times.",
  },
  {
    q: "What kind of work do you take on?",
    a: "AI systems that have to run unattended: multi-agent assistants, retrieval pipelines grounded in real data, LLM features inside an existing product, and the backends and interfaces around them. Also the automation layer when that is what the problem actually needs — n8n and integration pipelines rather than a model for its own sake.",
  },
  {
    q: "How do you keep an AI system reliable in production?",
    a: "By assuming the model can be wrong at every step. Output is requested against a schema and then validated anyway, because a schema request is a hope rather than a guarantee. Failures are caught at the boundary they happen at, not three steps downstream. Maestro routes work through a verifier whose model family is deliberately different from the worker's, so the check is independent. Cannon falls back across providers behind one typed interface, so an outage degrades the answer instead of breaking the app.",
  },
  {
    q: "Do you work with the models and infrastructure we already use?",
    a: "Yes — provider choice is a wiring decision, not an architectural one. Shipped work runs on Gemini, Groq, Llama, DeepSeek and fully local inference through Ollama, on Google Cloud and Hugging Face, with FastAPI, Node, Postgres and React around it. Cannon in particular is built so swapping a provider touches one interface rather than the application.",
  },
  {
    q: "Do you build the whole application, or only the AI part?",
    a: "The whole thing, when that is useful. The model is usually the least of it: someone still has to build the API, the data layer, the interface a person actually uses, and the tests that stop it regressing. Cannon ships with 91 unit tests and 13 end-to-end specs that run in CI without secrets.",
  },
  {
    q: "Do I get the code?",
    a: "Yes. Most of the work above is public on GitHub and you can read it before deciding anything — that is deliberate. You get the source, the tests, and the reasoning for the decisions that would otherwise be invisible six months later.",
  },
  {
    q: "What do you need to get started?",
    a: "The rough steps of the process as it works today, and what a good outcome looks like. Not a spec — a spec written before anyone understands the failure modes is usually wrong. From that I can tell you what the structure should be, and where the parts that will actually break are.",
  },
];

export default function Faq() {
  return (
    <section
      id="faq"
      className="scroll-mt-28 border-t border-line bg-surface/20"
    >
      <div className="shell py-20 md:py-28">
        <Reveal>
          <SectionHeading
            title="Questions worth asking"
            intro="The things people ask before starting, answered against work you can go and read."
          />
        </Reveal>

        {/* Native <details> rather than a scripted accordion.
            Nineteen answers laid out in full is a wall; the disclosure makes
            the list scannable. Doing it with the element the platform already
            has means it opens before hydration, works with the keyboard for
            free, and announces its own expanded state — no aria-expanded to
            keep in sync, no JS to ship.

            The answers stay in the HTML either way, which is the part that
            matters here: this section is what the FAQPage schema and the
            markdown twins are generated from, and an answer engine reads the
            markup, not the open state. Verified after the change by grepping
            the prerendered HTML for the answer text. */}
        <div className="mt-14 max-w-3xl">
          {faqs.map((f, i) => (
            <Reveal
              key={f.q}
              delay={(i % 3) * 0.06}
              className="border-t border-line first:border-t-0"
            >
              <details className="faq-item group" open={i === 0}>
                <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-6 text-left">
                  {/* A span, not an h3: a <summary> is a button, and headings
                      inside it can drop out of screen readers' heading lists. */}
                  <span className="font-display text-lg font-semibold tracking-tight text-ink transition-colors group-hover:text-accent-ink md:text-xl">
                    {f.q}
                  </span>
                  <span
                    aria-hidden
                    className="mt-1.5 shrink-0 text-dim transition-transform duration-300 group-open:rotate-45"
                  >
                    <Plus weight="bold" size={18} />
                  </span>
                </summary>
                <div className="pb-7 pr-10 text-pretty text-base leading-relaxed text-dim md:text-lg">
                  {f.a}
                </div>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
