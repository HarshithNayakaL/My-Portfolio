import SectionHeading from "./SectionHeading";
import Reveal from "./Reveal";
import Icon from "./Icon";

/**
 * The FAQ, in my voice, in the words people actually use. The first version
 * was written for a parser: keyword-stuffed questions nobody types ("Can I
 * hire an AI automation engineer in Bangalore for marketing workflows?"),
 * third-person answers under first-person questions, and lines like "Harshith
 * Nayaka L is one". A Google AI Mode audit showed what real searches look
 * like — short, blunt, about cost, fit and whether something works — and that
 * the stiff answers were not being cited anyway.
 *
 * So: questions a client or another engineer would really ask, first person
 * throughout, and a first sentence that answers on its own, because that is
 * the sentence an answer engine lifts. Every fact traces to a project page.
 *
 * This list is the single source for the visible FAQ, the FAQPage schema, the
 * markdown twins, llms-full.txt, the API and the A2A agent. Every question is
 * visible, never schema-only. No rates, turnaround or promises: the pricing
 * question is answered honestly by saying there is no rate card.
 */
export const faqs: { q: string; a: string }[] = [
  {
    q: "Who are you?",
    a: "I'm Harshith Nayaka L, an AI Engineer - Full Stack at DemandNXT in Bengaluru (Bangalore), India. Before this role I was the AI Workflow Engineer there. At work I build AI systems for marketing and creative teams; in public I've shipped things like Maestro, a multi-model LLM orchestration engine, and Cannon, a multi-agent assistant, both live and open-source.",
  },
  {
    q: "Are you available for freelance work?",
    a: "Yes. Email me at harshith28124@gmail.com, or use the contact form on this site, which goes to the same inbox.",
  },
  {
    q: "How much do you charge?",
    a: "There's no rate card on this site, on purpose: the price depends entirely on what needs building, and a number on a page can't know that. Email me what you're trying to do and we can talk about it.",
  },
  {
    q: "I'm looking for an AI engineer in Bangalore. What should I actually check?",
    a: "Check things you can verify rather than a skills list: a system you can try, code you can read, and a straight answer to what happens when the model is wrong. That last one matters most, because every demo works and the failures only show up in production. Every project on this site links its code or a live app for that reason, and I'm based in Bengaluru myself if you want to judge me the same way.",
  },
  {
    q: "Can you automate our marketing workflows with AI?",
    a: "Yes. At DemandNXT I build AI systems for marketing and creative teams, and the shape is usually the same: a brief goes in, content comes out, and most of the work is the checking in between. The public projects here show that pattern. The Creative-Ops Pipeline is about 90 n8n nodes that send each request to the right model, force the output into a fixed structure and stop bad output at QA gates instead of shipping it. BrandForge goes further: it reads a brand from its own website, generates a six-shot campaign, and repairs or blocks any image that doesn't match the real product.",
  },
  {
    q: "Can you build a WhatsApp bot for my business?",
    a: "I've built the front half of one. ReplyDesk is an interactive prototype of a WhatsApp lead agent that answers every new lead in about eight seconds, with a live dashboard for the lead feed, pipeline and response times. It isn't connected to WhatsApp in production yet, and the case study says so plainly.",
  },
  {
    q: "What's the difference between an AI engineer and a regular backend developer?",
    a: "Mostly what happens when things go wrong. A normal backend either works or throws an error; a model always gives you an answer, including when it's wrong. So on top of the usual building, the job is sending each request to the right model, checking output instead of trusting it, having a second model verify the first, and making the hundredth run behave like the first.",
  },
  {
    q: "How long have you been doing this?",
    a: "I've been building since 2022: a few years of shipping, breaking and fixing real systems. I've also co-authored a peer-reviewed paper on running DeepSeek R1 locally for note-taking (IJRTMR, 2025), and most of my projects are public, so you can judge the work directly.",
  },
  {
    q: "What's your tech stack, and can you work with the tools we already use?",
    a: "Probably, yes. Which model or cloud you use is a wiring choice, not a rebuild. My shipped work runs on Gemini, Groq, Llama, DeepSeek and fully local models through Ollama, with Python and FastAPI, TypeScript, React and Node, n8n and Postgres around them. In Cannon, swapping the AI provider touches one interface, not the whole app.",
  },
  {
    q: "Do you build the whole app, or just the AI part?",
    a: "The whole app, when that's what's needed. The model is usually the smallest part: someone still has to build the API, the database, the interface people actually use and the tests that stop it breaking. Cannon, for example, ships with 91 unit tests and 13 end-to-end tests that run in CI.",
  },
  {
    q: "Do I get the source code?",
    a: "Yes. Most of my work is already public on GitHub, so you can read it before deciding anything. You get the source, the tests and the reasoning behind the decisions, which is the part that's otherwise lost six months later.",
  },
  {
    q: "What do you need from me to get started?",
    a: "A rough description of how the process works today and what a good result would look like. Not a spec: a spec written before anyone knows where it breaks is usually wrong. From that I can tell you how I'd structure it and which parts are most likely to fail.",
  },
  {
    q: "How do you stop AI from hallucinating and making things up?",
    a: "You can't stop a model from hallucinating, but you can stop what it invents from reaching your users. I do three things: ground the model in real sources instead of its memory, never let a model grade its own work, and let code, not the model, make the final call. In BrandForge every conclusion about a brand is marked as either seen on a specific page of its website or inferred, and an image that fails its checks is repaired or blocked, never quietly shipped. In Maestro, a model from a different family checks every answer.",
  },
  {
    q: "Which AI model should my app use?",
    a: "Usually more than one. Most requests don't need your most expensive model, so it pays to score each request first and send it to the cheapest model that can handle it. My project Nova does exactly that: it rates every message on reasoning, code, breadth and context, starts from a mid-sized model, and only moves to the 20B or 120B model when the request clearly calls for it.",
  },
  {
    q: "How do I know if my business shows up in ChatGPT or Google's AI answers?",
    a: "Ask them the questions your customers would ask, and look at whether you're named and who's named instead. That's what my tool SPECTRA automates. It also shows where a fact about your site gets lost on the way to the answer, and it scores the result with fixed, inspectable rules rather than asking an AI to grade you. It's live and open-source.",
  },
  {
    q: "Is it safe to let an AI agent use my computer?",
    a: "Only if it can't approve itself. My Personal MCP OS lets an AI client use the filesystem, shell, browser and an Android phone, but anything risky stops and waits for a human, and that approval works once, for that exact action, and expires in five minutes. Every browser click counts as risky, and nothing is reachable from outside the machine.",
  },
  {
    q: "Can I run an AI model locally without sending my data to the cloud?",
    a: "Yes. My AI Notes app runs DeepSeek R1 on your own machine through Ollama, with no cloud fallback: if the local model isn't running, the app tells you instead of quietly sending your notes somewhere else. The approach is written up in my peer-reviewed paper (IJRTMR, 2025), which reported 87 percent satisfaction on summaries at 1.9 to 3.8 second response times.",
  },
  {
    q: "How do you stop multiple AI agents from mixing up each other's data?",
    a: "Enforce the separation in the code that reads the data, not in the prompt. In Cannon each agent has its own tools and its own data, and the data-access layer won't let one agent read another's. Asking a model to stay in its lane doesn't hold; a hard boundary does.",
  },
  {
    q: "What kind of projects do you take on?",
    a: "AI systems that have to work without someone babysitting them: multi-agent assistants, AI that answers from your own data, AI features inside an existing product, and the backend and interface around all of that. Also plain automation with n8n when that's what the problem needs, rather than adding a model for its own sake.",
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
                <summary className="faq-summary">
                  {/* A span, not an h3: a <summary> is a button, and headings
                      inside it can drop out of screen readers' heading lists. */}
                  <span className="faq-q">
                    {f.q}
                  </span>
                  <span
                    aria-hidden
                    className="faq-toggle"
                  >
                    <Icon name="plus" />
                  </span>
                </summary>
                <div className="faq-a">
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
