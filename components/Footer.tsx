import Image from "next/image";
import { BRAND, PHONE_DISPLAY, PHONE_TEL } from "@/lib/site";

export default function Footer() {
  return (
    <footer className="bg-ink text-cream/70">
      <div className="container-lp py-12">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm">
            <Image
              src="/brand/logo-white.png"
              alt={`${BRAND.nameFull} logo`}
              width={500}
              height={475}
              className="h-20 w-auto"
            />
            <p className="mt-4 text-sm leading-relaxed">{BRAND.tagline}</p>
          </div>

          <div className="grid grid-cols-2 gap-8 text-sm">
            <div>
              <p className="font-semibold text-cream">Contact</p>
              <ul className="mt-3 space-y-2">
                <li>
                  <a href={`tel:${PHONE_TEL}`} className="hover:text-cream">
                    {PHONE_DISPLAY}
                  </a>
                </li>
                <li>Available 24/7</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-cream">Explore</p>
              <ul className="mt-3 space-y-2">
                <li><a href="#programs" className="hover:text-cream">Programs</a></li>
                <li><a href="#reviews" className="hover:text-cream">Success stories</a></li>
                <li><a href="#faqs" className="hover:text-cream">FAQs</a></li>
                <li><a href="#verify" className="hover:text-cream">Verify insurance</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-xs leading-relaxed text-cream/50">
          <p>
            &copy; {BRAND.nameFull}. All communications are 100% confidential and protected under
            HIPAA. If you are experiencing a medical emergency, call 911.
          </p>
          <p className="mt-2">
            The reviews shown reflect individual experiences and are not a guarantee of outcome.
          </p>
        </div>
      </div>
    </footer>
  );
}
