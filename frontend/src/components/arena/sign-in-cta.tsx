"use client";

/**
 * The public page's door onto the floor. There is no authentication in this
 * prototype: "signing in" writes the default persona cookie and refreshes,
 * and the same URL turns from prospectus into the member floor — the turn is
 * the demonstration. The masthead register then lets the reader act as any
 * member company.
 */

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { DEFAULT_PERSONA_ID, writePersonaCookie } from "@/lib/persona";

export function SignInCta({
  variant = "default",
  children,
}: {
  variant?: "default" | "outline";
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const enter = () => {
    writePersonaCookie(DEFAULT_PERSONA_ID);
    startTransition(() => router.refresh());
  };

  return (
    <Button type="button" variant={variant} disabled={pending} onClick={enter}>
      {pending ? "Opening the floor…" : children}
    </Button>
  );
}
