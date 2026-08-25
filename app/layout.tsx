import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import Script from "next/script";
import SessionTracker from "@/components/SessionTracker";
import { BRAND, PHONE_DISPLAY, WIDGETS } from "@/lib/site";
import "./globals.css";

const serif = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-serif",
  display: "swap",
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: `${BRAND.nameFull} — Break Free from Addiction Today`,
  description:
    "Private luxury detox & inpatient rehab with same-day admissions, medical detox, and integrated dual-diagnosis care. Confidential admissions 24/7. Most insurance accepted.",
  keywords: [
    "detox",
    "drug rehab",
    "alcohol rehab",
    "dual diagnosis",
    "medical detox",
    "residential treatment",
    "addiction treatment",
  ],
  openGraph: {
    title: `${BRAND.nameFull} — Break Free from Addiction Today`,
    description:
      "Private luxury detox & inpatient rehab. Same-day admissions and confidential care, 24/7.",
    type: "website",
    siteName: BRAND.nameFull,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#011223",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const ld = {
    "@context": "https://schema.org",
    "@type": "MedicalBusiness",
    name: BRAND.nameFull,
    description: BRAND.tagline,
    telephone: PHONE_DISPLAY,
    medicalSpecialty: "Addiction Medicine",
    priceRange: "$$$",
  };

  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <head>
        {/* CallTrackingMetrics tracker.

            A raw <script> rather than next/script, so it lands in <head>
            byte-for-byte as supplied. next/script would relocate it, and it
            cannot hoist an inline `beforeInteractive` script in the App
            Router anyway.

            Loaded directly here and NOT through the GTM container:
            window.__ctm has to exist before anyone can reach the form, and
            dynamic number insertion needs it early. ⚠️ The container also
            carries a CTM tag (id 8) from before this app loaded t.js itself —
            pause it in GTM, or t.js loads twice on every pageview.

            Must stay `async`, and must NOT be made eager. Loading t.js
            eagerly lets it rewrite the phone number in the server HTML
            *before* React hydrates; React then sees a text mismatch, reverts
            the swap, and reports "server HTML was replaced with client
            content" for the whole document — the number swap defeated by the
            very change meant to protect it.

            The usual argument for eager loading — a visitor dialling the
            un-swapped number — is weak here anyway: PHONE_DISPLAY is already
            the ads-only tracked number, so a pre-swap call still attributes
            to paid at the site level. */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script async src={WIDGETS.callTracking.src} />
      </head>
      {/* Google Tag Manager — Next hoists this into <head> as early as possible */}
      <Script id="gtm-base" strategy="afterInteractive">
        {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${WIDGETS.gtm.id}');`}
      </Script>
      <body className="font-sans">
        {/* Google Tag Manager (noscript) — immediately after opening <body> */}
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${WIDGETS.gtm.id}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        {/* Persists first-touch campaign data before the visitor can reach a
            clean URL — see lib/session.ts */}
        <SessionTracker />
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
        />
      </body>
    </html>
  );
}
