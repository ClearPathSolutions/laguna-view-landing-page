// First-touch attribution store + CTM identity.
//
// Why this exists: the lead payload used to read utm/gclid out of
// location.search at submit time. A visitor who lands on an ad and then
// reloads, returns, or reaches the form from a clean URL converts with no
// campaign attached at all — and because the lead still delivers and CTM
// still returns 200, that failure is completely invisible. It shows up only
// as paid spend that appears to convert at zero. So: capture on first touch,
// read at submit time.
//
// localStorage, not sessionStorage: a second tab is the same visit, and CTM
// keeps its own id in a 30-day first-party cookie, so a shorter-lived store
// here could only ever be staler.

// t.js is loaded by the GTM container (tag id 8), not by this app, so nothing
// here can assume it has run — every read is guarded.
declare global {
  interface Window {
    __ctm?: {
      config?: { aid?: number; sid?: string };
      form?: {
        track: (
          host: string,
          formReactorId: string,
          trackingNumber: string,
          fields: Record<string, unknown>,
          callback: () => void
        ) => void;
      };
    };
  }
}

const CAMPAIGN_KEY = "lvd.campaign.v1";
const VISIT_KEY = "lvd.visit.v1";

const CAMPAIGN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days — matches CTM's __ctmid
const VISIT_IDLE_MS = 30 * 60 * 1000; // a 30-minute gap starts a new visit

// Campaign params worth keeping. gbraid/wbraid are Google's gclid substitutes
// under iOS and consent mode — CTM account 264810's own routing rules key on
// them, so dropping them loses exactly the clicks hardest to attribute.
// campaignid/adgroupid/creativeid arrive only if the ad's final URL carries
// ValueTrack placeholders.
const CAMPAIGN_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "gclid",
  "gbraid",
  "wbraid",
  "fbclid",
  "msclkid",
  "campaignid",
  "adgroupid",
  "creativeid",
] as const;

export type Campaign = {
  /** Only the params that were actually present — absent beats empty string. */
  params: Record<string, string>;
  /** The real entry page, query string intact. Not the page the form is on. */
  landingPageUrl: string;
  /** External referrer only; an internal page tells us nothing. */
  referrer: string;
  at: number;
};

type Visit = { id: string; startedAt: number; lastSeenAt: number; pageviews: number };

function canStore(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function readJson<T>(key: string): T | null {
  if (!canStore()) return null;
  try {
    return JSON.parse(localStorage.getItem(key) || "null") as T | null;
  } catch {
    return null; // private mode, quota, or someone else's junk in the slot
  }
}

function writeJson(key: string, value: unknown): void {
  if (!canStore()) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage disabled or full. Attribution degrades to live URL params,
    // which is exactly the old behaviour — never worth throwing over.
  }
}

/** Campaign params present in the current URL, if any. */
function campaignFromUrl(): Record<string, string> {
  const found: Record<string, string> = {};
  if (typeof window === "undefined") return found;
  const q = new URLSearchParams(window.location.search);
  for (const k of CAMPAIGN_PARAMS) {
    const v = q.get(k);
    if (v) found[k] = v;
  }
  return found;
}

/** document.referrer, but only when it came from another site. */
function externalReferrer(): string {
  if (typeof document === "undefined") return "";
  const ref = document.referrer || "";
  if (!ref) return "";
  try {
    return new URL(ref).host === window.location.host ? "" : ref;
  } catch {
    return "";
  }
}

function randomId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `v${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  }
}

/**
 * Call on every pageview. Records first touch, and re-attributes when a fresh
 * ad click arrives mid-visit — that is a new campaign, not a continuation.
 */
export function recordPageview(): void {
  if (!canStore()) return;

  const now = Date.now();
  const fresh = campaignFromUrl();
  const stored = readJson<Campaign>(CAMPAIGN_KEY);
  const expired = !stored || now - stored.at > CAMPAIGN_TTL_MS;

  if (Object.keys(fresh).length > 0) {
    // A fresh click always wins.
    writeJson(CAMPAIGN_KEY, {
      params: fresh,
      landingPageUrl: window.location.href,
      referrer: externalReferrer(),
      at: now,
    } satisfies Campaign);
  } else if (expired) {
    // No campaign and nothing usable stored: still worth knowing where they
    // came in, so an organic or direct lead reads correctly rather than
    // inheriting the form page as its landing page.
    writeJson(CAMPAIGN_KEY, {
      params: {},
      landingPageUrl: window.location.href,
      referrer: externalReferrer(),
      at: now,
    } satisfies Campaign);
  }

  const visit = readJson<Visit>(VISIT_KEY);
  const continuing = visit && now - visit.lastSeenAt < VISIT_IDLE_MS;
  writeJson(
    VISIT_KEY,
    continuing
      ? { ...visit!, lastSeenAt: now, pageviews: visit!.pageviews + 1 }
      : { id: randomId(), startedAt: now, lastSeenAt: now, pageviews: 1 }
  );
}

/** First-touch campaign, or null when nothing has been recorded yet. */
export function getCampaign(): Campaign | null {
  const stored = readJson<Campaign>(CAMPAIGN_KEY);
  if (!stored || Date.now() - stored.at > CAMPAIGN_TTL_MS) return null;
  return stored;
}

/**
 * This site's own visit id. Diagnostics only — it is a UUID, and a UUID is
 * never a CTM session id. See ctmVisitorSid().
 */
export function getVisitId(): string | null {
  return readJson<Visit>(VISIT_KEY)?.id ?? null;
}

/** CTM session ids are 24 hex characters, no dashes. A UUID is not one. */
const CTM_ID = /^[0-9a-f]{24}$/i;

/**
 * The CTM visitor session id, from t.js if it has run and from the __ctmid
 * first-party cookie otherwise. Returns null rather than substituting this
 * site's own session id — CTM files a lead against no visit either way, and a
 * plausible-looking wrong id hides the fact that t.js was blocked.
 */
export function ctmVisitorSid(): string | null {
  let sid: unknown = null;
  let cookie: string | null = null;

  try {
    sid = window.__ctm?.config?.sid;
  } catch {
    // t.js absent or blocked
  }
  try {
    const m = document.cookie.match(/(?:^|;\s*)__ctmid=([^;]*)/);
    cookie = m ? decodeURIComponent(m[1]) : null;
  } catch {
    // cookies unavailable
  }

  const fromTjs = typeof sid === "string" ? sid : null;
  if (fromTjs && CTM_ID.test(fromTjs)) return fromTjs;
  if (cookie && CTM_ID.test(cookie)) return cookie;
  // Neither is CTM-shaped. Hand the raw value over so the server can log what
  // it actually saw, but never manufacture one.
  return fromTjs || cookie || null;
}

/** Everything the lead endpoint needs to attribute a submission. */
export function attributionPayload() {
  const campaign = getCampaign();
  return {
    ctm_visitor_sid: ctmVisitorSid(),
    page_url: typeof window === "undefined" ? "" : window.location.href,
    landing_page_url: campaign?.landingPageUrl || "",
    referrer: campaign?.referrer || "",
    attribution: campaign?.params || {},
    site_visit_id: getVisitId(),
  };
}
