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

## Environment variables (optional)

The insurance-verification form **works out of the box** — with no configuration, submissions are
validated and logged server-side (visible in Vercel → your deployment → **Logs**). To actually
**email** each lead, add a [Resend](https://resend.com) API key. Copy `.env.example` → `.env.local`
locally, and add these in Vercel → **Settings → Environment Variables**:

| Variable          | Purpose                                              | Default                                   |
| ----------------- | ---------------------------------------------------- | ----------------------------------------- |
| `RESEND_API_KEY`  | Resend API key (`re_…`). Blank = log only, no email. | — (disabled)                              |
| `LEAD_TO_EMAIL`   | Where verification leads are sent.                   | `admissions@quadranthealthgroup.com`      |
| `LEAD_FROM_EMAIL` | Verified Resend sender.                              | `Laguna View Website <onboarding@resend.dev>` |

> To send from your own domain, verify it in Resend and set `LEAD_FROM_EMAIL` to an address on it.

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
