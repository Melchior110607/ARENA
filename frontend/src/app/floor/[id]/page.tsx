import Link from "next/link";
import { notFound } from "next/navigation";

import { ConnectButton, InterestButton } from "@/components/arena/actions";
import { AddressRail } from "@/components/arena/address-rail";
import { ChainLocator } from "@/components/arena/chain-locator";
import { MaterialSwatch } from "@/components/arena/material-swatch";
import { Monogram } from "@/components/arena/monogram";
import { daysUntil, todayIso } from "@/components/arena/registry";
import { Badge } from "@/components/ui/badge";
import { ApiError, getCompanies, getNotice, getProduct } from "@/lib/api";
import { getPersonaId } from "@/lib/persona.server";
import { isVisitor } from "@/lib/persona";
import {
  COMPANY_TYPE_LABELS,
  NOTICE_KIND_LABELS,
  SECTOR_LABELS,
} from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * One notice on its own page — the filed record a connection request or a
 * conversation points at. Same grammar as the floor row, given room: the
 * address strip becomes a plate of its own, the evidence gets its full size,
 * and the interest register names the companies that answered.
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

  const [personaId, companies, productDetail] = await Promise.all([
    getPersonaId(),
    getCompanies(),
    notice.product_id ? getProduct(notice.product_id).catch(() => null) : null,
  ]);

  const companyById = new Map(companies.map((company) => [company.id, company]));
  const author = companyById.get(notice.author_id);
  const viewer = isVisitor(personaId) ? undefined : companyById.get(personaId);
  const own = viewer !== undefined && viewer.id === notice.author_id;
  const interestedCompanies = notice.interested_by
    .map((companyId) => companyById.get(companyId))
    .filter((company) => company !== undefined);
  const deadlineDays = notice.deadline ? daysUntil(notice.deadline, todayIso()) : null;

  return (
    <article className="max-w-3xl">
      <Link
        href="/"
        className="rounded-sm text-sm text-muted-foreground underline-offset-4 outline-none hover:text-primary hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        ← The floor
      </Link>

      <header className="mt-5">
        <h1 className="text-[2rem] leading-[1.15] font-semibold tracking-[-0.01em] text-balance">
          {notice.title}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <Badge variant="outline">{NOTICE_KIND_LABELS[notice.kind]}</Badge>
          {notice.sector && <Badge variant="outline">{SECTOR_LABELS[notice.sector]}</Badge>}
          <span className="arena-data text-muted-foreground">
            Posted {notice.posted_at}
          </span>
        </div>
      </header>

      {author && (
        <div className="mt-6 flex flex-wrap items-start justify-between gap-x-8 gap-y-4">
          <div className="flex items-start gap-3">
            <Monogram logo={author.logo} size={48} />
            <div>
              <Link
                href={`/companies/${author.id}`}
                className="rounded-sm font-medium underline-offset-4 outline-none hover:text-primary hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                {author.name}
              </Link>
              <p className="text-sm text-muted-foreground">
                {COMPANY_TYPE_LABELS[author.type]} · {author.subsector}
              </p>
              <p className="text-sm text-muted-foreground">
                {author.city}, {author.country_name}
              </p>
            </div>
          </div>
          <ChainLocator position={author.chain_position} sector={author.sector} />
        </div>
      )}

      {/* The address plate — who this notice speaks to, and whether that is you. */}
      <div className="mt-6 border-y py-4">
        <AddressRail addressedTo={notice.addressed_to} readerType={viewer?.type} />
      </div>

      {notice.body && (
        <p className="mt-6 max-w-2xl text-sm leading-relaxed">{notice.body}</p>
      )}

      {/* ------------------------------- evidence ------------------------------- */}
      {notice.kind === "offer" && productDetail && (
        <figure className="mt-8 grid gap-x-8 gap-y-4 sm:grid-cols-[240px_1fr]">
          <div className="aspect-[4/3]">
            <MaterialSwatch visual={productDetail.product.visual} />
          </div>
          <div>
            <Link
              href={`/products/${productDetail.product.id}`}
              className="rounded-sm text-base font-medium underline-offset-4 outline-none hover:text-primary hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              {productDetail.product.name}
            </Link>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {productDetail.product.category} · {productDetail.product.material} ·{" "}
              {productDetail.product.country_name}
            </p>
            <dl className="mt-3 max-w-xs space-y-1.5 border-t pt-3">
              <div className="flex justify-between gap-4">
                <dt className="arena-data text-muted-foreground">MOQ</dt>
                <dd className="text-right font-mono text-sm">
                  {productDetail.product.moq}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="arena-data text-muted-foreground">Lead time</dt>
                <dd className="text-right font-mono text-sm">
                  {productDetail.product.lead_time}
                </dd>
              </div>
            </dl>
            {productDetail.has_traceability && (
              <Link
                href={`/products/${productDetail.product.id}/traceability`}
                className="mt-3 inline-block rounded-sm text-sm font-medium text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                Read the traceability record →
              </Link>
            )}
          </div>
        </figure>
      )}

      {notice.kind === "need" && (
        <dl className="mt-8 grid max-w-2xl grid-cols-[9rem_1fr] gap-x-6 gap-y-2 text-sm">
          <dt className="arena-data pt-0.5 text-muted-foreground">Region</dt>
          <dd>{notice.region ?? "Any region"}</dd>
          {notice.skills.length > 0 && (
            <>
              <dt className="arena-data pt-1 text-muted-foreground">Capabilities</dt>
              <dd className="flex flex-wrap gap-1.5">
                {notice.skills.map((skill) => (
                  <Badge key={skill} variant="outline">
                    {skill}
                  </Badge>
                ))}
              </dd>
            </>
          )}
          {notice.deadline && (
            <>
              <dt className="arena-data pt-0.5 text-muted-foreground">Closes</dt>
              <dd className="font-mono text-[13px]">
                {notice.deadline}
                {deadlineDays !== null &&
                  (deadlineDays >= 0 ? ` · ${deadlineDays} days remaining` : " · passed")}
              </dd>
            </>
          )}
        </dl>
      )}

      {/* --------------------------- interest register --------------------------- */}
      <div className="mt-10 border-t pt-4">
        <p className="arena-data text-muted-foreground">
          Interest registered · {notice.interested_by.length}
        </p>
        {interestedCompanies.length > 0 && (
          <ul className="mt-2 space-y-1">
            {interestedCompanies.map((company) => (
              <li key={company.id} className="flex items-center gap-2 text-sm">
                <Monogram logo={company.logo} size={20} />
                <Link
                  href={`/companies/${company.id}`}
                  className="rounded-sm underline-offset-4 outline-none hover:text-primary hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  {company.name}
                </Link>
                <span className="text-muted-foreground">
                  {COMPANY_TYPE_LABELS[company.type]}
                </span>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-5">
          {viewer === undefined ? (
            <p className="max-w-xl text-sm text-muted-foreground">
              You are reading the floor signed out. Sign in as a member company from
              the masthead to express interest or open a connection.
            </p>
          ) : own ? (
            <p className="text-sm text-muted-foreground">
              Your notice — the companies above answered it.
            </p>
          ) : (
            <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
              <InterestButton
                noticeId={notice.id}
                asCompanyId={viewer.id}
                interested={notice.interested_by.includes(viewer.id)}
              />
              {author && (
                <ConnectButton
                  fromId={viewer.id}
                  toId={author.id}
                  companyName={author.name}
                  label="Connect"
                  context={{ type: "notice", id: notice.id, label: notice.title }}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
