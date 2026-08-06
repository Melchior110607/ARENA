import Link from "next/link";

import { InterestButton } from "@/components/arena/actions";
import { getCompanies, getOpportunities } from "@/lib/api";
import { SECTOR_LABELS } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function OpportunitiesPage() {
  const [opportunities, companies] = await Promise.all([getOpportunities(), getCompanies()]);
  const nameOf = new Map(companies.map((company) => [company.id, company.name]));

  return (
    <div className="max-w-3xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Opportunities</h1>
        <p className="text-sm text-muted-foreground">
          Fictional needs published by brands and suppliers.
        </p>
      </header>

      <ul className="space-y-6">
        {opportunities.map((opportunity) => (
          <li key={opportunity.id} className="space-y-1 border-b pb-6">
            <h2 className="text-lg">{opportunity.title}</h2>
            <p className="text-sm text-muted-foreground">
              <Link href={`/companies/${opportunity.company_id}`} className="underline">
                {nameOf.get(opportunity.company_id) ?? opportunity.company_id}
              </Link>{" "}
              · {SECTOR_LABELS[opportunity.sector]} · {opportunity.region} · posted{" "}
              {opportunity.posted_at} · closes {opportunity.deadline}
            </p>
            <p className="text-sm">{opportunity.description}</p>
            <p className="text-sm text-muted-foreground">{opportunity.skills.join(" · ")}</p>
            <InterestButton
              opportunityId={opportunity.id}
              interested={opportunity.interested}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
