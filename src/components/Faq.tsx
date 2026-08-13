import SectionHeading from "./SectionHeading";
import Reveal from "./Reveal";

/**
 * Questions people actually ask before starting a project.
 *
 * Every answer here is drawn from work that exists and can be checked — the
 * case studies, the public repos, the stack those projects are built on. There
 * is deliberately nothing about rates, availability or turnaround: those are
 * commitments, not facts, and inventing them would put promises on the site
 * that nobody made.
 */
const faqs: { q: string; a: string }[] = [
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

        {/* Reveal carries the row styling rather than wrapping a second div.
            A <dl> may group each <dt>/<dd> pair in one <div>, but not two
            nested ones — with Reveal's own div on the outside this list was
            dl > div > div > dt, which fails both the definition-list and
            dlitem accessibility checks and, through them, the agent
            accessibility tree. One div, styled by Reveal, is valid and keeps
            the staggered reveal. */}
        <dl className="mt-14 max-w-3xl">
          {faqs.map((f, i) => (
            <Reveal
              key={f.q}
              delay={(i % 3) * 0.06}
              className="border-t border-line py-8 first:border-t-0 first:pt-0"
            >
              <dt>
                <h3 className="text-lg font-semibold tracking-tight text-ink md:text-xl">
                  {f.q}
                </h3>
              </dt>
              <dd className="mt-3 text-pretty text-base leading-relaxed text-dim md:text-lg">
                {f.a}
              </dd>
            </Reveal>
          ))}
        </dl>
      </div>
    </section>
  );
}
