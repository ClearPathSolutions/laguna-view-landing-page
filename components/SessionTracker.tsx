"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { recordPageview } from "@/lib/session";

/**
 * Records a pageview on first paint and on every route change, so first-touch
 * campaign data is stored before the visitor can navigate to a clean URL.
 *
 * usePathname, not useSearchParams: reading search params in a component forces
 * a Suspense boundary and opts every static page into dynamic rendering.
 * recordPageview() reads location.search itself, which is the same information
 * without that cost.
 */
export default function SessionTracker() {
  const pathname = usePathname();
  useEffect(() => {
    recordPageview();
  }, [pathname]);
  return null;
}
