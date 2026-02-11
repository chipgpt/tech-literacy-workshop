// Mailgun webhook -> OpenClaw hook transform
//
// Goal:
// - Support Mailgun Routes "store and notify" by fetching the stored message via Mailgun API
// - Emit a concise wake event in the main session
//
// Transform contract: export a function(ctx) returning either:
// - { kind: 'wake', text, mode?: 'now'|'next-heartbeat' }
// - null to skip

import fs from "node:fs";

function clip(s, n = 240) {
  if (!s) return "";
  s = String(s).replace(/\s+/g, " ").trim();
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

function pick(obj, paths) {
  for (const p of paths) {
    const v = p
      .split(".")
      .reduce((cur, k) => (cur && typeof cur === "object" ? cur[k] : undefined), obj);
    if (v !== undefined && v !== null && String(v).trim() !== "") return v;
  }
  return undefined;
}

function loadDotenv(dotenvPath = "/home/otothea/.openclaw/.env") {
  try {
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
  } catch {
    // ignore
  }
}

async function fetchStoredMessage(messageUrl) {
  if (!messageUrl) return null;

  // The gateway process may not have env vars loaded; load from the same .env used by send_mailgun.ts
  loadDotenv();

  const apiKey = (process.env.MAILGUN_API_KEY || "").trim();
  if (!apiKey) throw new Error("MAILGUN_API_KEY missing (needed to fetch stored message)");

  const auth = Buffer.from(`api:${apiKey}`).toString("base64");
  const res = await fetch(messageUrl, {
    headers: {
      Authorization: `Basic ${auth}`,
      Accept: "application/json",
    },
  });

  const bodyText = await res.text();
  if (!res.ok) {
    throw new Error(`fetch stored message failed: ${res.status} ${clip(bodyText, 200)}`);
  }

  try {
    return JSON.parse(bodyText);
  } catch {
    return { raw: bodyText };
  }
}

export async function transform(ctx) {
  const payload = ctx?.payload || {};

  // 0) Mailgun Routes: store and notify
  // Common fields: message-url / message_url / messageUrl
  const messageUrl = pick(payload, ["message-url", "message_url", "messageUrl"]);
  if (messageUrl) {
    try {
      const stored = await fetchStoredMessage(messageUrl);

      // Stored message JSON varies depending on whether you requested MIME, etc.
      const sender = pick(stored, [
        "From",
        "from",
        "sender",
        "message.headers.from",
        "message.headers.From",
      ]);
      const recipient = pick(stored, ["To", "to", "recipient"]);
      const subject = pick(stored, [
        "Subject",
        "subject",
        "message.headers.subject",
        "message.headers.Subject",
      ]);
      const body = pick(stored, ["stripped-text", "stripped_text", "body-plain", "body_plain", "text"]);

      const text = `Mailgun: inbound email (stored)${sender ? ` from ${clip(sender, 120)}` : ""}${recipient ? ` to ${clip(recipient, 120)}` : ""}${subject ? ` | subj: ${clip(subject, 140)}` : ""}${body ? ` | ${clip(body, 240)}` : ""}`;
      return { kind: "wake", text, mode: "now" };
    } catch (e) {
      const err = e?.message ? String(e.message) : String(e);
      const text = `Mailgun: store+notify received but fetch failed | ${clip(err, 240)}`;
      return { kind: "wake", text, mode: "now" };
    }
  }

  // 1) Mailgun Events API style (JSON)
  const eventData = payload["event-data"] || payload.eventData;
  if (eventData && typeof eventData === "object") {
    const event = eventData.event;

    // Ignore noisy events by default
    const ignore = new Set(["delivered", "opened", "clicked", "accepted"]);
    if (ignore.has(event)) return null;

    const from = pick(eventData, [
      "message.headers.from",
      "message.headers.From",
      "envelope.sender",
      "envelope.from",
      "recipient",
    ]);
    const to = pick(eventData, ["recipient", "envelope.to"]);
    const subject = pick(eventData, ["message.headers.subject", "message.headers.Subject"]);

    if (event === "stored") {
      const text = `Mailgun: inbound email stored${from ? ` from ${clip(from, 120)}` : ""}${to ? ` to ${clip(to, 120)}` : ""}${subject ? ` | subj: ${clip(subject, 140)}` : ""}`;
      return { kind: "wake", text, mode: "now" };
    }

    if (event === "failed") {
      const reason = pick(eventData, ["delivery-status.description", "delivery-status.message", "reason"]);
      const text = `Mailgun: delivery failed${to ? ` to ${clip(to, 120)}` : ""}${subject ? ` | subj: ${clip(subject, 140)}` : ""}${reason ? ` | ${clip(reason, 180)}` : ""}`;
      return { kind: "wake", text, mode: "now" };
    }

    if (event === "complained" || event === "unsubscribed") {
      const text = `Mailgun: ${event}${to ? ` (${clip(to, 120)})` : ""}${subject ? ` | subj: ${clip(subject, 140)}` : ""}`;
      return { kind: "wake", text, mode: "now" };
    }

    const text = `Mailgun: event=${event}${to ? ` to ${clip(to, 120)}` : ""}${subject ? ` | subj: ${clip(subject, 140)}` : ""}`;
    return { kind: "wake", text, mode: "now" };
  }

  // 2) Mailgun Routes (inbound email) basic style (often form-encoded fields)
  const sender = pick(payload, ["sender", "from", "From"]);
  const recipient = pick(payload, ["recipient", "to", "To"]);
  const subject = pick(payload, ["subject", "Subject"]);
  const body = pick(payload, ["stripped-text", "body-plain", "body_plain", "text"]);

  if (sender || subject || body) {
    const text = `Mailgun: inbound email${sender ? ` from ${clip(sender, 120)}` : ""}${recipient ? ` to ${clip(recipient, 120)}` : ""}${subject ? ` | subj: ${clip(subject, 140)}` : ""}${body ? ` | ${clip(body, 240)}` : ""}`;
    return { kind: "wake", text, mode: "now" };
  }

  return null;
}

export default transform;
