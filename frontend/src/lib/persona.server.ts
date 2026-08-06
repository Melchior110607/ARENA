import "server-only";

import { cookies } from "next/headers";

import { DEFAULT_PERSONA_ID, PERSONA_COOKIE, VISITOR, type PersonaId } from "./persona";

/**
 * Reads the simulated company on the server. Returns the `VISITOR` sentinel when
 * signed out. Pages using it must be dynamic.
 */
export async function getPersonaId(): Promise<PersonaId> {
  const store = await cookies();
  return store.get(PERSONA_COOKIE)?.value || DEFAULT_PERSONA_ID;
}

/**
 * For member-only surfaces: returns the acting company id, or `null` when signed
 * out. A `null` means the page should send the reader back to the public page
 * rather than call the API with a sentinel that is not a company.
 */
export async function requireCompanyId(): Promise<string | null> {
  const personaId = await getPersonaId();
  return personaId === VISITOR ? null : personaId;
}
