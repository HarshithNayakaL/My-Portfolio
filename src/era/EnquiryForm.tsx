import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { EMAIL, WEB3FORMS_KEY } from "../data/projects";

/**
 * The project enquiry form, in the era page's style: one dashed box, plain
 * labelled fields, a dark send button. The sending is the live site's form,
 * moved here unchanged: Web3Forms when a key is set, a prefilled email
 * otherwise, a honeypot, and the WebMCP declarative tool. The FAQ, the
 * contact page, the privacy policy and the agent surface all point at it.
 */
type Status = "idle" | "sending" | "sent" | "error";

export default function EnquiryForm() {
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
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
    // constraints have to be checked here, or an empty form goes straight to
    // the form provider.
    if (!form.checkValidity()) {
      // Scroll first, then report: reportValidity() focuses the first bad
      // field but doesn't reliably bring it into view.
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
      // No form provider configured: fall back to a prefilled email.
      const subject = encodeURIComponent(`Portfolio enquiry — ${name}`);
      const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\nCompany: ${company}\n\n${message}`);
      reply(Promise.resolve("Not sent yet: opened an email draft in the person's mail client; they send it from there."));
      window.location.href = `mailto:${EMAIL}?subject=${subject}&body=${body}`;
      setStatus("sent");
    }
  }

  if (status === "sent") {
    return (
      <div className="enq enq-done" role="status">
        <p className="text-lg font-semibold text-ink">Message on its way.</p>
        <p className="mt-1.5 text-[0.9375rem] text-dim">Thanks for writing. I'll reply to the email you gave.</p>
        <button type="button" className="enq-again" onClick={() => setStatus("idle")}>
          Send another
        </button>
      </div>
    );
  }

  return (
    /* WebMCP declarative tool (developer.chrome.com/docs/ai/webmcp): lets an
       agent map a conversation onto these fields. Deliberately no
       `toolautosubmit`: this sends a real message to a real inbox, so the
       agent fills the form and the person reviews and submits it. */
    <form
      onSubmit={handleSubmit}
      noValidate
      className="enq"
      toolname="draft_project_enquiry"
      tooldescription="Fill in the project enquiry form to contact Harshith Nayaka L about freelance or contract AI engineering work. Fills the fields only — the person reviews the message and submits it themselves."
    >
      {/* One name field, not first + last: the split assumes a name shape
          many people don't have. */}
      <div className="enq-row">
        <div className="enq-field">
          <label htmlFor="name">Name</label>
          <input id="name" name="name" type="text" required autoComplete="name" enterKeyHint="next" />
          <p aria-hidden className="enq-err">Add your name</p>
        </div>
        <div className="enq-field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required autoComplete="email" inputMode="email" enterKeyHint="next" />
          <p aria-hidden className="enq-err">Enter an email address like you@example.com</p>
        </div>
      </div>

      {/* Honeypot. */}
      <input type="checkbox" name="botcheck" aria-label="Leave unchecked (spam check)" tabIndex={-1} aria-hidden className="hidden" />

      <div className="enq-field">
        <label htmlFor="company">
          Company <span className="text-faint">(optional)</span>
        </label>
        <input
          id="company"
          name="company"
          type="text"
          autoComplete="organization"
          toolparamdescription="Optional. The company or organisation the enquiry is on behalf of. Leave empty for a personal enquiry rather than guessing."
        />
      </div>

      <div className="enq-field">
        <label htmlFor="message">What are you building, and where is it stuck?</label>
        <textarea
          id="message"
          name="message"
          required
          rows={4}
          toolparamdescription="What the project is: the problem to solve, rough scope or timeline, and anything already built. Use the person's own words rather than embellishing."
        />
        <p aria-hidden className="enq-err">Add a line about the project</p>
      </div>

      <div className="enq-foot">
        <p aria-live="polite" className="text-[max(12px,0.8125rem)] text-dim">
          {status === "error" ? (
            <>
              Something went wrong. Email me at{" "}
              <a href={`mailto:${EMAIL}`} className="font-semibold text-ink underline underline-offset-2">
                {EMAIL}
              </a>{" "}
              instead.
            </>
          ) : (
            <>
              By sending, you agree to the{" "}
              <Link to="/legal/privacy" className="font-medium text-ink underline underline-offset-2">
                Privacy Policy
              </Link>
              . I only use it to reply.
            </>
          )}
        </p>
        <button type="submit" disabled={status === "sending"} className="era-pill era-pill-dark enq-send" style={{ touchAction: "manipulation" }}>
          {status === "sending" ? "Sending…" : "Send message"}
        </button>
      </div>
    </form>
  );
}
