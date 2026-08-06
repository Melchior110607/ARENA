import { Fragment } from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import {
  CHAIN_POSITION_LABELS,
  CHAIN_POSITION_ORDER,
  type ChainPosition,
} from "@/lib/types";

/**
 * The directory's master control: the value chain as a filter rail.
 *
 * Five stations, upstream to downstream, joined by a flow line with direction
 * arrows — the same catalogue apparatus as the home page's Fig. 1, drawn
 * compact. Each station is a real link that toggles the `chain_position`
 * query param, so filtering by where a company stands in the chain is one
 * click, works without client JavaScript, and lands in the URL.
 *
 * Selection follows the house rule: geometry first (the 2px underline bar),
 * hue second (Signal).
 */

/** Compact catalogue apparatus glyphs, one per chain position. */
function StationMark({ position }: { position: ChainPosition }) {
  const stroke = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.3,
    strokeLinejoin: "round" as const,
  };

  return (
    <svg viewBox="0 0 28 28" width={28} height={28} aria-hidden="true" className="shrink-0">
      {position === "raw_material" && (
        // A strapped bale of raw fibre or graded stone.
        <g {...stroke}>
          <rect x="5" y="9" width="18" height="11" rx="1" />
          <path d="M11 9v11M17 9v11" />
        </g>
      )}
      {position === "processing" && (
        // Mill rolls with the web passing through the nip.
        <g {...stroke}>
          <circle cx="14" cy="9.5" r="4.2" />
          <circle cx="14" cy="18.5" r="4.2" />
          <path d="M3 14h22" />
        </g>
      )}
      {position === "manufacturing" && (
        // A frame press over the workpiece.
        <g {...stroke}>
          <path d="M5 6h18" />
          <path d="M7 6v16M21 6v16" />
          <path d="M5 22h18" />
          <path d="M14 6v5" />
          <rect x="10" y="11" width="8" height="2.5" />
          <rect x="9.5" y="17" width="9" height="5" />
        </g>
      )}
      {position === "distribution" && (
        // A packing crate: lid line, cross bracing below.
        <g {...stroke}>
          <rect x="5" y="7" width="18" height="14" rx="1" />
          <path d="M5 11h18" />
          <path d="M5 11l18 10M23 11L5 21" />
        </g>
      )}
      {position === "brand" && (
        // The foundry nameplate, struck and framed.
        <g {...stroke}>
          <rect x="4" y="9" width="20" height="10" rx="1" />
          <rect x="6" y="11" width="16" height="6" strokeOpacity="0.5" strokeWidth="0.8" />
          <path d="M10 14h8" />
        </g>
      )}
    </svg>
  );
}

export function ChainRail({
  counts,
  active,
  hrefFor,
}: {
  /** Companies standing at each stage, under the other active filters. */
  counts: Record<ChainPosition, number>;
  active?: ChainPosition;
  /** Toggle href per stage: selects it, or clears it when already active. */
  hrefFor: Record<ChainPosition, string>;
}) {
  return (
    <nav aria-label="Filter by value-chain stage" className="border-y">
      <div className="overflow-x-auto">
        <div className="flex min-w-[640px] items-stretch">
          {CHAIN_POSITION_ORDER.map((position, index) => {
            const selected = position === active;
            return (
              <Fragment key={position}>
                {index > 0 && (
                  // Flow line with a direction arrow, crossing at glyph height.
                  <div
                    aria-hidden="true"
                    className="relative mt-[23px] h-px min-w-6 flex-1 bg-border"
                  >
                    <span className="absolute -top-[3px] right-0 size-[6px] rotate-45 border-t border-r border-border" />
                  </div>
                )}
                <Link
                  href={hrefFor[position]}
                  aria-current={selected ? "true" : undefined}
                  className={cn(
                    "relative flex flex-col items-center gap-1 px-4 pt-2 pb-2.5 transition-colors outline-none",
                    "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset",
                    selected
                      ? "text-foreground after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <StationMark position={position} />
                  <span className="text-[13px] font-medium whitespace-nowrap">
                    {CHAIN_POSITION_LABELS[position]}
                  </span>
                  <span className="arena-data">
                    {counts[position]}
                    <span className="sr-only">
                      {counts[position] === 1 ? " company" : " companies"} at this stage
                      {selected ? " — selected, follow to clear" : ""}
                    </span>
                  </span>
                </Link>
              </Fragment>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
