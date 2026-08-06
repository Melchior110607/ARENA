import { Fragment } from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import {
  CHAIN_POSITION_LABELS,
  CHAIN_POSITION_ORDER,
  SECTOR_LABELS,
  type ChainPosition,
  type Sector,
} from "@/lib/types";

/**
 * A small figure locating one company in the value chain: five station ticks
 * joined by a flow line, the company's stage struck solid. Each tick is a
 * live link into the directory filtered to that stage and sector, so the
 * figure doubles as the fastest way to ask "who else stands here?".
 *
 * Identity is carried by geometry (filled vs open tick), never by hue alone.
 */
export function ChainLocator({
  position,
  sector,
  className,
}: {
  position: ChainPosition;
  sector: Sector;
  className?: string;
}) {
  const stageIndex = CHAIN_POSITION_ORDER.indexOf(position);

  return (
    <nav
      aria-label="Position in the value chain"
      className={cn("shrink-0", className)}
    >
      <div className="flex items-center">
        {CHAIN_POSITION_ORDER.map((stage, index) => {
          const here = stage === position;
          return (
            <Fragment key={stage}>
              {index > 0 && <span aria-hidden="true" className="h-px w-5 bg-border" />}
              <Link
                href={`/companies?sector=${sector}&chain_position=${stage}`}
                title={`${CHAIN_POSITION_LABELS[stage]} — open this stage in the directory`}
                aria-current={here ? "true" : undefined}
                className="group/tick rounded-sm p-1.5 transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "block rounded-[1px] transition-colors",
                    here
                      ? "size-2.5 bg-foreground group-hover/tick:bg-primary"
                      : "size-2 border border-input group-hover/tick:border-primary"
                  )}
                />
                <span className="sr-only">
                  {CHAIN_POSITION_LABELS[stage]}
                  {here ? " — this company's stage. " : ". "}
                  See {SECTOR_LABELS[sector].toLowerCase()} companies at this stage
                </span>
              </Link>
            </Fragment>
          );
        })}
      </div>
      <p className="arena-data mt-1.5 text-muted-foreground">
        <span className="text-foreground">{CHAIN_POSITION_LABELS[position]}</span> · stage{" "}
        {stageIndex + 1} of {CHAIN_POSITION_ORDER.length}
      </p>
    </nav>
  );
}
