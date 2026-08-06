"use client";

/**
 * The registry's writing instruments — every mutation on the relational
 * surfaces passes through here.
 *
 * Two signatures live in this file.
 *
 * THE FILING WINDOW: a consequential action (accept, decline, connect, express
 * interest) commits optimistically and inline, but the ink stays wet for five
 * seconds — a meter of five squares fills one per second, and Undo restores the
 * row instantly. When the window closes the entry is committed to the API and
 * the strip names the consequence in full instead of hiding it. Leaving the
 * page mid-window flushes the commit: a decision made is a decision filed.
 *
 * THE DOCKET: a connection request is never a bare button. Opening the
 * composer files a docket that carries its object — the article drawn as its
 * material swatch, the company as its monogram nameplate, the notice as its
 * posted-sheet glyph — above a note that travels with the request and becomes
 * the first entry of the conversation an acceptance opens. The receiving side
 * sees the object before anything else; accepting answers with a strip that
 * points at the exact thread it opened.
 *
 * The transport pattern: call the API from the browser, then `router.refresh()`
 * so server components re-read the mutated in-memory state.
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useOptimistic,
  useRef,
  useState,
  useTransition,
} from "react";

import { CONTEXT_KIND, ContextGlyph, contextHref } from "@/components/arena/context-glyph";
import { MaterialSwatch } from "@/components/arena/material-swatch";
import { Monogram } from "@/components/arena/monogram";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createConnection,
  expressInterest,
  respondToConnection,
  sendMessage,
} from "@/lib/api";
import type { ConnectionContext, Logo, Visual } from "@/lib/types";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* The filing window                                                   */
/* ------------------------------------------------------------------ */

const FILING_SECONDS = 5;
/** How long the filed consequence stays legible before the register refreshes. */
const SETTLE_MS = 2600;

type FilingPhase =
  | { name: "idle" }
  | { name: "filing"; ticks: number }
  | { name: "committing" }
  | { name: "filed" }
  | { name: "failed"; message: string };

function useFilingWindow() {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [phase, setPhase] = useState<FilingPhase>({ name: "idle" });

  const interval = useRef<ReturnType<typeof setInterval> | null>(null);
  const settle = useRef<ReturnType<typeof setTimeout> | null>(null);
  const commitFn = useRef<(() => Promise<unknown>) | null>(null);
  const committed = useRef(false);

  const clearInterval_ = () => {
    if (interval.current) clearInterval(interval.current);
    interval.current = null;
  };

  const runCommit = useCallback(() => {
    const commit = commitFn.current;
    if (!commit || committed.current) return;
    committed.current = true;
    setPhase({ name: "committing" });
    void commit()
      .then(() => {
        setPhase({ name: "filed" });
        settle.current = setTimeout(() => {
          startTransition(() => router.refresh());
        }, SETTLE_MS);
      })
      .catch((cause: unknown) => {
        committed.current = false;
        setPhase({
          name: "failed",
          message:
            cause instanceof Error ? cause.message : "The entry could not be filed",
        });
      });
  }, [router]);

  /** Open the window: the commit runs when the five ticks elapse. */
  const file = useCallback(
    (commit: () => Promise<unknown>) => {
      clearInterval_();
      commitFn.current = commit;
      committed.current = false;
      setPhase({ name: "filing", ticks: 0 });
      let elapsed = 0;
      interval.current = setInterval(() => {
        elapsed += 1;
        if (elapsed >= FILING_SECONDS) {
          clearInterval_();
          runCommit();
        } else {
          setPhase({ name: "filing", ticks: elapsed });
        }
      }, 1000);
    },
    [runCommit],
  );

  const undo = useCallback(() => {
    if (committed.current) return;
    clearInterval_();
    commitFn.current = null;
    setPhase({ name: "idle" });
  }, []);

  /* Leaving mid-window flushes the commit — a decision made is filed. */
  useEffect(
    () => () => {
      if (interval.current) {
        clearInterval(interval.current);
        if (!committed.current && commitFn.current) {
          committed.current = true;
          void commitFn.current();
        }
      }
      if (settle.current) clearTimeout(settle.current);
    },
    [],
  );

  return { phase, file, undo };
}

/** Five squares, one inked per second — discrete steps, safe under reduced motion. */
function FilingMeter({ ticks }: { ticks: number }) {
  return (
    <span aria-hidden="true" className="inline-flex items-center gap-[3px]">
      {Array.from({ length: FILING_SECONDS }, (_, index) => (
        <span
          key={index}
          className={cn(
            "size-1.5 rounded-[1px] border border-foreground/40 transition-colors",
            index < ticks && "border-foreground bg-foreground",
          )}
        />
      ))}
    </span>
  );
}

function FilingStrip({
  label,
  ticks,
  onUndo,
  undoRef,
}: {
  label: string;
  ticks: number;
  onUndo: () => void;
  undoRef: React.RefObject<HTMLButtonElement | null>;
}) {
  return (
    <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1.5">
      <span className="arena-data text-foreground">{label}</span>
      <FilingMeter ticks={ticks} />
      <Button ref={undoRef} type="button" variant="outline" size="xs" onClick={onUndo}>
        Undo
      </Button>
      <span className="sr-only">
        Filing in {FILING_SECONDS - ticks} seconds. Activate undo to cancel.
      </span>
    </span>
  );
}

function FiledError({ message }: { message: string }) {
  return <span className="text-[13px] text-destructive">{message} — try again.</span>;
}

/* ------------------------------------------------------------------ */
/* The consequence — what a filing actually does                       */
/* ------------------------------------------------------------------ */

/**
 * Accepting a request is not bookkeeping: the backend opens a conversation
 * between the two companies, seeded with the request's own note. The strip says
 * so, and points at it — at the exact thread when its id is known.
 */
function ConsequenceLine({
  lead,
  detail,
  href = "/messages",
  linkLabel = "Open the conversation",
}: {
  lead: string;
  detail: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <span className="text-sm leading-relaxed">
      <span className="font-medium">{lead}</span>{" "}
      <span className="text-muted-foreground">{detail}</span>{" "}
      <Link
        href={href}
        className="rounded-sm text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        {linkLabel}
      </Link>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Connections — respond to a request                                  */
/* ------------------------------------------------------------------ */

export function RespondButtons({
  connectionId,
  companyName,
}: {
  connectionId: string;
  companyName: string;
}) {
  const { phase, file, undo } = useFilingWindow();
  const [decision, setDecision] = useState<"accepted" | "declined" | null>(null);
  /** Returned by the PATCH when the request is accepted — the thread it opened. */
  const [threadId, setThreadId] = useState<string | null>(null);
  const acceptRef = useRef<HTMLButtonElement | null>(null);
  const undoRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (phase.name === "filing" && phase.ticks === 0) undoRef.current?.focus();
  }, [phase]);

  const decide = (next: "accepted" | "declined") => {
    setDecision(next);
    file(async () => {
      const updated = await respondToConnection(connectionId, next);
      setThreadId(updated.conversation_id);
      return updated;
    });
  };

  const cancel = () => {
    undo();
    setDecision(null);
    acceptRef.current?.focus();
  };

  const showButtons = phase.name === "idle" || phase.name === "failed";

  return (
    <div className="space-y-2">
      {showButtons && (
        <div className="flex items-center gap-2">
          <Button
            ref={acceptRef}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => decide("accepted")}
          >
            Accept
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() => decide("declined")}
          >
            Decline
          </Button>
        </div>
      )}
      <div role="status" className="min-h-0">
        {phase.name === "filing" && (
          <FilingStrip
            label={decision === "accepted" ? "Accepting" : "Declining"}
            ticks={phase.ticks}
            onUndo={cancel}
            undoRef={undoRef}
          />
        )}
        {phase.name === "committing" && (
          <span className="arena-data text-muted-foreground">Filing…</span>
        )}
        {phase.name === "filed" &&
          (decision === "accepted" ? (
            <ConsequenceLine
              lead={`Connected — ${companyName} joins the register.`}
              detail="A conversation is open between you, seeded with the note the request was sent with."
              href={threadId ? `/messages?thread=${threadId}` : "/messages"}
              linkLabel="Open the thread"
            />
          ) : (
            <span className="text-sm leading-relaxed">
              <span className="font-medium">Declined.</span>{" "}
              <span className="text-muted-foreground">
                The request is closed. No conversation was opened.
              </span>
            </span>
          ))}
        {phase.name === "failed" && <FiledError message={phase.message} />}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The docket — a connection request that carries its object           */
/* ------------------------------------------------------------------ */

/**
 * The object plate at the head of the docket. Drawn evidence first: an article
 * shows its material, a company its nameplate, a notice its posted sheet. The
 * label links to the record itself, so the sender can verify what the request
 * will carry before filing it.
 */
function DocketObject({
  context,
  companyName,
  objectVisual,
  objectLogo,
}: {
  context: ConnectionContext | null;
  companyName: string;
  objectVisual?: Visual;
  objectLogo?: Logo;
}) {
  if (!context) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-muted-foreground">
          <ContextGlyph type="company" />
        </span>
        <div className="min-w-0">
          <p className="arena-data text-muted-foreground">Re · Company record</p>
          <p className="mt-0.5 text-sm leading-snug font-medium">{companyName}</p>
        </div>
      </div>
    );
  }

  const evidence =
    context.type === "product" && objectVisual ? (
      <div className="h-12 w-16 shrink-0">
        <MaterialSwatch visual={objectVisual} />
      </div>
    ) : context.type === "company" && objectLogo ? (
      <Monogram logo={objectLogo} size={40} />
    ) : (
      <span className="text-muted-foreground">
        <ContextGlyph type={context.type} />
      </span>
    );

  return (
    <div className="flex items-center gap-3">
      {evidence}
      <div className="min-w-0">
        <p className="arena-data text-muted-foreground">
          Re · {CONTEXT_KIND[context.type]}
        </p>
        <p className="mt-0.5 text-sm leading-snug font-medium">
          <Link
            href={contextHref(context.type, context.id)}
            className="rounded-sm underline-offset-4 transition-colors outline-none hover:text-primary hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            {context.label}
          </Link>
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Pinned to the request — {companyName} sees it first.
        </p>
      </div>
    </div>
  );
}

/**
 * The connection request composer. Closed, it is one quiet button; open, it is
 * an inline docket — object on top, note beneath, the send passing through the
 * filing window. Kept export-compatible with the plain button it replaces, so
 * every surface that could already ask to connect now files a docket instead.
 */
export function ConnectButton({
  fromId,
  toId,
  companyName,
  context = null,
  message = "",
  label = "Connect",
  objectVisual,
  objectLogo,
}: {
  fromId: string;
  toId: string;
  companyName: string;
  /** What the request is about — a company, a product, or a notice. */
  context?: ConnectionContext | null;
  /** Seeds the note field. */
  message?: string;
  label?: string;
  /** Drawn evidence for the docket: the article's material… */
  objectVisual?: Visual;
  /** …or the company's nameplate. Notices draw their own glyph. */
  objectLogo?: Logo;
}) {
  const { phase, file, undo } = useFilingWindow();
  const noteId = useId();
  const helpId = useId();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState(message);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const noteRef = useRef<HTMLTextAreaElement | null>(null);
  const undoRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (phase.name === "filing" && phase.ticks === 0) undoRef.current?.focus();
  }, [phase]);

  const openDocket = () => {
    setOpen(true);
    // Focus lands in the note once the plate has mounted.
    requestAnimationFrame(() => noteRef.current?.focus());
  };

  const closeDocket = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  const holdFiling = () => {
    undo();
    // The note re-enables on the next render; focus after it does.
    requestAnimationFrame(() => noteRef.current?.focus());
  };

  const send = () => {
    file(() =>
      createConnection({ from_id: fromId, to_id: toId, message: note.trim(), context }),
    );
  };

  if (phase.name === "filed") {
    return (
      <div role="status">
        <ConsequenceLine
          lead={`Request sent to ${companyName}.`}
          detail={
            context
              ? `It files re ${context.label}${note.trim() ? ", with your note" : ""}. If they accept, a conversation opens and the note leads it.`
              : "A conversation opens between you if they accept."
          }
          href="/connections"
          linkLabel="Follow it in Connections"
        />
      </div>
    );
  }

  if (!open) {
    return (
      <Button
        ref={triggerRef}
        type="button"
        variant="outline"
        size="sm"
        aria-expanded={false}
        onClick={openDocket}
      >
        {label}
      </Button>
    );
  }

  const editable = phase.name === "idle" || phase.name === "failed";

  return (
    <section
      aria-label={`Connection request to ${companyName}`}
      className="max-w-xl rounded-md bg-card p-4 ring-1 ring-foreground/10"
      onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        event.stopPropagation();
        if (phase.name === "filing") holdFiling();
        else if (editable) closeDocket();
      }}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
        <p className="arena-data text-foreground">Connection request</p>
        <p className="arena-data text-muted-foreground">to {companyName}</p>
      </div>

      <div className="mt-3 border-b pb-3.5">
        <DocketObject
          context={context}
          companyName={companyName}
          objectVisual={objectVisual}
          objectLogo={objectLogo}
        />
      </div>

      <div className="mt-3.5">
        <Label htmlFor={noteId}>Note</Label>
        <Textarea
          ref={noteRef}
          id={noteId}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          aria-describedby={helpId}
          disabled={!editable}
          rows={3}
          placeholder="What do you want to discuss — quantities, timelines, the record above?"
          className="mt-1.5 min-h-16 resize-none bg-transparent"
        />
        <p id={helpId} className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
          Travels with the request. If they accept, it opens the conversation as its
          first entry.
        </p>
      </div>

      <div className="mt-3.5">
        {editable && (
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" size="sm" onClick={send}>
              Send request
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={closeDocket}
            >
              Cancel
            </Button>
          </div>
        )}
        <div role="status" className="min-h-0">
          {phase.name === "filing" && (
            <FilingStrip
              label="Sending request"
              ticks={phase.ticks}
              onUndo={holdFiling}
              undoRef={undoRef}
            />
          )}
          {phase.name === "committing" && (
            <span className="arena-data text-muted-foreground">Filing…</span>
          )}
          {phase.name === "failed" && (
            <p className="mt-2">
              <FiledError message={phase.message} />
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Opportunities — express interest                                    */
/* ------------------------------------------------------------------ */

/** A square registry stamp — deliberately not the circular traceability seal. */
function InterestStamp() {
  return (
    <svg viewBox="0 0 18 18" width={16} height={16} aria-hidden="true" className="shrink-0">
      <rect
        x="1"
        y="1"
        width="16"
        height="16"
        rx="1"
        fill="none"
        stroke="var(--status-verified)"
        strokeWidth="1.5"
      />
      <path
        d="M5.4 9.3l2.4 2.4 4.8-5.1"
        fill="none"
        stroke="var(--status-verified)"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function InterestRegistered() {
  return (
    <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
      <InterestStamp />
      <span className="text-sm font-medium">Interest registered.</span>
      <span className="text-sm text-muted-foreground">
        The issuing company sees it in this prototype only.
      </span>
    </span>
  );
}

export function InterestButton({
  noticeId,
  asCompanyId,
  interested,
}: {
  noticeId: string;
  asCompanyId: string;
  interested: boolean;
}) {
  const { phase, file, undo } = useFilingWindow();
  const interestRef = useRef<HTMLButtonElement | null>(null);
  const undoRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (phase.name === "filing" && phase.ticks === 0) undoRef.current?.focus();
  }, [phase]);

  if (interested) return <InterestRegistered />;

  const cancel = () => {
    undo();
    interestRef.current?.focus();
  };

  const showButton = phase.name === "idle" || phase.name === "failed";

  return (
    <div className="space-y-2">
      {showButton && (
        <Button
          ref={interestRef}
          type="button"
          variant="outline"
          size="sm"
          onClick={() => file(() => expressInterest(noticeId, asCompanyId))}
        >
          Express interest
        </Button>
      )}
      <div role="status" className="min-h-0">
        {phase.name === "filing" && (
          <FilingStrip
            label="Registering interest"
            ticks={phase.ticks}
            onUndo={cancel}
            undoRef={undoRef}
          />
        )}
        {phase.name === "committing" && (
          <span className="arena-data text-muted-foreground">Filing…</span>
        )}
        {phase.name === "filed" && <InterestRegistered />}
        {phase.name === "failed" && <FiledError message={phase.message} />}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Messages — the composer and its outbox                              */
/* ------------------------------------------------------------------ */

interface OutboxEntry {
  key: string;
  body: string;
}

/**
 * A sent message appears in the thread immediately: the outbox renders it in
 * the ledger's own row grammar while the send and refresh complete inside one
 * transition, after which the server copy takes over seamlessly.
 */
export function MessageComposer({
  conversationId,
  fromId,
  personaName,
  personaLogo,
}: {
  conversationId: string;
  fromId: string;
  personaName: string;
  personaLogo: Logo;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [outbox, appendToOutbox] = useOptimistic<OutboxEntry[], string>(
    [],
    (state, body) => [...state, { key: `out-${state.length}-${body.length}`, body }],
  );

  const send = () => {
    const body = draft.trim();
    if (!body) return;
    setDraft("");
    setError(null);
    startTransition(async () => {
      appendToOutbox(body);
      try {
        await sendMessage({ conversation_id: conversationId, from_id: fromId, body });
        router.refresh();
      } catch (cause: unknown) {
        setError(cause instanceof Error ? cause.message : "The message was not sent");
        setDraft(body);
      }
    });
  };

  return (
    <div>
      {outbox.length > 0 && (
        <ul aria-label="Sending" className="border-b">
          {outbox.map((entry) => (
            <li key={entry.key} className="py-4 pl-6 sm:pl-14">
              <div className="rounded-md bg-card p-3 ring-1 ring-foreground/10">
                <p className="flex items-center gap-2">
                  <Monogram logo={personaLogo} size={20} aria-hidden="true" />
                  <span className="text-[13px] font-medium">{personaName}</span>
                  <span className="arena-data text-muted-foreground">Sending…</span>
                </p>
                <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-line">
                  {entry.body}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form
        className="mt-4"
        onSubmit={(event) => {
          event.preventDefault();
          send();
        }}
      >
        <label htmlFor={`composer-${conversationId}`} className="sr-only">
          Write a message
        </label>
        <div className="flex items-end gap-2">
          <Textarea
            id={`composer-${conversationId}`}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                send();
              }
            }}
            placeholder={`Write to the counterparty as ${personaName}`}
            rows={2}
            className="min-h-16 flex-1 resize-none bg-transparent"
          />
          <Button type="submit" disabled={!draft.trim()}>
            Send
          </Button>
        </div>
        <p className="arena-data mt-2 text-muted-foreground">
          Enter sends · Shift+Enter breaks the line · correspondence resets when the
          prototype restarts
        </p>
        <div role="status">
          {error && <p className="mt-1 text-[13px] text-destructive">{error} — try again.</p>}
        </div>
      </form>
    </div>
  );
}
