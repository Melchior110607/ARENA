import Link from "next/link";

import { ConnectButton, InterestButton } from "@/components/arena/actions";
import { AddressRail } from "@/components/arena/address-rail";
import { MaterialSwatch } from "@/components/arena/material-swatch";
import { Monogram } from "@/components/arena/monogram";
import { daysUntil, todayIso } from "@/components/arena/registry";
import { Badge } from "@/components/ui/badge";
import {
  CHAIN_POSITION_LABELS,
  COMPANY_TYPE_LABELS,
  NOTICE_KIND_LABELS,
  type Company,
  type Notice,
  type Product,
} from "@/lib/types";

/**
 * One notice as a register row. The feed borrows the *anatomy* of a social
 * feed — author header, content, actions — and none of its look: rows under
 * hairline rules, evidence drawn as SVG, the address rail in the margin
 * column where a catalogue prints its routing codes.
 *
 * On large screens the address column stands to the right of every row, so a
 * reader can run one eye down the page and see exactly which notices strike
 * their station. That single scan is the argument for a sector feed.
 */

export function NoticeRow({
  notice,
  author,
  product,
  viewer,
  reasons,
}: {
  notice: Notice;
  author: Company | undefined;
  /** Resolved for offers; null when the product is unknown. */
  product?: Product | null;
  viewer: Company;
  /** "For you" only — why the ranking put this notice on the viewer's floor. */
  reasons?: string[];
}) {
  const own = notice.author_id === viewer.id;
  const interested = notice.interested_by.includes(viewer.id);
  const interestCount = notice.interested_by.length;
  const deadlineDays = notice.deadline ? daysUntil(notice.deadline, todayIso()) : null;

  return (
    <li className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-4 border-b py-6 sm:gap-x-5 lg:grid-cols-[auto_minmax(0,1fr)_230px] lg:gap-x-10">
      <Monogram logo={author?.logo ?? { monogram: "?", tone: 0 }} size={40} className="mt-0.5" />

      {/* ------------------------------- main column ------------------------------- */}
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
          {author ? (
            <Link
              href={`/companies/${author.id}`}
              className="rounded-sm font-medium underline-offset-4 outline-none hover:text-primary hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              {author.name}
            </Link>
          ) : (
            <span className="font-medium">{notice.author_id}</span>
          )}
          {author && (
            <span className="text-sm text-muted-foreground">
              {COMPANY_TYPE_LABELS[author.type]} ·{" "}
              {CHAIN_POSITION_LABELS[author.chain_position]} stage · {author.city},{" "}
              {author.country_name}
            </span>
          )}
          {own && (
            <span className="arena-data text-muted-foreground">Your notice</span>
          )}
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <Badge variant="outline">{NOTICE_KIND_LABELS[notice.kind]}</Badge>
          <Link
            href={`/floor/${notice.id}`}
            className="rounded-sm text-base leading-snug font-medium underline-offset-4 outline-none hover:text-primary hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            {notice.title}
          </Link>
        </div>

        {notice.body && (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {notice.body}
          </p>
        )}

        {/* ------------------------------ evidence ------------------------------ */}
        {notice.kind === "offer" && product && (
          <div className="mt-3 flex items-center gap-3">
            <div className="h-14 w-[74px] shrink-0">
              <MaterialSwatch visual={product.visual} />
            </div>
            <div className="min-w-0">
              <Link
                href={`/products/${product.id}`}
                className="rounded-sm text-sm font-medium underline-offset-4 outline-none hover:text-primary hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                {product.name}
              </Link>
              <p className="text-xs text-muted-foreground">
                {product.category} · {product.material}
              </p>
              <p className="arena-data mt-0.5 text-muted-foreground">
                MOQ {product.moq} · Lead {product.lead_time}
              </p>
            </div>
          </div>
        )}

        {notice.kind === "need" && (
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
            {notice.region && (
              <span className="arena-data text-muted-foreground">
                Region <span className="text-foreground">{notice.region}</span>
              </span>
            )}
            {notice.deadline && (
              <span className="arena-data text-muted-foreground">
                Closes <span className="text-foreground">{notice.deadline}</span>
                {deadlineDays !== null &&
                  (deadlineDays >= 0 ? ` · ${deadlineDays} days` : " · passed")}
              </span>
            )}
            {notice.skills.map((skill) => (
              <Badge key={skill} variant="outline">
                {skill}
              </Badge>
            ))}
          </div>
        )}

        {/* ------------------------------- actions ------------------------------- */}
        <div className="mt-4 flex flex-wrap items-start gap-x-4 gap-y-2">
          {own ? (
            <p className="text-sm text-muted-foreground">
              {interestCount === 0
                ? "No interest registered yet."
                : `Interest registered by ${interestCount} ${interestCount === 1 ? "company" : "companies"}.`}
            </p>
          ) : (
            <>
              <InterestButton
                noticeId={notice.id}
                asCompanyId={viewer.id}
                interested={interested}
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
            </>
          )}
          <Link
            href={`/floor/${notice.id}`}
            className="rounded-sm py-1 text-sm text-muted-foreground underline-offset-4 outline-none hover:text-primary hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            Open the notice →
          </Link>
        </div>
      </div>

      {/* --------------------------- address column --------------------------- */}
      <div className="col-start-2 lg:col-start-3 lg:row-start-1 lg:border-l lg:pl-6">
        <p className="arena-data text-muted-foreground">Posted {notice.posted_at}</p>
        <AddressRail
          addressedTo={notice.addressed_to}
          readerType={viewer.type}
          className="mt-2"
        />
        {reasons && reasons.length > 0 && (
          <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
            <span className="arena-data">Reached you</span>
            <br />
            {reasons.join(" · ")}
          </p>
        )}
      </div>
    </li>
  );
}
