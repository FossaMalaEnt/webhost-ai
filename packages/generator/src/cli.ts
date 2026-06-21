#!/usr/bin/env node
/**
 * Scriptable entry point for the website generator.
 *
 * Examples:
 *   # Read a business JSON file, write a single self-contained HTML file:
 *   node packages/generator/src/cli.ts --input samples/bellas-trattoria.json --out out/bellas.html
 *
 *   # Write <out-dir>/<slug>/index.html (handy for hosting per-hostname):
 *   node packages/generator/src/cli.ts --input samples/joes-plumbing.json --out-dir out
 *
 *   # Pipe JSON in on stdin, HTML out on stdout (composes with the outreach tool):
 *   cat samples/bellas-trattoria.json | node packages/generator/src/cli.ts > site.html
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { generateSite } from "./index.ts";
import type { Business } from "./types.ts";

interface Args {
  input?: string;
  out?: string;
  outDir?: string;
  help?: boolean;
}

function parseArgs(argv: string[]): Args {
  const args: Args = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--input" || a === "-i") args.input = argv[++i];
    else if (a === "--out" || a === "-o") args.out = argv[++i];
    else if (a === "--out-dir" || a === "-d") args.outDir = argv[++i];
    else if (a === "--help" || a === "-h") args.help = true;
  }
  return args;
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString("utf8");
}

const HELP = `webhost-generate — turn a business JSON into a deployable website

Usage:
  webhost-generate --input <file.json> [--out <file.html> | --out-dir <dir>]
  cat <file.json> | webhost-generate > site.html

Options:
  -i, --input <file>    Business JSON file (default: stdin)
  -o, --out <file>      Write HTML to this file (default: stdout)
  -d, --out-dir <dir>   Write <dir>/<slug>/index.html
  -h, --help            Show this help
`;

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    process.stdout.write(HELP);
    return;
  }

  const raw = args.input ? await readFile(args.input, "utf8") : await readStdin();
  if (!raw.trim()) {
    throw new Error("No business JSON provided (pass --input <file> or pipe JSON on stdin).");
  }

  let business: Business;
  try {
    business = JSON.parse(raw) as Business;
  } catch (err) {
    throw new Error(`Invalid JSON: ${(err as Error).message}`);
  }

  const site = generateSite(business);

  if (args.outDir) {
    const dir = join(args.outDir, site.slug);
    await mkdir(dir, { recursive: true });
    const file = join(dir, "index.html");
    await writeFile(file, site.html, "utf8");
    process.stderr.write(`Generated ${site.template} site -> ${file} (${site.bytes} bytes)\n`);
  } else if (args.out) {
    await mkdir(dirname(args.out), { recursive: true });
    await writeFile(args.out, site.html, "utf8");
    process.stderr.write(`Generated ${site.template} site -> ${args.out} (${site.bytes} bytes)\n`);
  } else {
    process.stdout.write(site.html);
  }
}

main().catch((err: unknown) => {
  process.stderr.write(`Error: ${(err as Error).message}\n`);
  process.exit(1);
});
