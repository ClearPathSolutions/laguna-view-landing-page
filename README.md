# Laguna View — Landing Page

Conversion landing page for **Laguna View Detox**, built from the client brief and the
`go.lagunaviewdetox.com` reference microsite. Next.js 14 (App Router) + Tailwind CSS + TypeScript,
optimized for deployment on **Vercel**.

- **Phone (all CTAs):** (866) 451-1021 → `tel:+18664511021`
- **Form leads deliver to:** `admissions@quadranthealthgroup.com` (configurable)

---

## Quick start (local)

```bash
npm install
npm run dev        # http://localhost:3000
```

Build / preview production:

```bash
npm run build
npm start
```

---

## Deploy to Vercel

**Option A — Git (recommended)**

1. Push this folder to a GitHub/GitLab repo.
2. In Vercel → **Add New → Project** → import the repo.
3. Framework preset auto-detects **Next.js**. No build settings to change.
4. (Optional) add the env vars below for live email delivery.
5. **Deploy.**

**Option B — Vercel CLI**

```bash
npm i -g vercel
vercel          # preview deploy
vercel --prod   # production deploy
```

---

## Lead delivery

Insurance-verification submissions go to **Clarion** and nowhere else. `POST /api/verify` holds the
site key and relays the lead to `api.clarionlabs.ai`, along with the visit session and first-touch
campaign captured by `lib/session.ts`.

CallTrackingMetrics still runs on the page — `t.js` (account `264810`, loaded from `lib/site.ts` by
the root layout) owns the dynamic number swap and mints the visitor session — but **CTM receives no
form submissions**. Clarion attaches each lead to the CTM visit itself, via `ctm_visitor_sid`. The
old CTM FormReactor path, server-side and browser-side both, has been removed.

If Clarion rejects or times out, the route returns **502** and the form shows an error and the phone
number. That is deliberate: a lead that silently vanished is worse than a visitor who knows to call.

> ⚠️ The GTM container (`GTM-TC7PQ4LR`) still carries a CTM tag (id 8) from when `t.js` was loaded
> through GTM rather than by this app. **Pause it**, or `t.js` loads twice on every pageview.

## Environment variables

Set these in Vercel → **Settings → Environment Variables** (Production + Preview).

| Variable            | Purpose                                                              | Default                                       |
| ------------------- | -------------------------------------------------------------------- | --------------------------------------------- |
| `CLARION_SITE_KEY`  | **Required.** Clarion site key. Server-only — never `NEXT_PUBLIC_`.  | — (form returns 502 without it)               |
| `RESEND_API_KEY`    | Optional. Emails a copy of each lead. Blank = Clarion only.          | — (disabled)                                  |
| `LEAD_TO_EMAIL`     | Where the email copy is sent.                                        | `admissions@quadranthealthgroup.com`          |
| `LEAD_FROM_EMAIL`   | Verified Resend sender.                                              | `Laguna View Website <onboarding@resend.dev>`  |

The Resend copy is best-effort convenience only: it runs after Clarion has accepted the lead and can
never change the response the visitor sees. To send from your own domain, verify it in Resend and set
`LEAD_FROM_EMAIL` to an address on it.

---

## What to customize before launch (search these files)

| Item                        | Where                                                       |
| --------------------------- | ---------------------------------------------------------- |
| Phone number & lead email   | `lib/site.ts` (`PHONE_DISPLAY`, `PHONE_TEL`, `LEAD_EMAIL`)  |
| All page copy               | `lib/site.ts`                                              |
| Colors / fonts              | `tailwind.config.ts`, `app/layout.tsx`                     |
| **Brand logo** (header/footer/favicon) | `public/brand/` — real Laguna View logos pulled from the live site: `logo-color.png` (header), `logo-white.png` (footer), `app/icon.png` (favicon). Accreditation badges `badge-jcaho.png` / `badge-dhcs.png` are also downloaded if you want to add them. |
| **Facility photos** (hero + 4-image gallery) | Real photos pulled from the microsite live in `public/facility/` and are wired into the hero (`hero-coastal.jpg`) and gallery (`GALLERY` in `app/page.tsx`). Swap files or edit the `GALLERY` array to change them. Extra shots (`home-exterior`, `pool-courtyard`) are also downloaded. |
| **Insurance logos** (Section 7) | `INSURERS.logos` in `lib/site.ts` — currently styled text tiles; drop in real logo `<img>`s if desired |
| **Google 4.9 badge**        | `components/icons.tsx` (`GoogleBadge`) — swap for a real Google reviews screenshot/widget if you have one |

### Placeholders intentionally left for you
- **Hero + gallery images** render as tasteful gradient blocks. Swap in real, licensed facility
  photos (`next/image` is already configured to allow `images.unsplash.com`).
- **Insurance logos** are text tiles (Aetna, Cigna, BCBS, UnitedHealthcare, Anthem, "+ More!").
  Per the brief, NYShip was removed and UnitedHealthcare added.
- **Google badge** is a hand-built "4.9 ★ Google Reviews" mark — replace with your real widget if
  compliance requires it.

---

## Structure

```
app/
  layout.tsx          fonts, SEO metadata, JSON-LD
  page.tsx            all sections assembled
  globals.css         design tokens + component classes
  api/verify/route.ts form handler (Resend-ready, logs otherwise)
components/            Header, Reviews, Faqs, VerifyForm, Footer, icons
lib/site.ts           single source of truth: contact info + copy
```

## Sections (per brief)
Sticky header + trust banner · Hero (S1) · Empowerment "Find Real Hope" (S2) · Programs (S3) ·
What Makes Us Different (S4) · Gallery (S5) · Reviews slider w/ read-more (S6) · Insurers (S7) ·
FAQs (S8) · Insurance verification form.

---

## Notes / open items
- **Phone number** is (866) 451-1021 everywhere, per your instruction (the reference site showed a
  different number).
- **Lead email** defaults to `admissions@quadranthealthgroup.com` (from the brief) — confirm this
  is the correct inbox before going live.
- Review text is lightly cleaned up from the brief; verify wording/attribution is approved for use.
- Marketing claims ("Accredited for Excellence", "Nearly a decade of successful care", "HIPAA-Safe")
  and the review quotes should reflect real, substantiable credentials before publishing.
