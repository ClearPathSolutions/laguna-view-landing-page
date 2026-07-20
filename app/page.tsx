import Image from "next/image";
import Header from "@/components/Header";
import Reviews from "@/components/Reviews";
import Faqs from "@/components/Faqs";
import VerifyForm from "@/components/VerifyForm";
import Footer from "@/components/Footer";
import CtaBar from "@/components/CtaBar";
import CallCard from "@/components/CallCard";
import {
  GoogleG,
  PhoneIcon,
  ShieldIcon,
  LockIcon,
  ClockIcon,
  Star,
  Stars,
  MedicalIcon,
  HomeIcon,
  RouteIcon,
  BrainIcon,
  DocIcon,
  ChatIcon,
  UsersIcon,
} from "@/components/icons";
import {
  PHONE_DISPLAY,
  PHONE_TEL,
  HERO,
  TRUST_BADGES,
  EMPOWERMENT,
  PROGRAMS,
  DIFFERENCE,
  INSURERS,
  NEXT_STEPS,
} from "@/lib/site";

function CallButton({ className = "" }: { className?: string }) {
  return (
    <a href={`tel:${PHONE_TEL}`} className={`btn-gold ${className}`}>
      <PhoneIcon className="h-4 w-4" />
      Call {PHONE_DISPLAY}
    </a>
  );
}

const TRUST_ICONS = [ShieldIcon, ClockIcon, Star, LockIcon];
const PROGRAM_ICONS = [MedicalIcon, HomeIcon, RouteIcon];
// Distinct icons for the 4 hero bullets (per edits: SVG icon per bullet)
const HERO_BULLET_ICONS = [ClockIcon, MedicalIcon, HomeIcon, BrainIcon];
// Icons for the 6 "what makes us different" items, in edit order
const DIFFERENCE_ICONS = [ChatIcon, HomeIcon, BrainIcon, UsersIcon, RouteIcon, DocIcon];

// Soft white halo so dark text stays legible directly on the clean hero photo (no scrim)
const HALO = "[text-shadow:0_1px_2px_rgba(255,255,255,0.95),0_2px_16px_rgba(255,255,255,0.8)]";

export default function Page() {
  return (
    <>
      <a
        href="#verify"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-[60] focus:rounded focus:bg-white focus:px-4 focus:py-2 focus:text-ink"
      >
        Skip to insurance verification
      </a>
      <Header />

      <main id="top">
        {/* ============================ SECTION 1 — HERO ============================ */}
        <section className="relative">
          {/* Full-bleed background photo — clean, no overlay */}
          <div className="relative isolate overflow-hidden">
            <Image
              src="/facility/hero-woman.jpg"
              alt="A moment of calm overlooking the ocean"
              fill
              priority
              sizes="100vw"
              className="-z-10 object-cover object-[70%_30%]"
            />

            <div className="container-lp py-16 sm:py-24 lg:py-28">
              <div className="max-w-xl animate-fadeUp">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-sm font-semibold text-ink shadow-card">
                  <GoogleG className="h-5 w-5" />
                  <Stars count={5} />
                  {HERO.eyebrow}
                </div>
                <h1 className={`h1 text-ink ${HALO}`}>{HERO.h1}</h1>

                <ul className="mt-8 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                  {HERO.bullets.map((b, i) => {
                    const Icon = HERO_BULLET_ICONS[i];
                    return (
                      <li key={b} className="flex items-center gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-teal text-cream">
                          <Icon className="h-5 w-5" />
                        </span>
                        <span className={`font-semibold text-ink ${HALO}`}>{b}</span>
                      </li>
                    );
                  })}
                </ul>

                <div className="mt-9">
                  <a href="#verify" className="btn-gold text-base">
                    Check My Insurance
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Trust badge strip — 4 columns */}
          <div className="border-b border-ink/10 bg-beige">
            <div className="container-lp grid grid-cols-2 divide-ink/10 sm:grid-cols-4 sm:divide-x">
              {TRUST_BADGES.map((b, i) => {
                const Icon = TRUST_ICONS[i];
                return (
                  <div key={b.label} className="flex items-center justify-center gap-2.5 px-3 py-4">
                    <Icon className="h-5 w-5 shrink-0 text-teal" />
                    <span className="leading-tight">
                      <span className="block text-sm font-semibold text-ink">{b.label}</span>
                      <span className="block text-xs text-body">{b.sub}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ============= SECTION 2 — EMPOWERMENT (two-column + call card) ========= */}
        <section className="bg-cream py-20 sm:py-24">
          <div className="container-lp grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Left — message */}
            <div className="animate-fadeUp">
              <p className="eyebrow">{EMPOWERMENT.eyebrow}</p>
              <h2 className="h2 mt-3">{EMPOWERMENT.h2}</h2>
              <div className="mt-6 space-y-4">
                {EMPOWERMENT.paragraphs.map((p, i) => (
                  <p key={i} className="lead">
                    {p}
                  </p>
                ))}
              </div>
              <p className="mt-6 font-semibold text-ink">{EMPOWERMENT.footnote}</p>
            </div>

            {/* Right — the "Call Obligation Free" card (moved from the hero) */}
            <div className="animate-fadeUp lg:justify-self-end">
              <CallCard className="max-w-md" />
            </div>
          </div>

          {/* Floating callout review */}
          <div className="container-lp">
            <figure className="relative z-10 mx-auto mt-8 max-w-2xl rounded-3xl bg-white p-6 shadow-cardHover ring-1 ring-ink/5 sm:p-8 lg:-mt-10 lg:ml-0">
              <Stars count={EMPOWERMENT.quote.stars} />
              <blockquote className="mt-3 font-serif text-xl leading-relaxed text-ink sm:text-2xl">
                “{EMPOWERMENT.quote.text}”
              </blockquote>
              <figcaption className="mt-3 text-sm font-semibold uppercase tracking-wide text-teal">
                — {EMPOWERMENT.quote.author}
              </figcaption>
            </figure>
          </div>
        </section>

        {/* ======================== SECTION 3 — PROGRAMS ========================= */}
        <section id="programs" className="bg-beige py-20 sm:py-24">
          <div className="container-lp">
            <p className="eyebrow">{PROGRAMS.eyebrow}</p>
            <h2 className="h2 mt-3 max-w-2xl">{PROGRAMS.h2}</h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {PROGRAMS.cards.map((c, i) => {
                const Icon = PROGRAM_ICONS[i];
                return (
                  <article key={c.title} className="card group hover:shadow-cardHover hover:-translate-y-1">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal/10 text-teal">
                      <Icon className="h-6 w-6" />
                    </span>
                    <h3 className="h3 mt-5">{c.title}</h3>
                    <p className="mt-3 text-body">{c.body}</p>
                  </article>
                );
              })}
            </div>
            <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
              <CallButton />
              <a href="#verify" className="btn-outline">
                Insurance Verification
              </a>
            </div>
          </div>
        </section>

        {/* =========== SECTION 4 — WHAT MAKES US DIFFERENT (icon grid) =========== */}
        <section className="bg-cream py-20 sm:py-24">
          <div className="container-lp grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
            {/* Left — heading */}
            <div className="lg:sticky lg:top-28 lg:self-start">
              <p className="eyebrow">{DIFFERENCE.eyebrow}</p>
              <h2 className="h2 mt-3">{DIFFERENCE.h2}</h2>
              <p className="lead mt-4">{DIFFERENCE.intro}</p>
            </div>

            {/* Right — 6 items in a 2-column icon grid */}
            <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
              {DIFFERENCE.cards.map((c, i) => {
                const Icon = DIFFERENCE_ICONS[i];
                return (
                  <div key={c.title} className="border-t border-ink/10 pt-5">
                    <Icon className="h-7 w-7 text-teal" />
                    <h3 className="mt-3 font-serif text-lg font-medium text-ink">{c.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-body">{c.body}</p>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-14">
            <CtaBar headline={DIFFERENCE.ctaHeadline} />
          </div>
        </section>

        {/* SECTION 6 — REVIEWS (Section 5 gallery removed per edits) */}
        <Reviews />

        {/* ======================= SECTION 7 — INSURERS ========================== */}
        <section className="bg-cream py-20 sm:py-24">
          <div className="container-lp text-center">
            <h2 className="h2">{INSURERS.h2}</h2>
            <p className="lead mx-auto mt-3 max-w-xl">{INSURERS.sub}</p>
            <div className="mx-auto mt-10 grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {INSURERS.logos.map(({ name, src }) => (
                <div
                  key={name}
                  className={`flex h-20 items-center justify-center rounded-2xl px-4 text-center text-sm font-semibold ring-1 ring-ink/5 ${
                    src ? "bg-white text-body shadow-card" : "bg-gold text-ink"
                  }`}
                >
                  {src ? (
                    <img
                      src={src}
                      alt={name}
                      className="max-h-10 w-auto max-w-full object-contain"
                      loading="lazy"
                    />
                  ) : (
                    name
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* INSURANCE VERIFICATION FORM — moved above the FAQ per edits */}
        <VerifyForm />

        {/* SECTION 8 — FAQs (two-column) */}
        <Faqs />

        {/* ===================== SECTION 9 — NEXT STEPS ========================== */}
        <section className="bg-ink py-20 text-cream sm:py-24">
          <div className="container-lp max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold">
              {NEXT_STEPS.eyebrow}
            </p>
            <h2 className="mt-3 font-serif text-3xl leading-tight sm:text-4xl">{NEXT_STEPS.h2}</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-cream/80">
              {NEXT_STEPS.p}
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <CallButton />
              <a
                href="#verify"
                className="btn border border-white bg-white text-ink hover:bg-cream focus-visible:ring-white"
              >
                Check My Insurance
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
