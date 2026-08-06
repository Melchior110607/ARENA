import Link from "next/link";

import { FloorComposer } from "@/components/arena/floor-composer";
import { NoticeRow } from "@/components/arena/notice-row";
import { PublicLanding } from "@/components/arena/public-landing";
import { getCompanies, getFeed, getProducts } from "@/lib/api";
import { getPersonaId } from "@/lib/persona.server";
import { isVisitor } from "@/lib/persona";
import {
  CHAIN_POSITION_ORDER,
  SECTOR_LABELS,
  type Company,
  type Notice,
} from "@/lib/types";
import { pluralTypeLabel } from "@/components/arena/address-rail";

export const dynamic = "force-dynamic";

/**
 * The root does one of two things.
 *
 * Signed out, it is the public page — the argument for joining. Signed in, it
 * is the floor: the notices posted by connected companies (and the acting
 * company itself), then everything else ranked by how strongly it addresses
 * the reader. The ranking is deliberately explainable — the same signals the
 * backend scores are printed on each notice, so "For you" is a claim the
 * reader can audit, not a black box.
 */

/** Why a notice reached this reader — mirrors `_notice_score` in the backend. */
function reachedYou(notice: Notice, author: Company | undefined, me: Company): string[] {
  const reasons: string[] = [];
  if (notice.addressed_to.length === 0) {
    reasons.push("open to every company type");
  } else if (notice.addressed_to.includes(me.type)) {
    reasons.push(`addressed to ${pluralTypeLabel(me.type).toLowerCase()}`);
  }
  if (notice.sector && notice.sector !== me.sector) {
    reasons.push(`outside your sector (${SECTOR_LABELS[notice.sector].toLowerCase()})`);
  }
  if (author) {
    const distance =
      CHAIN_POSITION_ORDER.indexOf(me.chain_position) -
      CHAIN_POSITION_ORDER.indexOf(author.chain_position);
    if (distance > 0) reasons.push("posted from upstream of you");
    const shared = author.capabilities.materials.filter((material) =>
      me.capabilities.materials.includes(material)
    );
    if (shared.length > 0) reasons.push(`shared material: ${shared[0].toLowerCase()}`);
  }
  if (reasons.length === 0) reasons.push("the rest of the floor");
  return reasons;
}

export default async function RootPage() {
  const personaId = await getPersonaId();

  if (isVisitor(personaId)) return <PublicLanding />;

  const [feed, companies, products] = await Promise.all([
    getFeed(personaId),
    getCompanies(),
    getProducts(),
  ]);

  const companyById = new Map(companies.map((company) => [company.id, company]));
  const productById = new Map(products.map((product) => [product.id, product]));
  const me = companyById.get(personaId);

  // A stale cookie naming a company that no longer exists reads as signed out.
  if (!me) return <PublicLanding />;

  const ownProducts = products.filter((product) => product.supplier_id === me.id);
  const noticeCount = feed.from_connections.length + feed.for_you.length;

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h1 className="text-2xl leading-tight font-semibold tracking-tight">The Floor</h1>
        <p className="arena-data text-muted-foreground">
          {noticeCount} notices · viewing as {me.name}
        </p>
      </div>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Needs and offers posted to the register. Every notice is addressed to the
        company types that can answer it — the rail beside each one shows whether
        that includes you.
      </p>

      <div className="mt-6">
        <FloorComposer author={me} products={ownProducts} />
      </div>

      {/* ------------------------- From your connections ------------------------- */}
      <section aria-labelledby="connections-heading" className="mt-12">
        <div className="flex items-baseline justify-between gap-4 border-b border-foreground/25 pb-2">
          <h2 id="connections-heading" className="text-xl leading-tight font-semibold">
            From your connections
          </h2>
          <p className="arena-data text-muted-foreground">
            {feed.from_connections.length}{" "}
            {feed.from_connections.length === 1 ? "notice" : "notices"}
          </p>
        </div>
        {feed.from_connections.length === 0 ? (
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Nothing here yet — none of your connected companies has posted, and your
            own notices would file here first. Find counterparties in the{" "}
            <Link
              href="/companies"
              className="underline underline-offset-4 hover:text-primary"
            >
              directory
            </Link>
            , or open{" "}
            <Link
              href="/connections"
              className="underline underline-offset-4 hover:text-primary"
            >
              connections
            </Link>{" "}
            for suggested counterparties.
          </p>
        ) : (
          <ul>
            {feed.from_connections.map((notice) => (
              <NoticeRow
                key={notice.id}
                notice={notice}
                author={companyById.get(notice.author_id)}
                product={notice.product_id ? productById.get(notice.product_id) ?? null : null}
                viewer={me}
              />
            ))}
          </ul>
        )}
      </section>

      {/* --------------------------------- For you --------------------------------- */}
      <section aria-labelledby="for-you-heading" className="mt-12">
        <div className="flex items-baseline justify-between gap-4 border-b border-foreground/25 pb-2">
          <h2 id="for-you-heading" className="text-xl leading-tight font-semibold">
            For you
          </h2>
          <p className="arena-data text-muted-foreground">
            {feed.for_you.length} {feed.for_you.length === 1 ? "notice" : "notices"}
          </p>
        </div>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          The rest of the floor, ranked by how strongly each notice addresses{" "}
          {me.name} — the reason is printed on every one.
        </p>
        {feed.for_you.length === 0 ? (
          <p className="mt-4 max-w-xl text-sm text-muted-foreground">
            The rest of the floor is empty — every live notice is already in your
            register above.
          </p>
        ) : (
          <ul className="mt-1">
            {feed.for_you.map((notice) => {
              const author = companyById.get(notice.author_id);
              return (
                <NoticeRow
                  key={notice.id}
                  notice={notice}
                  author={author}
                  product={
                    notice.product_id ? productById.get(notice.product_id) ?? null : null
                  }
                  viewer={me}
                  reasons={reachedYou(notice, author, me)}
                />
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
