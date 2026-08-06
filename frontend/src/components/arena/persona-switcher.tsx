"use client";

/**
 * "Viewing as" — the register control.
 *
 * Arena has no authentication; this control decides which company the visitor
 * is browsing as, and gives Connections, Messages and Pipeline their subject.
 * It writes the persona cookie and refreshes the tree, exactly as before —
 * only the presentation changed.
 */

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { ChevronsUpDownIcon } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Monogram } from "@/components/arena/monogram";
import { writePersonaCookie } from "@/lib/persona";
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
  const active = personas.find((persona) => persona.id === current) ?? personas[0];

  if (!active) return null;

  function select(id: string) {
    if (id === current) return;
    writePersonaCookie(id);
    startTransition(() => router.refresh());
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={pending}
        aria-label={`Viewing Arena as ${active.name}. Switch company.`}
        className="flex h-9 items-center gap-2 rounded-md border border-plate-border pr-1.5 pl-1 text-plate-foreground transition-colors outline-none select-none hover:border-plate-muted/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-plate-foreground disabled:opacity-60 aria-expanded:border-plate-muted/60"
      >
        <Monogram logo={active.logo} size={26} />
        <span className="hidden min-w-0 flex-col items-start sm:flex">
          <span className="arena-data text-plate-muted">Viewing as</span>
          <span className="max-w-44 truncate text-[13px] leading-tight font-medium">
            {active.name}
          </span>
        </span>
        <ChevronsUpDownIcon aria-hidden className="size-3.5 text-plate-muted" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="arena-data text-muted-foreground">
          Browse Arena as
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
