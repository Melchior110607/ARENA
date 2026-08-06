/**
 * The "simulated company" — whose point of view the visitor is browsing from.
 *
 * There is no authentication in this prototype. Instead a cookie records which
 * company the visitor is acting as, and Connections, Messages and Pipeline send
 * it to the backend as `?as=<company_id>`. Without this, those three surfaces
 * would have no subject.
 *
 * Client-safe: no `next/headers` import here. Server code uses `persona.server.ts`.
 */

export const PERSONA_COOKIE = "arena_persona";

export const DEFAULT_PERSONA_ID = "maison-vaudoise";

/** One year — long enough that a demo never loses its context mid-session. */
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function readPersonaFromCookieString(cookieString: string | undefined): string {
  if (!cookieString) return DEFAULT_PERSONA_ID;
  const match = cookieString
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${PERSONA_COOKIE}=`));
  if (!match) return DEFAULT_PERSONA_ID;
  return decodeURIComponent(match.slice(PERSONA_COOKIE.length + 1)) || DEFAULT_PERSONA_ID;
}

/** Browser-side write. Call `router.refresh()` afterwards so server components re-read it. */
export function writePersonaCookie(companyId: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${PERSONA_COOKIE}=${encodeURIComponent(companyId)}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
}

export function getClientPersona(): string {
  if (typeof document === "undefined") return DEFAULT_PERSONA_ID;
  return readPersonaFromCookieString(document.cookie);
}
