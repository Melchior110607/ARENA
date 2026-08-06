import Link from "next/link";

import { getCompanies, getFacets } from "@/lib/api";
import { CHAIN_POSITION_LABELS, COMPANY_TYPE_LABELS, SECTOR_LABELS } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const one = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const [companies, facets] = await Promise.all([
    getCompanies({
      type: one("type"),
      sector: one("sector"),
      country: one("country"),
      chain_position: one("chain_position"),
      product_type: one("product_type"),
      material: one("material"),
      certification: one("certification"),
      q: one("q"),
    }),
    getFacets(),
  ]);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Companies</h1>
        <p className="text-sm text-muted-foreground">
          {companies.length} of {facets.company_types.reduce((sum, f) => sum + f.count, 0)} companies
        </p>
      </header>

      <section className="space-y-2 text-sm">
        <p className="font-medium">Filters</p>
        <div className="flex flex-wrap gap-2">
          <Link href="/companies" className="underline">
            All
          </Link>
          {facets.company_types.map((facet) => (
            <Link key={facet.value} href={`/companies?type=${facet.value}`} className="underline">
              {facet.label} ({facet.count})
            </Link>
          ))}
          {facets.sectors.map((facet) => (
            <Link key={facet.value} href={`/companies?sector=${facet.value}`} className="underline">
              {facet.label} ({facet.count})
            </Link>
          ))}
        </div>
      </section>

      <ul className="space-y-4">
        {companies.map((company) => (
          <li key={company.id} className="border-b pb-4">
            <Link href={`/companies/${company.id}`} className="text-lg underline">
              {company.name}
            </Link>
            <p className="text-sm text-muted-foreground">
              {COMPANY_TYPE_LABELS[company.type]} · {SECTOR_LABELS[company.sector]} ·{" "}
              {CHAIN_POSITION_LABELS[company.chain_position]} · {company.city},{" "}
              {company.country_name}
            </p>
            <p className="mt-1 max-w-2xl text-sm">{company.tagline}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {company.capabilities.product_types.slice(0, 3).join(" · ")}
            </p>
          </li>
        ))}
      </ul>

      {companies.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No company matches these filters.{" "}
          <Link href="/companies" className="underline">
            Clear them
          </Link>
          .
        </p>
      )}
    </div>
  );
}
