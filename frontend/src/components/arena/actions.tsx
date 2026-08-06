"use client";

/**
 * The registry's writing instruments — every mutation on the four relational
 * surfaces passes through here.
 *
 * The signature is THE FILING WINDOW: a consequential action (accept, decline,
 * connect, express interest) commits optimistically and inline, but the ink
 * stays wet for five seconds — a meter of five squares fills one per second,
 * and Undo restores the row instantly. When the window closes the entry is
 * committed to the API and the strip names the consequence in full ("pipeline
 * record advanced to Connected") instead of hiding it. Leaving the page mid-
 * window flushes the commit: a decision made is a decision filed.
 *
 * The transport pattern is unchanged from the proven placeholder: call the
 * API from the browser, then `router.refresh()` so server components re-read
 * the mutated in-memory state.
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
  moveRelationship,
  respondToConnection,
  sendMessage,
  trackRelationship,
} from "@/lib/api";
import {
  RELATIONSHIP_STATUS_LABELS,
  RELATIONSHIP_STATUS_ORDER,
} from "@/lib/types";
import type { Logo, RelationshipStatus } from "@/lib/types";
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
/* The consequence — what a filing does to the pipeline                */
/* ------------------------------------------------------------------ */

/**
 * Computed server-side from the actual relationship record, so the strip
 * states what the backend really does: advance the record, or leave it where
 * it already stands.
 */
export interface PipelineConsequence {
  kind: "advances" | "holds";
  /** Label of the status the record advances to, or already holds. */
  statusLabel: string;
}

function ConsequenceLine({
  lead,
  consequence,
}: {
  lead: string;
  consequence: PipelineConsequence;
}) {
  return (
    <span className="text-sm leading-relaxed">
      <span className="font-medium">{lead}</span>{" "}
      <span className="text-muted-foreground">
        {consequence.kind === "advances"
          ? `Pipeline record advanced to ${consequence.statusLabel}.`
          : `Pipeline record already stands at ${consequence.statusLabel}.`}
      </span>{" "}
      <Link
        href="/pipeline"
        className="rounded-sm text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        Open pipeline
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
  consequence,
}: {
  connectionId: string;
  companyName: string;
  consequence: PipelineConsequence;
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
              consequence={consequence}
            />
          ) : (
            <span className="text-sm leading-relaxed">
              <span className="font-medium">Declined.</span>{" "}
              <span className="text-muted-foreground">
                The request is closed; the pipeline record is untouched.
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
  consequence = { kind: "advances", statusLabel: RELATIONSHIP_STATUS_LABELS.contacted },
}: {
  fromId: string;
  toId: string;
  companyName: string;
  consequence?: PipelineConsequence;
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
          onClick={() => file(() => createConnection({ from_id: fromId, to_id: toId }))}
        >
          Connect
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
            consequence={consequence}
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
  opportunityId,
  interested,
}: {
  opportunityId: string;
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
          onClick={() => file(() => expressInterest(opportunityId))}
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

/* ------------------------------------------------------------------ */
/* Pipeline — the docket stepper                                       */
/* ------------------------------------------------------------------ */

/**
 * Six square stations on the card itself — clearer than drag. Past stages sit
 * small and half-inked, the current stage is struck full, coming stages stand
 * open. Selecting any station moves the record; arrows travel the row.
 */
export function StatusStepper({
  relationshipId,
  status,
  companyName,
  className,
}: {
  relationshipId: string;
  status: RelationshipStatus;
  companyName: string;
  className?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [target, setTarget] = useState<RelationshipStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const stationRefs = useRef<(HTMLButtonElement | null)[]>([]);

  /* The server confirmed the move — drop the optimistic overlay. */
  useEffect(() => {
    if (target !== null && target === status) setTarget(null);
  }, [status, target]);

  const shown = target ?? status;
  const currentIndex = RELATIONSHIP_STATUS_ORDER.indexOf(shown);
  const moving = target !== null && target !== status;

  const move = (next: RelationshipStatus) => {
    if (next === shown) return;
    setError(null);
    setTarget(next);
    void moveRelationship(relationshipId, next)
      .then(() => startTransition(() => router.refresh()))
      .catch((cause: unknown) => {
        setTarget(null);
        setError(cause instanceof Error ? cause.message : "The move was not filed");
      });
  };

  const travel = (event: React.KeyboardEvent, index: number) => {
    const next =
      event.key === "ArrowRight"
        ? Math.min(index + 1, RELATIONSHIP_STATUS_ORDER.length - 1)
        : event.key === "ArrowLeft"
          ? Math.max(index - 1, 0)
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? RELATIONSHIP_STATUS_ORDER.length - 1
              : null;
    if (next === null) return;
    event.preventDefault();
    stationRefs.current[next]?.focus();
  };

  return (
    <div className={className}>
      <div
        role="group"
        aria-label={`Pipeline stage for ${companyName}: ${RELATIONSHIP_STATUS_LABELS[shown]}, stage ${currentIndex + 1} of ${RELATIONSHIP_STATUS_ORDER.length}`}
        className="flex items-center"
      >
        {RELATIONSHIP_STATUS_ORDER.map((value, index) => {
          const here = value === shown;
          const past = index < currentIndex;
          return (
            <span key={value} className="flex items-center">
              {index > 0 && <span aria-hidden="true" className="h-px w-1 bg-border" />}
              <button
                ref={(el) => {
                  stationRefs.current[index] = el;
                }}
                type="button"
                aria-pressed={here}
                title={
                  here
                    ? `${RELATIONSHIP_STATUS_LABELS[value]} — current stage`
                    : `Move to ${RELATIONSHIP_STATUS_LABELS[value]}`
                }
                onClick={() => move(value)}
                onKeyDown={(event) => travel(event, index)}
                className="group/station cursor-pointer rounded-sm p-1.5 transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "block rounded-[1px] transition-colors",
                    here && "size-2.5 bg-foreground",
                    past && "size-2 bg-foreground/45 group-hover/station:bg-primary",
                    !here && !past &&
                      "size-2 border border-input group-hover/station:border-primary",
                  )}
                />
                <span className="sr-only">
                  {RELATIONSHIP_STATUS_LABELS[value]}, stage {index + 1} of{" "}
                  {RELATIONSHIP_STATUS_ORDER.length}
                  {here ? " — current stage" : ". Move the record here"}
                </span>
              </button>
            </span>
          );
        })}
      </div>
      <p role="status" className="arena-data mt-1 text-muted-foreground">
        {pad2(currentIndex + 1)} · {RELATIONSHIP_STATUS_LABELS[shown]}
        {(moving || isPending) && <span className="text-foreground"> · filing…</span>}
      </p>
      {error && <p className="mt-1 text-[13px] text-destructive">{error} — try again.</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Track a company into the pipeline (kept for other surfaces)         */
/* ------------------------------------------------------------------ */

export function TrackButton({ ownerId, companyId }: { ownerId: string; companyId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <span role="status" className="text-sm text-muted-foreground">
        Tracked —{" "}
        <Link
          href="/pipeline"
          className="rounded-sm text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          open pipeline
        </Link>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={() => {
          setError(null);
          void trackRelationship({ owner_id: ownerId, company_id: companyId })
            .then(() => {
              setDone(true);
              startTransition(() => router.refresh());
            })
            .catch((cause: unknown) =>
              setError(cause instanceof Error ? cause.message : "Not tracked"),
            );
        }}
      >
        Track in pipeline
      </Button>
      {error && <span className="text-[13px] text-destructive">{error}</span>}
    </span>
  );
}
