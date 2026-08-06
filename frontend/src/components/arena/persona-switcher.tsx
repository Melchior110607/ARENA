"use client";

/**
 * PLACEHOLDER — replaced by the design foundation agent.
 *
 * Picks the company the visitor is browsing as. There is no authentication in this
 * prototype, so this is what gives Connections, Messages and Pipeline a subject.
 */

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { writePersonaCookie } from "@/lib/persona";
import type { Company } from "@/lib/types";

export function PersonaSwitcher({
  personas,
  current,
}: {
  personas: Company[];
  current: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">Viewing as</span>
      <select
        className="border px-2 py-1"
        value={current}
        disabled={pending}
        onChange={(event) => {
          writePersonaCookie(event.target.value);
          startTransition(() => router.refresh());
        }}
      >
        {personas.map((persona) => (
          <option key={persona.id} value={persona.id}>
            {persona.name}
          </option>
        ))}
      </select>
    </label>
  );
}
