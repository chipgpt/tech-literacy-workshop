#!/usr/bin/env node
/**
 * List (and optionally fetch) Mailgun **stored** inbound messages.
 *
 * IMPORTANT: Mailgun only exposes message bodies for inbound mail that was stored
 * via Routes using the `store()` action. If you are not storing inbound messages,
 * this will return zero results.
 *
 * Auth/env (optionally loaded from --dotenv):
 * - MAILGUN_API_KEY (required)
 * - MAILGUN_DOMAIN (required)  e.g. mg.example.com
 * - MAILGUN_API_BASE (optional) default https://api.mailgun.net (EU: https://api.eu.mailgun.net)
 *
 * Usage examples:
 *   npx --yes tsx scripts/list_mailgun_stored.ts --since-hours 24
 *   npx --yes tsx scripts/list_mailgun_stored.ts --since-hours 24 --limit 50 --fetch
 */

import fs from "node:fs";

type Args = {
  dotenv: string;
  sinceHours: number;
  limit: number;
  fetch: boolean;
  maxChars: number;
};

function parseArgs(argv: string[]): Args {
  const out: Args = {
    dotenv: "/home/otothea/.openclaw/.env",
    sinceHours: 24,
    limit: 100,
    fetch: false,
    maxChars: 4000,
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
      case "--since-hours":
        out.sinceHours = Number(take(i));
        i++;
        break;
      case "--limit":
        out.limit = Number(take(i));
        i++;
        break;
      case "--fetch":
        out.fetch = true;
        break;
      case "--max-chars":
        out.maxChars = Number(take(i));
        i++;
        break;
      default:
        throw new Error(`Unknown arg: ${a}`);
    }
  }

  if (!Number.isFinite(out.sinceHours) || out.sinceHours <= 0) {
    throw new Error("--since-hours must be a positive number");
  }
  if (!Number.isFinite(out.limit) || out.limit <= 0) {
    throw new Error("--limit must be a positive number");
  }
  if (!Number.isFinite(out.maxChars) || out.maxChars <= 0) {
    throw new Error("--max-chars must be a positive number");
  }

  return out;
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

function authHeader(): string {
  const apiKey = (process.env.MAILGUN_API_KEY || "").trim();
  if (!apiKey) throw new Error("Missing required env var: MAILGUN_API_KEY");
  const auth = Buffer.from(`api:${apiKey}`).toString("base64");
  return `Basic ${auth}`;
}

function cfg() {
  const domain = (process.env.MAILGUN_DOMAIN || "").trim();
  const apiBase = (process.env.MAILGUN_API_BASE || "https://api.mailgun.net").trim() ||
    "https://api.mailgun.net";
  if (!domain) throw new Error("Missing required env var: MAILGUN_DOMAIN");
  return { domain, apiBase };
}

async function fetchJson(url: string): Promise<any> {
  const res = await fetch(url, {
    headers: {
      Authorization: authHeader(),
    },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`);
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Expected JSON, got: ${text.slice(0, 200)}`);
  }
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      Authorization: authHeader(),
    },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`);
  return text;
}

function pick(o: any, path: string, fallback = ""): string {
  try {
    const parts = path.split(".");
    let cur: any = o;
    for (const p of parts) cur = cur?.[p];
    if (cur === undefined || cur === null) return fallback;
    return String(cur);
  } catch {
    return fallback;
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  loadDotenv(args.dotenv);
  const { domain, apiBase } = cfg();

  const begin = new Date(Date.now() - args.sinceHours * 60 * 60 * 1000).toUTCString();

  const qs = new URLSearchParams();
  qs.set("event", "stored");
  qs.set("ascending", "yes");
  qs.set("begin", begin);
  qs.set("limit", String(args.limit));

  const url = `${apiBase}/v3/${domain}/events?${qs.toString()}`;
  const data = await fetchJson(url);
  const items: any[] = Array.isArray(data?.items) ? data.items : [];

  if (items.length === 0) {
    console.log(`No stored messages found in the last ~${args.sinceHours} hours.`);
    return;
  }

  for (const it of items) {
    const ts = pick(it, "timestamp");
    const from = pick(it, "message.headers.from") || pick(it, "envelope.sender");
    const to = pick(it, "recipient") || pick(it, "envelope.targets");
    const subject = pick(it, "message.headers.subject");
    const storageUrl = pick(it, "storage.url");

    console.log("---");
    console.log(`timestamp: ${ts}`);
    console.log(`from: ${from}`);
    console.log(`to: ${to}`);
    console.log(`subject: ${subject}`);
    console.log(`storage_url: ${storageUrl}`);

    if (args.fetch && storageUrl) {
      // storage.url returns a JSON doc including body-plain/body-html when available.
      const raw = await fetchText(storageUrl);
      const clipped = raw.length > args.maxChars ? raw.slice(0, args.maxChars) + "\n...[clipped]" : raw;
      console.log("message:");
      console.log(clipped);
    }
  }
}

main().catch((e) => {
  console.error(String(e?.message || e));
  process.exit(2);
});
