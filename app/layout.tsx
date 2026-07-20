import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import Script from "next/script";
import { BRAND, PHONE_DISPLAY } from "@/lib/site";
import "./globals.css";

// Google Tag Manager container
const GTM_ID = "GTM-TC7PQ4LR";

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
      {/* Google Tag Manager — Next hoists this into <head> as early as possible */}
      <Script id="gtm-base" strategy="afterInteractive">
        {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`}
      </Script>
      <body className="font-sans">
        {/* Google Tag Manager (noscript) — immediately after opening <body> */}
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
        />
      </body>
    </html>
  );
}
