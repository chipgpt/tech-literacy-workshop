#!/usr/bin/env node
/**
 * Send emails via Mailgun.
 *
 * Credentials are read from environment variables (optionally loaded from a .env file):
 * - MAILGUN_API_KEY (required)
 * - MAILGUN_DOMAIN (required)  e.g. mail.example.com (your Mailgun sending domain)
 * - MAILGUN_FROM (optional)    e.g. "Chip <hi@example.com>"
 * - MAILGUN_API_BASE (optional) default "https://api.mailgun.net" (EU: https://api.eu.mailgun.net)
 *
 * Supports:
 * - Single send: --to --subject --text/--text-file
 * - Batch send from CSV: --csv with per-row {BusinessName}/{Name} substitution
 *
 * Placeholder variables (case-sensitive):
 * - {BusinessName}
 * - {Name}
 */

import fs from "node:fs";
import path from "node:path";

type Dict = Record<string, string>;

type Args = {
  dotenv: string;
  to?: string;
  subject?: string;
  text?: string;
  textFile?: string;
  htmlFile?: string;
  tag?: string;

  csv?: string;
  toCol: string;
  fallbackCol: string;
  nameCol: string;
  businessCol: string;
  start: number;
  end: number;
  dryRun: boolean;
};

function parseArgs(argv: string[]): Args {
  const out: any = {
    dotenv: "/home/otothea/.openclaw/.env",
    toCol: "Email",
    fallbackCol: "ContactEmail",
    nameCol: "OwnerName",
    businessCol: "BusinessName",
    start: 1,
    end: 0,
    dryRun: false,
  };

  const take = (i: number) => {
    if (i + 1 >= argv.length) throw new Error(`Missing value for ${argv[i]}`);
    return argv[i + 1];
  };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) continue;

    switch (a) {
      case "--dotenv":
        out.dotenv = take(i);
        i++;
        break;
      case "--to":
        out.to = take(i);
        i++;
        break;
      case "--subject":
        out.subject = take(i);
        i++;
        break;
      case "--text":
        out.text = take(i);
        i++;
        break;
      case "--text-file":
        out.textFile = take(i);
        i++;
        break;
      case "--html-file":
        out.htmlFile = take(i);
        i++;
        break;
      case "--tag":
        out.tag = take(i);
        i++;
        break;

      case "--csv":
        out.csv = take(i);
        i++;
        break;
      case "--to-col":
        out.toCol = take(i);
        i++;
        break;
      case "--fallback-col":
        out.fallbackCol = take(i);
        i++;
        break;
      case "--name-col":
        out.nameCol = take(i);
        i++;
        break;
      case "--business-col":
        out.businessCol = take(i);
        i++;
        break;
      case "--start":
        out.start = Number(take(i));
        i++;
        break;
      case "--end":
        out.end = Number(take(i));
        i++;
        break;
      case "--dry-run":
        out.dryRun = true;
        break;
      default:
        throw new Error(`Unknown arg: ${a}`);
    }
  }

  return out as Args;
}

function loadDotenv(dotenvPath: string) {
  if (!dotenvPath || !fs.existsSync(dotenvPath)) return;
  const lines = fs.readFileSync(dotenvPath, "utf-8").split(/\r?\n/);
  for (const raw of lines) {
    let line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    if (line.toLowerCase().startsWith("export ")) line = line.slice(7).trim();
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const k = line.slice(0, eq).trim();
    let v = line.slice(eq + 1).trim();
    v = v.replace(/^"|"$/g, "").replace(/^'|'$/g, "");
    if (!(k in process.env)) process.env[k] = v;
  }
}

function normalizeRecipients(to: string): string {
  return to
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .join(",");
}

function isProbablyEmail(s: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test((s || "").trim());
}

function renderTemplate(tpl: string, ctx: Dict): string {
  let out = tpl;
  for (const [k, v] of Object.entries(ctx)) {
    out = out.split(`{${k}}`).join(v);
  }
  return out;
}

function readTextArg(text?: string, textFile?: string): string {
  if (text && textFile) throw new Error("Use either --text or --text-file, not both");
  if (textFile) return fs.readFileSync(textFile, "utf-8");
  return text || "";
}

function parseCsv(content: string): { headers: string[]; rows: Dict[] } {
  const lines = content.split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };

  const parseLine = (line: string): string[] => {
    const out: string[] = [];
    let cur = "";
    let inQ = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQ) {
        if (ch === '"') {
          if (line[i + 1] === '"') {
            cur += '"';
            i++;
          } else {
            inQ = false;
          }
        } else {
          cur += ch;
        }
        continue;
      }

      if (ch === ',') {
        out.push(cur);
        cur = "";
        continue;
      }
      if (ch === '"') {
        inQ = true;
        continue;
      }
      cur += ch;
    }
    out.push(cur);
    return out;
  };

  const headers = parseLine(lines[0]);
  const rows: Dict[] = [];
  for (const line of lines.slice(1)) {
    const cols = parseLine(line);
    const row: Dict = {};
    for (let i = 0; i < headers.length; i++) {
      row[headers[i]] = cols[i] ?? "";
    }
    rows.push(row);
  }
  return { headers, rows };
}

async function sendMailgun(opts: {
  to: string;
  subject: string;
  text: string;
  html?: string;
  tag?: string;
}): Promise<{ ok: boolean; status: number; body: string }>
{
  const apiKey = (process.env.MAILGUN_API_KEY || "").trim();
  const domain = (process.env.MAILGUN_DOMAIN || "").trim();
  const from = (process.env.MAILGUN_FROM || "").trim();
  const apiBase = (process.env.MAILGUN_API_BASE || "https://api.mailgun.net").trim() || "https://api.mailgun.net";

  const missing: string[] = [];
  if (!apiKey) missing.push("MAILGUN_API_KEY");
  if (!domain) missing.push("MAILGUN_DOMAIN");
  if (missing.length) throw new Error(`Missing required env vars: ${missing.join(", ")}`);

  const fromValue = from || `Chip <no-reply@${domain}>`;

  const url = `${apiBase}/v3/${domain}/messages`;

  const params = new URLSearchParams();
  params.set("from", fromValue);
  params.set("to", normalizeRecipients(opts.to));
  params.set("subject", opts.subject);
  params.set("text", opts.text);
  if (opts.html) params.set("html", opts.html);
  if (opts.tag) params.set("o:tag", opts.tag);

  const auth = Buffer.from(`api:${apiKey}`).toString("base64");
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  const body = await res.text();
  return { ok: res.ok, status: res.status, body };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  loadDotenv(args.dotenv);

  const textTemplate = readTextArg(args.text, args.textFile);
  if (!textTemplate) throw new Error("Missing email body: provide --text or --text-file");

  const html = args.htmlFile ? fs.readFileSync(args.htmlFile, "utf-8") : undefined;

  // Batch
  if (args.csv) {
    const csvText = fs.readFileSync(args.csv, "utf-8");
    const { rows } = parseCsv(csvText);

    const start = Math.max(1, args.start || 1);
    const end = args.end && args.end >= start ? Math.min(args.end, rows.length) : rows.length;

    for (let idx = start; idx <= end; idx++) {
      const r = rows[idx - 1];
      const to = (r[args.toCol] || "").trim() || (r[args.fallbackCol] || "").trim();
      if (!isProbablyEmail(to)) {
        if (args.dryRun) console.log(`SKIP row ${idx}: no valid email`);
        continue;
      }

      const ctx: Dict = {
        BusinessName: (r[args.businessCol] || "").trim(),
        Name: ((r[args.nameCol] || "").trim() || "there"),
      };

      const subject = renderTemplate(args.subject || "Quick question, {BusinessName}", ctx);
      const text = renderTemplate(textTemplate, ctx);

      if (args.dryRun) {
        console.log(`DRYRUN row ${idx}: to=${to} subject=${subject}`);
        continue;
      }

      const resp = await sendMailgun({ to, subject, text, html, tag: args.tag });
      if (!resp.ok) {
        console.error(`ERROR row ${idx}: HTTP ${resp.status}: ${resp.body}`);
        process.exit(3);
      }
    }

    process.exit(0);
  }

  // Single
  if (!args.to || !args.subject) {
    throw new Error("Single send requires --to and --subject (or use --csv for batch)");
  }

  if (args.dryRun) {
    console.log(`DRYRUN to=${args.to} subject=${args.subject}`);
    process.exit(0);
  }

  const resp = await sendMailgun({ to: args.to, subject: args.subject, text: textTemplate, html, tag: args.tag });
  if (!resp.ok) {
    console.error(`HTTP ${resp.status}: ${resp.body}`);
    process.exit(3);
  }
}

main().catch((e) => {
  console.error(String(e?.message || e));
  process.exit(2);
});
