"use client";

/**
 * The registry's writing instruments — every mutation on the relational
 * surfaces passes through here.
 *
 * The signature is THE FILING WINDOW: a consequential action (accept, decline,
 * connect, express interest) commits optimistically and inline, but the ink
 * stays wet for five seconds — a meter of five squares fills one per second,
 * and Undo restores the row instantly. When the window closes the entry is
 * committed to the API and the strip names the consequence in full instead of
 * hiding it. Leaving the page mid-window flushes the commit: a decision made is
 * a decision filed.
 *
 * The transport pattern: call the API from the browser, then `router.refresh()`
 * so server components re-read the mutated in-memory state.
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useOptimistic,
  useRef,
  useState,
  useTransition,
} from "react";

import { Monogram } from "@/components/arena/monogram";
import { pad2 } from "@/components/arena/registry";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  createConnection,
  expressInterest,
  respondToConnection,
  sendMessage,
} from "@/lib/api";
import type { ConnectionContext, Logo } from "@/lib/types";
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
 * so, and points at it.
 */
function ConsequenceLine({ lead, detail }: { lead: string; detail: string }) {
  return (
    <span className="text-sm leading-relaxed">
      <span className="font-medium">{lead}</span>{" "}
      <span className="text-muted-foreground">{detail}</span>{" "}
      <Link
        href="/messages"
        className="rounded-sm text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        Open the conversation
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
  const acceptRef = useRef<HTMLButtonElement | null>(null);
  const undoRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (phase.name === "filing" && phase.ticks === 0) undoRef.current?.focus();
  }, [phase]);

  const decide = (next: "accepted" | "declined") => {
    setDecision(next);
    file(() => respondToConnection(connectionId, next));
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
              detail="A thread is open between you, carrying the note the request was sent with."
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
/* Connections — send a request to a suggested counterparty            */
/* ------------------------------------------------------------------ */

export function ConnectButton({
  fromId,
  toId,
  companyName,
  context = null,
  message = "",
  label = "Connect",
}: {
  fromId: string;
  toId: string;
  companyName: string;
  /** What the request is about — a company, a product, or a notice. */
  context?: ConnectionContext | null;
  message?: string;
  label?: string;
}) {
  const { phase, file, undo } = useFilingWindow();
  const connectRef = useRef<HTMLButtonElement | null>(null);
  const undoRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (phase.name === "filing" && phase.ticks === 0) undoRef.current?.focus();
  }, [phase]);

  const cancel = () => {
    undo();
    connectRef.current?.focus();
  };

  const showButton = phase.name === "idle" || phase.name === "failed";

  return (
    <div className="space-y-2">
      {showButton && (
        <Button
          ref={connectRef}
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            file(() =>
              createConnection({ from_id: fromId, to_id: toId, message, context }),
            )
          }
        >
          {label}
        </Button>
      )}
      <div role="status" className="min-h-0">
        {phase.name === "filing" && (
          <FilingStrip
            label="Sending request"
            ticks={phase.ticks}
            onUndo={cancel}
            undoRef={undoRef}
          />
        )}
        {phase.name === "committing" && (
          <span className="arena-data text-muted-foreground">Filing…</span>
        )}
        {phase.name === "filed" && (
          <ConsequenceLine
            lead={`Request sent to ${companyName}.`}
            detail={
              context
                ? `It carries what it is about: ${context.label}. A thread opens if they accept.`
                : "A thread opens between you if they accept."
            }
          />
        )}
        {phase.name === "failed" && <FiledError message={phase.message} />}
      </div>
    </div>
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

