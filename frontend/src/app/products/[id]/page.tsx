import { Fragment } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { MaterialSwatch } from "@/components/arena/material-swatch";
import { Monogram } from "@/components/arena/monogram";
import { SpecSheet, SpecValue, specList, type SpecRow } from "@/components/arena/spec-sheet";
import { StatusSeal } from "@/components/arena/status-seal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ApiError, getProduct, getTraceability } from "@/lib/api";
import {
  COMPANY_TYPE_LABELS,
  SECTOR_LABELS,
  TRACEABILITY_STATUS_LABELS,
  TRACEABILITY_STATUS_ORDER,
  type TraceabilityChain,
} from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * The manifest: the traceability chain previewed as its row of inspection
 * stamps, upstream to downstream — the promise this product makes, shown
 * before it is opened.
 */
function TraceabilityManifest({ chain, productId }: { chain: TraceabilityChain; productId: string }) {
  const statusCounts = TRACEABILITY_STATUS_ORDER.map((status) => ({
    status,
    count: chain.steps.filter((step) => step.status === status).length,
  })).filter((entry) => entry.count > 0);

  return (
    <section
      aria-labelledby="traceability-heading"
      className="rounded-xl bg-card p-5 ring-1 ring-foreground/10"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="traceability-heading" className="text-xl leading-tight font-semibold">
          Traceability
        </h2>
        <span className="arena-data text-muted-foreground">
          {chain.steps.length} stages on record
        </span>
      </div>
      <p className="mt-2 max-w-[70ch] text-sm text-muted-foreground">{chain.summary}</p>

      <ol
        aria-label="Chain stages, upstream to downstream"
        className="mt-4 flex flex-wrap items-center gap-y-2"
      >
        {chain.steps.map((step, index) => (
          <Fragment key={step.order}>
            {index > 0 && (
              <li aria-hidden="true" className="relative mx-1.5 h-px w-5 bg-border">
                <span className="absolute -top-[2.5px] right-0 size-[5px] rotate-45 border-t border-r border-border" />
              </li>
            )}
            <li
              className="flex items-center gap-1.5"
              title={`Stage ${step.order}: ${step.role} — ${TRACEABILITY_STATUS_LABELS[step.status]}`}
            >
              <span className="arena-data text-muted-foreground">{step.order}</span>
              <StatusSeal status={step.status} size={18} />
              <span className="sr-only">
                {step.role}, {TRACEABILITY_STATUS_LABELS[step.status]}
              </span>
            </li>
          </Fragment>
        ))}
      </ol>

      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5">
        {statusCounts.map((entry) => (
          <span key={entry.status} className="flex items-baseline gap-1.5">
            <StatusSeal status={entry.status} showLabel className="self-center" />
            <span className="arena-data text-muted-foreground">× {entry.count}</span>
          </span>
        ))}
      </div>

      <Button asChild className="mt-5">
        <Link href={`/products/${productId}/traceability`}>Open the traceability record</Link>
      </Button>
    </section>
  );
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let detail;
  try {
    detail = await getProduct(id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const { product, supplier, has_traceability } = detail;
  // A missing chain record degrades the manifest to the honest empty plate.
  const chain = has_traceability ? await getTraceability(id).catch(() => null) : null;

  const specRows: SpecRow[] = [
    ...product.specs.map((spec) => ({
      label: spec.label,
      value: <SpecValue>{spec.value}</SpecValue>,
    })),
    { label: "Materials", value: specList(product.materials) },
    { label: "Processes", value: specList(product.processes) },
    { label: "Applications", value: specList(product.applications) },
    { label: "Customization", value: specList(product.customization) },
    {
      label: "Certifications",
      value:
        product.certifications.length > 0 ? (
          <span className="flex flex-wrap gap-1.5">
            {product.certifications.map((cert) => (
              <Badge key={cert} variant="outline">
                {cert}
              </Badge>
            ))}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
  ];

  return (
    <article className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{product.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {product.category} · {SECTOR_LABELS[product.sector]} · made in {product.country_name}
        </p>
      </header>

      <div className="grid gap-x-12 gap-y-8 lg:grid-cols-[340px_minmax(0,1fr)]">
        {/* ------------------------------- The plate ------------------------------- */}
        <div className="space-y-6">
          <figure>
            <div className="aspect-[4/3]">
              <MaterialSwatch visual={product.visual} />
            </div>
            <figcaption className="arena-data mt-2 flex items-baseline justify-between gap-3 text-muted-foreground">
              <span className="truncate">{product.material}</span>
              <span className="shrink-0">{product.country_name}</span>
            </figcaption>
          </figure>

          <dl className="border-t border-foreground/25">
            <div className="flex items-baseline justify-between gap-4 border-b py-2">
              <dt className="arena-data text-muted-foreground">Minimum order</dt>
              <dd className="text-right">
                <SpecValue>{product.moq}</SpecValue>
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 border-b py-2">
              <dt className="arena-data text-muted-foreground">Lead time</dt>
              <dd className="text-right">
                <SpecValue>{product.lead_time}</SpecValue>
              </dd>
            </div>
          </dl>

          <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
            <div className="flex items-center gap-3">
              <Monogram logo={supplier.logo} size={44} />
              <div className="min-w-0">
                <p className="truncate font-medium">
                  <Link
                    href={`/companies/${supplier.id}`}
                    className="rounded-sm underline-offset-4 outline-none transition-colors hover:text-primary hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  >
                    {supplier.name}
                  </Link>
                </p>
                <p className="truncate text-sm text-muted-foreground">
                  {COMPANY_TYPE_LABELS[supplier.type]} · {supplier.city}, {supplier.country_name}
                </p>
              </div>
            </div>
            <Button asChild variant="outline" className="mt-3 w-full">
              <Link href={`/companies/${supplier.id}`}>View supplier profile</Link>
            </Button>
          </div>
        </div>

        {/* ------------------------------- The record ------------------------------- */}
        <div className="space-y-8">
          <p className="max-w-[70ch] text-sm">{product.description}</p>

          {chain ? (
            <TraceabilityManifest chain={chain} productId={product.id} />
          ) : (
            <div className="rounded-xl border border-dashed border-input p-5">
              <p className="font-medium">No traceability chain published</p>
              <p className="mt-1 max-w-[60ch] text-sm text-muted-foreground">
                The production stages behind this article are not on record. When the supplier
                publishes them, each stage appears here with its grade of proof — declared,
                confirmed or verified.
              </p>
            </div>
          )}

          <section aria-labelledby="specs-heading">
            <h2 id="specs-heading" className="text-xl leading-tight font-semibold">
              Specifications
            </h2>
            <SpecSheet rows={specRows} className="mt-4" />
          </section>
        </div>
      </div>
    </article>
  );
}
