import { PHONE_DISPLAY, PHONE_TEL, CTA_CHIPS } from "@/lib/site";
import { PhoneIcon, ShieldIcon, LockIcon, ClockIcon } from "./icons";

const CHIP_ICONS = [LockIcon, ClockIcon, ShieldIcon];

/** Repeating call-to-action bar used between sections (per reference LP). */
export default function CtaBar({ headline }: { headline: string }) {
  return (
    <div className="container-lp">
      <div className="flex flex-col gap-5 rounded-3xl bg-white p-6 shadow-card ring-1 ring-ink/5 sm:p-7 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="font-serif text-xl leading-snug text-ink sm:text-2xl">{headline}</p>
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5">
            {CTA_CHIPS.map((c, i) => {
              const Icon = CHIP_ICONS[i];
              return (
                <li key={c} className="flex items-center gap-1.5 text-sm font-medium text-body">
                  <Icon className="h-4 w-4 text-teal" />
                  {c}
                </li>
              );
            })}
          </ul>
        </div>
        <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
          <a href={`tel:${PHONE_TEL}`} className="btn-gold whitespace-nowrap">
            <PhoneIcon className="h-4 w-4" />
            Call {PHONE_DISPLAY}
          </a>
          <a href="#verify" className="btn-outline whitespace-nowrap">
            Check My Insurance
          </a>
        </div>
      </div>
    </div>
  );
}
