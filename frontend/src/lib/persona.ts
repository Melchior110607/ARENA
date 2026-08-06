/**
 * The "simulated company" — whose point of view the visitor is browsing from,
 * or nobody at all.
 *
 * There is no authentication in this prototype. A cookie records which company
 * the visitor is acting as, and it is sent to the backend as `?as=<company_id>`.
 * The cookie can also hold the `visitor` sentinel, which stands for signed out:
 * `/` then shows the public page instead of the floor, and the member-only
 * surfaces are closed. That lets a demo show both faces of the product without
 * building any authentication.
 *
 * Client-safe: no `next/headers` import here. Server code uses `persona.server.ts`.
 */

export const PERSONA_COOKIE = "arena_persona";

/** Signed out. Not a company id — no API call may be made with this value. */
export const VISITOR = "visitor";

/** A fresh session opens signed in, so a demo lands on the floor. */
export const DEFAULT_PERSONA_ID = "maison-vaudoise";

/** One year — long enough that a demo never loses its context mid-session. */
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export type PersonaId = string;

export function isVisitor(personaId: PersonaId): boolean {
  return personaId === VISITOR;
}

export function readPersonaFromCookieString(cookieString: string | undefined): PersonaId {
  if (!cookieString) return DEFAULT_PERSONA_ID;
  const match = cookieString
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${PERSONA_COOKIE}=`));
  if (!match) return DEFAULT_PERSONA_ID;
  return decodeURIComponent(match.slice(PERSONA_COOKIE.length + 1)) || DEFAULT_PERSONA_ID;
}

/** Browser-side write. Call `router.refresh()` afterwards so server components re-read it. */
export function writePersonaCookie(companyId: PersonaId): void {
  if (typeof document === "undefined") return;
  document.cookie = `${PERSONA_COOKIE}=${encodeURIComponent(companyId)}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
}

/** Sign out — the header control writes the sentinel rather than clearing the cookie. */
export function signOut(): void {
  writePersonaCookie(VISITOR);
}

export function getClientPersona(): PersonaId {
  if (typeof document === "undefined") return DEFAULT_PERSONA_ID;
  return readPersonaFromCookieString(document.cookie);
}
