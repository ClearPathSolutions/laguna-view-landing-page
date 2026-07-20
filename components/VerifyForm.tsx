"use client";

import { useState } from "react";
import { PHONE_DISPLAY, PHONE_TEL } from "@/lib/site";
import { CheckGold, LockIcon, PhoneIcon } from "./icons";

type Status = "idle" | "submitting" | "success" | "error";

declare global {
  interface Window {
    __ctm?: {
      form: {
        track: (
          host: string,
          formReactorId: string,
          trackingNumber: string,
          fields: Record<string, unknown>,
          callback: () => void
        ) => void;
      };
    };
  }
}

const CTM_HOST = "app.calltrackingmetrics.com";
const CTM_FORM_REACTOR_ID =
  "FRT472ABB2C5B9B141A1FFF98722836BB0F6BAE7ADA045D98FCA64D850A3683001F";
const CTM_TRACKING_NUMBER = "8664511021";

type CtmLead = {
  name: string;
  phone: string;
  dob: string;
  insurer: string;
  memberId: string;
};

// Sends the lead to the CTM FormReactor with the captured field VALUES
// (per CTM's manual-tracking docs). The tracker (//264810.tctm.co/t.js) is
// loaded via GTM, so it may be absent (blocked, or GTM not yet loaded) —
// resolve no matter what so the lead is never lost to tracking.
function trackCtmLead(lead: CtmLead): Promise<void> {
  return new Promise((resolve) => {
    const ctm = window.__ctm;
    if (!ctm?.form?.track) return resolve();
    const timer = setTimeout(resolve, 3000);
    const done = () => {
      clearTimeout(timer);
      resolve();
    };
    try {
      ctm.form.track(
        CTM_HOST,
        CTM_FORM_REACTOR_ID,
        CTM_TRACKING_NUMBER,
        {
          country_code: "1",
          name: lead.name,
          phone: lead.phone,
          custom: {
            "date of birth": lead.dob,
            "insurance provider": lead.insurer,
            "member id": lead.memberId,
          },
        },
        done
      );
    } catch {
      done();
    }
  });
}

const field =
  "w-full rounded-xl border border-ink/15 bg-white px-4 py-3 text-ink placeholder:text-body/50 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30";
const label = "mb-1.5 block text-sm font-medium text-ink";

export default function VerifyForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    // Log the lead in CTM before the email goes out.
    await trackCtmLead({
      name: `${data.firstName ?? ""} ${data.lastName ?? ""}`.trim(),
      phone: String(data.phone ?? ""),
      dob: String(data.dob ?? ""),
      insurer: String(data.insurer ?? ""),
      memberId: String(data.memberId ?? ""),
    });

    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Something went wrong.");
      setStatus("success");
      setMessage(json?.message || "Thank you — an admissions specialist will call you shortly.");
      form.reset();
    } catch (err) {
      setStatus("error");
      setMessage(
        err instanceof Error ? err.message : "Something went wrong. Please call us instead."
      );
    }
  }

  return (
    <section id="verify" className="relative overflow-hidden bg-ink py-20 text-cream sm:py-24">
      {/* soft glow */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-teal/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-gold/15 blur-3xl" />

      <div className="container-lp relative grid items-start gap-12 lg:grid-cols-2">
        {/* Left: reassurance */}
        <div className="lg:pt-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold">
            Insurance Verification
          </p>
          <h2 className="mt-3 font-serif text-3xl leading-tight sm:text-4xl">
            Check your insurance benefits confidentially.
          </h2>
          <p className="mt-4 max-w-md text-cream/80">
            Most PPO plans cover detox and residential treatment. Verifying takes under two minutes,
            carries no obligation, and never affects your coverage.
          </p>

          <ul className="mt-8 space-y-3">
            {[
              "100% confidential — protected under HIPAA",
              "No commitment and no cost to check",
              "Real answers from a licensed admissions team",
            ].map((t) => (
              <li key={t} className="flex items-start gap-3">
                <CheckGold className="mt-0.5 h-6 w-6 shrink-0" />
                <span className="text-cream/90">{t}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex items-center gap-3 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
            <LockIcon className="h-6 w-6 text-gold" />
            <p className="text-sm text-cream/80">
              Prefer to talk? Call{" "}
              <a href={`tel:${PHONE_TEL}`} className="font-semibold text-cream underline">
                {PHONE_DISPLAY}
              </a>{" "}
              — available around the clock.
            </p>
          </div>
        </div>

        {/* Right: the form */}
        <div className="rounded-3xl bg-white p-6 text-body shadow-card sm:p-8">
          {status === "success" ? (
            <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
              <CheckGold className="h-16 w-16" />
              <h3 className="mt-4 font-serif text-2xl text-ink">You're all set.</h3>
              <p className="mt-2 max-w-sm text-body">{message}</p>
              <a href={`tel:${PHONE_TEL}`} className="btn-gold mt-6">
                <PhoneIcon className="h-4 w-4" />
                Call {PHONE_DISPLAY}
              </a>
            </div>
          ) : (
            <form id="verify-benefits-form" onSubmit={onSubmit} noValidate>
              <h3 className="font-serif text-2xl text-ink">Verify my benefits</h3>
              <p className="mt-1 text-sm text-body">
                Fields marked with <span className="text-gold">*</span> are required.
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={label} htmlFor="firstName">
                    First name <span className="text-gold">*</span>
                  </label>
                  <input id="firstName" name="firstName" className={field} required autoComplete="given-name" />
                </div>
                <div>
                  <label className={label} htmlFor="lastName">
                    Last name <span className="text-gold">*</span>
                  </label>
                  <input id="lastName" name="lastName" className={field} required autoComplete="family-name" />
                </div>
                <div>
                  <label className={label} htmlFor="phone">
                    Phone <span className="text-gold">*</span>
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    className={field}
                    required
                    autoComplete="tel"
                    placeholder="(555) 555-5555"
                  />
                </div>
                <div>
                  <label className={label} htmlFor="dob">
                    Date of birth
                  </label>
                  <input id="dob" name="dob" type="date" className={field} autoComplete="bday" />
                </div>
                <div>
                  <label className={label} htmlFor="insurer">
                    Insurance provider <span className="text-gold">*</span>
                  </label>
                  <input
                    id="insurer"
                    name="insurer"
                    className={field}
                    required
                    autoComplete="off"
                    placeholder="e.g. Aetna, Cigna, Blue Cross"
                  />
                </div>
                <div>
                  <label className={label} htmlFor="memberId">
                    Member ID
                  </label>
                  <input id="memberId" name="memberId" className={field} autoComplete="off" />
                </div>
              </div>

              {status === "error" && (
                <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                  {message}
                </p>
              )}

              <button type="submit" className="btn-gold mt-6 w-full" disabled={status === "submitting"}>
                {status === "submitting" ? "Sending…" : "Verify My Benefits Now"}
              </button>

              <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-body/70">
                <LockIcon className="h-3.5 w-3.5" />
                Your information is secure and confidential. No obligation.
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
