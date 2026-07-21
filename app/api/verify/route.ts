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
  ctmSid?: string;
  pageUrl?: string;
};

const CTM_FORM_REACTOR_ID =
  "FRT472ABB2C5B9B141A1FFF98722836BB0F6BAE7ADA045D98FCA64D850A3683001F";

// Server-to-server submission to the CTM FormReactor (no CORS, no ad
// blockers). Never throws — a CTM outage must not block lead delivery.
async function sendToCtm(lead: Lead): Promise<string> {
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
    "field[date of birth]": lead.dob || "",
    "field[insurance provider]": lead.insurer || "",
    "field[member id]": lead.memberId || "",
  });

  // Link the lead to the CTM visitor session so it keeps ad attribution
  // (traffic source, UTM params, gclid), and record the URL/gclid as
  // custom fields as a visible backup.
  if (lead.ctmSid) body.set("visitor_sid", lead.ctmSid);
  if (lead.pageUrl) {
    body.set("field[landing page url]", lead.pageUrl);
    try {
      const gclid = new URL(lead.pageUrl).searchParams.get("gclid");
      if (gclid) body.set("field[gclid]", gclid);
    } catch {
      // unparseable URL — still recorded verbatim above
    }
  }

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

  const ctm = await sendToCtm(lead);

  const to = process.env.LEAD_TO_EMAIL || LEAD_EMAIL;
  const from = process.env.LEAD_FROM_EMAIL || "Laguna View Website <onboarding@resend.dev>";
  const apiKey = process.env.RESEND_API_KEY;

  const rows: Array<[string, unknown]> = [
    ["Name", `${firstName} ${lastName}`],
    ["Phone", phone],
    ["Date of birth", lead.dob || "—"],
    ["Insurance provider", insurer],
    ["Member ID", lead.memberId || "—"],
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
