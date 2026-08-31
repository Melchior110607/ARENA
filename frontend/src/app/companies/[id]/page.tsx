import Link from "next/link";
import { notFound } from "next/navigation";

import { ConnectButton } from "@/components/arena/actions";
import { ChainLocator } from "@/components/arena/chain-locator";
import { ConnectionStanding, standingWith } from "@/components/arena/connection-standing";
import { MaterialSwatch } from "@/components/arena/material-swatch";
import { Monogram } from "@/components/arena/monogram";
import { SpecSheet, SpecValue, specList, type SpecRow } from "@/components/arena/spec-sheet";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ApiError, getCompany, getConnections } from "@/lib/api";
import { isVisitor } from "@/lib/persona";
import { getPersonaId } from "@/lib/persona.server";
import {
  CHAIN_POSITION_LABELS,
  COMPANY_TYPE_LABELS,
  SECTOR_LABELS,
} from "@/lib/types";

export const dynamic = "force-dynamic";

/** A fact of record in the side register: mono label, measured value. */
function FactRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b py-2">
      <dt className="arena-data shrink-0 text-muted-foreground">{label}</dt>
      <dd className="text-right text-sm">{value}</dd>
    </div>
  );
}

export default async function CompanyProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  /* Who is reading — needed up front so a confidential company's identity is
     resolved (or masked) correctly for this viewer, not the raw record. */
  const personaId = await getPersonaId();
  const signedOut = isVisitor(personaId);
  const viewerId = signedOut ? undefined : personaId;

  let detail;
  try {
    detail = await getCompany(id, viewerId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const { company, products, network } = detail;
  const c = company.capabilities;

  const ownRecord = !signedOut && personaId === company.id;
  const connectionsView =
    signedOut || ownRecord ? null : await getConnections(personaId).catch(() => null);
  const standing = signedOut ? null : standingWith(connectionsView, personaId, company.id);

  const capabilityRows: SpecRow[] = [
    { label: "Product types", value: specList(c.product_types) },
    { label: "Materials", value: specList(c.materials) },
    { label: "Machines", value: specList(c.machines) },
    { label: "Processes", value: specList(c.processes) },
    { label: "Production capacity", value: <SpecValue>{c.production_capacity}</SpecValue> },
    { label: "Customization", value: specList(c.customization) },
    { label: "Minimum order", value: <SpecValue>{c.moq}</SpecValue> },
    {
      label: "Certifications",
      value:
        c.certifications.length > 0 ? (
          <span className="flex flex-wrap gap-1.5">
            {c.certifications.map((cert) => (
              <Badge key={cert} variant="outline">
                {cert}
              </Badge>
            ))}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
  ];

  return (
    <article className="space-y-10">
      {/* ---------------------------------- Header ---------------------------------- */}
      <header className="flex flex-wrap items-start justify-between gap-x-12 gap-y-6">
        <div className="flex min-w-0 items-start gap-5">
          <Monogram logo={company.logo} size={72} className="mt-1" />
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight">{company.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {COMPANY_TYPE_LABELS[company.type]} · {SECTOR_LABELS[company.sector]} —{" "}
              {company.subsector} · {company.city}, {company.country_name}
            </p>
            <p className="mt-2 max-w-2xl text-base">{company.tagline}</p>

            {/* The act that makes a network a network — asking, from the record itself. */}
            <div className="mt-5">
              {signedOut ? (
                <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
                  You are reading this record signed out. Sign in as a member company
                  from the masthead to request a connection.
                </p>
              ) : ownRecord ? (
                <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
                  Your own record — this is how counterparties read {company.name}.
                </p>
              ) : standing ? (
                <ConnectionStanding
                  state={standing.state}
                  counterpartName={company.name}
                  date={standing.date}
                  threadId={standing.threadId}
                />
              ) : (
                <ConnectButton
                  fromId={personaId}
                  toId={company.id}
                  companyName={company.name}
                  label="Request connection"
                  context={{ type: "company", id: company.id, label: company.name }}
                  objectLogo={company.logo}
                />
              )}
            </div>
          </div>
        </div>
        <ChainLocator position={company.chain_position} sector={company.sector} />
      </header>

      {/* ---------------------------------- General ---------------------------------- */}
      <section aria-labelledby="general-heading" className="border-t border-foreground/25 pt-5">
        <h2 id="general-heading" className="text-xl leading-tight font-semibold">
          General
        </h2>
        <div className="mt-4 grid gap-x-12 gap-y-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <p className="max-w-[70ch] text-sm">{company.description}</p>
          <dl className="self-start border-t border-foreground/25">
            <FactRow label="Founded" value={<SpecValue>{company.founded}</SpecValue>} />
            <FactRow label="Country" value={`${company.city}, ${company.country_name}`} />
            <FactRow label="Regions served" value={company.regions_served.join(", ")} />
            <FactRow label="Employees" value={<SpecValue>{company.employees}</SpecValue>} />
            <FactRow label="Revenue range" value={<SpecValue>{company.revenue_range}</SpecValue>} />
            <FactRow label="Website" value={<SpecValue>{company.website}</SpecValue>} />
          </dl>
        </div>
      </section>

      {/* -------------------------------- Positioning -------------------------------- */}
      <section
        aria-labelledby="positioning-heading"
        className="border-t border-foreground/25 pt-5"
      >
        <h2 id="positioning-heading" className="text-xl leading-tight font-semibold">
          Positioning
        </h2>
        <div className="mt-4 grid gap-x-12 gap-y-6 lg:grid-cols-2">
          <div className="space-y-5">
            <div>
              <h3 className="arena-data text-muted-foreground">Mission</h3>
              <p className="mt-1.5 max-w-[70ch] text-sm">{company.mission}</p>
            </div>
            <div>
              <h3 className="arena-data text-muted-foreground">Vision</h3>
              <p className="mt-1.5 max-w-[70ch] text-sm">{company.vision}</p>
            </div>
          </div>
          <div className="space-y-5">
            <div>
              <h3 className="arena-data text-muted-foreground">Goals</h3>
              <ul className="mt-1.5 space-y-1.5">
                {company.goals.map((goal) => (
                  <li key={goal} className="flex gap-2.5 text-sm">
                    <span
                      aria-hidden="true"
                      className="mt-[7px] size-1.5 shrink-0 rounded-[1px] bg-muted-foreground"
                    />
                    {goal}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="arena-data text-muted-foreground">Partners sought</h3>
              <ul className="mt-1.5 space-y-1.5">
                {company.seeking.map((partner) => (
                  <li key={partner} className="flex gap-2.5 text-sm">
                    <span
                      aria-hidden="true"
                      className="mt-[7px] size-1.5 shrink-0 rounded-[1px] border border-input"
                    />
                    {partner}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------- Capabilities -------------------------------- */}
      <section
        aria-labelledby="capabilities-heading"
        className="border-t border-foreground/25 pt-5"
      >
        <h2 id="capabilities-heading" className="text-xl leading-tight font-semibold">
          Capabilities
        </h2>
        <SpecSheet rows={capabilityRows} className="mt-4" />
      </section>

      {/* ---------------------------------- Products ---------------------------------- */}
      <section aria-labelledby="products-heading" className="border-t border-foreground/25 pt-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="products-heading" className="text-xl leading-tight font-semibold">
            Products
          </h2>
          <span className="arena-data text-muted-foreground">
            {products.length} {products.length === 1 ? "article" : "articles"}
          </span>
        </div>
        {products.length > 0 ? (
          <div className="mt-4">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Article</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead className="text-right">MOQ</TableHead>
                  <TableHead className="text-right">Lead time</TableHead>
                  <TableHead>Chain</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-12 shrink-0">
                          <MaterialSwatch visual={product.visual} framed={false} />
                        </div>
                        <Link
                          href={`/products/${product.id}`}
                          className="rounded-sm font-medium underline-offset-4 outline-none transition-colors hover:text-primary hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        >
                          {product.name}
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{product.category}</TableCell>
                    <TableCell className="text-muted-foreground">{product.material}</TableCell>
                    <TableCell className="text-right font-mono text-[13px]">
                      {product.moq}
                    </TableCell>
                    <TableCell className="text-right font-mono text-[13px]">
                      {product.lead_time}
                    </TableCell>
                    <TableCell>
                      {product.traceability_chain ? (
                        <Link
                          href={`/products/${product.id}/traceability`}
                          className="arena-data rounded-sm text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        >
                          Published
                        </Link>
                      ) : (
                        <span className="arena-data text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            No articles published yet. Products appear here once the company records them.
          </p>
        )}
      </section>

      {/* ---------------------------------- Network ---------------------------------- */}
      <section aria-labelledby="network-heading" className="border-t border-foreground/25 pt-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="network-heading" className="text-xl leading-tight font-semibold">
            Network
          </h2>
          <span className="arena-data text-muted-foreground">
            {network.length} connected {network.length === 1 ? "company" : "companies"}
          </span>
        </div>
        {network.length > 0 ? (
          <ul className="mt-2">
            {network.map((partner) => (
              <li
                key={partner.id}
                className="relative grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 border-b py-3 transition-colors hover:bg-muted/50"
              >
                <Monogram logo={partner.logo} size={36} />
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
                  <div className="min-w-0">
                    <Link
                      href={`/companies/${partner.id}`}
                      className="rounded-sm font-medium underline-offset-4 outline-none transition-colors after:absolute after:inset-0 hover:text-primary hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    >
                      {partner.name}
                    </Link>
                    <span className="ml-3 text-sm text-muted-foreground">
                      {COMPANY_TYPE_LABELS[partner.type]} · {partner.city}, {partner.country_name}
                    </span>
                  </div>
                  <span className="arena-data hidden text-muted-foreground sm:block">
                    {CHAIN_POSITION_LABELS[partner.chain_position]}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            No connections on record. The companies this one works with appear here once a
            connection is accepted.
          </p>
        )}
      </section>
    </article>
  );
}
