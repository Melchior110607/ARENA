import Link from "next/link";

import { MessageComposer } from "@/components/arena/actions";
import { getCompanies, getConversations } from "@/lib/api";
import { getPersonaId } from "@/lib/persona.server";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const personaId = await getPersonaId();
  const [conversations, companies] = await Promise.all([
    getConversations(personaId),
    getCompanies(),
  ]);
  const nameOf = new Map(companies.map((company) => [company.id, company.name]));

  return (
    <div className="max-w-3xl space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Messages</h1>
        <p className="text-sm text-muted-foreground">
          Simulated. Nothing is sent to a real company.
        </p>
      </header>

      {conversations.map((conversation) => {
        const counterpart =
          conversation.participants.find((id) => id !== personaId) ?? conversation.participants[0];

        return (
          <section key={conversation.id} className="space-y-3 border-b pb-6">
            <header className="space-y-1">
              <h2 className="font-medium">
                <Link href={`/companies/${counterpart}`} className="underline">
                  {nameOf.get(counterpart) ?? counterpart}
                </Link>
              </h2>
              <p className="text-sm text-muted-foreground">
                About: {conversation.context.label} ({conversation.context.type})
              </p>
            </header>

            <ul className="space-y-2 text-sm">
              {conversation.messages.map((message) => (
                <li key={message.id}>
                  <span className="text-muted-foreground">
                    {nameOf.get(message.from_id) ?? message.from_id} ·{" "}
                    {message.sent_at.slice(0, 10)}
                  </span>
                  <p>{message.body}</p>
                </li>
              ))}
            </ul>

            <MessageComposer conversationId={conversation.id} fromId={personaId} />
          </section>
        );
      })}

      {conversations.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No conversation for this company yet. Switch the company you are viewing as.
        </p>
      )}
    </div>
  );
}
