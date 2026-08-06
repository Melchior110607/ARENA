import Link from "next/link";
import { notFound } from "next/navigation";

import { ApiError, getCompany, getNotice, getProduct } from "@/lib/api";
import { COMPANY_TYPE_LABELS, NOTICE_KIND_LABELS } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * One notice, on its own page — what a connection request or a conversation
 * points at when it says which notice it came from.
 *
 * PLACEHOLDER: scaffolding. The design agent owns this surface.
 */
export default async function NoticePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let notice;
  try {
    notice = await getNotice(id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const [author, product] = await Promise.all([
    getCompany(notice.author_id).catch(() => null),
    notice.product_id ? getProduct(notice.product_id).catch(() => null) : null,
  ]);

  return (
    <article className="max-w-2xl space-y-6">
      <header className="space-y-2">
        <p className="text-sm text-muted-foreground">
          {NOTICE_KIND_LABELS[notice.kind]} · posted {notice.posted_at}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">{notice.title}</h1>
        {author && (
          <p className="text-sm text-muted-foreground">
            <Link href={`/companies/${author.company.id}`} className="underline">
              {author.company.name}
            </Link>{" "}
            — {COMPANY_TYPE_LABELS[author.company.type]} · {author.company.city},{" "}
            {author.company.country_name}
          </p>
        )}
      </header>

      <p>{notice.body}</p>

      <dl className="grid grid-cols-[10rem_1fr] gap-x-6 gap-y-1 text-sm">
        <dt className="text-muted-foreground">Addressed to</dt>
        <dd>
          {notice.addressed_to.length > 0
            ? notice.addressed_to.map((type) => COMPANY_TYPE_LABELS[type]).join(" · ")
            : "Everyone"}
        </dd>
        {notice.region && (
          <>
            <dt className="text-muted-foreground">Region</dt>
            <dd>{notice.region}</dd>
          </>
        )}
        {notice.skills.length > 0 && (
          <>
            <dt className="text-muted-foreground">Capabilities sought</dt>
            <dd>{notice.skills.join(" · ")}</dd>
          </>
        )}
        {notice.deadline && (
          <>
            <dt className="text-muted-foreground">Closes</dt>
            <dd>{notice.deadline}</dd>
          </>
        )}
        {product && (
          <>
            <dt className="text-muted-foreground">Product</dt>
            <dd>
              <Link href={`/products/${product.product.id}`} className="underline">
                {product.product.name}
              </Link>
            </dd>
          </>
        )}
      </dl>

      <Link href="/" className="inline-block text-sm underline">
        ← Back to the floor
      </Link>
    </article>
  );
}
