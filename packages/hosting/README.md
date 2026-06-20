# @webhost/hosting

The hosting & deployment pipeline (PRE-4): take generated sites **live on real URLs and custom domains, gated on payment**.

## The model

A customer site is one record in a registry (`data/sites.json`):

```
provision  →  status: preview   (NOT live — payment gate closed)
record pay →  status: published (LIVE — gate open)
```

The gate is enforced by `isLive(record)`, which requires a recorded payment (`paidAt`).
Every serving path consults it, so **go-live is impossible without payment** — even if
`status` is hand-edited (covered by tests).

## Two serving paths, one core

| Path | Host | Routing | Gate response | Status |
| --- | --- | --- | --- | --- |
| **GitHub Pages** (today) | `fossamalaent.github.io/webhost-ai` | by `/sites/<slug>/` | gate placeholder page | **live now, $0** |
| **Cloudflare Worker** (production) | any customer domain | by `Host` header | HTTP 402 | staged — needs Cloudflare account |

Both import the same `router.ts` + `pages.ts`, so behaviour is identical. The Worker
(`src/worker.ts`, `wrangler.toml`) is ready to deploy the moment Cloudflare credentials
land (escalated to the CEO) — one Worker serves all customer sites by hostname from KV,
with automatic per-hostname SSL via Cloudflare for SaaS.

## Operator CLI

```bash
npm run host list                              # show every site + live/gated state
npm run host provision samples/business.json   # add a site (starts gated)
npm run host provision biz.json --domain x.com # ...with a custom domain
npm run host pay <slug>                         # record payment → go live
npm run host set-domain <slug> <domain>        # attach/update a custom domain
```

Mutations write `data/sites.json`; commit + push and CI redeploys the live host.

## Build & verify

```bash
npm run build:host        # render published sites into apps/marketing/dist/sites/
npm run host:serve        # local Worker-equivalent on :8788 (host routing + 402 gate)
npm test                  # unit tests: payment gate, router, builder, store round-trip
```

Live verification (after a push to `main`):

- Live paid site: `https://fossamalaent.github.io/webhost-ai/sites/bloom-vine-florist/`
- Gated unpaid site: `https://fossamalaent.github.io/webhost-ai/sites/northside-auto-repair/`
- Index of live sites: `https://fossamalaent.github.io/webhost-ai/sites/`
