import { Fragment } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ChainRecord, type TraceStage } from "@/components/arena/chain-record";
import { MaterialSwatch } from "@/components/arena/material-swatch";
import { StatusSeal } from "@/components/arena/status-seal";
import { Button } from "@/components/ui/button";
import { ApiError, getCompanies, getProduct, getTraceability } from "@/lib/api";
import {
  SECTOR_LABELS,
  TRACEABILITY_STATUS_LABELS,
  TRACEABILITY_STATUS_ORDER,
  type Sector,
  type TraceabilityStatus,
} from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * The traceability record — the full document behind the product page's
 * manifest. A certificate of custody: Fig. 1 (the walkable chain, drawn per
 * sector), the schedule of operations, and the reading apparatus that says
 * plainly what is established and what is not.
 */

const STATUS_DEFINITIONS: Record<TraceabilityStatus, string> = {
  declared: "Stated by the company itself. Nothing corroborates it yet.",
  confirmed: "Countersigned by the company one stage upstream.",
  verified: "Checked by an independent third party.",
};

const WEAK_READINGS: Record<Exclude<TraceabilityStatus, "verified">, string> = {
  declared: "declared only — stated, with nothing countersigning it",
  confirmed:
    "confirmed but not verified — countersigned upstream, never independently checked",
};

const inlineLink =
  "rounded-sm underline underline-offset-4 transition-colors outline-none hover:text-primary focus-visible:ring-[3px] focus-visible:ring-ring/50";

const chipLink =
  "arena-data rounded-sm border px-1.5 py-0.5 text-foreground transition-colors outline-none hover:border-primary hover:text-primary focus-visible:ring-[3px] focus-visible:ring-ring/50";

/** A sample of the figure's joint drawing, for the legend. */
function JointSample({ sector, dashed }: { sector: Sector; dashed: boolean }) {
  return (
    <svg
      viewBox="0 0 44 12"
      width={44}
      height={12}
      aria-hidden="true"
      className="mt-1 shrink-0 text-muted-foreground"
    >
      {sector === "textile" ? (
        <path
          d="M0 6 C 14 2, 30 10, 44 6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray={dashed ? "4 3.5" : undefined}
        />
      ) : (
        <>
          <path
            d="M0 6 H44"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray={dashed ? "4 3.5" : undefined}
          />
          {!dashed && <path d="M8 6v4M19 6v4M30 6v4M41 6v4" stroke="currentColor" strokeWidth="1" />}
        </>
      )}
    </svg>
  );
}

export default async function TraceabilityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let detail;
  try {
    detail = await getProduct(id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
  const { product } = detail;

  let chain;
  try {
    chain = await getTraceability(id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) chain = null;
    else throw error;
  }

  /* ------------------- No chain published: the honest plate ------------------- */

  if (!chain) {
    return (
      <article className="max-w-2xl space-y-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Traceability record</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            <Link href={`/products/${id}`} className={`text-foreground ${inlineLink}`}>
              {product.name}
            </Link>{" "}
            · {SECTOR_LABELS[product.sector]}
          </p>
        </header>
        <div className="rounded-xl border border-dashed border-input p-6">
          <p className="font-medium">No chain published for this article</p>
          <p className="mt-1.5 max-w-[60ch] text-sm text-muted-foreground">
            The production stages behind this article are not on record. When the supplier
            publishes them, each stage will appear here with its grade of proof — declared,
            confirmed or verified — and the joints between stages drawn as they stand.
          </p>
          <Button asChild variant="outline" className="mt-4">
            <Link href={`/products/${id}`}>Return to the product record</Link>
          </Button>
        </div>
      </article>
    );
  }

  /* ----------------------------- Assemble the record ----------------------------- */

  const steps = [...chain.steps].sort((a, b) => a.order - b.order);
  const companies = await getCompanies();
  const companyById = new Map(companies.map((company) => [company.id, company]));

  const ordersByCompany = new Map<string, number[]>();
  for (const step of steps) {
    ordersByCompany.set(step.company_id, [
      ...(ordersByCompany.get(step.company_id) ?? []),
      step.order,
    ]);
  }

  const stages: TraceStage[] = steps.map((step) => {
    const company = companyById.get(step.company_id);
    return {
      order: step.order,
      companyId: step.company_id,
      companyName: company?.name ?? step.company_id,
      logo: company?.logo ?? { monogram: step.company_id.slice(0, 2), tone: 0 },
      role: step.role,
      countryName: step.country_name,
      material: step.material,
      process: step.process,
      status: step.status,
      note: step.note,
      alsoStages: (ordersByCompany.get(step.company_id) ?? []).filter((o) => o !== step.order),
    };
  });

  const statusRows = [...TRACEABILITY_STATUS_ORDER].reverse().map((status) => ({
    status,
    orders: steps.filter((step) => step.status === status).map((step) => step.order),
  }));
  const countersigned = steps.slice(1).filter((step) => step.status !== "declared").length;
  const weakest =
    TRACEABILITY_STATUS_ORDER.find((status) => steps.some((step) => step.status === status)) ??
    "verified";
  const weakOrders = steps.filter((step) => step.status === weakest).map((step) => step.order);
  const nameByOrder = new Map(stages.map((stage) => [stage.order, stage.companyName]));

  /* ------------------------- The reading apparatus (aside) ------------------------- */

  const aside = (
    <>
      <section aria-labelledby="standing-heading">
        <h2 id="standing-heading" className="text-base leading-tight font-semibold">
          What this record establishes
        </h2>
        <ul className="mt-3 border-t border-foreground/25">
          {statusRows.map(({ status, orders }) => (
            <li key={status} className="border-b py-3">
              <div className="flex items-center justify-between gap-3">
                <StatusSeal status={status} showLabel size={16} />
                <span className="arena-data text-muted-foreground">× {orders.length}</span>
              </div>
              {orders.length > 0 ? (
                <p className="mt-2 flex flex-wrap gap-1.5">
                  {orders.map((order) => (
                    <a key={order} href={`#stage-${order}`} className={chipLink}>
                      Stage {order}
                    </a>
                  ))}
                </p>
              ) : (
                <p className="arena-data mt-2 text-muted-foreground">None on record</p>
              )}
            </li>
          ))}
        </ul>
        {steps.length > 1 && (
          <p className="arena-data mt-3 text-muted-foreground">
            Hand-offs countersigned · {countersigned} of {steps.length - 1}
          </p>
        )}
        <div className="mt-4 border-t border-foreground/25 pt-3">
          <p className="arena-data text-muted-foreground">Weakest link</p>
          {weakest === "verified" ? (
            <p className="mt-1 text-sm leading-relaxed">
              None — every stage on this record is verified by a third party.
            </p>
          ) : (
            <p className="mt-1 text-sm leading-relaxed">
              {weakOrders.map((order, index) => (
                <Fragment key={order}>
                  {index > 0 && (index === weakOrders.length - 1 ? " and " : ", ")}
                  <a href={`#stage-${order}`} className={inlineLink}>
                    Stage {order} — {nameByOrder.get(order)}
                  </a>
                </Fragment>
              ))}{" "}
              {weakOrders.length > 1 ? "stand" : "stands"}{" "}
              {WEAK_READINGS[weakest as Exclude<TraceabilityStatus, "verified">]}. A chain holds
              at its weakest stage.
            </p>
          )}
        </div>
      </section>

      <section aria-labelledby="legend-heading">
        <h2 id="legend-heading" className="text-base leading-tight font-semibold">
          How to read this record
        </h2>
        <ul className="mt-3 space-y-2.5">
          {TRACEABILITY_STATUS_ORDER.map((status) => (
            <li key={status} className="flex items-start gap-2.5">
              <StatusSeal status={status} size={16} className="mt-0.5 shrink-0" />
              <p className="text-xs leading-relaxed text-muted-foreground">
                <span className="font-medium text-foreground">
                  {TRACEABILITY_STATUS_LABELS[status]}
                </span>
                {" — "}
                {STATUS_DEFINITIONS[status]}
              </p>
            </li>
          ))}
        </ul>
        <ul className="mt-3 space-y-2.5 border-t pt-3">
          <li className="flex items-start gap-2.5">
            <JointSample sector={chain.sector} dashed={false} />
            <p className="text-xs leading-relaxed text-muted-foreground">
              Solid joint — the receiving stage countersigns the hand-off.
            </p>
          </li>
          <li className="flex items-start gap-2.5">
            <JointSample sector={chain.sector} dashed />
            <p className="text-xs leading-relaxed text-muted-foreground">
              Broken joint — the hand-off is stated only; nothing countersigns it.
            </p>
          </li>
        </ul>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          All companies, stages and certificates in this record are fictional.
        </p>
      </section>

      <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
        <div className="flex items-center gap-3">
          <div className="size-14 shrink-0">
            <MaterialSwatch visual={product.visual} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              <Link href={`/products/${id}`} className={inlineLink}>
                {product.name}
              </Link>
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {product.category} · {SECTOR_LABELS[product.sector]}
            </p>
          </div>
        </div>
        <Button asChild variant="outline" className="mt-3 w-full">
          <Link href={`/products/${id}`}>Open the product record</Link>
        </Button>
      </div>
    </>
  );

  /* ------------------------------------ The page ------------------------------------ */

  return (
    <article className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Traceability record</h1>
        <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
          <Link href={`/products/${id}`} className={`text-foreground ${inlineLink}`}>
            {product.name}
          </Link>
          <span aria-hidden="true">·</span>
          <span>{SECTOR_LABELS[chain.sector]}</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono text-[13px]">{chain.id}</span>
          <span aria-hidden="true">·</span>
          <span>{steps.length} stages on record</span>
        </p>
        <p className="mt-4 max-w-[72ch] text-sm leading-relaxed">{chain.summary}</p>
      </header>

      <ChainRecord sector={chain.sector} stages={stages} aside={aside} />
    </article>
  );
}
