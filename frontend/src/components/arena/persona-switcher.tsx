"use client";

/**
 * The register control in the masthead.
 *
 * Signed in it reads "Viewing as" — which company the visitor is acting as.
 * Signed out it reads "Sign in as…" — the same list, offered instead of held.
 * Arena has no authentication: signing out writes the `visitor` sentinel and
 * the public page takes over; signing in writes a company id. The cookie
 * mechanics (`writePersonaCookie` / `signOut` + `router.refresh()`) are
 * load-bearing and unchanged — only the presentation differs by state.
 */

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { ChevronsUpDownIcon } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Monogram } from "@/components/arena/monogram";
import { isVisitor, signOut, writePersonaCookie } from "@/lib/persona";
import { COMPANY_TYPE_LABELS, type Company } from "@/lib/types";

export function PersonaSwitcher({
  personas,
  current,
}: {
  personas: Company[];
  current: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const active = isVisitor(current)
    ? undefined
    : personas.find((persona) => persona.id === current);
  const signedOut = active === undefined;

  function select(id: string) {
    if (id === current) return;
    writePersonaCookie(id);
    startTransition(() => router.refresh());
  }

  function leave() {
    signOut();
    startTransition(() => router.refresh());
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={pending}
        aria-label={
          signedOut
            ? "Signed out. Sign in as a member company."
            : `Viewing Arena as ${active.name}. Switch company or sign out.`
        }
        className="flex h-9 items-center gap-2 rounded-md border border-plate-border pr-1.5 pl-1 text-plate-foreground transition-colors outline-none select-none hover:border-plate-muted/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-plate-foreground disabled:opacity-60 aria-expanded:border-plate-muted/60"
      >
        {signedOut ? (
          /* No company held — an empty nameplate where the monogram would sit. */
          <span
            aria-hidden="true"
            className="ml-0.5 block size-[26px] shrink-0 rounded-[2px] border border-dashed border-plate-muted/70"
          />
        ) : (
          <Monogram logo={active.logo} size={26} />
        )}
        <span className="hidden min-w-0 flex-col items-start sm:flex">
          <span className="arena-data text-plate-muted">
            {signedOut ? "Signed out" : "Viewing as"}
          </span>
          <span className="max-w-44 truncate text-[13px] leading-tight font-medium">
            {signedOut ? "Sign in as…" : active.name}
          </span>
        </span>
        <ChevronsUpDownIcon aria-hidden className="size-3.5 text-plate-muted" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="arena-data text-muted-foreground">
          {signedOut ? "Sign in as" : "Browse Arena as"}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={current} onValueChange={select}>
          {personas.map((persona) => (
            <DropdownMenuRadioItem
              key={persona.id}
              value={persona.id}
              className="py-1.5"
            >
              <Monogram logo={persona.logo} size={28} />
              <span className="flex min-w-0 flex-col">
                <span className="truncate font-medium">{persona.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {COMPANY_TYPE_LABELS[persona.type]} · {persona.city},{" "}
                  {persona.country_name}
                </span>
              </span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        {!signedOut && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={leave}>
              <span className="flex min-w-0 flex-col">
                <span className="font-medium">Sign out</span>
                <span className="text-xs text-muted-foreground">
                  Read Arena as a visitor — the public page and open registers
                </span>
              </span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
