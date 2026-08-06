import Link from "next/link";

import { StatusStepper } from "@/components/arena/actions";
import { Monogram } from "@/components/arena/monogram";
import { daysBetween, pad2, todayIso } from "@/components/arena/registry";
import { getCompanies, getRelationships } from "@/lib/api";
import { getPersonaId } from "@/lib/persona.server";
import {
  COMPANY_TYPE_LABELS,
  RELATIONSHIP_STATUS_LABELS,
  RELATIONSHIP_STATUS_ORDER,
} from "@/lib/types";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

/** A record that has not moved in this many days is information in itself. */
const HELD_AFTER_DAYS = 60;

export default async function PipelinePage() {
  const personaId = await getPersonaId();
  const [relationships, companies] = await Promise.all([
    getRelationships(personaId),
    getCompanies(),
  ]);

  const byId = new Map(companies.map((company) => [company.id, company]));
  const personaName = byId.get(personaId)?.name ?? personaId;
  const today = todayIso();

  const daysInStage = (statusSince: string) => daysBetween(statusSince, today);
  const held = relationships.filter(
    (r) => daysInStage(r.status_since) >= HELD_AFTER_DAYS,
  ).length;

  return (
    <div className="space-y-8">
      <header className="max-w-3xl space-y-3">
        <h1 className="text-[2rem] leading-[1.15] font-semibold tracking-[-0.01em]">
          Pipeline
        </h1>
        <p className="max-w-[65ch] text-sm leading-relaxed text-muted-foreground">
          How {personaName} moves counterparties from first sighting to active partner.
          The stepper on each card moves the record between stages; the longest-held
          records surface first, because a relationship that has stopped moving is
          information.
        </p>
        <p className="arena-data text-muted-foreground">
          {relationships.length} {relationships.length === 1 ? "record" : "records"} ·{" "}
          {held} held over {HELD_AFTER_DAYS} d
        </p>
      </header>

      {relationships.length === 0 ? (
        <div className="max-w-xl rounded-md bg-card p-5 ring-1 ring-foreground/10">
          <p className="text-base font-medium">Nothing tracked yet.</p>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            Records file here from the rest of the register: sending a request in{" "}
            <Link
              href="/connections"
              className="rounded-sm text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              Connections
            </Link>{" "}
            files a counterparty at Contacted, accepting one advances it to Connected —
            or track any company directly from its record in the{" "}
            <Link
              href="/companies"
              className="rounded-sm text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              directory
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
          {RELATIONSHIP_STATUS_ORDER.map((status, stageIndex) => {
            const records = relationships
              .filter((relationship) => relationship.status === status)
              .sort((a, b) =>
                a.status_since < b.status_since
                  ? -1
                  : a.status_since > b.status_since
                    ? 1
                    : 0,
              );
            const headingId = `stage-${status}`;
            return (
              <section key={status} aria-labelledby={headingId}>
                <div className="border-b border-foreground/25 pb-2">
                  <h2
                    id={headingId}
                    className="flex items-baseline justify-between gap-2"
                  >
                    <span className="flex items-baseline gap-2">
                      <span className="arena-data text-muted-foreground">
                        {pad2(stageIndex + 1)}
                      </span>
                      <span className="text-sm leading-tight font-semibold">
                        {RELATIONSHIP_STATUS_LABELS[status]}
                      </span>
                    </span>
                    <span className="arena-data text-muted-foreground">
                      {records.length}
                      <span className="sr-only">
                        {" "}
                        {records.length === 1 ? "record" : "records"} at this stage
                      </span>
                    </span>
                  </h2>
                </div>

                <ul className="mt-3 space-y-3">
                  {records.map((relationship) => {
                    const company = byId.get(relationship.company_id);
                    const days = daysInStage(relationship.status_since);
                    const stalled = days >= HELD_AFTER_DAYS;
                    return (
                      <li
                        key={relationship.id}
                        className="rounded-xl bg-card p-3 ring-1 ring-foreground/10"
                      >
                        <div className="flex items-start gap-2.5">
                          {company && (
                            <Monogram logo={company.logo} size={28} className="mt-0.5" />
                          )}
                          <div className="min-w-0">
                            <p className="text-sm leading-snug font-medium">
                              <Link
                                href={`/companies/${relationship.company_id}`}
                                className="rounded-sm underline-offset-4 transition-colors outline-none hover:text-primary hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
                              >
                                {company?.name ?? relationship.company_id}
                              </Link>
                            </p>
                            {company && (
                              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                {COMPANY_TYPE_LABELS[company.type]} · {company.country}
                              </p>
                            )}
                          </div>
                        </div>

                        {relationship.note && (
                          <p
                            title={relationship.note}
                            className="mt-2 line-clamp-3 text-xs leading-relaxed text-muted-foreground"
                          >
                            {relationship.note}
                          </p>
                        )}

                        <div className="mt-2.5 space-y-0.5">
                          <p className="arena-data flex justify-between gap-2 text-muted-foreground">
                            <span>in stage</span>
                            <span
                              className={cn(
                                stalled && "font-medium text-foreground",
                              )}
                            >
                              {days} d{stalled && " — held"}
                            </span>
                          </p>
                          <p className="arena-data flex justify-between gap-2 text-muted-foreground">
                            <span>since</span>
                            <span>{relationship.status_since}</span>
                          </p>
                          <p className="arena-data flex justify-between gap-2 text-muted-foreground">
                            <span>first seen</span>
                            <span>{relationship.first_seen}</span>
                          </p>
                        </div>

                        <StatusStepper
                          relationshipId={relationship.id}
                          status={relationship.status}
                          companyName={company?.name ?? relationship.company_id}
                          className="mt-3 border-t pt-2.5"
                        />
                      </li>
                    );
                  })}
                </ul>

                {records.length === 0 && (
                  <p className="arena-data mt-3 text-muted-foreground">— none held —</p>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
