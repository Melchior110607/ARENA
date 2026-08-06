import "server-only";

import { cookies } from "next/headers";

import { DEFAULT_PERSONA_ID, PERSONA_COOKIE } from "./persona";

/** Reads the simulated company on the server. Pages using it must be dynamic. */
export async function getPersonaId(): Promise<string> {
  const store = await cookies();
  return store.get(PERSONA_COOKIE)?.value || DEFAULT_PERSONA_ID;
}
