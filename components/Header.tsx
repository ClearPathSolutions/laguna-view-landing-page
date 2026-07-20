"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { BRAND, PHONE_DISPLAY, PHONE_TEL } from "@/lib/site";
import { PhoneIcon } from "./icons";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-50">
      {/* Main bar */}
      <div
        className={`border-b transition-all duration-300 ${
          scrolled
            ? "border-ink/10 bg-beige/95 shadow-header backdrop-blur-md"
            : "border-transparent bg-beige/80 backdrop-blur"
        }`}
      >
        <div className="container-lp flex h-16 items-center justify-between gap-3 sm:h-20">
          {/* Brand */}
          <a
            href="#top"
            className="flex min-w-0 shrink-0 items-center"
            aria-label={`${BRAND.nameFull} home`}
          >
            <Image
              src="/brand/logo-color.png"
              alt={`${BRAND.nameFull} logo`}
              width={650}
              height={620}
              priority
              className="h-12 w-auto sm:h-14"
            />
          </a>

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {/* Check insurance — hidden on mobile per brief */}
            <a href="#verify" className="btn-outline hidden px-5 py-2.5 text-sm md:inline-flex">
              Check My Insurance
            </a>

            {/* Call CTA: icon+number only on mobile; adds "Call Now" on desktop */}
            <a
              href={`tel:${PHONE_TEL}`}
              className="btn-gold gap-1.5 whitespace-nowrap px-3 py-2.5 text-sm sm:gap-2 sm:px-5"
              aria-label={`Call ${PHONE_DISPLAY}`}
            >
              <PhoneIcon className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Call Now</span>
              <span>{PHONE_DISPLAY}</span>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
