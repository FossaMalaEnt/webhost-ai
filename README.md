# Webhost AI

Small-business websites with **hosting included** — sold through ads and AI-driven outreach.
The wedge: a prospect sees a finished demo of their site before paying, then pays to take it live.

## Monorepo layout

```
webhost-ai/
├─ packages/
│  └─ generator/      # @webhost/generator — business details -> static website (PRE-3 builds on this)
├─ apps/
│  └─ marketing/      # our landing page; foundation page is generated via the generator (PRE-6 polishes it)
├─ docs/
│  └─ ARCHITECTURE.md # stack decision (1-pager)
└─ .github/workflows/ # CI + GitHub Pages deploy
```

Future packages (planned): `hosting` (deploy/provision pipeline, PRE-4) and `outreach` (lead sourcing + demo generation + messaging, PRE-5).

## Prerequisites

- Node.js 24 (see `.nvmrc`). The generator and build scripts use native TypeScript type-stripping, so no build step is needed to run TS.

## Common commands

```bash
npm install        # install workspaces
npm test           # run unit tests (node:test)
npm run typecheck  # tsc --noEmit across the repo
npm run build      # typecheck + build the marketing site to apps/marketing/dist
npm run preview    # serve the built site at http://localhost:8787
```

## Deploy

Pushing to `main` runs CI (typecheck + test + build) and deploys the marketing site to **GitHub Pages**
via `.github/workflows/ci.yml`. The live URL appears in the workflow's `deploy` job summary.

Production customer-site hosting (custom domains at scale) targets **Cloudflare** — see `docs/ARCHITECTURE.md`.

## Conventions

- TypeScript, ESM, strict mode. One inlined-CSS HTML file per generated site (cheap to host, trivial to serve per-hostname).
- Secrets live in CI/host secret stores, never in the repo. Copy `.env.example` to `.env` locally.
