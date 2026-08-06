import Link from "next/link";

import { InterestButton } from "@/components/arena/actions";
import { Monogram } from "@/components/arena/monogram";
import { daysUntil, todayIso } from "@/components/arena/registry";
import { getCompanies, getOpportunities } from "@/lib/api";
import { getPersonaId } from "@/lib/persona.server";
import { COMPANY_TYPE_LABELS, SECTOR_LABELS } from "@/lib/types";
import type { Company, Opportunity } from "@/lib/types";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/* Reading a brief against the acting company's declared capability    */
/* ------------------------------------------------------------------ */

const STOP_WORDS = new Set([
  "and",
  "chain",
  "custody",
  "days",
  "delivery",
  "for",
  "from",
  "house",
  "into",
  "runs",
  "site",
  "small",
  "the",
  "under",
  "weeks",
  "with",
  "within",
]);

function capabilityHaystack(company: Company): string {
  const c = company.capabilities;
  return [
    ...c.product_types,
    ...c.materials,
    ...c.machines,
    ...c.processes,
    ...c.customization,
    ...c.certifications,
    company.subsector,
  ]
    .join(" · ")
    .toLowerCase();
}

/** Loose token match — honest about being a reading, not a verification. */
function skillCovered(skill: string, haystack: string): boolean {
  return skill
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 3 && !STOP_WORDS.has(token))
    .some((token) => haystack.includes(token));
}

/** A square coverage tick in plain ink — geometry, not hue. */
function CoverageMark({ covered }: { covered: boolean }) {
  return (
    <svg
      viewBox="0 0 14 14"
      width={14}
      height={14}
      aria-hidden="true"
      className={cn("mt-1 shrink-0", covered ? "text-foreground" : "text-muted-foreground")}
    >
      <rect
        x="1"
        y="1"
        width="12"
        height="12"
        rx="1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeOpacity={covered ? 1 : 0.5}
      />
      {covered && (
        <path
          d="M4 7.2l2 2 4-4.4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* The page                                                            */
/* ------------------------------------------------------------------ */

export default async function OpportunitiesPage() {
  const personaId = await getPersonaId();
  const [opportunities, companies] = await Promise.all([
    getOpportunities(),
    getCompanies(),
  ]);

  const byId = new Map(companies.map((company) => [company.id, company]));
  const persona = byId.get(personaId);
  const personaName = persona?.name ?? personaId;
  const haystack = persona ? capabilityHaystack(persona) : "";
  const today = todayIso();

  const remainingOf = (opportunity: Opportunity) => daysUntil(opportunity.deadline, today);
  const sorted = [...opportunities].sort((a, b) => {
    const ra = remainingOf(a);
    const rb = remainingOf(b);
    const closedA = ra < 0 ? 1 : 0;
    const closedB = rb < 0 ? 1 : 0;
    if (closedA !== closedB) return closedA - closedB;
    return a.deadline < b.deadline ? -1 : a.deadline > b.deadline ? 1 : 0;
  });

  const open = sorted.filter((o) => remainingOf(o) >= 0);
  const inSector = open.filter((o) => persona && o.sector === persona.sector);

  return (
    <div className="space-y-8">
      <header className="max-w-3xl space-y-3">
        <h1 className="text-[2rem] leading-[1.15] font-semibold tracking-[-0.01em]">
          Opportunities
        </h1>
        <p className="max-w-[65ch] text-sm leading-relaxed text-muted-foreground">
          Open briefs published by brands and suppliers, ordered by closing date. Each
          call is read against {personaName}&rsquo;s declared capability — a loose
          reading, not a verification.
        </p>
        <p className="arena-data text-muted-foreground">
          {open.length} open {open.length === 1 ? "brief" : "briefs"} · {inSector.length}{" "}
          in your sector
        </p>
      </header>

      <ul className="max-w-5xl border-t border-foreground/25">
        {sorted.map((opportunity) => {
          const issuer = byId.get(opportunity.company_id);
          const remaining = remainingOf(opportunity);
          const closed = remaining < 0;
          const own = opportunity.company_id === personaId;
          const sectorMatch = persona ? opportunity.sector === persona.sector : false;
          const regionServed = persona
            ? persona.regions_served.includes(opportunity.region)
            : false;
          const coverage = opportunity.skills.map((skill) => ({
            skill,
            covered: skillCovered(skill, haystack),
          }));
          const coveredCount = coverage.filter((entry) => entry.covered).length;

          return (
            <li key={opportunity.id} className="border-b py-6">
              <div className="grid gap-x-10 gap-y-4 lg:grid-cols-[10.5rem_minmax(0,1fr)]">
                {/* ------------------- The docket column ------------------- */}
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 lg:block lg:space-y-1.5">
                  <p className={cn("arena-data", closed ? "text-muted-foreground" : "text-foreground")}>
                    {closed ? `closed ${opportunity.deadline}` : `closes ${opportunity.deadline}`}
                  </p>
                  {!closed && (
                    <p
                      className={cn(
                        "arena-data",
                        remaining <= 14
                          ? "font-medium text-foreground"
                          : "text-muted-foreground",
                      )}
                    >
                      {remaining === 0 ? "closes today" : `${remaining} d remaining`}
                      {remaining > 0 && remaining <= 14 && " · soon"}
                    </p>
                  )}
                  <p className="arena-data text-muted-foreground">
                    posted {opportunity.posted_at}
                  </p>
                  <p className="arena-data text-muted-foreground">
                    {SECTOR_LABELS[opportunity.sector]} · {opportunity.region}
                  </p>
                </div>

                {/* --------------------- The call itself --------------------- */}
                <div className="min-w-0">
                  <h2 className="max-w-[40rem] text-lg leading-snug font-medium">
                    {opportunity.title}
                  </h2>
                  {issuer && (
                    <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                      <Monogram logo={issuer.logo} size={22} aria-hidden="true" />
                      <Link
                        href={`/companies/${issuer.id}`}
                        className="rounded-sm text-sm font-medium underline-offset-4 transition-colors outline-none hover:text-primary hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
                      >
                        {issuer.name}
                      </Link>
                      <span className="text-[13px] text-muted-foreground">
                        {COMPANY_TYPE_LABELS[issuer.type]} · {issuer.city},{" "}
                        {issuer.country_name}
                      </span>
                    </p>
                  )}
                  <p className="mt-2.5 max-w-[75ch] text-sm leading-relaxed">
                    {opportunity.description}
                  </p>

                  <ul className="mt-3.5 grid max-w-[52rem] gap-x-8 gap-y-1.5 sm:grid-cols-2">
                    {coverage.map(({ skill, covered }) => (
                      <li key={skill} className="flex items-start gap-2 text-sm">
                        {own ? (
                          <span
                            aria-hidden="true"
                            className="mt-2 size-1.5 shrink-0 rounded-[1px] bg-foreground/40"
                          />
                        ) : (
                          <CoverageMark covered={covered} />
                        )}
                        <span>{skill}</span>
                        {!own && (
                          <span className="sr-only">
                            {covered
                              ? "— matched in your declared capability"
                              : "— not found in your declared capability"}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>

                  {own ? (
                    <p className="arena-data mt-3.5 text-muted-foreground">
                      your brief · visible to every company on Arena
                    </p>
                  ) : (
                    <>
                      <p className="arena-data mt-3.5 text-muted-foreground">
                        skills {coveredCount}/{coverage.length} · region{" "}
                        {regionServed ? "served" : "not served"} ·{" "}
                        {sectorMatch ? "your sector" : "outside your sector"}
                      </p>
                      {!closed && (
                        <div className="mt-3.5">
                          <InterestButton
                            opportunityId={opportunity.id}
                            interested={opportunity.interested}
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {sorted.length === 0 && (
        <div className="max-w-xl rounded-md bg-card p-5 ring-1 ring-foreground/10">
          <p className="text-base font-medium">No briefs on the board.</p>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            Opportunities are published by brands and suppliers across both sectors.
            Check back after the next data load, or browse the{" "}
            <Link
              href="/companies"
              className="rounded-sm text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              directory
            </Link>{" "}
            directly.
          </p>
        </div>
      )}
    </div>
  );
}
