import { useId } from "react";

import { cn } from "@/lib/utils";
import type { Visual } from "@/lib/types";

/**
 * Product visual: a material swatch drawn as a catalogue diagram.
 *
 * Arena has no photography. Each product's `visual` names a material pattern
 * and a tone (0–5); this component draws the material the way a mid-century
 * works catalogue or a DIN section drawing would — line work in the tone's
 * drawing ink on a tinted plate. Several tiles are the actual engineering
 * section symbols for their material (sheet hatch, glass double-diagonal,
 * batt zigzag).
 *
 * Patterns: weave, knit, yarn, fibre, grain, aggregate, sheet, panel, glass, batt.
 * Unknown patterns fall back to the neutral section hatch.
 */

const clampTone = (tone: number) => Math.min(5, Math.max(0, Math.round(tone)));

type Tile = { w: number; h: number; content: React.ReactNode };

function tileFor(pattern: string, ink: string): Tile {
  const stroke = { stroke: ink, fill: "none" as const };

  switch (pattern) {
    case "weave":
      // Over-under basket cells: line direction alternates warp/weft.
      return {
        w: 20,
        h: 20,
        content: (
          <g {...stroke} strokeWidth="1.2">
            <path d="M1 3h8M1 6.5h8" />
            <path d="M13 1v8M16.5 1v8" />
            <path d="M11 13h8M11 16.5h8" />
            <path d="M3 11v8M6.5 11v8" />
          </g>
        ),
      };
    case "knit":
      // Interlocked V loops in staggered courses.
      return {
        w: 12,
        h: 12,
        content: (
          <g {...stroke} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M0 1l3 4 3-4" />
            <path d="M6 1l3 4 3-4" />
            <path d="M-3 7l3 4 3-4" />
            <path d="M3 7l3 4 3-4" />
            <path d="M9 7l3 4 3-4" />
          </g>
        ),
      };
    case "yarn":
      // Rope lay: short parallel diagonals in staggered courses.
      return {
        w: 12,
        h: 12,
        content: (
          <g {...stroke} strokeWidth="1.2" strokeLinecap="round">
            <path d="M0 5L5 0M6 5l5-5" />
            <path d="M3 11l5-5M9 11l5-5M-3 11l5-5" />
          </g>
        ),
      };
    case "fibre":
      // Nonwoven web: short strokes at scattered angles.
      return {
        w: 24,
        h: 24,
        content: (
          <g {...stroke} strokeWidth="1" strokeLinecap="round">
            <path d="M2 4l5-2M14 2l4 3M8 9l5 1M19 8l3 4M3 14l4 3M12 15l5-2M21 17l2 3M6 20l5 1M15 21l4-3M1 9l2 3" />
          </g>
        ),
      };
    case "grain":
      // Sawn timber: long grain lines with a knot.
      return {
        w: 48,
        h: 24,
        content: (
          <g {...stroke} strokeWidth="1">
            <path d="M0 3c8 0 12 2 20 2s16-2 28-2" />
            <path d="M0 9c10 0 14-2 24-2s14 2 24 2" />
            <path d="M0 15c7 0 13 2 22 2s17-2 26-2" />
            <path d="M0 21c9 0 15-2 25-2s13 2 23 2" />
            <ellipse cx="30" cy="12" rx="3.2" ry="1.6" />
          </g>
        ),
      };
    case "aggregate":
      // Concrete section: scattered stones and fines.
      return {
        w: 26,
        h: 26,
        content: (
          <g {...stroke} strokeWidth="1" strokeLinejoin="round">
            <path d="M4 3l3.5 1.5L7 8 3.5 7z" />
            <path d="M16 5l3-1 2 2.5-2 2-3-1z" />
            <path d="M8 15l3 1 .5 3-3 1-2-2.5z" />
            <path d="M19 17l3 1-.5 3.5-3-1z" />
            <circle cx="13" cy="10.5" r="0.8" fill={ink} stroke="none" />
            <circle cx="2.5" cy="12" r="0.7" fill={ink} stroke="none" />
            <circle cx="23" cy="11" r="0.7" fill={ink} stroke="none" />
            <circle cx="14" cy="22" r="0.8" fill={ink} stroke="none" />
            <circle cx="3" cy="21" r="0.7" fill={ink} stroke="none" />
          </g>
        ),
      };
    case "sheet":
      // The DIN section hatch for solid metal: 45° lines.
      return {
        w: 8,
        h: 8,
        content: (
          <g {...stroke} strokeWidth="1">
            <path d="M-2 6L6 -2M2 10l8-8" />
          </g>
        ),
      };
    case "panel":
      // Cladding: large seamed fields, fasteners at the joints only.
      return {
        w: 56,
        h: 36,
        content: (
          <g {...stroke} strokeWidth="1">
            <path d="M0 0.5h56M0 18.5h56" />
            <path d="M28.5 0v18M0.5 18v18M56 18H0M56.5 18v18" />
            <circle cx="28.5" cy="9.5" r="1" fill={ink} stroke="none" />
            <circle cx="14" cy="27.5" r="1" fill={ink} stroke="none" />
            <circle cx="43" cy="27.5" r="1" fill={ink} stroke="none" />
          </g>
        ),
      };
    case "glass":
      // The drawing convention for glass: sparse double diagonals.
      return {
        w: 20,
        h: 20,
        content: (
          <g {...stroke} strokeWidth="0.9">
            <path d="M-2 14L14 -2M2 18L18 2M6 22L22 6" />
          </g>
        ),
      };
    case "batt":
      // Insulation batt symbol: zigzag held between rails.
      return {
        w: 16,
        h: 12,
        content: (
          <g {...stroke} strokeWidth="1" strokeLinejoin="round">
            <path d="M0 1.5h16M0 10.5h16" />
            <path d="M0 10l4-8 4 8 4-8 4 8" />
          </g>
        ),
      };
    default:
      // Neutral section hatch.
      return {
        w: 8,
        h: 8,
        content: (
          <g {...stroke} strokeWidth="1">
            <path d="M-2 6L6 -2M2 10l8-8" />
          </g>
        ),
      };
  }
}

export function MaterialSwatch({
  visual,
  className,
  framed = true,
  ...props
}: {
  visual: Visual;
  /** Draw the fine inner rule that frames a catalogue plate. */
  framed?: boolean;
} & Omit<React.ComponentProps<"svg">, "children">) {
  const id = useId();
  const tone = clampTone(visual.tone);
  const fill = `var(--tone-${tone})`;
  const ink = `var(--tone-${tone}-deep)`;
  const tile = tileFor(visual.pattern, ink);
  const patternId = `${id}-p`;

  return (
    <svg
      role="img"
      aria-label={`${visual.pattern} material swatch`}
      className={cn("block h-full w-full", className)}
      {...props}
    >
      <defs>
        <pattern
          id={patternId}
          width={tile.w}
          height={tile.h}
          patternUnits="userSpaceOnUse"
        >
          <rect width={tile.w} height={tile.h} fill={fill} />
          {tile.content}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={fill} />
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      {framed && (
        <rect
          x="3.5"
          y="3.5"
          style={{ width: "calc(100% - 7px)", height: "calc(100% - 7px)" }}
          fill="none"
          stroke={ink}
          strokeOpacity="0.4"
          strokeWidth="1"
        />
      )}
    </svg>
  );
}
