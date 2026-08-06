import Link from "next/link";
import { notFound } from "next/navigation";

import { ApiError, getCompanies, getProduct, getTraceability } from "@/lib/api";
import { TRACEABILITY_STATUS_LABELS } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function TraceabilityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let chain;
  let detail;
  try {
    [chain, detail] = await Promise.all([getTraceability(id), getProduct(id)]);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const companies = await getCompanies();
  const nameOf = new Map(companies.map((company) => [company.id, company.name]));

  return (
    <div className="max-w-3xl space-y-8">
      <header className="space-y-2">
        <p className="text-sm text-muted-foreground">
          <Link href={`/products/${id}`} className="underline">
            {detail.product.name}
          </Link>
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Traceability chain</h1>
        <p className="text-sm">{chain.summary}</p>
      </header>

      <ol className="space-y-4">
        {chain.steps.map((step) => (
          <li key={`${step.order}-${step.company_id}`} className="border-b pb-4">
            <p className="text-sm text-muted-foreground">Stage {step.order}</p>
            <p>
              <Link href={`/companies/${step.company_id}`} className="underline">
                {nameOf.get(step.company_id) ?? step.company_id}
              </Link>{" "}
              <span className="text-sm text-muted-foreground">
                — {step.role} · {step.country_name}
              </span>
            </p>
            <p className="text-sm">
              {step.material} — {step.process}
            </p>
            <p className="text-sm">
              Status: <strong>{TRACEABILITY_STATUS_LABELS[step.status]}</strong>
            </p>
            <p className="text-sm text-muted-foreground">{step.note}</p>
          </li>
        ))}
      </ol>

      <p className="text-sm text-muted-foreground">
        Statuses are fictional. Declared means stated by the company, confirmed means corroborated by
        the company upstream, verified means checked by a third party.
      </p>
    </div>
  );
}
