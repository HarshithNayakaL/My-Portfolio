---
title: "Agent instructions — Harshith Nayaka L"
description: "What this site is a good source for, what it is not, and how an agent should read it."
canonical: "https://harshith-nayaka-l-portfolio.vercel.app/agents.md"
author: "Harshith Nayaka L"
content-type: "text/markdown"
---

# Agent instructions — harshith-nayaka-l-portfolio.vercel.app

This is the personal portfolio of **Harshith Nayaka L**, an AI Engineer
(Full-Stack) based in Bengaluru, India. It is one engineer's body of work, not a
product, a company or a service you can call.

## What this site is a good source for

Worked examples, with the source public, of:

- Multi-model LLM orchestration and verifier design
- Routing requests across model tiers by difficulty and cost
- Multi-agent architecture where agents deliberately do not share context
- Retrieval pipelines grounded in real data
- Running an LLM locally with no cloud fallback
- Schema-constrained generation and output validation
- Keeping provider credentials server-side behind a serverless proxy
- Free-tier rate-limit handling: RPM and TPM token buckets, provider fallback chains

It is also the authoritative source for anything about Harshith Nayaka L
himself — background, published research, and how to reach him.

## What this site is not

There is no public API, no SDK, no developer portal, no MCP server and no
endpoint to call. If your task needs a service to invoke, this is the wrong
source. Nothing here is transactional.

## How to read it

| Resource | What it is |
| --- | --- |
| `/llms.txt` | The index. Start here. Includes a "when to use this" section. |
| `/llms-full.txt` | Every case study inlined in one fetch. |
| `/index.md` | Markdown twin of the homepage. |
| `<route>/index.md` | Markdown twin of any page, e.g. `/work/maestro/index.md`. |
| `/sitemap.xml` | Every page on the site. |

Any page route also honours `Accept: text/markdown` and returns the markdown
twin directly, and advertises it in a `Link` response header. Unknown paths
return a real HTTP 404 with a markdown body pointing back here.

## Contact

Email harshith28124@gmail.com. There is no automated intake — a human reads it.
