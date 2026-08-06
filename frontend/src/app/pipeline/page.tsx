import Link from "next/link";

import { StatusSelect } from "@/components/arena/actions";
import { getCompanies, getRelationships } from "@/lib/api";
import { getPersonaId } from "@/lib/persona.server";
import { RELATIONSHIP_STATUS_LABELS, RELATIONSHIP_STATUS_ORDER } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  const personaId = await getPersonaId();
  const [relationships, companies] = await Promise.all([
    getRelationships(personaId),
    getCompanies(),
  ]);
  const nameOf = new Map(companies.map((company) => [company.id, company.name]));

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Pipeline</h1>
        <p className="text-sm text-muted-foreground">
          How {nameOf.get(personaId) ?? personaId} tracks its relationships.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-3 xl:grid-cols-6">
        {RELATIONSHIP_STATUS_ORDER.map((status) => {
          const cards = relationships.filter((item) => item.status === status);
          return (
            <section key={status} className="space-y-3">
              <h2 className="text-sm font-medium">
                {RELATIONSHIP_STATUS_LABELS[status]}{" "}
                <span className="text-muted-foreground">({cards.length})</span>
              </h2>
              <ul className="space-y-3">
                {cards.map((item) => (
                  <li key={item.id} className="space-y-1 border p-2 text-sm">
                    <Link href={`/companies/${item.company_id}`} className="underline">
                      {nameOf.get(item.company_id) ?? item.company_id}
                    </Link>
                    <p className="text-xs text-muted-foreground">Since {item.status_since}</p>
                    <p className="text-xs">{item.note}</p>
                    <StatusSelect relationshipId={item.id} status={item.status} />
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
