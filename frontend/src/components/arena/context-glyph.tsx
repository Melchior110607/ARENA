import type { ContextType } from "@/lib/types";

/**
 * The object apparatus — shared by every surface that shows what a request or
 * a conversation is about.
 *
 * A connection request always carries its object: a company record, a product
 * article, or a notice on the floor. These helpers keep that object's route,
 * its label of record and its drawn glyph identical wherever it appears — the
 * composer that files the request, the connections register that lists it, and
 * the correspondence file it opens.
 */

export function contextHref(type: ContextType, id: string): string {
  if (type === "company") return `/companies/${id}`;
  if (type === "product") return `/products/${id}`;
  return `/floor/${id}`;
}

export const CONTEXT_KIND: Record<ContextType, string> = {
  company: "Company record",
  product: "Product record",
  notice: "Notice on the floor",
};

/** Catalogue apparatus glyphs, one per context type, in the house line work. */
export function ContextGlyph({ type, size = 22 }: { type: ContextType; size?: number }) {
  const stroke = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinejoin: "round" as const,
  };
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" className="shrink-0">
      {type === "company" && (
        // The foundry nameplate.
        <g {...stroke}>
          <rect x="2.5" y="7" width="19" height="10" rx="1" />
          <rect x="4.5" y="9" width="15" height="6" strokeOpacity="0.5" strokeWidth="0.9" />
          <path d="M8.5 12h7" />
        </g>
      )}
      {type === "product" && (
        // A DIN material swatch, hatched.
        <g {...stroke}>
          <rect x="3.5" y="3.5" width="17" height="17" rx="1" />
          <g strokeWidth="1" strokeOpacity="0.75">
            <path d="M3.5 9.5l6-6M3.5 15.5l12-12M3.5 20.5l17-17M9.5 20.5l11-11M15.5 20.5l5-5" />
          </g>
        </g>
      )}
      {type === "notice" && (
        // A posted notice: head rule, then the brief's lines.
        <g {...stroke}>
          <rect x="4.5" y="3" width="15" height="18" rx="1" />
          <path d="M7.5 7.5h9" />
          <path strokeWidth="1" strokeOpacity="0.75" d="M7.5 11h9M7.5 14h9M7.5 17h5.5" />
        </g>
      )}
    </svg>
  );
}
