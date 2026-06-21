#!/usr/bin/env node
/**
 * Outreach CLI — run the acquisition loop end to end.
 *
 *   node packages/outreach/src/cli.ts \
 *     --leads packages/outreach/leads/sample-leads.json \
 *     --base-url https://fossamalaent.github.io/webhost-ai \
 *     --out packages/outreach/out
 *
 * Writes, under <out>:
 *   demos/<slug>/index.html   — the generated demo for each lead
 *   campaign.json             — machine-readable results (preview URL + message)
 *   outreach.md               — human-readable sheet for the sales team
 *
 * The demo HTML written here is the same output the marketing build deploys to
 * `/demos/<slug>/`, so the preview links in the sheet are the real live URLs.
 */
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runCampaign } from "./campaign.ts";
import type { CampaignResult, Lead } from "./types.ts";

const here = dirname(fileURLToPath(import.meta.url));
const pkgRoot = join(here, "..");

interface Args {
  leads: string;
  baseUrl?: string;
  out: string;
  now?: string;
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    leads: join(pkgRoot, "leads", "sample-leads.json"),
    out: join(pkgRoot, "out"),
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    if (a === "--leads") args.leads = next();
    else if (a === "--base-url") args.baseUrl = next();
    else if (a === "--out") args.out = next();
    else if (a === "--now") args.now = next();
    else if (a === "--help" || a === "-h") {
      console.log("Usage: cli.ts --leads <file> [--base-url <url>] [--out <dir>] [--now <iso>]");
      process.exit(0);
    }
  }
  return args;
}

/** Render the human-readable campaign sheet the sales team works from. */
function campaignSheet(result: CampaignResult): string {
  const lines: string[] = [
    "# Outreach campaign",
    "",
    `- Generated: ${result.generatedAt}`,
    `- Base URL: ${result.baseUrl}`,
    `- Leads processed: ${result.results.length}`,
    `- Errors: ${result.errors.length}`,
    "",
  ];
  result.results.forEach((r, i) => {
    lines.push(
      `## ${i + 1}. ${r.lead.name} — ${r.lead.industry}, ${r.lead.location}`,
      "",
      `- Preview: ${r.previewUrl}`,
      `- Template: ${r.template}`,
      r.lead.email ? `- Email: ${r.lead.email}` : `- Email: (none on file)`,
      r.lead.phone ? `- Phone: ${r.lead.phone}` : `- Phone: (none on file)`,
      "",
      `**Subject:** ${r.draft.subject}`,
      "",
      "**Email:**",
      "",
      "```",
      r.draft.email,
      "```",
      "",
      "**SMS / DM:**",
      "",
      "```",
      r.draft.sms,
      "```",
      "",
      "---",
      "",
    );
  });
  if (result.errors.length) {
    lines.push("## Errors", "");
    for (const e of result.errors) {
      lines.push(`- ${e.lead.name || "(unnamed lead)"}: ${e.error}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const raw = await readFile(args.leads, "utf8");
  const parsed = JSON.parse(raw);
  const leads: Lead[] = Array.isArray(parsed) ? parsed : parsed.leads;
  if (!Array.isArray(leads)) {
    throw new Error(`Leads file must be a JSON array (or { "leads": [...] }): ${args.leads}`);
  }

  const result = runCampaign(leads, { baseUrl: args.baseUrl, now: args.now });

  await mkdir(args.out, { recursive: true });
  for (const r of result.results) {
    const dir = join(args.out, "demos", r.slug);
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, "index.html"), r.html, "utf8");
  }
  await writeFile(
    join(args.out, "campaign.json"),
    JSON.stringify(
      {
        baseUrl: result.baseUrl,
        generatedAt: result.generatedAt,
        results: result.results.map((r) => ({
          name: r.lead.name,
          slug: r.slug,
          previewUrl: r.previewUrl,
          template: r.template,
          draft: r.draft,
        })),
        errors: result.errors,
      },
      null,
      2,
    ) + "\n",
    "utf8",
  );
  await writeFile(join(args.out, "outreach.md"), campaignSheet(result), "utf8");

  console.log(`Outreach campaign complete:`);
  console.log(`  leads processed: ${result.results.length}`);
  console.log(`  errors:          ${result.errors.length}`);
  console.log(`  output:          ${args.out}`);
  for (const r of result.results) {
    console.log(`  - ${r.lead.name}  ->  ${r.previewUrl}`);
  }
  if (result.errors.length) {
    for (const e of result.errors) {
      console.error(`  ! ${e.lead.name || "(unnamed)"}: ${e.error}`);
    }
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.stack : String(err));
  process.exit(1);
});
