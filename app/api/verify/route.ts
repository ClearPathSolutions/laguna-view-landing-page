import { NextResponse } from "next/server";
import { LEAD_EMAIL } from "@/lib/site";
import { resolveVisitorSid, sanitizeRecord, sanitizeSession, text } from "@/lib/session-server";

/**
 * Clarion lead relay for the insurance-verification form.
 *
 * Clarion is the system of record for admissions enquiries and the only
 * destination that decides this endpoint's response. CallTrackingMetrics still
 * runs on the page for the number swap and the visitor session, but receives no
 * leads — Clarion attaches this one to the CTM visit itself, via
 * `ctm_visitor_sid`. The CTM FormReactor path this route used to carry (both
 * the server-side REST submission and the browser `__ctm.form.track` call) is
 * gone; nothing here should reintroduce it.
 *
 * Reports the truth back to the browser: a 502 here makes the form show an
 * error and the phone number rather than a confirmation, because a lead that
 * silently vanished is worse than a visitor who knows to call.
 *
 * CLARION_SITE_KEY is server-side only and must never gain a NEXT_PUBLIC_
 * prefix.
 */

export const runtime = "nodejs";
// Posts to a third party per request — never cache or prerender it.
export const dynamic = "force-dynamic";

const CLARION_ENDPOINT = "https://api.clarionlabs.ai/forms/public/submit";

/** How submissions are grouped on Clarion's side. */
const FORM_KEY = "insurance_verification";

/** Clarion wants utm as a nested object, keyed without the `utm_` prefix. */
const UTM_KEYS = ["source", "medium", "campaign", "term", "content"] as const;

/** Fields the form marks required — a lead missing one is unactionable. */
const REQUIRED_FIELDS = ["first_name", "last_name", "phone", "insurance_provider"] as const;

const CONFIRMATION = "Thank you — an admissions specialist will call you shortly.";

function esc(v: unknown): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Best-effort email copy, so admissions still sees the lead in an inbox.
 *
 * Deliberately cannot affect the response: Clarion already holds the lead by
 * the time this runs, and telling someone in crisis to call again because a
 * mail API was down would be wrong. Never throws.
 */
async function emailCopy(
  data: Record<string, string>,
  extras: Array<[string, string]>
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const to = process.env.LEAD_TO_EMAIL || LEAD_EMAIL;
  const from = process.env.LEAD_FROM_EMAIL || "Laguna View Website <onboarding@resend.dev>";

  const rows: Array<[string, string]> = [
    ["Name", `${data.first_name ?? ""} ${data.last_name ?? ""}`.trim()],
    ["Phone", data.phone ?? "—"],
    ["Date of birth", data.date_of_birth || "—"],
    ["Insurance provider", data.insurance_provider || "—"],
    ["Member ID", data.member_id || "—"],
    ...extras,
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
    <p style="font-family:Arial,sans-serif;color:#9aa">Submitted from the Laguna View landing page. Clarion holds the authoritative record.</p>
  `;

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
        subject: `New verification lead — ${data.first_name ?? ""} ${data.last_name ?? ""}`.trim(),
        html,
      }),
    });
    if (!res.ok) {
      console.error("[verify] email copy failed", res.status, await res.text().catch(() => ""));
    }
  } catch (error) {
    console.error("[verify] email copy request failed", error);
  }
}

export async function POST(request: Request) {
  const siteKey = process.env.CLARION_SITE_KEY;
  if (!siteKey) {
    // Nothing the visitor can do about this, and we must not claim success.
    console.error("[verify] CLARION_SITE_KEY is not set — lead not delivered");
    return NextResponse.json({ ok: false }, { status: 502 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const data = sanitizeRecord(body.data);
  if (!Object.keys(data).length) {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  // The form sets `noValidate` so it can render its own messages, which means
  // the browser enforces nothing — the check has to happen here.
  if (REQUIRED_FIELDS.some((field) => !data[field])) {
    return NextResponse.json(
      { ok: false, error: "Please complete all required fields." },
      { status: 400 }
    );
  }

  const utmIn = sanitizeRecord(body.utm, { maxKeys: UTM_KEYS.length });
  const utm: Record<string, string> = {};
  for (const key of UTM_KEYS) {
    if (utmIn[key]) utm[key] = utmIn[key];
  }

  const visitorSid = resolveVisitorSid(body.ctm_visitor_sid, request);
  const landingPageUrl = text(body.landing_page_url, 2048);
  const pageUrl = text(body.page_url, 2048);
  const referrer = text(body.referrer, 2048);

  const payload: Record<string, unknown> = {
    site_key: siteKey,
    form_key: FORM_KEY,
    data,
    page_url: pageUrl || null,
    landing_page_url: landingPageUrl || null,
    referrer: referrer || null,
    utm: Object.keys(utm).length ? utm : null,
    gclid: text(body.gclid) || null,
    // This exact key name, flat and top-level, or Clarion drops it and the lead
    // attaches to no visit.
    ctm_visitor_sid: visitorSid || null,
    user_agent: request.headers.get("user-agent"),
    // This form has no opt-in control, so consent is never asserted. Only wire
    // this to true alongside a real checkbox the visitor ticked themselves.
    email_consent: false,
  };

  // Rebuilt from the client's version, never passed through. Null when absent
  // or unsafe, and omitted entirely rather than sent as null.
  const session = sanitizeSession(body.session);
  if (session) payload.session = session;

  const post = (payloadToSend: Record<string, unknown>) =>
    fetch(CLARION_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payloadToSend),
      cache: "no-store",
    });

  try {
    let res = await post(payload);

    // `session` is a key Clarion was not explicitly asked to accept. If their
    // validation is strict, an unknown field would turn every lead into an
    // error — so on a 4xx, drop it and try once more. Losing admissions
    // enquiries to gain context is not a trade worth making.
    if (!res.ok && res.status >= 400 && res.status < 500 && session) {
      const rejection = await res.text().catch(() => "");
      console.warn(
        "[verify] Clarion rejected the payload",
        res.status,
        rejection,
        "— retrying without `session`"
      );
      const { session: _dropped, ...withoutSession } = payload;
      res = await post(withoutSession);
    }

    if (!res.ok) {
      console.error("[verify] Clarion responded", res.status, await res.text().catch(() => ""));
      // Log enough to recover the lead by hand, without the free-text clinical
      // detail this form does not collect anyway.
      console.error(
        "[verify] undelivered lead",
        JSON.stringify({ ...data, ctm_visitor_sid: visitorSid || null })
      );
      return NextResponse.json({ ok: false }, { status: 502 });
    }
  } catch (error) {
    console.error("[verify] Clarion request failed", error);
    console.error(
      "[verify] undelivered lead",
      JSON.stringify({ ...data, ctm_visitor_sid: visitorSid || null })
    );
    return NextResponse.json({ ok: false }, { status: 502 });
  }

  // Clarion has the lead. The inbox copy is a convenience from here on, so it
  // is awaited only to keep the serverless instance alive long enough to send.
  await emailCopy(data, [
    ["Landing page", landingPageUrl || pageUrl || "—"],
    ["Referrer", referrer || "direct"],
    [
      "Campaign",
      Object.entries(utm)
        .map(([k, v]) => `utm_${k}=${v}`)
        .join(" · ") || "none captured",
    ],
    ["CTM visitor sid", visitorSid || "none — t.js blocked, no visit attached"],
  ]);

  return NextResponse.json({ ok: true, message: CONFIRMATION });
}
