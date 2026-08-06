import Link from "next/link";

import type { Connection, ConnectionsView } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * The standing between the acting company and the one on the page, for the
 * states where no new request can be filed: already connected, or a request
 * already pending in either direction.
 *
 * The coupling mark draws it in the register's station grammar: two squares
 * joined by a rule — the acting company on the left, the counterparty on the
 * right. Both struck with a solid rule means coupled (connected); a dashed
 * rule with only the asking side struck means a request is travelling. The
 * sentence beside the mark states the same thing in words, so geometry leads
 * and hue never carries meaning alone.
 */

export type StandingState = "connected" | "pending_out" | "pending_in";

export interface Standing {
  state: StandingState;
  date: string | null;
  threadId: string | null;
}

/**
 * Reads the standing between the acting company and a counterparty out of the
 * connections view. `null` means no record stands — a new request may be filed.
 */
export function standingWith(
  view: ConnectionsView | null,
  personaId: string,
  counterpartId: string,
): Standing | null {
  if (!view) return null;
  const involves = (connection: Connection) =>
    (connection.from_id === personaId && connection.to_id === counterpartId) ||
    (connection.from_id === counterpartId && connection.to_id === personaId);

  const accepted = view.accepted.find(involves);
  if (accepted) {
    return {
      state: "connected",
      date: accepted.responded_at ?? accepted.created_at,
      threadId: accepted.conversation_id,
    };
  }
  const outgoing = view.outgoing.find(involves);
  if (outgoing) return { state: "pending_out", date: outgoing.created_at, threadId: null };
  const incoming = view.incoming.find(involves);
  if (incoming) return { state: "pending_in", date: incoming.created_at, threadId: null };
  return null;
}

function CouplingMark({ state }: { state: StandingState }) {
  const connected = state === "connected";
  const leftStruck = connected || state === "pending_out";
  const rightStruck = connected || state === "pending_in";
  return (
    <svg
      viewBox="0 0 34 10"
      width={34}
      height={10}
      aria-hidden="true"
      className="shrink-0"
    >
      <rect
        x="1"
        y="1"
        width="8"
        height="8"
        rx="1"
        className={cn(leftStruck ? "fill-foreground" : "fill-none stroke-input")}
        strokeWidth="1.2"
      />
      <line
        x1="10.5"
        y1="5"
        x2="23.5"
        y2="5"
        className="stroke-foreground/60"
        strokeWidth="1.2"
        strokeDasharray={connected ? undefined : "2.5 2.5"}
      />
      <rect
        x="25"
        y="1"
        width="8"
        height="8"
        rx="1"
        className={cn(rightStruck ? "fill-foreground" : "fill-none stroke-input")}
        strokeWidth="1.2"
      />
    </svg>
  );
}

const STANDING_LABEL: Record<StandingState, string> = {
  connected: "Connected",
  pending_out: "Request pending",
  pending_in: "Request received",
};

export function ConnectionStanding({
  state,
  counterpartName,
  date,
  threadId,
  className,
}: {
  state: StandingState;
  counterpartName: string;
  /** ISO day of record: responded for connected, filed for pending. */
  date?: string | null;
  /** The conversation an acceptance opened — links straight to it. */
  threadId?: string | null;
  className?: string;
}) {
  const linkClass =
    "rounded-sm text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50";

  return (
    <div className={cn("max-w-xl", className)}>
      <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
        <CouplingMark state={state} />
        <span className="arena-data text-foreground">{STANDING_LABEL[state]}</span>
        {date && <span className="arena-data text-muted-foreground">{date}</span>}
      </p>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
        {state === "connected" && (
          <>
            {counterpartName} is in your register — you are already talking.{" "}
            <Link
              href={threadId ? `/messages?thread=${threadId}` : "/messages"}
              className={linkClass}
            >
              Open the thread
            </Link>
          </>
        )}
        {state === "pending_out" && (
          <>
            Your request is with {counterpartName}, awaiting their answer.{" "}
            <Link href="/connections" className={linkClass}>
              Follow it in Connections
            </Link>
          </>
        )}
        {state === "pending_in" && (
          <>
            {counterpartName} has asked to connect with you — the decision is yours.{" "}
            <Link href="/connections" className={linkClass}>
              Decide in Connections
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
