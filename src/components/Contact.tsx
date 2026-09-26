import { useState } from "react";
import { Link } from "react-router-dom";
import { PaperPlaneTilt, CheckCircle } from "@phosphor-icons/react";
import { EMAIL, LINKEDIN, GITHUB, WEB3FORMS_KEY } from "../data/projects";
import Reveal from "./Reveal";
import Icon from "./Icon";

const socials = [
  { label: "LinkedIn", href: LINKEDIN },
  { label: "GitHub", href: GITHUB },
];

type Status = "idle" | "sending" | "sent" | "error";

const fieldBase =
  "peer w-full border-b border-line bg-transparent py-2.5 text-base text-ink placeholder-transparent transition-colors focus:border-accent focus:outline-none user-invalid:border-accent-ink";
// Shown once a required field is left empty or malformed (:user-invalid, so
// never while someone is still typing). Text, not just the border colour, so
// the state doesn't rest on colour alone. aria-hidden because the browser's
// own validation message, raised by reportValidity() on submit, is what
// assistive tech announces; this is the visual counterpart.
const errorBase =
  "mt-1.5 hidden font-mono text-[0.6875rem] text-accent-ink peer-user-invalid:block";
const labelBase =
  "pointer-events-none absolute left-0 top-2.5 origin-left font-mono text-[0.75rem] uppercase tracking-[0.12em] text-faint transition-all duration-200 peer-focus:-translate-y-4 peer-focus:text-[0.625rem] peer-focus:text-accent-ink peer-[:not(:placeholder-shown)]:-translate-y-4 peer-[:not(:placeholder-shown)]:text-[0.625rem]";

export default function Contact() {
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    // WebMCP: when an agent submitted the form, hand it the outcome in words
    // instead of leaving it to scrape the page for what happened. The
    // browser only accepts respondWith() synchronously inside this handler,
    // so every branch calls it before its first await. A no-op elsewhere.
    const submit = e.nativeEvent as SubmitEvent & {
      agentInvoked?: boolean;
      respondWith?: (result: Promise<string>) => void;
    };
    const reply = (result: Promise<string>) => {
      if (submit.agentInvoked) submit.respondWith?.(result);
    };

    // noValidate keeps the browser from blocking the submit event, so the
    // constraints have to be checked here. Without this an empty form went
    // straight to the form provider: `required` was on the fields and
    // enforced nowhere.
    if (!form.checkValidity()) {
      // Scroll first, then report: reportValidity() focuses the first bad
      // field but doesn't reliably bring it into view, and left alone it sat
      // above the viewport or under the fixed nav. Instant, so the browser's
      // message bubble anchors to where the field ends up.
      form.querySelector<HTMLElement>(":invalid")?.scrollIntoView({ block: "center" });
      form.reportValidity();
      const problems = [...form.elements]
        .filter((el): el is HTMLInputElement => "validity" in el && !(el as HTMLInputElement).validity.valid)
        .map((el) => `${el.name}: ${el.validationMessage}`);
      reply(Promise.resolve(`Not sent. Fix these fields: ${problems.join("; ")}`));
      return;
    }
    const fd = new FormData(form);
    // Honeypot: invisible to people and to assistive tech, so only a bot
    // fills it. Report success without sending.
    if (fd.has("botcheck")) {
      setStatus("sent");
      form.reset();
      return;
    }
    const get = (k: string) => String(fd.get(k) ?? "").trim();
    const name = get("name");
    const email = get("email");
    const company = get("company");
    const message = get("message");

    if (WEB3FORMS_KEY) {
      setStatus("sending");
      const sent = fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: WEB3FORMS_KEY,
          subject: `Portfolio enquiry — ${name}`,
          from_name: name,
          email,
          company,
          message,
        }),
      })
        .then((res) => res.json())
        .then((json) => Boolean(json.success))
        .catch(() => false);
      reply(
        sent.then((ok) =>
          ok
            ? "Sent. The enquiry reached Harshith's inbox; a reply comes to the email address given."
            : `Not sent: the form service returned an error. Email ${EMAIL} directly instead.`,
        ),
      );
      if (await sent) {
        setStatus("sent");
        form.reset();
      } else setStatus("error");
    } else {
      // No form provider configured — fall back to a prefilled email.
      const subject = encodeURIComponent(`Portfolio enquiry — ${name}`);
      const body = encodeURIComponent(
        `Name: ${name}\nEmail: ${email}\nCompany: ${company}\n\n${message}`,
      );
      reply(Promise.resolve("Not sent yet: opened an email draft in the person's mail client; they send it from there."));
      window.location.href = `mailto:${EMAIL}?subject=${subject}&body=${body}`;
      setStatus("sent");
    }
  }

  return (
    <section
      id="contact"
      className="relative scroll-mt-28 border-t border-line bg-surface/40"
    >
      <div className="shell relative py-20 md:py-28">
        <div className="grid items-start gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          {/* Pitch + direct contact */}
          <Reveal>
            <div>
              <h2 className="text-balance text-[clamp(1.9rem,4.5vw,3rem)] font-semibold leading-[1.1] tracking-tight">
                Have a manual process that should be a reliable system? Tell me
                about it.
              </h2>
              <p className="mt-6 max-w-md text-pretty text-base leading-relaxed text-dim md:text-lg">
                Send a couple of lines about the problem and I'll tell you
                honestly whether I'm the right person to build it.
              </p>

              <div className="mt-8 space-y-3">
                <a
                  href={`mailto:${EMAIL}`}
                  className="inline-flex items-center gap-2 font-mono text-sm font-medium text-dim transition-colors hover:text-accent-ink"
                >
                  {EMAIL}
                </a>
                <div className="flex flex-wrap gap-x-6 gap-y-2 pt-1">
                  {socials.map((s) => (
                    <a
                      key={s.label}
                      href={s.href}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-dim transition-colors hover:text-accent-ink"
                    >
                      {s.label}
                      <Icon name="arrow-up-right" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>

          {/* Send-message form */}
          <Reveal delay={0.08}>
            <div className="glass-card rounded-[var(--radius-lg)] p-6 sm:p-8">
              {status === "sent" ? (
                <div className="flex min-h-[320px] flex-col items-center justify-center text-center">
                  <CheckCircle size={40} weight="fill" className="text-accent-ink" />
                  <p className="mt-4 text-lg font-semibold text-ink">
                    Message on its way.
                  </p>
                  <p className="mt-2 max-w-xs text-sm text-dim">
                    Thanks for reaching out — I'll get back to you at the email
                    you provided, usually within a day or two.
                  </p>
                  <button
                    onClick={() => setStatus("idle")}
                    className="mt-6 text-sm font-semibold text-accent-ink hover:text-ink"
                  >
                    Send another
                  </button>
                </div>
              ) : (
                /* WebMCP declarative tool (developer.chrome.com/docs/ai/webmcp).
                   Lets an agent map a conversation onto these fields instead of
                   guessing at the DOM. Deliberately no `toolautosubmit`: this
                   sends a real message to a real inbox, so the agent fills the
                   form and the person reviews and submits it. Plain unknown
                   attributes in browsers without WebMCP, so it costs nothing. */
                <form
                  onSubmit={handleSubmit}
                  noValidate
                  className="space-y-6"
                  toolname="draft_project_enquiry"
                  tooldescription="Fill in the project enquiry form to contact Harshith Nayaka L about freelance or contract AI engineering work. Fills the fields only — the person reviews the message and submits it themselves."
                >
                  {/* One name field, not first + last: the split assumes a
                      name shape many people don't have. */}
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="relative">
                      <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        placeholder="Name"
                        autoComplete="name"
                        enterKeyHint="next"
                        className={fieldBase}
                      />
                      <label htmlFor="name" className={labelBase}>
                        Name
                      </label>
                      <p aria-hidden className={errorBase}>
                        Add your name
                      </p>
                    </div>
                    <div className="relative">
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        placeholder="Email"
                        autoComplete="email"
                        inputMode="email"
                        enterKeyHint="next"
                        className={fieldBase}
                      />
                      <label htmlFor="email" className={labelBase}>
                        Email
                      </label>
                      <p aria-hidden className={errorBase}>
                        Enter an email address like you@example.com
                      </p>
                    </div>
                  </div>

                  {/* Honeypot. No autoComplete: the attribute is invalid on a
                      checkbox (html-validate flags it) and browsers never
                      autofill one, so it did nothing. */}
                  <input
                    type="checkbox"
                    name="botcheck"
                    tabIndex={-1}
                    aria-hidden
                    className="hidden"
                  />

                  <div className="relative">
                    <input
                      id="company"
                      name="company"
                      type="text"
                      placeholder="Company (optional)"
                      toolparamdescription="Optional. The company or organisation the enquiry is on behalf of. Leave empty for a personal enquiry rather than guessing."
                      autoComplete="organization"
                      className={fieldBase}
                    />
                    <label htmlFor="company" className={labelBase}>
                      Company (optional)
                    </label>
                  </div>

                  <div className="relative">
                    <textarea
                      id="message"
                      name="message"
                      required
                      rows={4}
                      placeholder="Message"
                      toolparamdescription="What the project is: the problem to solve, rough scope or timeline, and anything already built. Use the person's own words rather than embellishing."
                      className={`${fieldBase} resize-none`}
                    />
                    <label htmlFor="message" className={labelBase}>
                      Message
                    </label>
                    <p aria-hidden className={errorBase}>
                      Add a line about the project
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={status === "sending"}
                    style={{ touchAction: "manipulation" }}
                    className="contact-submit btn-accent group inline-flex w-full items-center justify-center gap-2.5 rounded-full py-3.5 text-sm font-semibold disabled:opacity-70"
                  >
                    {status === "sending" ? "Sending…" : "Send message"}
                    <span className="cta-icon">
                      <PaperPlaneTilt weight="bold" size={14} />
                    </span>
                  </button>

                  <p
                    aria-live="polite"
                    className={`text-center text-[0.8125rem] ${
                      status === "error" ? "text-ink" : "text-faint"
                    }`}
                  >
                    {status === "error" ? (
                      <>Something went wrong — please email me directly at{" "}
                        <a href={`mailto:${EMAIL}`} className="font-semibold text-accent-ink">
                          {EMAIL}
                        </a>
                        .
                      </>
                    ) : (
                      <>
                        By submitting, you agree to the{" "}
                        <Link
                          to="/legal/privacy"
                          className="font-medium text-accent-ink hover:text-ink"
                        >
                          Privacy Policy
                        </Link>
                        . No spam, no mailing list — I only use it to reply.
                      </>
                    )}
                  </p>
                </form>
              )}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
