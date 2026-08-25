// First-touch attribution store, visit session, and CTM identity.
//
// Lead delivery goes to Clarion and nowhere else. CallTrackingMetrics still
// runs on the page — t.js owns the dynamic number swap and mints the visitor
// session — but no form submission is ever sent to CTM. Clarion attaches the
// lead to that CTM visit itself, via the `ctm_visitor_sid` passed through here.
//
// Why the first-touch store exists: the lead payload used to read utm/gclid out
// of location.search at submit time. A visitor who lands on an ad and then
// reloads, returns, or reaches the form from a clean URL converts with no
// campaign attached at all — and because the lead still delivers and the
// endpoint still returns 200, that failure is completely invisible. It shows up
// only as paid spend that appears to convert at zero. So: capture on first
// touch, read at submit time.
//
// localStorage, not sessionStorage: a second tab is the same visit, and CTM
// keeps its own id in a 30-day first-party cookie, so a shorter-lived store
// here could only ever be staler.

// t.js is loaded by app/layout.tsx, but an ad-blocker can still stop it, so
// every read of window.__ctm is guarded.
declare global {
  interface Window {
    __ctm?: {
      config?: { aid?: number; sid?: string };
    };
  }
}

const CAMPAIGN_KEY = "lvd.campaign.v1";
const VISIT_KEY = "lvd.visit.v1";

const CAMPAIGN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days — matches CTM's __ctmid
const VISIT_IDLE_MS = 30 * 60 * 1000; // a 30-minute gap starts a new visit

/** Enough to see the path through the page; bounded so the payload can't grow. */
const MAX_TRACKED_PAGES = 20;

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

type Visit = {
  /**
   * This site's own id for the visit. Deliberately a UUID so it can never be
   * mistaken for CTM's 24-hex session id — substituting one for the other is
   * the classic way to file a lead against no visit at all.
   */
  id: string;
  startedAt: number;
  lastSeenAt: number;
  pageviews: number;
  /** Paths only, never full URLs: a query string would repeat the ad params. */
  pages?: string[];
};

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
  // A fresh ad click mid-visit re-attributes but does NOT split the visit: it
  // is the same person continuing to browse, and breaking it in two would make
  // the pageview count read lower than the journey actually was.
  const continuing = visit && now - visit.lastSeenAt < VISIT_IDLE_MS;
  const base: Visit = continuing
    ? { ...visit!, lastSeenAt: now }
    : { id: randomId(), startedAt: now, lastSeenAt: now, pageviews: 0, pages: [] };

  // Count a pageview only when the path actually changed. React StrictMode
  // double-invokes effects in development, a remount or Fast Refresh can fire
  // the tracker again on the same route, and VerifyForm calls this once more at
  // submit time — without this the count arrives at Clarion inflated. The cost
  // is that reloading the same URL is not counted twice, the better error.
  const pages = base.pages ?? [];
  const path = window.location.pathname;
  if (pages[pages.length - 1] !== path) {
    base.pages = [...pages, path].slice(-MAX_TRACKED_PAGES);
    base.pageviews += 1;
  } else {
    base.pages = pages;
  }

  writeJson(VISIT_KEY, base);
}

/** First-touch campaign, or null when nothing has been recorded yet. */
export function getCampaign(): Campaign | null {
  const stored = readJson<Campaign>(CAMPAIGN_KEY);
  if (!stored || Date.now() - stored.at > CAMPAIGN_TTL_MS) return null;
  return stored;
}

/** The live visit, or null once it has gone idle past the window. */
function getVisit(): Visit | null {
  const visit = readJson<Visit>(VISIT_KEY);
  if (!visit || typeof visit.id !== "string" || typeof visit.lastSeenAt !== "number") return null;
  return Date.now() - visit.lastSeenAt < VISIT_IDLE_MS ? visit : null;
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
 * The CTM session id, from t.js if it has run and from the __ctmid first-party
 * cookie otherwise. Returns null rather than substituting this site's own
 * session id — Clarion attaches the lead to no visit either way, and a
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

/* ------------------------------------------------------------------ */
/* Lead delivery                                                       */
/* ------------------------------------------------------------------ */

/**
 * No trailing slash: this app does not set `trailingSlash`, so adding one would
 * make every lead pay a 308 redirect first.
 */
const VERIFY_ROUTE = "/api/verify";

const UTM_KEYS = ["source", "medium", "campaign", "term", "content"] as const;

/** Reshape the stored flat params into the payload Clarion expects. */
function attributionPayload() {
  const campaign = getCampaign();
  const params = campaign?.params ?? {};

  const utm: Record<string, string> = {};
  for (const key of UTM_KEYS) {
    const value = params[`utm_${key}`];
    if (value) utm[key] = value;
  }

  return {
    page_url: typeof window === "undefined" ? "" : window.location.href,
    // The real entry page with its campaign on it, not wherever the form sits.
    landing_page_url: campaign?.landingPageUrl || (typeof window === "undefined" ? "" : window.location.href),
    referrer: campaign?.referrer || null,
    utm: Object.keys(utm).length ? utm : null,
    // wbraid / gbraid are what Google substitutes for gclid under iOS and
    // consent mode. CTM's own routing rules key on all three, so a lead that
    // only carries gclid loses exactly those clicks.
    gclid: params.gclid || params.wbraid || params.gbraid || null,
  };
}

/**
 * The visit context that goes alongside the answers: how long this person has
 * been reading, how many pages they saw, what brought them here, and which CTM
 * visit they are.
 */
function sessionPayload(visitorSid: string | null) {
  const visit = getVisit();
  if (!visit) return null;
  const campaign = getCampaign();

  return {
    id: visit.id,
    started_at: new Date(visit.startedAt).toISOString(),
    last_active_at: new Date(visit.lastSeenAt).toISOString(),
    duration_seconds: Math.max(0, Math.round((Date.now() - visit.startedAt) / 1000)),
    pageviews: visit.pageviews,
    pages: visit.pages ?? [],
    entry_page: campaign?.landingPageUrl || null,
    referrer: campaign?.referrer || null,
    // The full flat set, including the params the top-level fields don't carry
    // (msclkid, fbclid, campaignid, adgroupid, creativeid).
    attribution: campaign?.params ?? {},
    // Repeated here for context only. The flat top-level copy is the one
    // Clarion reads.
    ctm_visitor_sid: visitorSid,
    ctm_account_id: (() => {
      try {
        return window.__ctm?.config?.aid ?? null;
      } catch {
        return null;
      }
    })(),
  };
}

export type VerificationLead = {
  firstName: string;
  lastName: string;
  phone: string;
  dob?: string;
  insurer?: string;
  memberId?: string;
};

/**
 * Deliver the lead to Clarion through this site's own route, which holds the
 * site key.
 *
 * Resolves false on any failure so the caller shows an error and the phone
 * number instead of a confirmation — a silently dropped admissions enquiry is
 * the worst outcome available here.
 */
export async function submitVerificationLead(
  lead: VerificationLead
): Promise<{ ok: boolean; message?: string }> {
  const visitorSid = ctmVisitorSid();

  try {
    const res = await fetch(VERIFY_ROUTE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: {
          first_name: lead.firstName,
          last_name: lead.lastName,
          phone: lead.phone,
          date_of_birth: lead.dob ?? "",
          insurance_provider: lead.insurer ?? "",
          member_id: lead.memberId ?? "",
        },
        ...attributionPayload(),
        // Flat and top-level under this exact name, or Clarion drops it.
        ctm_visitor_sid: visitorSid,
        session: sessionPayload(visitorSid),
      }),
      // Lets the request finish if the visitor navigates away mid-submit.
      keepalive: true,
    });

    const json = (await res.json().catch(() => null)) as
      | { ok?: boolean; message?: string; error?: string }
      | null;

    if (res.ok && json?.ok === true) {
      return { ok: true, message: json.message };
    }
    return { ok: false, message: json?.error };
  } catch {
    return { ok: false };
  }
}
