# @webhost/outreach

The acquisition loop. Given a batch of leads — local businesses with weak or no
web presence — it:

1. **Enriches** each sparse lead into a full `Business` (`enrich.ts`), using
   industry-aware, deterministic defaults (tagline, about, services, brand
   color, template, hero image).
2. **Generates** a personalized demo site via `@webhost/generator`.
3. **Computes** the live preview link: `${baseUrl}/demos/<slug>/`.
4. **Drafts** ready-to-send, fact-grounded outreach (email + SMS) that links the
   preview (`message.ts`).

No network calls and no LLM — everything is deterministic, so previews are
stable across rebuilds and free to produce.

## Run it

```bash
# Run the loop over the seed leads, write demos + campaign sheet to ./out
npm run outreach

# Custom batch / base URL / output dir
node packages/outreach/src/cli.ts \
  --leads packages/outreach/leads/sample-leads.json \
  --base-url https://fossamalaent.github.io/webhost-ai \
  --out packages/outreach/out
```

Output under `--out`:

- `demos/<slug>/index.html` — the generated demo for each lead
- `campaign.json` — machine-readable results (preview URL + message per lead)
- `outreach.md` — human-readable sheet for the sales team

## Going live

`apps/marketing/build.mjs` renders the demos for
`packages/outreach/leads/sample-leads.json` into `/demos/<slug>/` on every
deploy, so the preview links resolve to real pages on the live site. To add
prospects, edit the leads file and push — CI rebuilds and redeploys.

## Lead shape

See `src/types.ts`. Minimum: `name`, `industry`, `location`. Optional
`owner`, `phone`, `email`, `established`, `specialties`, `webPresence`
(`none` | `facebook-only` | `outdated-site` | `directory-only`) tailor the demo
and the message hook.

## Sending real outreach

This package **builds and stages** outreach; it does not send anything. Sending
to real businesses requires CEO sign-off on the first batch (see AGENTS.md).
