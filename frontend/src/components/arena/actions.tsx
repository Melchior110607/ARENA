"use client";

/**
 * PLACEHOLDER INTERACTION WIRING — replaced by the design agents.
 *
 * These components exist so the mutation paths (connect, respond, message, express
 * interest, move a relationship) are proven end to end before any design work starts.
 * They are intentionally unstyled: the pattern is what matters here, not the look.
 *
 * The pattern: call the API from the browser, then `router.refresh()` so the server
 * components re-read the mutated in-memory state.
 */

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  createConnection,
  expressInterest,
  moveRelationship,
  respondToConnection,
  sendMessage,
  trackRelationship,
} from "@/lib/api";
import { RELATIONSHIP_STATUS_LABELS, RELATIONSHIP_STATUS_ORDER } from "@/lib/types";
import type { RelationshipStatus } from "@/lib/types";

function useAction() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = (fn: () => Promise<unknown>) => {
    setError(null);
    void fn()
      .then(() => startTransition(() => router.refresh()))
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Failed"));
  };

  return { run, pending, error };
}

export function ConnectButton({ fromId, toId }: { fromId: string; toId: string }) {
  const { run, pending, error } = useAction();
  return (
    <span>
      <button
        type="button"
        className="underline disabled:opacity-50"
        disabled={pending}
        onClick={() => run(() => createConnection({ from_id: fromId, to_id: toId }))}
      >
        Connect
      </button>
      {error && <span className="ml-2 text-destructive">{error}</span>}
    </span>
  );
}

export function RespondButtons({ connectionId }: { connectionId: string }) {
  const { run, pending, error } = useAction();
  return (
    <span className="space-x-3">
      <button
        type="button"
        className="underline disabled:opacity-50"
        disabled={pending}
        onClick={() => run(() => respondToConnection(connectionId, "accepted"))}
      >
        Accept
      </button>
      <button
        type="button"
        className="underline disabled:opacity-50"
        disabled={pending}
        onClick={() => run(() => respondToConnection(connectionId, "declined"))}
      >
        Decline
      </button>
      {error && <span className="text-destructive">{error}</span>}
    </span>
  );
}

export function MessageComposer({
  conversationId,
  fromId,
}: {
  conversationId: string;
  fromId: string;
}) {
  const { run, pending, error } = useAction();
  const [body, setBody] = useState("");

  return (
    <form
      className="flex gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        if (!body.trim()) return;
        run(() => sendMessage({ conversation_id: conversationId, from_id: fromId, body }));
        setBody("");
      }}
    >
      <input
        className="flex-1 border px-2 py-1"
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder="Write a message"
        aria-label="Message"
      />
      <button type="submit" className="border px-3 py-1 disabled:opacity-50" disabled={pending}>
        Send
      </button>
      {error && <span className="text-destructive">{error}</span>}
    </form>
  );
}

export function InterestButton({
  opportunityId,
  interested,
}: {
  opportunityId: string;
  interested: boolean;
}) {
  const { run, pending, error } = useAction();

  if (interested) return <span className="text-muted-foreground">Interest registered</span>;

  return (
    <span>
      <button
        type="button"
        className="underline disabled:opacity-50"
        disabled={pending}
        onClick={() => run(() => expressInterest(opportunityId))}
      >
        Express interest
      </button>
      {error && <span className="ml-2 text-destructive">{error}</span>}
    </span>
  );
}

export function StatusSelect({
  relationshipId,
  status,
}: {
  relationshipId: string;
  status: RelationshipStatus;
}) {
  const { run, pending, error } = useAction();
  return (
    <span>
      <select
        className="border px-2 py-1"
        value={status}
        disabled={pending}
        aria-label="Relationship status"
        onChange={(event) =>
          run(() => moveRelationship(relationshipId, event.target.value as RelationshipStatus))
        }
      >
        {RELATIONSHIP_STATUS_ORDER.map((value) => (
          <option key={value} value={value}>
            {RELATIONSHIP_STATUS_LABELS[value]}
          </option>
        ))}
      </select>
      {error && <span className="ml-2 text-destructive">{error}</span>}
    </span>
  );
}

export function TrackButton({ ownerId, companyId }: { ownerId: string; companyId: string }) {
  const { run, pending, error } = useAction();
  return (
    <span>
      <button
        type="button"
        className="underline disabled:opacity-50"
        disabled={pending}
        onClick={() => run(() => trackRelationship({ owner_id: ownerId, company_id: companyId }))}
      >
        Track in pipeline
      </button>
      {error && <span className="ml-2 text-destructive">{error}</span>}
    </span>
  );
}
