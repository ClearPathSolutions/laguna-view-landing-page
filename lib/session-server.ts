/**
 * Server-side helpers for the lead endpoint.
 *
 * The route is public and unauthenticated, and every value in a request body is
 * shaped entirely by the client, so nothing reaches a vendor unbounded.
 */

/** CTM session ids are 24 hex characters, no dashes. A UUID is not one. */
export const CTM_SID_PATTERN = /^[0-9a-f]{24}$/i;

const MAX_FIELD_LENGTH = 512;

/** Keys that would pollute a prototype if a payload were ever spread. */
const FORBIDDEN_KEYS = new Set(["__proto__", "constructor", "prototype"]);

/** Coerce an untrusted value to a bounded string, or "" if it isn't scalar. */
export function text(value: unknown, max: number = MAX_FIELD_LENGTH): string {
  if (typeof value !== "string" && typeof value !== "number") return "";
  return String(value).trim().slice(0, max);
}

function ctmIdCookie(request: Request): string {
  const raw = request.headers.get("cookie")?.match(/(?:^|;\s*)__ctmid=([^;]*)/)?.[1];
  if (!raw) return "";
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

/**
 * The visitor session is what ties a lead back to the ad click, so it gets two
 * independent sources.
 *
 * `__ctmid` is a first-party cookie on lagunaviewdetox.com, so it rides along
 * on this same-origin request for free. That makes the server the backstop: a
 * client-side regression, or a t.js that loaded on an earlier visit but is
 * blocked on this one, can no longer silently un-attribute every lead.
 *
 * Returns "" rather than inventing an id. An id from anywhere else — most
 * dangerously this site's own UUID visit id — would file the lead against the
 * wrong visit, which is worse than filing it against none.
 */
export function resolveVisitorSid(sidFromClient: unknown, request: Request): string {
  const fromClient = text(sidFromClient);
  if (CTM_SID_PATTERN.test(fromClient)) return fromClient;

  const fromCookie = ctmIdCookie(request);
  if (CTM_SID_PATTERN.test(fromCookie)) {
    if (fromClient) {
      console.warn("[verify] browser sid was not CTM-shaped; using __ctmid cookie");
    }
    return fromCookie;
  }

  if (fromClient) {
    console.warn("[verify] sid not CTM-shaped and no __ctmid cookie — no visit will attach");
    return fromClient;
  }
  console.warn("[verify] no CTM session id — t.js was likely blocked");
  return "";
}

/**
 * Rebuild a client-supplied flat record rather than passing it through: cap the
 * key count, the key length and every value, and drop anything non-scalar.
 */
export function sanitizeRecord(
  input: unknown,
  { maxKeys = 40, maxKeyLength = 64, maxValueLength = 1024 } = {}
): Record<string, string> {
  const out: Record<string, string> = {};
  if (!input || typeof input !== "object" || Array.isArray(input)) return out;

  for (const [rawKey, rawValue] of Object.entries(input as Record<string, unknown>)) {
    if (Object.keys(out).length >= maxKeys) break;
    const key = rawKey.slice(0, maxKeyLength);
    if (!key || FORBIDDEN_KEYS.has(key)) continue;
    const value = text(rawValue, maxValueLength);
    if (value) out[key] = value;
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Session object                                                      */
/* ------------------------------------------------------------------ */

const SESSION_LIMITS = {
  maxDepth: 4,
  maxKeys: 30,
  maxArray: 25,
  maxString: 512,
  /** Serialised budget. Over this the session is dropped, not truncated. */
  maxBytes: 8 * 1024,
};

type Json = string | number | boolean | null | Json[] | { [k: string]: Json };

/**
 * Rebuild the client's session object rather than passing it through: the
 * endpoint is public, and a hostile payload could otherwise arrive arbitrarily
 * deep, wide, or large. Caps depth, key count, array length and string length,
 * and drops anything that is not a JSON scalar.
 */
function rebuild(value: unknown, depth: number): Json | undefined {
  if (value === null) return null;

  if (typeof value === "string") return value.slice(0, SESSION_LIMITS.maxString);
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;

  if (depth >= SESSION_LIMITS.maxDepth) return undefined;

  if (Array.isArray(value)) {
    const out: Json[] = [];
    for (const item of value.slice(0, SESSION_LIMITS.maxArray)) {
      const clean = rebuild(item, depth + 1);
      if (clean !== undefined) out.push(clean);
    }
    return out;
  }

  if (typeof value === "object") {
    const out: { [k: string]: Json } = {};
    for (const [rawKey, rawValue] of Object.entries(value as Record<string, unknown>)) {
      if (Object.keys(out).length >= SESSION_LIMITS.maxKeys) break;
      const key = rawKey.slice(0, 64);
      if (!key || FORBIDDEN_KEYS.has(key)) continue;
      const clean = rebuild(rawValue, depth + 1);
      if (clean !== undefined) out[key] = clean;
    }
    return out;
  }

  // Functions, symbols, undefined — nothing a JSON body should carry.
  return undefined;
}

/**
 * Sanitize the session object, or return null if it cannot be made safe within
 * budget. Returning null is deliberate: the lead still goes through carrying
 * every flat field, minus the extra context.
 */
export function sanitizeSession(input: unknown): Json | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;

  const rebuilt = rebuild(input, 0);
  if (rebuilt === undefined || rebuilt === null) return null;

  const bytes = Buffer.byteLength(JSON.stringify(rebuilt), "utf8");
  if (bytes > SESSION_LIMITS.maxBytes) {
    console.warn(`[verify] session object was ${bytes}B, over budget — sending lead without it`);
    return null;
  }
  return rebuilt;
}
