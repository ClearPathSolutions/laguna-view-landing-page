"use client";

import { useState } from "react";
import { FAQS, FAQ_INTRO } from "@/lib/site";

export default function Faqs() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faqs" className="bg-cream py-20 sm:py-24">
      <div className="container-lp grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
        {/* Left — heading block */}
        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="eyebrow">{FAQ_INTRO.eyebrow}</p>
          <h2 className="h2 mt-3">{FAQ_INTRO.h2}</h2>
          <p className="lead mt-4 max-w-sm">{FAQ_INTRO.p}</p>
        </div>

        {/* Right — accordion */}
        <div className="divide-y divide-ink/10 overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-ink/5">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q}>
                <h3>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left sm:px-7"
                  >
                    <span className="font-serif text-lg font-medium text-ink">{f.q}</span>
                    <span
                      className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border border-teal/30 text-teal transition-transform duration-300 ${
                        isOpen ? "rotate-45 bg-teal text-white" : ""
                      }`}
                      aria-hidden="true"
                    >
                      +
                    </span>
                  </button>
                </h3>
                <div
                  className={`grid transition-all duration-300 ease-out ${
                    isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="px-5 pb-6 text-body sm:px-7">{f.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
