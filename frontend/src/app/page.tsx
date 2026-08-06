import Link from "next/link";

import { getCompanies, getOpportunities, getProducts } from "@/lib/api";
import { COMPANY_TYPE_LABELS } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [companies, products, opportunities] = await Promise.all([
    getCompanies(),
    getProducts(),
    getOpportunities(),
  ]);

  const recommended = companies.filter((c) => c.type !== "brand").slice(0, 4);

  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">
          The B2B network where brands and suppliers discover each other
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Present your capabilities, find the partners who can actually make what you need, and
          publish value chains that hold up to scrutiny.
        </p>
        <Link href="/companies" className="inline-block underline">
          Explore companies →
        </Link>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-medium">Recommended suppliers</h2>
        <ul className="space-y-1">
          {recommended.map((company) => (
            <li key={company.id}>
              <Link href={`/companies/${company.id}`} className="underline">
                {company.name}
              </Link>{" "}
              <span className="text-sm text-muted-foreground">
                {COMPANY_TYPE_LABELS[company.type]} · {company.city}, {company.country_name}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-medium">Featured products</h2>
        <ul className="space-y-1">
          {products.slice(0, 5).map((product) => (
            <li key={product.id}>
              <Link href={`/products/${product.id}`} className="underline">
                {product.name}
              </Link>{" "}
              <span className="text-sm text-muted-foreground">
                {product.category} · {product.material}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-medium">Open opportunities</h2>
        <ul className="space-y-1">
          {opportunities.slice(0, 4).map((opportunity) => (
            <li key={opportunity.id}>
              <Link href="/opportunities" className="underline">
                {opportunity.title}
              </Link>{" "}
              <span className="text-sm text-muted-foreground">{opportunity.region}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-medium">How Arena works</h2>
        <ol className="list-inside list-decimal space-y-1 text-muted-foreground">
          <li>Every company publishes what it can actually make, at what volume.</li>
          <li>Brands filter by capability, material and position in the chain.</li>
          <li>Connections and conversations happen between companies, not intermediaries.</li>
          <li>Products carry the chain that produced them, stage by stage.</li>
        </ol>
      </section>
    </div>
  );
}
