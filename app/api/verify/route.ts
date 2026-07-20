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
};

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
        message: "Thank you — an admissions specialist will call you shortly.",
      });
    }

    return NextResponse.json({
      ok: true,
      delivered: true,
      message: "Thank you — an admissions specialist will call you shortly.",
    });
  } catch (err) {
    console.error("[verify] unexpected error:", err);
    console.log("[verify] lead (exception):", lead);
    return NextResponse.json({
      ok: true,
      delivered: false,
      message: "Thank you — an admissions specialist will call you shortly.",
    });
  }
}
