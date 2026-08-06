"use client";

/**
 * Fig. 1 — the value chain drawn as a works-catalogue process diagram.
 *
 * Five stations, upstream to downstream, joined by a flow line with
 * direction arrows. Each station is drawn apparatus — bale, mill rolls,
 * press, crate, nameplate — in catalogue line work, and each station is a
 * live control: selecting one opens the register of real companies standing
 * at that stage. Selection follows the house rule — the geometry moves
 * first (2px underline bar), the hue reinforces (Signal).
 *
 * Semantics: a manual tablist with roving tabindex and arrow-key travel;
 * the companies panel below is its tabpanel.
 */

import { useRef } from "react";

import { cn } from "@/lib/utils";
import {
  CHAIN_POSITION_LABELS,
  CHAIN_POSITION_ORDER,
  type ChainPosition,
} from "@/lib/types";

/** Catalogue apparatus glyphs, one per chain position. Stroke inherits. */
function StationGlyph({ position }: { position: ChainPosition }) {
  const stroke = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinejoin: "round" as const,
  };

  return (
    <svg viewBox="0 0 40 40" width={40} height={40} aria-hidden="true" className="shrink-0">
      {position === "raw_material" && (
        // A strapped bale of raw fibre or graded stone.
        <g {...stroke}>
          <rect x="7" y="14" width="26" height="16" rx="1" />
          <path d="M15 14v16M25 14v16" />
        </g>
      )}
      {position === "processing" && (
        // Mill rolls with the web passing through the nip.
        <g {...stroke}>
          <circle cx="20" cy="13" r="6" />
          <circle cx="20" cy="27" r="6" />
          <path d="M4 20h32" />
          <circle cx="20" cy="13" r="0.9" fill="currentColor" stroke="none" />
          <circle cx="20" cy="27" r="0.9" fill="currentColor" stroke="none" />
        </g>
      )}
      {position === "manufacturing" && (
        // A frame press over the workpiece.
        <g {...stroke}>
          <path d="M7 9h26" />
          <path d="M10 9v23M30 9v23" />
          <path d="M7 32h26" />
          <path d="M20 9v7" />
          <rect x="14" y="16" width="12" height="3" />
          <rect x="13" y="25.5" width="14" height="6.5" />
        </g>
      )}
      {position === "distribution" && (
        // A packing crate: lid line, cross bracing below.
        <g {...stroke}>
          <rect x="8" y="10" width="24" height="20" rx="1" />
          <path d="M8 15h24" />
          <path d="M8 15l24 15M32 15L8 30" />
        </g>
      )}
      {position === "brand" && (
        // The foundry nameplate, struck and framed.
        <g {...stroke}>
          <rect x="6" y="13" width="28" height="14" rx="1" />
          <rect x="8.5" y="15.5" width="23" height="9" strokeOpacity="0.5" strokeWidth="1" />
          <path d="M14 20h12" />
        </g>
      )}
    </svg>
  );
}

export function ChainFigure({
  counts,
  active,
  onSelect,
  panelId,
}: {
  /** Companies standing at each position, for the active sector. */
  counts: Record<ChainPosition, number>;
  active: ChainPosition;
  onSelect: (position: ChainPosition) => void;
  /** id of the companies panel this figure controls. */
  panelId: string;
}) {
  const refs = useRef<Partial<Record<ChainPosition, HTMLButtonElement | null>>>({});

  const move = (from: ChainPosition, delta: number) => {
    const order = CHAIN_POSITION_ORDER;
    const next =
      delta === Number.NEGATIVE_INFINITY
        ? order[0]
        : delta === Number.POSITIVE_INFINITY
          ? order[order.length - 1]
          : order[(order.indexOf(from) + delta + order.length) % order.length];
    onSelect(next);
    refs.current[next]?.focus();
  };

  return (
    <figure>
      <div className="snap-x overflow-x-auto">
        <div
          role="tablist"
          aria-label="Value chain stages"
          className="flex min-w-[660px] items-stretch"
        >
        {CHAIN_POSITION_ORDER.map((position, index) => {
          const selected = position === active;
          return (
            <div key={position} className={cn("flex items-stretch", index > 0 && "flex-1")}>
              {index > 0 && (
                // Flow line with a direction arrow, crossing at glyph height.
                <div aria-hidden="true" className="relative mt-[30px] h-px min-w-8 flex-1 bg-border">
                  <span className="absolute -top-[3px] right-0 size-[7px] rotate-45 border-t border-r border-border" />
                </div>
              )}
              <button
                ref={(node) => {
                  refs.current[position] = node;
                }}
                type="button"
                role="tab"
                id={`station-${position}`}
                aria-selected={selected}
                aria-controls={panelId}
                tabIndex={selected ? 0 : -1}
                onClick={() => onSelect(position)}
                onKeyDown={(event) => {
                  if (event.key === "ArrowRight") move(position, 1);
                  else if (event.key === "ArrowLeft") move(position, -1);
                  else if (event.key === "Home") move(position, Number.NEGATIVE_INFINITY);
                  else if (event.key === "End") move(position, Number.POSITIVE_INFINITY);
                  else return;
                  event.preventDefault();
                }}
                className={cn(
                  "relative flex snap-start cursor-pointer flex-col items-center gap-1.5 px-3 pt-2.5 pb-3 transition-colors outline-none",
                  "focus-visible:ring-[3px] focus-visible:ring-ring/50",
                  selected
                    ? "text-foreground after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:bg-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <StationGlyph position={position} />
                <span className="text-[13px] font-medium whitespace-nowrap">
                  {CHAIN_POSITION_LABELS[position]}
                </span>
                <span className="arena-data">
                  {counts[position]}
                  <span className="sr-only">
                    {counts[position] === 1 ? " company" : " companies"}
                  </span>
                </span>
              </button>
            </div>
          );
        })}
        </div>
      </div>
      <figcaption className="arena-data mt-3 text-muted-foreground">
        Fig. 1 · The value chain, upstream to downstream · Select a stage
      </figcaption>
    </figure>
  );
}
