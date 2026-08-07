import Link from "next/link";
import { ChevronDown } from "lucide-react";

import { ChainRail } from "@/components/arena/chain-rail";
import {
  FacetRail,
  FilterStamps,
  SearchField,
  filterHref,
  type FacetGroupSpec,
} from "@/components/arena/facet-rail";
import { Monogram } from "@/components/arena/monogram";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCompanies, getFacets } from "@/lib/api";
import {
  CHAIN_POSITION_LABELS,
  CHAIN_POSITION_ORDER,
  COMPANY_TYPE_LABELS,
  SECTOR_LABELS,
  type ChainPosition,
  type Company,
} from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata = { title: "Company directory — Arena" };

/** Query params this register understands — all real filters on the API. */
const FILTER_PARAMS = [
  "chain_position",
  "sector",
  "type",
  "country",
  "product_type",
  "material",
  "certification",
  "q",
] as const;

const BASE = "/companies";

function CompanyRow({ company }: { company: Company }) {
  const types = company.capabilities.product_types;

  return (
    <li className="relative grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 border-b py-3.5 transition-colors hover:bg-muted/50">
      <Monogram logo={company.logo} size={44} className="mt-0.5" />
      <div>
        <div className="flex items-baseline justify-between gap-4">
          <Link
            href={`/companies/${company.id}`}
            className="rounded-sm font-medium underline-offset-4 outline-none transition-colors after:absolute after:inset-0 hover:text-primary hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            {company.name}
          </Link>
          <span className="arena-data hidden shrink-0 text-muted-foreground sm:block">
            Est. {company.founded}
          </span>
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {COMPANY_TYPE_LABELS[company.type]} · {SECTOR_LABELS[company.sector]} —{" "}
          {company.subsector} · {company.city}, {company.country_name}
        </p>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{company.tagline}</p>
        {types.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {types.slice(0, 3).map((type) => (
              <Badge key={type} variant="outline">
                {type}
              </Badge>
            ))}
            {types.length > 3 && <Badge variant="outline">+{types.length - 3}</Badge>}
          </div>
        )}
      </div>
    </li>
  );
}

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const one = (key: string) => {
    const value = params[key];
    const first = Array.isArray(value) ? value[0] : value;
    return first?.trim() ? first : undefined;
  };

  const current: Record<string, string> = {};
  for (const key of FILTER_PARAMS) {
    const value = one(key);
    if (value) current[key] = value;
  }

  const activeStage = CHAIN_POSITION_ORDER.includes(current.chain_position as ChainPosition)
    ? (current.chain_position as ChainPosition)
    : undefined;

  const [companies, stageBaseOrNull, facets] = await Promise.all([
    getCompanies(current),
    // The rail counts answer "who stands at each stage under my other
    // filters?" — so they come from the same query minus the stage itself.
    activeStage ? getCompanies({ ...current, chain_position: undefined }) : null,
    getFacets(),
  ]);
  const stageBase = stageBaseOrNull ?? companies;

  const stageCounts = Object.fromEntries(
    CHAIN_POSITION_ORDER.map((position) => [position, 0])
  ) as Record<ChainPosition, number>;
  for (const company of stageBase) stageCounts[company.chain_position] += 1;

  const railHrefs = Object.fromEntries(
    CHAIN_POSITION_ORDER.map((position) => [
      position,
      filterHref(BASE, current, "chain_position", activeStage === position ? null : position),
    ])
  ) as Record<ChainPosition, string>;

  const groups: FacetGroupSpec[] = [
    { param: "sector", label: "Sector", values: facets.sectors },
    { param: "type", label: "Company type", values: facets.company_types },
    { param: "country", label: "Country", values: facets.countries },
    { param: "product_type", label: "Product type", values: facets.product_types, collapsed: true },
    { param: "material", label: "Material", values: facets.materials, collapsed: true },
    {
      param: "certification",
      label: "Certification",
      values: facets.certifications,
      collapsed: true,
    },
  ];

  const labelFor = (param: string, value: string): string => {
    if (param === "q") return `“${value}”`;
    if (param === "chain_position")
      return CHAIN_POSITION_LABELS[value as ChainPosition] ?? value;
    const group = groups.find((g) => g.param === param);
    return group?.values.find((v) => v.value === value)?.label ?? value;
  };
  const stamps = Object.entries(current).map(([param, value]) => ({
    param,
    label: labelFor(param, value),
  }));

  const total = facets.company_types.reduce((sum, facet) => sum + facet.count, 0);

  // The register reads the way Arena thinks: upstream to downstream.
  const sorted = [...companies].sort(
    (a, b) =>
      CHAIN_POSITION_ORDER.indexOf(a.chain_position) -
        CHAIN_POSITION_ORDER.indexOf(b.chain_position) || a.name.localeCompare(b.name)
  );
  const stageGroups = activeStage
    ? [{ position: activeStage, rows: sorted }]
    : CHAIN_POSITION_ORDER.map((position) => ({
        position,
        rows: sorted.filter((company) => company.chain_position === position),
      })).filter((group) => group.rows.length > 0);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Companies</h1>
      </header>

      <ChainRail counts={stageCounts} active={activeStage} hrefFor={railHrefs} />

      <div className="lg:grid lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-10">
        <div>
          <SearchField
            id="companies-search"
            basePath={BASE}
            current={current}
            placeholder="Search the register"
          />

          {/* Mobile: the facet index folds away. Desktop: always in view. */}
          <details className="group/refine mt-4 border-y py-2.5 lg:hidden">
            <summary className="arena-data flex cursor-pointer list-none items-center justify-between gap-2 rounded-sm text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
              <span>
                Refine
                {stamps.length > 0 ? <span className="text-primary"> · {stamps.length}</span> : null}
              </span>
              <ChevronDown
                aria-hidden="true"
                className="size-3.5 shrink-0 transition-transform group-open/refine:rotate-180"
              />
            </summary>
            <div className="pt-3">
              <FacetRail basePath={BASE} current={current} groups={groups} />
            </div>
          </details>
          <aside
            aria-label="Filters"
            className="mt-5 hidden lg:sticky lg:top-6 lg:block lg:max-h-[calc(100dvh-3rem)] lg:overflow-y-auto"
          >
            <FacetRail basePath={BASE} current={current} groups={groups} />
          </aside>
        </div>

        <div className="mt-6 lg:mt-0">
          <FilterStamps basePath={BASE} current={current} stamps={stamps} />
          <p className={stamps.length > 0 ? "arena-data mt-3 text-muted-foreground" : "arena-data text-muted-foreground"}>
            {stamps.length > 0
              ? `${companies.length} of ${total} companies match`
              : `${total} companies listed`}
          </p>

          {companies.length > 0 ? (
            <div className="mt-2">
              {stageGroups.map((group) => (
                <section key={group.position} aria-label={CHAIN_POSITION_LABELS[group.position]}>
                  <div className="flex items-baseline justify-between border-b border-foreground/25 pt-4 pb-1 first-of-type:pt-0">
                    <h2 className="arena-data text-muted-foreground">
                      {CHAIN_POSITION_LABELS[group.position]}
                    </h2>
                    <span className="arena-data text-muted-foreground">
                      {group.rows.length}
                      <span className="sr-only">
                        {group.rows.length === 1 ? " company" : " companies"}
                      </span>
                    </span>
                  </div>
                  <ul>
                    {group.rows.map((company) => (
                      <CompanyRow key={company.id} company={company} />
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          ) : (
            <div className="mt-2 border-t border-foreground/25 pt-6">
              <p className="font-medium">No company matches this combination.</p>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Widen the search — remove one of the stamps above, or clear every filter and
                start from the full register.
              </p>
              <Button asChild variant="outline" className="mt-4">
                <Link href={BASE}>Clear all filters</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
