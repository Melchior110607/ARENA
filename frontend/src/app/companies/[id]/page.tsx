import Link from "next/link";
import { notFound } from "next/navigation";

import { ApiError, getCompany } from "@/lib/api";
import { CHAIN_POSITION_LABELS, COMPANY_TYPE_LABELS, SECTOR_LABELS } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CompanyProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let detail;
  try {
    detail = await getCompany(id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const { company, products, network } = detail;
  const c = company.capabilities;

  return (
    <div className="max-w-3xl space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">{company.name}</h1>
        <p className="text-sm text-muted-foreground">
          {COMPANY_TYPE_LABELS[company.type]} · {SECTOR_LABELS[company.sector]} ·{" "}
          {company.subsector} · {CHAIN_POSITION_LABELS[company.chain_position]}
        </p>
        <p>{company.tagline}</p>
      </header>

      <section className="space-y-2">
        <h2 className="font-medium">General</h2>
        <p className="text-sm">{company.description}</p>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
          <dt className="text-muted-foreground">Founded</dt>
          <dd>{company.founded}</dd>
          <dt className="text-muted-foreground">Country</dt>
          <dd>
            {company.city}, {company.country_name}
          </dd>
          <dt className="text-muted-foreground">Regions served</dt>
          <dd>{company.regions_served.join(", ")}</dd>
          <dt className="text-muted-foreground">Employees</dt>
          <dd>{company.employees}</dd>
          <dt className="text-muted-foreground">Revenue range</dt>
          <dd>{company.revenue_range}</dd>
          <dt className="text-muted-foreground">Website</dt>
          <dd>{company.website}</dd>
        </dl>
      </section>

      <section className="space-y-2">
        <h2 className="font-medium">Positioning</h2>
        <dl className="space-y-1 text-sm">
          <dt className="text-muted-foreground">Mission</dt>
          <dd>{company.mission}</dd>
          <dt className="text-muted-foreground">Vision</dt>
          <dd>{company.vision}</dd>
          <dt className="text-muted-foreground">Goals</dt>
          <dd>
            <ul className="list-inside list-disc">
              {company.goals.map((goal) => (
                <li key={goal}>{goal}</li>
              ))}
            </ul>
          </dd>
          <dt className="text-muted-foreground">Partners sought</dt>
          <dd>{company.seeking.join(" · ")}</dd>
        </dl>
      </section>

      <section className="space-y-2">
        <h2 className="font-medium">Capabilities</h2>
        <dl className="grid grid-cols-[12rem_1fr] gap-x-6 gap-y-1 text-sm">
          <dt className="text-muted-foreground">Product types</dt>
          <dd>{c.product_types.join(" · ") || "—"}</dd>
          <dt className="text-muted-foreground">Materials</dt>
          <dd>{c.materials.join(" · ") || "—"}</dd>
          <dt className="text-muted-foreground">Machines</dt>
          <dd>{c.machines.join(" · ") || "—"}</dd>
          <dt className="text-muted-foreground">Processes</dt>
          <dd>{c.processes.join(" · ") || "—"}</dd>
          <dt className="text-muted-foreground">Production capacity</dt>
          <dd>{c.production_capacity}</dd>
          <dt className="text-muted-foreground">Customization</dt>
          <dd>{c.customization.join(" · ") || "—"}</dd>
          <dt className="text-muted-foreground">Minimum order</dt>
          <dd>{c.moq}</dd>
          <dt className="text-muted-foreground">Certifications</dt>
          <dd>{c.certifications.join(" · ") || "—"}</dd>
        </dl>
      </section>

      {products.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-medium">Products</h2>
          <ul className="space-y-1 text-sm">
            {products.map((product) => (
              <li key={product.id}>
                <Link href={`/products/${product.id}`} className="underline">
                  {product.name}
                </Link>{" "}
                <span className="text-muted-foreground">
                  {product.category} · {product.material}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-2">
        <h2 className="font-medium">Network</h2>
        <ul className="space-y-1 text-sm">
          {network.map((partner) => (
            <li key={partner.id}>
              <Link href={`/companies/${partner.id}`} className="underline">
                {partner.name}
              </Link>{" "}
              <span className="text-muted-foreground">
                {COMPANY_TYPE_LABELS[partner.type]} · {partner.country_name}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
