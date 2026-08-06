"use client";

/**
 * The home page folio: the catalogue in two sections, T (textile) and
 * C (construction). One sector register at the top governs every piece of
 * evidence below it — the chain figure and its company register, the
 * specimen traceability record, the product register and the open briefs
 * all re-set when the section turns.
 *
 * All content is live API data passed down from the server component.
 * Nothing here is invented; the fictional data set is the content.
 */

import { useMemo, useState } from "react";
import Link from "next/link";

import { ChainFigure } from "@/components/arena/chain-figure";
import { MaterialSwatch } from "@/components/arena/material-swatch";
import { Monogram } from "@/components/arena/monogram";
import { StatusSeal } from "@/components/arena/status-seal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  CHAIN_POSITION_LABELS,
  CHAIN_POSITION_ORDER,
  COMPANY_TYPE_LABELS,
  SECTOR_LABELS,
  type ChainPosition,
  type Company,
  type Opportunity,
  type Product,
  type Sector,
  type TraceabilityChain,
} from "@/lib/types";

export interface Specimen {
  product: Product;
  chain: TraceabilityChain;
}

const DATE_FORMAT = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const formatDate = (iso: string) => DATE_FORMAT.format(new Date(`${iso}T00:00:00Z`));

export function HomeFolio({
  companies,
  products,
  opportunities,
  specimens,
}: {
  companies: Company[];
  products: Product[];
  opportunities: Opportunity[];
  specimens: Record<Sector, Specimen | null>;
}) {
  const [sector, setSector] = useState<Sector>("textile");
  const [position, setPosition] = useState<ChainPosition>("processing");
  // Motion is earned by turning the folio, never by loading the page.
  const [turned, setTurned] = useState(false);

  const turnSector = (next: Sector) => {
    if (next === sector) return;
    setSector(next);
    setTurned(true);
  };
  const selectStage = (next: ChainPosition) => {
    if (next === position) return;
    setPosition(next);
    setTurned(true);
  };

  const byId = useMemo(() => new Map(companies.map((c) => [c.id, c])), [companies]);

  const sectorCompanies = useMemo(
    () => companies.filter((c) => c.sector === sector),
    [companies, sector]
  );

  const counts = useMemo(() => {
    const map = Object.fromEntries(
      CHAIN_POSITION_ORDER.map((p) => [p, 0])
    ) as Record<ChainPosition, number>;
    for (const company of sectorCompanies) map[company.chain_position] += 1;
    return map;
  }, [sectorCompanies]);

  const stationCompanies = sectorCompanies.filter((c) => c.chain_position === position);

  const sectorProducts = useMemo(() => {
    const inSector = products.filter((p) => p.sector === sector);
    // Articles that carry a published chain lead the register.
    return [...inSector]
      .sort((a, b) => Number(Boolean(b.traceability_chain)) - Number(Boolean(a.traceability_chain)))
      .slice(0, 6);
  }, [products, sector]);

  const sectorOpportunities = opportunities.filter((o) => o.sector === sector);
  const specimen = specimens[sector];

  return (
    <div>
      <div role="tablist" aria-label="Catalogue section" className="flex gap-6">
        {(["textile", "construction"] as const).map((s) => {
          const selected = s === sector;
          const other: Sector = s === "textile" ? "construction" : "textile";
          return (
            <button
              key={s}
              type="button"
              role="tab"
              id={`section-${s}`}
              aria-selected={selected}
              aria-controls="folio-panel"
              tabIndex={selected ? 0 : -1}
              onClick={() => turnSector(s)}
              onKeyDown={(event) => {
                if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
                event.preventDefault();
                turnSector(other);
                document.getElementById(`section-${other}`)?.focus();
              }}
              className={cn(
                "relative flex cursor-pointer items-baseline gap-2 pb-2 text-base font-medium transition-colors outline-none",
                "focus-visible:ring-[3px] focus-visible:ring-ring/50",
                selected
                  ? "text-foreground after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {SECTOR_LABELS[s]}
              <span className="arena-data text-muted-foreground">
                {companies.filter((c) => c.sector === s).length}
                <span className="sr-only"> companies</span>
              </span>
            </button>
          );
        })}
      </div>

      <div role="tabpanel" id="folio-panel" aria-labelledby={`section-${sector}`}>
      {/* ------------------------- Fig. 1 + company register ------------------------- */}
      <section aria-label="The value chain" className="mt-6">
        <ChainFigure
          counts={counts}
          active={position}
          onSelect={selectStage}
          panelId="station-register"
        />

        <div
          key={`${sector}-${position}`}
          id="station-register"
          role="tabpanel"
          aria-labelledby={`station-${position}`}
          className={cn(
            "mt-6 border-t border-foreground/25",
            turned && "animate-in fade-in slide-in-from-bottom-2"
          )}
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2 pt-3 pb-1">
            <p className="arena-data text-muted-foreground">
              {CHAIN_POSITION_LABELS[position]} · {SECTOR_LABELS[sector]} ·{" "}
              {stationCompanies.length} of {sectorCompanies.length} companies
            </p>
            <Link
              href={`/companies?sector=${sector}&chain_position=${position}`}
              className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
            >
              Open this stage in the directory →
            </Link>
          </div>
          <ul>
            {stationCompanies.map((company) => (
              <li
                key={company.id}
                className="grid grid-cols-[auto_1fr] gap-x-4 border-b py-3 transition-colors hover:bg-muted/50"
              >
                <Monogram logo={company.logo} size={40} className="mt-0.5" />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                    <Link
                      href={`/companies/${company.id}`}
                      className="font-medium underline-offset-4 transition-colors hover:text-primary hover:underline"
                    >
                      {company.name}
                    </Link>
                    <span className="text-sm text-muted-foreground">
                      {COMPANY_TYPE_LABELS[company.type]} · {company.subsector} · {company.city},{" "}
                      {company.country_name}
                    </span>
                  </div>
                  <p className="mt-0.5 max-w-2xl text-sm text-muted-foreground">
                    {company.tagline}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ------------------------------ Specimen record ------------------------------ */}
      {specimen && (
      <section aria-labelledby="specimen-heading" className="mt-14" id="specimen">
        <h2 id="specimen-heading" className="text-xl leading-tight font-semibold">
          One product, on the record
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{specimen.chain.summary}</p>

        <figure className="mt-6 grid gap-x-10 gap-y-8 lg:grid-cols-[300px_1fr]">
          <div>
            <div className="aspect-[4/3]">
              <MaterialSwatch visual={specimen.product.visual} />
            </div>
            <h3 className="mt-4 text-base font-medium">
              <Link
                href={`/products/${specimen.product.id}`}
                className="underline-offset-4 transition-colors hover:text-primary hover:underline"
              >
                {specimen.product.name}
              </Link>
            </h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {specimen.product.category} · {specimen.product.material} ·{" "}
              {byId.get(specimen.product.supplier_id)?.name ?? specimen.product.country_name}
            </p>
            <dl className="mt-4 space-y-1.5 border-t pt-3">
              <div className="flex justify-between gap-4">
                <dt className="arena-data text-muted-foreground">MOQ</dt>
                <dd className="text-right font-mono text-sm">{specimen.product.moq}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="arena-data text-muted-foreground">Lead time</dt>
                <dd className="text-right font-mono text-sm">{specimen.product.lead_time}</dd>
              </div>
            </dl>
            <Link
              href={`/products/${specimen.product.id}/traceability`}
              className="mt-4 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Read the full traceability record →
            </Link>
          </div>

          <ol aria-label="Traceability chain, upstream to downstream">
            {specimen.chain.steps.map((step, index) => {
              const company = byId.get(step.company_id);
              const last = index === specimen.chain.steps.length - 1;
              return (
                <li key={step.order} className="relative grid grid-cols-[20px_1fr] gap-x-4 pb-6">
                  {!last && (
                    <span
                      aria-hidden="true"
                      className="absolute top-7 bottom-1 left-[9.5px] w-px bg-border"
                    />
                  )}
                  <span className="arena-data pt-1 text-center text-muted-foreground">
                    <span className="sr-only">Stage </span>
                    {step.order}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <p className="text-sm">
                        {company ? (
                          <Link
                            href={`/companies/${company.id}`}
                            className="font-medium underline-offset-4 transition-colors hover:text-primary hover:underline"
                          >
                            {company.name}
                          </Link>
                        ) : (
                          <span className="font-medium">{step.company_id}</span>
                        )}
                        <span className="text-muted-foreground"> — {step.role}</span>
                      </p>
                      <StatusSeal status={step.status} size={16} showLabel />
                    </div>
                    <p className="arena-data mt-1 text-muted-foreground">
                      {step.material} · {step.country_name}
                    </p>
                    <p className="mt-1 max-w-xl text-sm text-muted-foreground">{step.note}</p>
                  </div>
                </li>
              );
            })}
          </ol>
          <figcaption className="arena-data text-muted-foreground lg:col-span-2">
            Fig. 2 · Traceability record, upstream to downstream
          </figcaption>
        </figure>
      </section>
      )}

      {/* ------------------------------ Product register ------------------------------ */}
      <section aria-labelledby="products-heading" className="mt-14">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="products-heading" className="text-xl leading-tight font-semibold">
            Featured products
          </h2>
          <Link
            href="/products"
            className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
          >
            All {products.length} products →
          </Link>
        </div>
        <div className="mt-4">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Article</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Material</TableHead>
                <TableHead className="text-right">MOQ</TableHead>
                <TableHead className="text-right">Lead time</TableHead>
                <TableHead>Chain</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sectorProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-12 shrink-0">
                        <MaterialSwatch visual={product.visual} framed={false} />
                      </div>
                      <div className="min-w-0">
                        <Link
                          href={`/products/${product.id}`}
                          className="font-medium underline-offset-4 transition-colors hover:text-primary hover:underline"
                        >
                          {product.name}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {byId.get(product.supplier_id)?.name ?? product.country_name}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{product.category}</TableCell>
                  <TableCell className="text-muted-foreground">{product.material}</TableCell>
                  <TableCell className="text-right font-mono text-[13px]">{product.moq}</TableCell>
                  <TableCell className="text-right font-mono text-[13px]">
                    {product.lead_time}
                  </TableCell>
                  <TableCell>
                    {product.traceability_chain ? (
                      <Link
                        href={`/products/${product.id}/traceability`}
                        className="arena-data text-primary underline-offset-4 hover:underline"
                      >
                        Published
                      </Link>
                    ) : (
                      <span className="arena-data text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* ------------------------------- Open briefs ---------------------------------- */}
      <section aria-labelledby="opportunities-heading" className="mt-14">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="opportunities-heading" className="text-xl leading-tight font-semibold">
            Open opportunities
          </h2>
          <Link
            href="/opportunities"
            className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
          >
            All {opportunities.length} briefs →
          </Link>
        </div>
        <ul className="mt-4">
          {sectorOpportunities.map((opportunity) => {
            const poster = byId.get(opportunity.company_id);
            return (
              <li
                key={opportunity.id}
                className="grid gap-x-8 gap-y-2 border-b py-4 transition-colors hover:bg-muted/50 sm:grid-cols-[1fr_auto]"
              >
                <div className="min-w-0">
                  <Link
                    href="/opportunities"
                    className="font-medium underline-offset-4 transition-colors hover:text-primary hover:underline"
                  >
                    {opportunity.title}
                  </Link>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {poster?.name ?? "—"} · {opportunity.region}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {opportunity.skills.slice(0, 3).map((skill) => (
                      <Badge key={skill} variant="outline">
                        {skill}
                      </Badge>
                    ))}
                    {opportunity.skills.length > 3 && (
                      <Badge variant="outline">+{opportunity.skills.length - 3}</Badge>
                    )}
                  </div>
                </div>
                <p className="arena-data text-muted-foreground sm:pt-1 sm:text-right">
                  Closes {formatDate(opportunity.deadline)}
                </p>
              </li>
            );
          })}
        </ul>
        <div className="mt-6">
          <Button asChild variant="outline">
            <Link href="/opportunities">Browse all briefs</Link>
          </Button>
        </div>
      </section>
      </div>
    </div>
  );
}
