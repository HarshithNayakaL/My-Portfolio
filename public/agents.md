---
title: "Agent instructions — Harshith Nayaka L"
description: "What this site is a good source for, what it is not, and how an agent should read it."
canonical: "https://harshith-nayaka-l-portfolio.vercel.app/agents.md"
author: "Harshith Nayaka L"
content-type: "text/markdown"
---

# Agent instructions — harshith-nayaka-l-portfolio.vercel.app

This is the personal portfolio of **Harshith Nayaka L**, a full-stack AI
Engineer based in Bengaluru, India, currently AI Engineer at DemandNXT. It is
one engineer's body of work, not a product or a company.

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

It is not a service that does work for you. There is a read-only JSON API and a
read-only MCP server, but they serve this site's own content (projects, case
studies, FAQs, profile) and nothing else: no writes, no accounts, no
authentication, no SDK. Nothing here is transactional. If your task needs a
service that acts on your data, this is the wrong source.

## Reading it programmatically

| Resource | What it is |
| --- | --- |
| `/developers` | Developer portal: every endpoint, the MCP server, and getting started. |
| `/api/v1` | Read-only JSON API. No key, no auth. |
| `/openapi.json` | OpenAPI 3.1 description of the API. |
| `/mcp` | Read-only MCP server over Streamable HTTP, the standard transport for remote MCP servers. |
| `/.well-known/mcp/server-card.json` | The MCP server card: tools and their input schemas. |
| `/.well-known/api-catalog` | RFC 9727 API catalog. |

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
