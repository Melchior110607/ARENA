import Link from "next/link";
import { ChevronDown, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { FacetValue } from "@/lib/types";

/**
 * The query column shared by the directory and the catalogue.
 *
 * Every control is a real navigation: facet values are links that toggle a
 * query param, the search field is a GET form. Server components read the
 * result from `searchParams` — nothing here needs client JavaScript, and
 * every filtered view has a shareable URL.
 *
 * Selection is geometry first: the marker square fills (Signal) and the row
 * gains weight before hue says anything.
 */

export interface FacetGroupSpec {
  /** Query param this group drives, e.g. "country". */
  param: string;
  label: string;
  values: FacetValue[];
  /** Long-tail groups render as a native <details> index, closed by default. */
  collapsed?: boolean;
}

/** Toggle `param` to `value` (or clear it with null), keeping every other filter. */
export function filterHref(
  basePath: string,
  current: Record<string, string>,
  param: string,
  value: string | null
): string {
  const params = new URLSearchParams();
  for (const [key, existing] of Object.entries(current)) {
    if (key !== param) params.set(key, existing);
  }
  if (value) params.set(param, value);
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

function FacetList({
  basePath,
  current,
  group,
}: {
  basePath: string;
  current: Record<string, string>;
  group: FacetGroupSpec;
}) {
  const activeValue = current[group.param];

  return (
    <ul className={cn("mt-1.5", group.values.length > 9 && "max-h-60 overflow-y-auto pr-1")}>
      {group.values.map((facet) => {
        const selected = activeValue === facet.value;
        return (
          <li key={facet.value}>
            <Link
              href={filterHref(basePath, current, group.param, selected ? null : facet.value)}
              aria-current={selected ? "true" : undefined}
              className={cn(
                "group/facet flex items-baseline justify-between gap-3 rounded-sm px-1 py-[3px] text-sm transition-colors outline-none",
                "focus-visible:ring-[3px] focus-visible:ring-ring/50",
                selected
                  ? "font-medium text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span className="flex min-w-0 items-baseline gap-2">
                <span
                  aria-hidden="true"
                  className={cn(
                    "size-1.5 shrink-0 self-center rounded-[1px]",
                    selected
                      ? "bg-primary"
                      : "border border-border transition-colors group-hover/facet:border-input"
                  )}
                />
                <span className="truncate">{facet.label}</span>
              </span>
              <span className="arena-data text-muted-foreground">
                {facet.count}
                <span className="sr-only"> listed</span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function FacetRail({
  basePath,
  current,
  groups,
}: {
  basePath: string;
  current: Record<string, string>;
  groups: FacetGroupSpec[];
}) {
  return (
    <div>
      {groups.map((group) => {
        const activeValue = current[group.param];

        if (group.collapsed) {
          return (
            <details
              key={group.param}
              open={activeValue ? true : undefined}
              className="group/details border-t border-foreground/25 py-2.5"
            >
              <summary
                className={cn(
                  "arena-data flex cursor-pointer list-none items-center justify-between gap-2 rounded-sm text-muted-foreground transition-colors outline-none",
                  "hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50",
                  "[&::-webkit-details-marker]:hidden"
                )}
              >
                <span>
                  {group.label}
                  {activeValue ? <span className="text-primary"> · 1</span> : null}
                </span>
                <ChevronDown
                  aria-hidden="true"
                  className="size-3.5 shrink-0 transition-transform group-open/details:rotate-180"
                />
              </summary>
              <FacetList basePath={basePath} current={current} group={group} />
            </details>
          );
        }

        return (
          <section
            key={group.param}
            aria-label={group.label}
            className="border-t border-foreground/25 py-2.5"
          >
            <h3 className="arena-data text-muted-foreground">{group.label}</h3>
            <FacetList basePath={basePath} current={current} group={group} />
          </section>
        );
      })}
    </div>
  );
}

/** GET form — submits to the same route, keeping every other active filter. */
export function SearchField({
  id,
  basePath,
  current,
  placeholder,
}: {
  id: string;
  basePath: string;
  current: Record<string, string>;
  placeholder: string;
}) {
  const { q, ...others } = current;

  return (
    <form action={basePath} method="get" role="search" className="flex gap-2">
      {Object.entries(others).map(([key, value]) => (
        <input key={key} type="hidden" name={key} value={value} />
      ))}
      <label htmlFor={id} className="sr-only">
        {placeholder}
      </label>
      <Input
        id={id}
        type="search"
        name="q"
        defaultValue={q ?? ""}
        placeholder={placeholder}
        className="min-w-0 flex-1"
      />
      <Button type="submit" variant="outline">
        Search
      </Button>
    </form>
  );
}

/** Applied filters as removable stamps; each is a link that drops one param. */
export function FilterStamps({
  basePath,
  current,
  stamps,
}: {
  basePath: string;
  current: Record<string, string>;
  stamps: { param: string; label: string }[];
}) {
  if (stamps.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
      {stamps.map((stamp) => (
        <Badge key={stamp.param} asChild variant="default">
          <Link
            href={filterHref(basePath, current, stamp.param, null)}
            aria-label={`Remove filter: ${stamp.label}`}
          >
            {stamp.label}
            <X aria-hidden="true" />
          </Link>
        </Badge>
      ))}
      {stamps.length > 1 && (
        <Link
          href={basePath}
          className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
        >
          Clear all
        </Link>
      )}
    </div>
  );
}
