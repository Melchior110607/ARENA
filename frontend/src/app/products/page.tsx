import Link from "next/link";

import { getCompanies, getFacets, getProducts } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const one = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const [products, companies, facets] = await Promise.all([
    getProducts({
      category: one("category"),
      material: one("material"),
      country: one("country"),
      supplier: one("supplier"),
      certification: one("certification"),
      sector: one("sector"),
      q: one("q"),
    }),
    getCompanies(),
    getFacets(),
  ]);

  const nameOf = new Map(companies.map((company) => [company.id, company.name]));

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
        <p className="text-sm text-muted-foreground">{products.length} products</p>
      </header>

      <section className="space-y-2 text-sm">
        <p className="font-medium">Filters</p>
        <div className="flex flex-wrap gap-2">
          <Link href="/products" className="underline">
            All
          </Link>
          {facets.product_categories.map((facet) => (
            <Link
              key={facet.value}
              href={`/products?category=${encodeURIComponent(facet.value)}`}
              className="underline"
            >
              {facet.label} ({facet.count})
            </Link>
          ))}
        </div>
      </section>

      <ul className="space-y-4">
        {products.map((product) => (
          <li key={product.id} className="border-b pb-4">
            <Link href={`/products/${product.id}`} className="text-lg underline">
              {product.name}
            </Link>
            <p className="text-sm text-muted-foreground">
              {product.category} · {product.material} · {product.country_name} ·{" "}
              {nameOf.get(product.supplier_id) ?? product.supplier_id}
            </p>
            <p className="mt-1 max-w-2xl text-sm">{product.description}</p>
            {product.certifications.length > 0 && (
              <p className="mt-1 text-sm text-muted-foreground">
                {product.certifications.join(" · ")}
              </p>
            )}
          </li>
        ))}
      </ul>

      {products.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No product matches these filters.{" "}
          <Link href="/products" className="underline">
            Clear them
          </Link>
          .
        </p>
      )}
    </div>
  );
}
