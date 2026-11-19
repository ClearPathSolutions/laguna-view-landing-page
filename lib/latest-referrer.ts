/**
 * The most recent EXTERNAL referrer, kept 30 days.
 *
 * `document.referrer` is only a traffic source on a page load that came from
 * another site. The site used to keep the FIRST visit's referrer for 30 days
 * and let only an ad click replace it, so a person who came back today from a
 * referral site was sent to Clarion with the first visit's referrer, or with
 * none if that first visit was direct. This records every external referrer as
 * it happens and hands the latest one to the lead ("last non-direct", the same
 * rule GA4 uses).
 *
 * "External" is decided by registrable domain, not exact host: www vs bare
 * domain, http vs https and our own go. microsites are never a referrer.
 *
 * Every function is best-effort and never throws: private browsing or a
 * blocked storage must cost attribution, never a submission.
 */

const KEY = 'clarion.last_referrer.v1';
const TTL_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_LEN = 2048;
const TWO_LEVEL_SUFFIXES = new Set([
  'co.uk', 'org.uk', 'ac.uk', 'gov.uk', 'com.au', 'net.au', 'org.au',
  'co.nz', 'com.mx', 'com.br', 'co.jp', 'co.in', 'com.sg',
]);

function siteDomain(host: string): string {
  const h = host.toLowerCase().replace(/\.$/, '').replace(/^www\./, '');
  const parts = h.split('.');
  if (parts.length <= 2) return h;
  const lastTwo = parts.slice(-2).join('.');
  return TWO_LEVEL_SUFFIXES.has(lastTwo) ? parts.slice(-3).join('.') : lastTwo;
}

/** This page load's referrer when it came from another site, else ''. */
export function externalReferrerNow(): string {
  try {
    if (typeof document === 'undefined') return '';
    const ref = document.referrer || '';
    if (!ref) return '';
    const url = new URL(ref);
    if (
      (url.protocol === 'http:' || url.protocol === 'https:') &&
      siteDomain(url.hostname) === siteDomain(window.location.hostname)
    ) {
      return '';
    }
    return ref.slice(0, MAX_LEN);
  } catch {
    return '';
  }
}

/** Call on every full page load (next to the site's existing attribution capture). */
export function rememberReferrer(): void {
  try {
    const ref = externalReferrerNow();
    if (!ref) return;
    window.localStorage.setItem(KEY, JSON.stringify({ ref, at: Date.now() }));
  } catch {
    // Storage unavailable: latestReferrer() still reads the live value.
  }
}

/** What to send as `referrer`: this page load's external referrer, else the latest one within 30 days. */
export function latestReferrer(): string | null {
  const live = externalReferrerNow();
  if (live) return live;
  try {
    const v = JSON.parse(window.localStorage.getItem(KEY) || 'null') as { ref?: unknown; at?: unknown } | null;
    if (v && typeof v.ref === 'string' && v.ref && typeof v.at === 'number' && Date.now() - v.at < TTL_MS) {
      return v.ref;
    }
  } catch {
    // fall through
  }
  return null;
}
