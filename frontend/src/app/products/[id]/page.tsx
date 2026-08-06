import Link from "next/link";
import { notFound } from "next/navigation";

import { ApiError, getProduct } from "@/lib/api";

export const dynamic = "force-dynamic";

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

  return (
    <div className="max-w-3xl space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">{product.name}</h1>
        <p className="text-sm text-muted-foreground">
          {product.category} · {product.material} · {product.country_name}
        </p>
        <p>{product.description}</p>
      </header>

      <section className="space-y-2">
        <h2 className="font-medium">Specifications</h2>
        <dl className="grid grid-cols-[14rem_1fr] gap-x-6 gap-y-1 text-sm">
          {product.specs.map((spec) => (
            <div key={spec.label} className="contents">
              <dt className="text-muted-foreground">{spec.label}</dt>
              <dd>{spec.value}</dd>
            </div>
          ))}
          <dt className="text-muted-foreground">Materials</dt>
          <dd>{product.materials.join(" · ")}</dd>
          <dt className="text-muted-foreground">Processes</dt>
          <dd>{product.processes.join(" · ")}</dd>
          <dt className="text-muted-foreground">Applications</dt>
          <dd>{product.applications.join(" · ")}</dd>
          <dt className="text-muted-foreground">Minimum order</dt>
          <dd>{product.moq}</dd>
          <dt className="text-muted-foreground">Lead time</dt>
          <dd>{product.lead_time}</dd>
          <dt className="text-muted-foreground">Certifications</dt>
          <dd>{product.certifications.join(" · ") || "—"}</dd>
          <dt className="text-muted-foreground">Customization</dt>
          <dd>{product.customization.join(" · ") || "—"}</dd>
        </dl>
      </section>

      <section className="space-y-2">
        <h2 className="font-medium">Supplier</h2>
        <p className="text-sm">
          <Link href={`/companies/${supplier.id}`} className="underline">
            {supplier.name}
          </Link>{" "}
          <span className="text-muted-foreground">
            — {supplier.city}, {supplier.country_name}
          </span>
        </p>
      </section>

      <section className="flex gap-4 text-sm">
        <Link href={`/companies/${supplier.id}`} className="underline">
          View supplier profile
        </Link>
        {has_traceability ? (
          <Link href={`/products/${product.id}/traceability`} className="underline">
            View traceability chain
          </Link>
        ) : (
          <span className="text-muted-foreground">No traceability chain published</span>
        )}
      </section>
    </div>
  );
}
