import { useParams, Link, Navigate } from "react-router-dom";
import { ArrowLeft } from "@phosphor-icons/react";
import { EMAIL, NAME } from "../data/projects";

type Section = { h: string; p: string[] };
type Doc = { title: string; updated: string; intro: string; sections: Section[] };

const UPDATED = "June 2026";

const docs: Record<string, Doc> = {
  privacy: {
    title: "Privacy Policy",
    updated: UPDATED,
    intro:
      "This is a personal portfolio site. It collects as little as possible and never sells your data. This policy explains what is collected, why, and your choices.",
    sections: [
      {
        h: "What I collect",
        p: [
          "Contact form: if you send a message, I receive the name, email address, optional company, and message you type. That's it.",
          "Theme preference: your light/dark choice is stored locally in your browser (localStorage). It never leaves your device and is not a tracking cookie.",
          "Basic server logs: the host (Vercel) may keep standard request logs (e.g. IP, timestamp) for security and reliability, as most web hosts do.",
        ],
      },
      {
        h: "Why I use it",
        p: [
          "Only to read and reply to your message. I do not use it for marketing, profiling, or advertising, and there is no newsletter or automated mailing.",
        ],
      },
      {
        h: "Who it's shared with",
        p: [
          "Your message is delivered through a form provider (Web3Forms) and/or standard email so it reaches my inbox. It is not sold, rented, or shared with anyone else.",
          "External links (GitHub, LinkedIn, project demos) lead to third-party sites with their own privacy policies.",
        ],
      },
      {
        h: "Retention & your rights",
        p: [
          "Messages are kept only as long as needed to respond and follow up. You can ask me to access or delete anything you've sent by emailing " +
            EMAIL +
            ".",
        ],
      },
      {
        h: "Children",
        p: ["This site isn't directed at children under 16 and doesn't knowingly collect their data."],
      },
      {
        h: "Changes",
        p: [
          "If this policy changes, the date above is updated. Questions? Email " + EMAIL + ".",
        ],
      },
    ],
  },
  terms: {
    title: "Terms of Use",
    updated: UPDATED,
    intro:
      "By using this site you agree to these terms. It's a personal portfolio, provided for informational purposes.",
    sections: [
      {
        h: "Use of the site",
        p: [
          "You may browse and share the site freely. Please don't attempt to disrupt it, scrape it abusively, probe it for vulnerabilities without permission, or use it to break the law.",
        ],
      },
      {
        h: "Intellectual property",
        p: [
          "The site design, code, and written content are owned by " +
            NAME +
            " unless stated otherwise. Third-party names, logos, and trademarks (e.g. tools and platforms referenced) belong to their respective owners.",
          "Case studies describe my own work; client-specific data is omitted and demos use generic content.",
        ],
      },
      {
        h: "No warranty",
        p: [
          'The site and its content are provided "as is", without warranties of any kind. To the extent permitted by law, I am not liable for any loss arising from its use or from links to external sites.',
        ],
      },
      {
        h: "Governing law",
        p: ["These terms are governed by the laws of India. Questions? Email " + EMAIL + "."],
      },
    ],
  },
  cookies: {
    title: "Cookie Policy",
    updated: UPDATED,
    intro:
      "Short version: this site does not use tracking or advertising cookies, and there are no third-party analytics.",
    sections: [
      {
        h: "What's stored",
        p: [
          "The only thing stored on your device is your theme preference (light/dark), kept in your browser's localStorage so the site remembers your choice. It is strictly functional and never shared.",
        ],
      },
      {
        h: "No tracking",
        p: [
          "There are no advertising cookies, no cross-site trackers, and no analytics pixels. If that ever changes, this page and the privacy policy will be updated first.",
        ],
      },
      {
        h: "Clearing it",
        p: ["You can clear it any time by clearing your browser's site data."],
      },
    ],
  },
};

export default function Legal() {
  const { doc } = useParams();
  const data = doc ? docs[doc] : undefined;
  if (!data) return <Navigate to="/" replace />;

  return (
    <article className="shell max-w-3xl pt-32 pb-24 md:pt-40">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 font-mono text-[13px] font-medium text-dim transition-colors hover:text-accent-ink"
      >
        <ArrowLeft size={15} weight="bold" /> Back home
      </Link>

      <p className="mt-10 font-mono text-[12px] font-medium uppercase tracking-[0.2em] text-accent-ink">
        Legal
      </p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
        {data.title}
      </h1>
      <p className="mt-3 font-mono text-[12px] text-faint">Last updated · {data.updated}</p>
      <p className="mt-6 max-w-2xl text-pretty text-base leading-relaxed text-dim md:text-lg">
        {data.intro}
      </p>

      <div className="mt-12 space-y-10">
        {data.sections.map((s) => (
          <section key={s.h}>
            <h2 className="text-xl font-semibold tracking-tight text-ink">{s.h}</h2>
            <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-dim">
              {s.p.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <p className="mt-14 border-t border-line pt-6 text-sm text-faint">
        This is a plain-language summary for a personal site, not formal legal
        advice. For anything specific, email{" "}
        {/* Underlined, not just tinted. Inside a paragraph the accent colour
            alone is a 1.17:1 difference from the surrounding text, so anyone
            who cannot separate those two hues has nothing marking this as a
            link — the same reason WCAG asks for a non-colour cue in running
            text. Links that sit on their own, like the nav, don't need it. */}
        <a
          href={`mailto:${EMAIL}`}
          className="font-medium text-accent-ink underline decoration-line underline-offset-4 transition-colors hover:text-ink"
        >
          {EMAIL}
        </a>
        .
      </p>
    </article>
  );
}
