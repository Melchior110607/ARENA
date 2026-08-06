import Link from "next/link";

import { ConnectButton, RespondButtons } from "@/components/arena/actions";
import { getCompanies, getConnections } from "@/lib/api";
import { getPersonaId } from "@/lib/persona.server";
import { COMPANY_TYPE_LABELS } from "@/lib/types";
import type { Connection } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ConnectionsPage() {
  const personaId = await getPersonaId();
  const [view, companies] = await Promise.all([getConnections(personaId), getCompanies()]);
  const byId = new Map(companies.map((company) => [company.id, company]));

  const other = (connection: Connection) =>
    connection.from_id === personaId ? connection.to_id : connection.from_id;

  const label = (id: string) => {
    const company = byId.get(id);
    return company ? `${company.name} — ${COMPANY_TYPE_LABELS[company.type]}` : id;
  };

  return (
    <div className="max-w-3xl space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Connections</h1>
        <p className="text-sm text-muted-foreground">
          Seen from {byId.get(personaId)?.name ?? personaId}.
        </p>
      </header>

      <section className="space-y-2">
        <h2 className="font-medium">Requests received ({view.incoming.length})</h2>
        <ul className="space-y-3 text-sm">
          {view.incoming.map((connection) => (
            <li key={connection.id}>
              <Link href={`/companies/${connection.from_id}`} className="underline">
                {label(connection.from_id)}
              </Link>
              <p className="text-muted-foreground">{connection.message}</p>
              <RespondButtons connectionId={connection.id} />
            </li>
          ))}
          {view.incoming.length === 0 && <li className="text-muted-foreground">None.</li>}
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="font-medium">Requests sent ({view.outgoing.length})</h2>
        <ul className="space-y-1 text-sm">
          {view.outgoing.map((connection) => (
            <li key={connection.id}>
              <Link href={`/companies/${connection.to_id}`} className="underline">
                {label(connection.to_id)}
              </Link>
              <span className="text-muted-foreground"> — awaiting response</span>
            </li>
          ))}
          {view.outgoing.length === 0 && <li className="text-muted-foreground">None.</li>}
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="font-medium">Connected ({view.accepted.length})</h2>
        <ul className="space-y-1 text-sm">
          {view.accepted.map((connection) => (
            <li key={connection.id}>
              <Link href={`/companies/${other(connection)}`} className="underline">
                {label(other(connection))}
              </Link>
            </li>
          ))}
          {view.accepted.length === 0 && <li className="text-muted-foreground">None.</li>}
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="font-medium">Suggestions</h2>
        <ul className="space-y-1 text-sm">
          {view.suggestions.map((id) => (
            <li key={id}>
              <Link href={`/companies/${id}`} className="underline">
                {label(id)}
              </Link>{" "}
              <ConnectButton fromId={personaId} toId={id} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
