import Link from "next/link";
import { redirect } from "next/navigation";

import { ConnectButton, RespondButtons } from "@/components/arena/actions";
import { ChainLocator } from "@/components/arena/chain-locator";
import { CONTEXT_KIND, ContextGlyph, contextHref } from "@/components/arena/context-glyph";
import { MaterialSwatch } from "@/components/arena/material-swatch";
import { Monogram } from "@/components/arena/monogram";
import { pad2 } from "@/components/arena/registry";
import { getCompanies, getConnections, getProducts } from "@/lib/api";
import { requireCompanyId } from "@/lib/persona.server";
import { CHAIN_POSITION_LABELS, COMPANY_TYPE_LABELS } from "@/lib/types";
import type { Company, Connection, ConnectionContext, Product } from "@/lib/types";

export const dynamic = "force-dynamic";

function metaOf(company: Company): string {
  return `${COMPANY_TYPE_LABELS[company.type]} · ${CHAIN_POSITION_LABELS[company.chain_position]} · ${company.country_name}`;
}

function CompanyLink({ company }: { company: Company }) {
  return (
    <Link
      href={`/companies/${company.id}`}
      className="rounded-sm font-medium underline-offset-4 transition-colors outline-none hover:text-primary hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      {company.name}
    </Link>
  );
}

function EmptyLine({ children }: { children: React.ReactNode }) {
  return <p className="border-b py-4 text-sm text-muted-foreground">{children}</p>;
}

/**
 * What the request is about, drawn: an article shows its material swatch, a
 * company its nameplate, a notice its posted-sheet glyph. The label is a live
 * link into the record — the origin of a request is a place you can go.
 */
function RequestObject({
  context,
  product,
  contextCompany,
  compact = false,
}: {
  context: ConnectionContext | null;
  product: Product | undefined;
  contextCompany: Company | undefined;
  /** One-line form for the compact rows of the connected register. */
  compact?: boolean;
}) {
  if (!context) return null;

  const evidence =
    context.type === "product" && product ? (
      <span className={compact ? "h-6 w-8 shrink-0" : "h-8 w-[42px] shrink-0"}>
        <MaterialSwatch visual={product.visual} />
      </span>
    ) : context.type === "company" && contextCompany ? (
      <Monogram logo={contextCompany.logo} size={compact ? 20 : 26} />
    ) : (
      <span className="text-muted-foreground">
        <ContextGlyph type={context.type} size={compact ? 15 : 18} />
      </span>
    );

  return (
    <p className="flex min-w-0 items-center gap-2.5">
      <span className="arena-data shrink-0 text-muted-foreground">Re</span>
      {evidence}
      <span className="min-w-0 leading-tight">
        <Link
          href={contextHref(context.type, context.id)}
          className="rounded-sm text-sm font-medium underline-offset-4 transition-colors outline-none hover:text-primary hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          {context.label}
        </Link>
        {!compact && (
          <span className="block text-xs text-muted-foreground">
            {CONTEXT_KIND[context.type]}
          </span>
        )}
      </span>
    </p>
  );
}

export default async function ConnectionsPage() {
  const personaId = await requireCompanyId();
  // Signed out: this surface belongs to a company, so send the reader to the public page.
  if (personaId === null) redirect("/");
  const [view, companies, products] = await Promise.all([
    getConnections(personaId),
    getCompanies({ as: personaId }),
    getProducts(),
  ]);

  const byId = new Map(companies.map((company) => [company.id, company]));
  const productById = new Map(products.map((product) => [product.id, product]));
  const persona = byId.get(personaId);
  const personaName = persona?.name ?? personaId;

  const counterpartOf = (connection: Connection) =>
    connection.from_id === personaId ? connection.to_id : connection.from_id;

  const objectOf = (connection: Connection) => ({
    context: connection.context,
    product:
      connection.context?.type === "product"
        ? productById.get(connection.context.id)
        : undefined,
    contextCompany:
      connection.context?.type === "company"
        ? byId.get(connection.context.id)
        : undefined,
  });

  const byDateDesc = (a: string, b: string) => (a < b ? 1 : a > b ? -1 : 0);
  const incoming = [...view.incoming].sort((a, b) => byDateDesc(a.created_at, b.created_at));
  const outgoing = [...view.outgoing].sort((a, b) => byDateDesc(a.created_at, b.created_at));
  const accepted = [...view.accepted].sort((a, b) =>
    byDateDesc(a.responded_at ?? a.created_at, b.responded_at ?? b.created_at),
  );
  const suggestions = view.suggestions
    .map((id) => byId.get(id))
    .filter((company): company is Company => company !== undefined);

  return (
    <div className="space-y-10">
      <header className="max-w-3xl space-y-3">
        <h1 className="text-[2rem] leading-[1.15] font-semibold tracking-[-0.01em]">
          Connections
        </h1>
        <p className="arena-data text-muted-foreground">
          {view.incoming.length} received · {view.outgoing.length} sent ·{" "}
          {view.accepted.length} connected · {suggestions.length} suggested
        </p>
      </header>

      <div className="grid gap-x-14 gap-y-12 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-12">
          {/* ------------------- Requests received ------------------- */}
          <section aria-labelledby="incoming-heading">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h2 id="incoming-heading" className="text-xl leading-tight font-semibold">
                Requests received
              </h2>
              <span className="arena-data text-muted-foreground">
                {incoming.length} awaiting your decision
              </span>
            </div>
            <ul className="mt-3 border-t border-foreground/25">
              {incoming.map((connection) => {
                const company = byId.get(counterpartOf(connection));
                if (!company) return null;
                return (
                  <li key={connection.id} className="border-b py-5">
                    <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3.5">
                      <Monogram logo={company.logo} size={36} className="mt-0.5" />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
                          <CompanyLink company={company} />
                          <span className="arena-data text-muted-foreground">
                            received {connection.created_at}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[13px] text-muted-foreground">
                          {metaOf(company)}
                        </p>
                        <div className="mt-3">
                          <RequestObject {...objectOf(connection)} />
                        </div>
                        {connection.message && (
                          <p className="mt-2.5 max-w-[65ch] border-l border-border pl-3 text-sm leading-relaxed">
                            {connection.message}
                          </p>
                        )}
                        <div className="mt-3">
                          <RespondButtons
                            connectionId={connection.id}
                            companyName={company.name}
                          />
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            {incoming.length === 0 && <EmptyLine>Nothing awaiting decision.</EmptyLine>}
          </section>

          {/* --------------------- Requests sent --------------------- */}
          <section aria-labelledby="outgoing-heading">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h2 id="outgoing-heading" className="text-xl leading-tight font-semibold">
                Requests sent
              </h2>
              <span className="arena-data text-muted-foreground">
                {outgoing.length} open
              </span>
            </div>
            <ul className="mt-3 border-t border-foreground/25">
              {outgoing.map((connection) => {
                const company = byId.get(counterpartOf(connection));
                if (!company) return null;
                return (
                  <li key={connection.id} className="border-b py-4">
                    <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3.5">
                      <Monogram logo={company.logo} size={32} className="mt-0.5" />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
                          <CompanyLink company={company} />
                          <span className="arena-data text-muted-foreground">
                            sent {connection.created_at} · awaiting response
                          </span>
                        </div>
                        <p className="mt-0.5 text-[13px] text-muted-foreground">
                          {metaOf(company)}
                        </p>
                        <div className="mt-2.5">
                          <RequestObject {...objectOf(connection)} />
                        </div>
                        {connection.message && (
                          <p className="mt-2 line-clamp-2 max-w-[65ch] text-sm leading-relaxed text-muted-foreground">
                            {connection.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            {outgoing.length === 0 && <EmptyLine>No open requests.</EmptyLine>}
          </section>

          {/* ----------------------- Connected ------------------------ */}
          <section aria-labelledby="accepted-heading">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h2 id="accepted-heading" className="text-xl leading-tight font-semibold">
                Connected
              </h2>
              <span className="arena-data text-muted-foreground">
                {accepted.length} in the register
              </span>
            </div>
            <ul className="mt-3 border-t border-foreground/25">
              {accepted.map((connection) => {
                const company = byId.get(counterpartOf(connection));
                if (!company) return null;
                return (
                  <li key={connection.id} className="border-b py-3.5">
                    <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3.5">
                      <Monogram logo={company.logo} size={32} className="mt-0.5" />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
                          <CompanyLink company={company} />
                          <span className="arena-data text-muted-foreground">
                            connected {connection.responded_at ?? connection.created_at}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[13px] text-muted-foreground">
                          {metaOf(company)}
                        </p>
                        {(connection.context || connection.conversation_id) && (
                          <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                            <RequestObject {...objectOf(connection)} compact />
                            {connection.conversation_id && (
                              <Link
                                href={`/messages?thread=${connection.conversation_id}`}
                                className="rounded-sm text-sm text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
                              >
                                Open the thread →
                              </Link>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            {accepted.length === 0 && (
              <EmptyLine>
                No connections yet — start from the suggestions or the{" "}
                <Link
                  href="/companies"
                  className="rounded-sm text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  directory
                </Link>
                .
              </EmptyLine>
            )}
          </section>
        </div>

        {/* ------------------ Suggested counterparties ------------------ */}
        <aside aria-labelledby="suggestions-heading">
          <h2 id="suggestions-heading" className="text-xl leading-tight font-semibold">
            Suggested counterparties
          </h2>
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
            Ranked by how well each company completes {personaName}&rsquo;s chain.
            Connect opens a request that carries the company record and your note.
          </p>
          <ol className="mt-3 border-t border-foreground/25">
            {suggestions.map((company, index) => {
              return (
                <li key={company.id} className="border-b py-4">
                  <div className="grid grid-cols-[auto_auto_minmax(0,1fr)] gap-x-3">
                    <span className="arena-data pt-2 text-muted-foreground">
                      {pad2(index + 1)}
                    </span>
                    <Monogram logo={company.logo} size={32} className="mt-0.5" />
                    <div className="min-w-0">
                      <CompanyLink company={company} />
                      <p className="mt-0.5 text-[13px] text-muted-foreground">
                        {COMPANY_TYPE_LABELS[company.type]} · {company.country_name}
                      </p>
                      <ChainLocator
                        position={company.chain_position}
                        sector={company.sector}
                        className="mt-2.5"
                      />
                      <div className="mt-3">
                        <ConnectButton
                          fromId={personaId}
                          toId={company.id}
                          companyName={company.name}
                          context={{
                            type: "company",
                            id: company.id,
                            label: company.name,
                          }}
                          objectLogo={company.logo}
                        />
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
          {suggestions.length === 0 && (
            <EmptyLine>No suggestions — the chain is covered.</EmptyLine>
          )}
        </aside>
      </div>
    </div>
  );
}
