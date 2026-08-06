"use client";

/**
 * The traceability record's working half: Fig. 1 — the walkable chain — and
 * the schedule of operations it opens into.
 *
 * The chain is drawn per sector, in catalogue line work: a continuous thread
 * running through grommet eyelets for textile, hatched strata blocks on a
 * datum line for construction. The joints between stages are drawn honestly —
 * solid where the receiving stage countersigned the hand-off, broken where
 * its account stands alone. The record admits where it is weakly joined.
 *
 * Walking: hovering or focusing a station inks the path upstream of it,
 * fades what lies downstream, and previews the stage in the plate below the
 * figure. Selecting a station opens its full entry in the schedule. Entries
 * return the favour on hover.
 */

import { Fragment, useRef, useState } from "react";
import Link from "next/link";

import { Monogram } from "@/components/arena/monogram";
import { StatusSeal } from "@/components/arena/status-seal";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  TRACEABILITY_STATUS_LABELS,
  type Logo,
  type Sector,
  type TraceabilityStatus,
} from "@/lib/types";

export interface TraceStage {
  order: number;
  companyId: string;
  companyName: string;
  logo: Logo;
  role: string;
  countryName: string;
  material: string;
  process: string;
  status: TraceabilityStatus;
  note: string;
  /** Other stage numbers held by the same company, when it appears twice. */
  alsoStages: number[];
}

const pad2 = (n: number) => String(n).padStart(2, "0");

type JointState = "default" | "walked" | "dimmed";

/**
 * The joint between two stations: the thread (textile) or the datum line
 * with sleeper ticks (construction). Broken — dashed, and unanchored — when
 * the receiving stage's account is declared only.
 */
function Joint({
  sector,
  dashed,
  state,
}: {
  sector: Sector;
  dashed: boolean;
  state: JointState;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative mt-16 h-6 min-w-9 flex-1 transition-[color,opacity] duration-200",
        state === "walked" ? "text-foreground" : "text-muted-foreground",
        state === "dimmed" && "opacity-50"
      )}
    >
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 24"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {sector === "textile" ? (
          <path
            d="M0 12 C 33 5, 67 19, 100 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
            strokeDasharray={dashed ? "5 4" : undefined}
          />
        ) : (
          <>
            <path
              d="M0 12 H100"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
              strokeDasharray={dashed ? "5 4" : undefined}
            />
            {!dashed && (
              <path
                d="M12 12v5M37 12v5M62 12v5M87 12v5"
                stroke="currentColor"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
            )}
          </>
        )}
      </svg>
      {/* Direction arrow, the house flow-line idiom. */}
      <span className="absolute top-1/2 right-0 size-[7px] -translate-y-1/2 rotate-45 border-t border-r border-current" />
    </div>
  );
}

/**
 * The station mark the joints pass through: a grommet eyelet for textile, a
 * hatched stratum block for construction. The stubs either side carry the
 * dash of the joint they belong to, so the drawing stays continuous.
 */
function StationMark({
  sector,
  showIn,
  showOut,
  dashIn,
  dashOut,
}: {
  sector: Sector;
  showIn: boolean;
  showOut: boolean;
  dashIn: boolean;
  dashOut: boolean;
}) {
  const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1.5 } as const;

  return (
    <svg viewBox="0 0 40 24" width={40} height={24} aria-hidden="true" className="shrink-0">
      {sector === "textile" ? (
        <>
          {showIn && (
            <path {...stroke} d="M0 12h14.5" strokeDasharray={dashIn ? "4 3.5" : undefined} />
          )}
          {showOut && (
            <path {...stroke} d="M25.5 12h14.5" strokeDasharray={dashOut ? "4 3.5" : undefined} />
          )}
          <circle {...stroke} cx="20" cy="12" r="5.5" fill="var(--background)" />
          <circle cx="20" cy="12" r="2.4" fill="none" stroke="currentColor" strokeWidth="1" />
        </>
      ) : (
        <>
          {showIn && (
            <path {...stroke} d="M0 12h8" strokeDasharray={dashIn ? "4 3.5" : undefined} />
          )}
          {showOut && (
            <path {...stroke} d="M32 12h8" strokeDasharray={dashOut ? "4 3.5" : undefined} />
          )}
          <rect {...stroke} x="8" y="4.5" width="24" height="15" fill="var(--background)" />
          <g stroke="currentColor" strokeWidth="1" strokeOpacity="0.75">
            <path d="M8 9L12.5 4.5" />
            <path d="M8 16L19.5 4.5" />
            <path d="M11.5 19.5L26.5 4.5" />
            <path d="M18.5 19.5L32 6" />
            <path d="M25.5 19.5L32 13" />
          </g>
        </>
      )}
    </svg>
  );
}

export function ChainRecord({
  sector,
  stages,
  aside,
}: {
  sector: Sector;
  stages: TraceStage[];
  /** Server-rendered reading apparatus: standing, legend, article plate. */
  aside: React.ReactNode;
}) {
  const n = stages.length;

  /** Transient walk position — hover or focus along the chain. */
  const [walk, setWalk] = useState<number | null>(null);
  /** Pinned station after a select; keeps the plate and the entry marked. */
  const [selected, setSelected] = useState<number | null>(null);

  const stationRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const entryRefs = useRef<(HTMLLIElement | null)[]>([]);

  const active = walk !== null ? walk : selected;

  const openStage = (i: number) => {
    setSelected(i);
    const entry = entryRefs.current[i];
    if (!entry) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    entry.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    entry.focus({ preventScroll: true });
  };

  const travel = (event: React.KeyboardEvent, i: number) => {
    const target =
      event.key === "ArrowRight"
        ? Math.min(i + 1, n - 1)
        : event.key === "ArrowLeft"
          ? Math.max(i - 1, 0)
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? n - 1
              : null;
    if (target === null) return;
    event.preventDefault();
    stationRefs.current[target]?.focus();
  };

  const shown = active !== null ? stages[active] : null;

  return (
    <div className="space-y-10">
      {/* ------------------------- Fig. 1 — the chain ------------------------- */}
      <figure>
        <div className="overflow-x-auto pb-1">
          <div
            role="group"
            aria-label={`Chain of custody — ${n} stations, upstream to downstream`}
            className="flex items-start"
            style={{ minWidth: `${n * 96 + (n - 1) * 36}px` }}
          >
            {stages.map((stage, i) => {
              const onPath = (walk !== null && i <= walk) || selected === i;
              return (
                <Fragment key={stage.order}>
                  {i > 0 && (
                    <Joint
                      sector={sector}
                      dashed={stage.status === "declared"}
                      state={walk === null ? "default" : i <= walk ? "walked" : "dimmed"}
                    />
                  )}
                  <button
                    ref={(el) => {
                      stationRefs.current[i] = el;
                    }}
                    type="button"
                    aria-current={selected === i ? "true" : undefined}
                    aria-label={`Stage ${stage.order} of ${n} — ${stage.companyName} — ${stage.role} — ${stage.countryName} — ${TRACEABILITY_STATUS_LABELS[stage.status]}. Opens the full entry in the schedule.`}
                    onMouseEnter={() => setWalk(i)}
                    onMouseLeave={() => setWalk(null)}
                    onFocus={() => setWalk(i)}
                    onBlur={() => setWalk(null)}
                    onClick={() => openStage(i)}
                    onKeyDown={(event) => travel(event, i)}
                    className={cn(
                      "relative flex shrink-0 cursor-pointer flex-col items-center rounded-md px-3 pt-2 pb-2.5 transition-opacity duration-200 outline-none",
                      "focus-visible:ring-[3px] focus-visible:ring-ring/50",
                      walk !== null && i > walk && "opacity-60",
                      selected === i &&
                        "after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:bg-primary"
                    )}
                  >
                    <span
                      className={cn(
                        "arena-data leading-4 transition-colors duration-200",
                        onPath ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {pad2(stage.order)}
                    </span>
                    <Monogram logo={stage.logo} size={30} className="mt-1" aria-hidden="true" />
                    <span
                      className={cn(
                        "mt-1.5 transition-colors duration-200",
                        onPath ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      <StationMark
                        sector={sector}
                        showIn={i > 0}
                        showOut={i < n - 1}
                        dashIn={stage.status === "declared"}
                        dashOut={stages[i + 1]?.status === "declared"}
                      />
                    </span>
                    <StatusSeal status={stage.status} showLabel size={15} className="mt-1.5" />
                  </button>
                </Fragment>
              );
            })}
          </div>
        </div>

        {/* The reading plate: echoes the walked station. Stations carry their
            own full labels, so this visual echo stays out of the SR tree. */}
        <div
          aria-hidden="true"
          className="mt-3 min-h-14 rounded-md bg-card px-3.5 py-2.5 ring-1 ring-foreground/10"
        >
          {shown === null ? (
            <p className="text-sm leading-relaxed text-muted-foreground">
              Hover or tab along the stations to walk the chain. Selecting one opens its full
              entry in the schedule below.
            </p>
          ) : (
            <div className="min-w-0">
              <p className="flex min-w-0 items-center gap-2">
                <span className="arena-data shrink-0 text-muted-foreground">
                  Stage {pad2(shown.order)} / {pad2(n)}
                </span>
                <StatusSeal status={shown.status} showLabel size={14} className="shrink-0" />
                <span className="truncate text-sm font-medium">{shown.companyName}</span>
              </p>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {shown.role} · {shown.countryName} · {shown.material} ·{" "}
                {active !== null &&
                  `${active} upstream / ${n - 1 - active} downstream`}
              </p>
            </div>
          )}
        </div>

        <figcaption className="arena-data mt-3 text-muted-foreground">
          Fig. 1 · Chain of custody, read upstream to downstream ·{" "}
          {sector === "textile" ? "the thread follows the lot" : "the section follows the build-up"}{" "}
          · a broken joint is a hand-off no one countersigns
        </figcaption>
      </figure>

      {/* --------------- The schedule of operations + the apparatus --------------- */}
      <div className="grid gap-x-10 gap-y-10 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section aria-labelledby="schedule-heading">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2 id="schedule-heading" className="text-xl leading-tight font-semibold">
              Schedule of operations
            </h2>
            <span className="arena-data text-muted-foreground">
              Read upstream to downstream
            </span>
          </div>

          <ol className="mt-4 border-t border-foreground/25">
            {stages.map((stage, i) => (
              <li
                key={stage.order}
                id={`stage-${stage.order}`}
                ref={(el) => {
                  entryRefs.current[i] = el;
                }}
                tabIndex={-1}
                aria-current={selected === i ? "true" : undefined}
                onMouseEnter={() => setWalk(i)}
                onMouseLeave={() => setWalk(null)}
                className={cn(
                  "scroll-mt-6 rounded-sm border-b outline-none transition-colors duration-200",
                  "focus-visible:ring-[3px] focus-visible:ring-ring/50",
                  (walk === i || selected === i) && "bg-muted/50"
                )}
              >
                <div className="grid gap-x-8 gap-y-3 py-5 lg:grid-cols-[7.5rem_minmax(0,1fr)]">
                  <div className="flex items-center gap-x-4 lg:flex-col lg:items-start lg:gap-y-1.5">
                    <p className="arena-data text-muted-foreground">Stage {pad2(stage.order)}</p>
                    <StatusSeal status={stage.status} showLabel size={16} />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                      <Monogram logo={stage.logo} size={34} />
                      <div className="min-w-0 flex-1">
                        <p className="text-base leading-tight font-medium">
                          <Link
                            href={`/companies/${stage.companyId}`}
                            className="rounded-sm underline-offset-4 transition-colors outline-none hover:text-primary hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
                          >
                            {stage.companyName}
                          </Link>
                        </p>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {stage.role} · {stage.countryName}
                        </p>
                      </div>
                      {stage.alsoStages.length > 0 && (
                        <Badge variant="outline" className="shrink-0">
                          Same company as stage {stage.alsoStages.join(" & ")}
                        </Badge>
                      )}
                    </div>

                    <dl className="mt-3.5 grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
                      <div>
                        <dt className="arena-data text-muted-foreground">Material</dt>
                        <dd className="mt-0.5 text-sm">{stage.material}</dd>
                      </div>
                      <div>
                        <dt className="arena-data text-muted-foreground">Process</dt>
                        <dd className="mt-0.5 text-sm">{stage.process}</dd>
                      </div>
                    </dl>

                    {/* The remark is the record's most interesting line — what
                        is and is not established. Full ink, never buried. */}
                    <div className="mt-3.5 max-w-[75ch]">
                      <p className="arena-data text-muted-foreground">Remarks</p>
                      <p className="mt-1 text-sm leading-relaxed">{stage.note}</p>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <aside className="space-y-8">{aside}</aside>
      </div>
    </div>
  );
}
