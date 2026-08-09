import Link from "next/link";
import { ChevronDown } from "lucide-react";

import {
  FacetRail,
  FilterStamps,
  SearchField,
  type FacetGroupSpec,
} from "@/components/arena/facet-rail";
import { MaterialSwatch } from "@/components/arena/material-swatch";
import { Monogram } from "@/components/arena/monogram";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCompanies, getFacets, getProducts } from "@/lib/api";
import type { Company, Product } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata = { title: "Product catalogue — Arena" };

/** Query params this catalogue understands — all real filters on the API. */
const FILTER_PARAMS = ["category", "material", "country", "supplier", "certification", "q"] as const;

const BASE = "/products";

function ProductPlate({ product, supplier }: { product: Product; supplier?: Company }) {
  const certs = product.certifications;

  return (
    <article className="group/plate relative">
      <div className="aspect-[4/3]">
        <MaterialSwatch visual={product.visual} />
      </div>
      <div className="mt-2 flex items-baseline justify-between gap-3 border-b pb-1.5">
        <span className="arena-data truncate text-muted-foreground">{product.material}</span>
        <span className="arena-data shrink-0 text-muted-foreground">{product.country_name}</span>
      </div>
      <h3 className="mt-2 leading-snug font-medium">
        <Link
          href={`/products/${product.id}`}
          className="rounded-sm underline-offset-4 outline-none transition-colors after:absolute after:inset-0 hover:text-primary hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          {product.name}
        </Link>
      </h3>
      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
      {supplier && (
        <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
          <Monogram logo={supplier.logo} size={20} />
          <span className="truncate">{supplier.name}</span>
        </p>
      )}
      {(certs.length > 0 || product.traceability_chain) && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {product.traceability_chain && <Badge variant="outline">Chain published</Badge>}
          {certs.slice(0, 2).map((cert) => (
            <Badge key={cert} variant="outline">
              {cert}
            </Badge>
          ))}
          {certs.length > 2 && <Badge variant="outline">+{certs.length - 2}</Badge>}
        </div>
      )}
    </article>
  );
}

export default async function ProductsPage({
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

  const [products, companies, facets] = await Promise.all([
    getProducts(current),
    getCompanies(),
    getFacets(),
  ]);

  const companyById = new Map(companies.map((company) => [company.id, company]));

  const groups: FacetGroupSpec[] = [
    { param: "category", label: "Category", values: facets.product_categories },
    { param: "country", label: "Country of production", values: facets.product_countries },
    { param: "material", label: "Material", values: facets.product_materials, collapsed: true },
    { param: "supplier", label: "Supplier", values: facets.suppliers, collapsed: true },
    {
      param: "certification",
      label: "Certification",
      values: facets.product_certifications,
      collapsed: true,
    },
  ];

  const labelFor = (param: string, value: string): string => {
    if (param === "q") return `“${value}”`;
    const group = groups.find((g) => g.param === param);
    return group?.values.find((v) => v.value === value)?.label ?? value;
  };
  const stamps = Object.entries(current).map(([param, value]) => ({
    param,
    label: labelFor(param, value),
  }));

  const total = facets.product_categories.reduce((sum, facet) => sum + facet.count, 0);

  // The catalogue reads in sections, one per category — the same structural
  // logic as the directory's chain-stage grouping, applied to this data.
  const sorted = [...products].sort(
    (a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name)
  );
  const categoryGroups: { category: string; rows: Product[] }[] = [];
  for (const product of sorted) {
    const group = categoryGroups.at(-1);
    if (group && group.category === product.category) group.rows.push(product);
    else categoryGroups.push({ category: product.category, rows: [product] });
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-[2rem] leading-[1.15] font-semibold tracking-[-0.01em]">Products</h1>
      </header>

      <div className="lg:grid lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-10">
        <div>
          <SearchField
            id="products-search"
            basePath={BASE}
            current={current}
            placeholder="Search the catalogue"
          />

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
              ? `${products.length} of ${total} articles match`
              : `${total} articles listed`}
          </p>

          {products.length > 0 ? (
            <div className="mt-2 space-y-10">
              {categoryGroups.map((group) => (
                <section key={group.category} aria-label={group.category}>
                  <div className="flex items-baseline justify-between border-b border-foreground/25 pb-1">
                    <h2 className="arena-data text-muted-foreground">{group.category}</h2>
                    <span className="arena-data text-muted-foreground">
                      {group.rows.length}
                      <span className="sr-only">
                        {group.rows.length === 1 ? " article" : " articles"}
                      </span>
                    </span>
                  </div>
                  <div className="mt-4 grid gap-x-6 gap-y-8 sm:grid-cols-2 xl:grid-cols-3">
                    {group.rows.map((product) => (
                      <ProductPlate
                        key={product.id}
                        product={product}
                        supplier={companyById.get(product.supplier_id)}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="mt-2 border-t border-foreground/25 pt-6">
              <p className="font-medium">No article matches this combination.</p>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Widen the search — remove one of the stamps above, or clear every filter and
                leaf through the full catalogue.
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
