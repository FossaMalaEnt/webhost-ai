# Architecture & Stack Decision (PRE-2)

_Owner: Founding Engineer. Status: adopted 2026-06-20. This is the foundation all downstream product work builds on._

## TL;DR

Boring, cheap, fast-to-ship. **Node.js + TypeScript** everywhere, **static-HTML output** for customer
sites, **GitHub + GitHub Actions** for source/CI, and **GitHub Pages today / Cloudflare in production**
for hosting. Per-site marginal cost trends to ~zero because every generated site is a single static file.

## The bet that drives the stack

Our product is **many small websites, hosted cheaply, generated fast**. So the core technical constraints are:

1. **Low marginal cost per site** — we host every customer + every outreach demo. Static files win.
2. **Fast time-to-live-demo** — outreach depends on generating + previewing a site in seconds.
3. **Small ops surface** — one founding engineer owns everything; avoid services that need babysitting.

Static-site generation satisfies all three: a generated site is one self-contained HTML file with inlined
CSS, servable from any CDN/object store at near-zero cost, with no per-site runtime.

## Decisions

| Area | Choice | Why |
| --- | --- | --- |
| Language / runtime | **Node.js 24 + TypeScript (ESM)** | One language across generator, hosting, outreach, marketing. Node 24 runs `.ts` directly (type-stripping) → no build step to iterate. |
| Site generator | **In-repo `@webhost/generator`** — `Business` JSON → self-contained HTML | No heavy framework. Output is one static file: cheapest possible to host and serve per-hostname. API-callable (outreach calls it). |
| Repo / source control | **GitHub monorepo** (npm workspaces) | One repo for generator, hosting, outreach, marketing. Cheap, simple, already authenticated. |
| CI | **GitHub Actions** | Free for our scale, lives next to the code, one workflow file. Runs typecheck + tests + build on every push/PR. |
| Hosting (now) | **GitHub Pages** via Actions | Zero new accounts, zero spend, live URL today. Proves the build→deploy pipeline end-to-end. |
| Hosting (production) | **Cloudflare** (Workers + R2/KV, custom domains) | The scalable, cheap home for many customer sites with custom domains + SSL. **Needs a Cloudflare account — escalated to CEO (see below).** |
| Secrets / env | **GitHub Actions secrets** + local `.env` (gitignored), `.env.example` checked in | No secrets in the repo. Host tokens injected at deploy time. |
| One-command deploy | `npm run build` locally; **push to `main`** triggers CI build + Pages deploy | Single pipeline, no manual deploy steps. |

## Production hosting plan (PRE-4) — the real design

GitHub Pages proves the pipeline but is not the production host (one site per repo; no multi-tenant custom
domains). The production target is **Cloudflare**:

- A single **Cloudflare Worker** serves all customer sites, routing by `Host` header to the right generated
  HTML stored in **R2** (object storage) or **KV**. One deploy, unlimited customer hostnames, ~zero marginal cost.
- **Custom domains + automatic SSL** via Cloudflare for SaaS (point a customer's domain at us).
- **Payment-gated go-live**: a site stays in `preview` state until payment is recorded, then is flipped to `published`.

This keeps "hosting included" reliable and cheap as we scale to many sites. It is the first task of PRE-4.

## Escalation (blocks production hosting, not this task)

Cloudflare requires a **company account + API token** (and, for custom domains, a payment method on file).
This is a spend/credentials decision that belongs to the CEO. PRE-2's acceptance criteria are met **today**
on GitHub Pages with no spend; the Cloudflare account is requested as a follow-up so PRE-4 isn't blocked when it starts.

## What this explicitly is **not** (yet)

- No database yet — customer/site state lands in PRE-4 (start with SQLite/Cloudflare D1; only add Postgres if needed).
- No CMS / page builder — generation is template-driven from structured `Business` input.
- No heavy frontend framework — static HTML keeps hosting cheap and pages fast. Revisit only if a real need appears.
