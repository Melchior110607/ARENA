/**
 * Server-safe helpers shared by the registry surfaces — the Floor, Connections
 * and Messages. Dates in the registry are always set as ISO days in Fragment
 * Mono: the register quotes the record, it does not prettify it.
 */

export const pad2 = (n: number) => String(n).padStart(2, "0");

/** "2026-07-14T09:12:00Z" → "2026-07-14". Plain dates pass through. */
export const dayOf = (iso: string) => iso.slice(0, 10);

/** "2026-07-14T09:12:00Z" → "09:12". Empty for date-only strings. */
export const timeOf = (iso: string) => (iso.length >= 16 ? iso.slice(11, 16) : "");

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Whole days from one ISO day to another; never negative. */
export function daysBetween(fromIso: string, toIso: string): number {
  const from = Date.parse(dayOf(fromIso));
  const to = Date.parse(dayOf(toIso));
  if (Number.isNaN(from) || Number.isNaN(to)) return 0;
  return Math.max(0, Math.round((to - from) / 86_400_000));
}

/** Signed days from today to an ISO day — negative when the day has passed. */
export function daysUntil(iso: string, today: string): number {
  const from = Date.parse(today);
  const to = Date.parse(dayOf(iso));
  if (Number.isNaN(from) || Number.isNaN(to)) return 0;
  return Math.round((to - from) / 86_400_000);
}
