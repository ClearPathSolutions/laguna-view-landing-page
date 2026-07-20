import { HERO, PHONE_DISPLAY, PHONE_TEL } from "@/lib/site";
import { CheckBadge, PhoneIcon } from "./icons";

/** "Call Obligation Free" card. Lives in Section 2 (moved out of the hero per edits). */
export default function CallCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`w-full rounded-3xl bg-white p-6 shadow-card ring-1 ring-ink/5 sm:p-8 ${className}`}
    >
      <p className="eyebrow">{HERO.callCard.eyebrow}</p>
      <h3 className="h3 mt-2 !text-2xl">{HERO.callCard.h2}</h3>

      <ul className="mt-5 space-y-3.5">
        {HERO.callCard.checks.map((c) => (
          <li key={c} className="flex items-start gap-3">
            <CheckBadge className="mt-0.5 h-6 w-6 shrink-0" />
            <span className="text-body">{c}</span>
          </li>
        ))}
      </ul>

      <div className="mt-6 rounded-2xl bg-ink p-5 text-cream">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">
          {HERO.callCard.lineLabel}
        </p>
        <a
          href={`tel:${PHONE_TEL}`}
          className="mt-1 flex items-center gap-2 font-serif text-2xl font-semibold sm:text-3xl"
        >
          <PhoneIcon className="h-6 w-6 text-gold" />
          {PHONE_DISPLAY}
        </a>
      </div>

      <a href={`tel:${PHONE_TEL}`} className="btn-gold mt-4 w-full">
        <PhoneIcon className="h-4 w-4" />
        Call {PHONE_DISPLAY}
      </a>
    </div>
  );
}
