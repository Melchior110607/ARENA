import Link from "next/link";
import { redirect } from "next/navigation";

import { MessageComposer } from "@/components/arena/actions";
import { CONTEXT_KIND, ContextGlyph, contextHref } from "@/components/arena/context-glyph";
import { MaterialSwatch } from "@/components/arena/material-swatch";
import { Monogram } from "@/components/arena/monogram";
import { dayOf, timeOf } from "@/components/arena/registry";
import { getCompanies, getConnections, getConversations, getProducts } from "@/lib/api";
import { requireCompanyId } from "@/lib/persona.server";
import { COMPANY_TYPE_LABELS } from "@/lib/types";
import type { Company, Connection, Conversation, Message, Product } from "@/lib/types";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/* The context rail: every thread is anchored to the record that       */
/* started it — company, product or notice — as a live link. The       */
/* record is drawn, not named: an article shows its material, a        */
/* company its nameplate, a notice its posted sheet.                   */
/* ------------------------------------------------------------------ */

function ContextPlate({
  conversation,
  product,
  contextCompany,
}: {
  conversation: Conversation;
  /** Resolved when the context is a product — carries the drawn swatch. */
  product: Product | undefined;
  /** Resolved when the context is a company — carries the nameplate. */
  contextCompany: Company | undefined;
}) {
  const { type, id, label } = conversation.context;
  const evidence =
    type === "product" && product ? (
      <span className="h-12 w-16 shrink-0">
        <MaterialSwatch visual={product.visual} />
      </span>
    ) : type === "company" && contextCompany ? (
      <Monogram logo={contextCompany.logo} size={40} />
    ) : (
      <span className="mt-0.5 text-muted-foreground">
        <ContextGlyph type={type} />
      </span>
    );
  return (
    <div className="rounded-md bg-card p-3.5 ring-1 ring-foreground/10">
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3">
        {evidence}
        <div className="min-w-0">
          <p className="arena-data text-muted-foreground">Filed under · {type}</p>
          <p className="mt-1 text-sm leading-snug">
            <Link
              href={contextHref(type, id)}
              className="rounded-sm font-medium underline-offset-4 transition-colors outline-none hover:text-primary hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              {label}
            </Link>
          </p>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            {CONTEXT_KIND[type]} — the exchange below refers to it.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The ledger                                                          */
/* ------------------------------------------------------------------ */

function groupByDay(messages: Message[]): { day: string; entries: Message[] }[] {
  const groups: { day: string; entries: Message[] }[] = [];
  for (const message of messages) {
    const day = dayOf(message.sent_at);
    const last = groups[groups.length - 1];
    if (last && last.day === day) last.entries.push(message);
    else groups.push({ day, entries: [message] });
  }
  return groups;
}

function LedgerEntry({
  message,
  own,
  sender,
}: {
  message: Message;
  own: boolean;
  sender: Company | undefined;
}) {
  const body = (
    <>
      <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
        {sender && <Monogram logo={sender.logo} size={20} aria-hidden="true" />}
        <span className="text-[13px] font-medium">{sender?.name ?? message.from_id}</span>
        <span className="arena-data text-muted-foreground">{timeOf(message.sent_at)}</span>
      </p>
      <p className="mt-1.5 max-w-[70ch] text-sm leading-relaxed whitespace-pre-line">
        {message.body}
      </p>
    </>
  );

  /* Direction is geometry: replies from the acting company sit inset, on a
     plate; the counterparty's entries lie flush on the page. */
  if (own) {
    return (
      <li className="py-4 pl-6 sm:pl-14">
        <div className="rounded-md bg-card p-3 ring-1 ring-foreground/10">{body}</div>
      </li>
    );
  }
  return <li className="py-4 pr-6 sm:pr-14">{body}</li>;
}

/* ------------------------------------------------------------------ */
/* The page                                                            */
/* ------------------------------------------------------------------ */

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [personaId, params] = await Promise.all([requireCompanyId(), searchParams]);
  if (personaId === null) redirect("/");
  const [conversations, companies, products, connectionsView] = await Promise.all([
    getConversations(personaId),
    getCompanies({ as: personaId }),
    getProducts(),
    getConnections(personaId).catch(() => null),
  ]);

  const byId = new Map(companies.map((company) => [company.id, company]));
  const productById = new Map(products.map((product) => [product.id, product]));
  /* The request each thread was born from — accepted connections carry the id. */
  const originByThread = new Map<string, Connection>(
    (connectionsView?.accepted ?? [])
      .filter((connection) => connection.conversation_id !== null)
      .map((connection) => [connection.conversation_id as string, connection]),
  );
  const persona = byId.get(personaId);
  const personaName = persona?.name ?? personaId;
  const personaLogo = persona?.logo ?? { monogram: personaId.slice(0, 2), tone: 0 };

  const lastSentAt = (conversation: Conversation) =>
    conversation.messages[conversation.messages.length - 1]?.sent_at ?? "";
  const sorted = [...conversations].sort((a, b) =>
    lastSentAt(a) < lastSentAt(b) ? 1 : -1,
  );

  const requestedRaw = params.thread;
  const requested = Array.isArray(requestedRaw) ? requestedRaw[0] : requestedRaw;
  const explicit = sorted.find((conversation) => conversation.id === requested);
  const active = explicit ?? sorted[0] ?? null;

  return (
    <div className="space-y-8">
      <header className="max-w-3xl space-y-3">
        <h1 className="text-[2rem] leading-[1.15] font-semibold tracking-[-0.01em]">
          Messages
        </h1>
      </header>

      {sorted.length === 0 ? (
        <div className="max-w-xl rounded-md bg-card p-5 ring-1 ring-foreground/10">
          <p className="text-base font-medium">No correspondence on file.</p>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            Conversations open from a company, product or notice. Switch the
            company you are viewing as (top right) to read another desk&rsquo;s files, or
            start from the{" "}
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
        <div className="grid gap-x-12 gap-y-8 md:grid-cols-[300px_minmax(0,1fr)] lg:grid-cols-[340px_minmax(0,1fr)]">
          {/* ---------------------- The thread register ---------------------- */}
          <nav
            aria-label="Conversations"
            className={cn("md:sticky md:top-8 md:self-start", explicit && "hidden md:block")}
          >
            <p className="arena-data text-muted-foreground">
              {sorted.length} {sorted.length === 1 ? "thread" : "threads"}
            </p>
            <ul className="mt-2 border-t border-foreground/25">
              {sorted.map((conversation) => {
                const counterpartId =
                  conversation.participants.find((id) => id !== personaId) ??
                  conversation.participants[0];
                const counterpart = byId.get(counterpartId);
                const isActive = active?.id === conversation.id;
                const last = conversation.messages[conversation.messages.length - 1];
                return (
                  <li key={conversation.id} className="border-b">
                    <Link
                      href={`/messages?thread=${conversation.id}`}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 rounded-sm px-2 py-3 transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                        isActive ? "bg-muted/50" : "hover:bg-muted/30",
                      )}
                    >
                      {counterpart ? (
                        <Monogram logo={counterpart.logo} size={30} className="mt-0.5" />
                      ) : (
                        <span className="size-[30px]" aria-hidden="true" />
                      )}
                      <span className="min-w-0">
                        <span className="flex items-baseline justify-between gap-2">
                          <span className="flex min-w-0 items-center gap-2">
                            <span
                              aria-hidden="true"
                              className={cn(
                                "size-1.5 shrink-0 rounded-[1px]",
                                isActive ? "bg-primary" : "border border-border",
                              )}
                            />
                            <span
                              className={cn(
                                "truncate text-sm",
                                isActive ? "font-semibold" : "font-medium",
                              )}
                            >
                              {counterpart?.name ?? counterpartId}
                            </span>
                          </span>
                          <span className="arena-data shrink-0 text-muted-foreground">
                            {last ? dayOf(last.sent_at) : "—"}
                          </span>
                        </span>
                        <span className="mt-1 flex items-center gap-1.5 text-[13px] text-muted-foreground">
                          <ContextGlyph type={conversation.context.type} size={14} />
                          <span className="truncate">{conversation.context.label}</span>
                        </span>
                        <span className="arena-data mt-1 block text-muted-foreground">
                          {conversation.messages.length}{" "}
                          {conversation.messages.length === 1 ? "entry" : "entries"}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* ------------------------- The open file ------------------------- */}
          {active &&
            (() => {
              const counterpartId =
                active.participants.find((id) => id !== personaId) ??
                active.participants[0];
              const counterpart = byId.get(counterpartId);
              const groups = groupByDay(active.messages);
              const origin = originByThread.get(active.id);
              const openedByMe = origin?.from_id === personaId;
              return (
                <section
                  aria-label={`Correspondence with ${counterpart?.name ?? counterpartId}`}
                  className={cn("min-w-0", !explicit && "hidden md:block")}
                >
                  <p className="md:hidden">
                    <Link
                      href="/messages"
                      className="rounded-sm text-sm text-muted-foreground underline-offset-4 outline-none hover:text-primary hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    >
                      ← All correspondence
                    </Link>
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-x-3.5 gap-y-2 md:mt-0">
                    {counterpart && <Monogram logo={counterpart.logo} size={40} />}
                    <div className="min-w-0">
                      <h2 className="text-xl leading-tight font-semibold">
                        {counterpart ? (
                          <Link
                            href={`/companies/${counterpart.id}`}
                            className="rounded-sm underline-offset-4 transition-colors outline-none hover:text-primary hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
                          >
                            {counterpart.name}
                          </Link>
                        ) : (
                          counterpartId
                        )}
                      </h2>
                      {counterpart && (
                        <p className="mt-0.5 text-[13px] text-muted-foreground">
                          {COMPANY_TYPE_LABELS[counterpart.type]} · {counterpart.city},{" "}
                          {counterpart.country_name}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4">
                    <ContextPlate
                      conversation={active}
                      product={
                        active.context.type === "product"
                          ? productById.get(active.context.id)
                          : undefined
                      }
                      contextCompany={
                        active.context.type === "company"
                          ? byId.get(active.context.id)
                          : undefined
                      }
                    />
                  </div>

                  <ol className="mt-6 border-t border-foreground/25">
                    {/* How the file came to exist — legible even one entry in. */}
                    {origin && (
                      <li className="pt-4">
                        <p className="max-w-[65ch] text-[13px] leading-relaxed text-muted-foreground">
                          <span className="arena-data">
                            File opened{origin.responded_at ? ` ${origin.responded_at}` : ""}
                          </span>{" "}
                          —{" "}
                          {openedByMe
                            ? `${counterpart?.name ?? counterpartId} accepted your connection request; your note leads the file.`
                            : `you accepted ${counterpart?.name ?? counterpartId}'s connection request; their note leads the file.`}
                        </p>
                      </li>
                    )}
                    {groups.map((group) => (
                      <li key={group.day}>
                        <p
                          aria-hidden="true"
                          className="flex items-center gap-3 pt-4 pb-1"
                        >
                          <span className="h-px flex-1 bg-border" />
                          <span className="arena-data text-muted-foreground">
                            {group.day}
                          </span>
                          <span className="h-px flex-1 bg-border" />
                        </p>
                        <ul>
                          {group.entries.map((message) => (
                            <LedgerEntry
                              key={message.id}
                              message={message}
                              own={message.from_id === personaId}
                              sender={byId.get(message.from_id)}
                            />
                          ))}
                        </ul>
                      </li>
                    ))}
                    {active.messages.length === 0 && (
                      <li className="py-4 text-sm text-muted-foreground">
                        No entries yet — open the file with the first message.
                      </li>
                    )}
                  </ol>

                  <MessageComposer
                    conversationId={active.id}
                    fromId={personaId}
                    personaName={personaName}
                    personaLogo={personaLogo}
                  />
                </section>
              );
            })()}
        </div>
      )}
    </div>
  );
}
