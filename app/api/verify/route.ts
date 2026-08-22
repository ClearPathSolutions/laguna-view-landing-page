import { NextResponse } from "next/server";
import { LEAD_EMAIL } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Lead = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  dob?: string;
  insurer?: string;
  memberId?: string;
  ctmTracked?: boolean;
  // Attribution, captured on first touch by lib/session.ts.
  ctm_visitor_sid?: unknown;
  page_url?: unknown;
  landing_page_url?: unknown;
  referrer?: unknown;
  attribution?: unknown;
  site_visit_id?: unknown;
};

const CTM_FORM_REACTOR_ID =
  "FRT472ABB2C5B9B141A1FFF98722836BB0F6BAE7ADA045D98FCA64D850A3683001F";

/** CTM session ids are 24 hex characters, no dashes. A UUID is not one. */
const CTM_ID = /^[0-9a-f]{24}$/i;

/**
 * The CTM visitor session id, preferring the browser's value and falling back
 * to the __ctmid cookie. __ctmid is first-party on lagunaviewdetox.com, so it
 * rides along on this same-origin POST — which means a client-side regression
 * cannot silently un-attribute every lead.
 *
 * Returns null rather than substituting this site's own session id: CTM files
 * the lead against no visit either way, and a plausible-looking wrong id would
 * hide the fact that t.js was blocked.
 */
function ctmVisitorSid(lead: Lead, req: Request): string | null {
  const fromClient = typeof lead.ctm_visitor_sid === "string" ? lead.ctm_visitor_sid : null;
  if (fromClient && CTM_ID.test(fromClient)) return fromClient;

  const raw = req.headers.get("cookie")?.match(/(?:^|;\s*)__ctmid=([^;]*)/)?.[1];
  const fromCookie = raw ? decodeURIComponent(raw) : null;
  if (fromCookie && CTM_ID.test(fromCookie)) {
    if (fromClient) {
      console.warn("[verify] browser sent a non-CTM sid; using the __ctmid cookie instead");
    }
    return fromCookie;
  }
  if (fromClient) {
    // Log what we actually saw, but don't pass it on: CTM cannot match it, and
    // a malformed visitor_sid risks CTM rejecting the whole submission. Losing
    // an admissions enquiry to gain attribution is not a trade worth making.
    console.warn(
      "[verify] sid is not CTM-shaped and no __ctmid cookie — no visit will attach:",
      fromClient.slice(0, 64)
    );
    return null;
  }
  console.warn("[verify] no CTM session id — t.js was likely blocked");
  return null;
}

// This endpoint is public and unauthenticated, and `attribution` is shaped
// entirely by the client, so take only keys we know and cap their size.
const ATTRIBUTION_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "gclid",
  "gbraid",
  "wbraid",
  "fbclid",
  "msclkid",
  "campaignid",
  "adgroupid",
  "creativeid",
] as const;

const MAX_VALUE_CHARS = 512;

function cleanAttribution(raw: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return out;
  for (const key of ATTRIBUTION_KEYS) {
    const v = (raw as Record<string, unknown>)[key];
    if (typeof v === "string" && v) out[key] = v.slice(0, MAX_VALUE_CHARS);
  }
  return out;
}

function cleanUrl(raw: unknown): string {
  return typeof raw === "string" ? raw.slice(0, 2048) : "";
}

// Server-to-server submission to the CTM FormReactor (no CORS, no ad
// blockers). Never throws — a CTM outage must not block lead delivery.
async function sendToCtm(lead: Lead, sid: string | null): Promise<string> {
  const key = process.env.CTM_FORMREACTOR_KEY;
  if (!key) {
    console.error("[verify] CTM_FORMREACTOR_KEY not set; skipping CTM submission");
    return "no-key";
  }
  // CTM rejects submissions whose phone number isn't a valid dialable
  // number, so normalize to bare digits without the leading country code.
  let phone = String(lead.phone ?? "").replace(/\D/g, "");
  if (phone.length === 11 && phone.startsWith("1")) phone = phone.slice(1);

  const body = new URLSearchParams({
    phone_number: phone,
    country_code: "1",
    caller_name: `${lead.firstName ?? ""} ${lead.lastName ?? ""}`.trim(),
    // Formats per CTM's FormReactor API example: custom_fields[<api_name>]
    // for form data, paid_attribution[...] for ad click data.
    "custom_fields[date_of_birth]": lead.dob || "",
    "custom_fields[insurance_provider]": lead.insurer || "",
    "custom_fields[member_id]": lead.memberId || "",
  });

  // Link the lead to the CTM visitor session so it keeps ad attribution.
  // 24 hex, no dashes — see ctmVisitorSid(). Omitted rather than faked when
  // t.js was blocked, so an unattributed lead is visible instead of plausible.
  if (sid) body.set("visitor_sid", sid);

  // The real entry page, with its campaign — not the page the form sits on.
  // Falls back to the current page only when nothing was ever captured.
  const landing = cleanUrl(lead.landing_page_url) || cleanUrl(lead.page_url);
  if (landing) body.set("custom_fields[landing_page_url]", landing);

  // First-touch campaign, read from localStorage by the browser rather than
  // from the URL at submit time. Reading it live is the whole Fault B: a
  // visitor who lands on an ad and then reaches a clean URL submits as direct
  // traffic, and the lead still delivers, so nothing ever surfaces the loss.
  //
  // Each UTM goes under both the utm_* name and the name CTM's Paid Ads Data
  // panel rows use; CTM ignores keys it doesn't know. ValueTrack ids only
  // arrive if the ad's final URL carries them (e.g. &campaignid={campaignid}).
  const campaign = cleanAttribution(lead.attribution);
  const CTM_ATTRIBUTION_KEYS: Array<[string, string]> = [
    ["gclid", "gclid"],
    ["gbraid", "gbraid"],
    ["wbraid", "wbraid"],
    ["utm_source", "utm_source"],
    ["utm_source", "source"],
    ["utm_medium", "utm_medium"],
    ["utm_medium", "medium"],
    ["utm_campaign", "utm_campaign"],
    ["utm_campaign", "campaign"],
    ["utm_campaign", "campaign_name"],
    ["utm_content", "utm_content"],
    ["utm_content", "ad_content"],
    ["utm_content", "content"],
    ["utm_term", "utm_term"],
    ["utm_term", "keyword"],
    ["utm_term", "term"],
    ["campaignid", "campaign_id"],
    ["adgroupid", "adgroup_id"],
    ["creativeid", "creative_id"],
  ];
  for (const [param, ctmKey] of CTM_ATTRIBUTION_KEYS) {
    const v = campaign[param];
    if (v) body.set(`paid_attribution[${ctmKey}]`, v);
  }
  // gbraid/wbraid replace gclid under iOS and consent mode. CTM's own routing
  // rules key on all three, so let either stand in for a missing gclid.
  if (!campaign.gclid) {
    const substitute = campaign.wbraid || campaign.gbraid;
    if (substitute) body.set("paid_attribution[gclid]", substitute);
  }

  console.log("[verify] CTM payload:", body.toString());

  try {
    const res = await fetch(
      `https://api.calltrackingmetrics.com/api/v1/formreactor/${CTM_FORM_REACTOR_ID}?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      }
    );
    const text = await res.text();
    if (!res.ok) {
      console.error("[verify] CTM formreactor error:", res.status, text);
      return `rejected:${res.status}`;
    }
    console.log("[verify] CTM formreactor accepted:", text);
    return "sent";
  } catch (err) {
    console.error("[verify] CTM formreactor request failed:", err);
    return "error";
  }
}

function esc(v: unknown): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function POST(req: Request) {
  let lead: Lead;
  try {
    lead = (await req.json()) as Lead;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { firstName, lastName, phone, insurer } = lead;
  if (!firstName || !lastName || !phone || !insurer) {
    return NextResponse.json(
      { error: "Please complete all required fields." },
      { status: 400 }
    );
  }

  const sid = ctmVisitorSid(lead, req);
  // The browser tracker already logged the lead in CTM (session-linked);
  // only fall back to the REST API when that didn't happen.
  const ctm = lead.ctmTracked ? "sent-by-browser" : await sendToCtm(lead, sid);

  const to = process.env.LEAD_TO_EMAIL || LEAD_EMAIL;
  const from = process.env.LEAD_FROM_EMAIL || "Laguna View Website <onboarding@resend.dev>";
  const apiKey = process.env.RESEND_API_KEY;

  // Attribution goes in the email too, so marketing can reconcile a lead
  // against CTM by hand when a visit failed to attach.
  const campaign = cleanAttribution(lead.attribution);
  const source = Object.entries(campaign)
    .map(([k, v]) => `${k}=${v}`)
    .join(" · ");

  const rows: Array<[string, unknown]> = [
    ["Name", `${firstName} ${lastName}`],
    ["Phone", phone],
    ["Date of birth", lead.dob || "—"],
    ["Insurance provider", insurer],
    ["Member ID", lead.memberId || "—"],
    ["Landing page", cleanUrl(lead.landing_page_url) || cleanUrl(lead.page_url) || "—"],
    ["Referrer", cleanUrl(lead.referrer) || "direct"],
    ["Campaign", source || "none captured"],
    ["CTM visitor sid", sid || "none — t.js blocked, no visit attached"],
  ];
  const html = `
    <h2 style="font-family:Georgia,serif;color:#011223">New insurance verification lead</h2>
    <table style="font-family:Arial,sans-serif;border-collapse:collapse">
      ${rows
        .map(
          ([k, v]) =>
            `<tr><td style="padding:6px 14px 6px 0;color:#166876;font-weight:bold">${esc(
              k
            )}</td><td style="padding:6px 0;color:#3F4E5D">${esc(v)}</td></tr>`
        )
        .join("")}
    </table>
    <p style="font-family:Arial,sans-serif;color:#9aa">Submitted from the Laguna View landing page.</p>
  `;

  // No Resend key configured: log the lead so nothing is lost, and still succeed.
  if (!apiKey) {
    console.log("[verify] lead received (email delivery not configured):", {
      ...lead,
      to,
    });
    return NextResponse.json({
      ok: true,
      delivered: false,
      ctm,
      message: "Thank you — an admissions specialist will call you shortly.",
    });
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: undefined,
        subject: `New verification lead — ${firstName} ${lastName}`,
        html,
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error("[verify] resend error:", res.status, detail);
      // Don't lose the lead — log it and still tell the visitor we've got them.
      console.log("[verify] lead (email failed):", lead);
      return NextResponse.json({
        ok: true,
        delivered: false,
        ctm,
        message: "Thank you — an admissions specialist will call you shortly.",
      });
    }

    return NextResponse.json({
      ok: true,
      delivered: true,
      ctm,
      message: "Thank you — an admissions specialist will call you shortly.",
    });
  } catch (err) {
    console.error("[verify] unexpected error:", err);
    console.log("[verify] lead (exception):", lead);
    return NextResponse.json({
      ok: true,
      delivered: false,
      ctm,
      message: "Thank you — an admissions specialist will call you shortly.",
    });
  }
}
