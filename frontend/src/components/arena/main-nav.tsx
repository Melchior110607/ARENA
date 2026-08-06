"use client";

/**
 * The index row of the masthead: Arena's seven surfaces, read like the
 * section index of a works catalogue. The active surface carries a vermilion
 * signal underline plus full-strength text — never colour alone.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/companies", label: "Companies" },
  { href: "/products", label: "Products" },
  { href: "/opportunities", label: "Opportunities" },
  { href: "/connections", label: "Connections" },
  { href: "/messages", label: "Messages" },
  { href: "/pipeline", label: "Pipeline" },
] as const;

export function MainNav() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav aria-label="Primary" className="-mx-1 overflow-x-auto">
      <ul className="flex min-w-max items-stretch gap-4 px-1 sm:gap-6">
        {NAV.map((item) => {
          const active = isActive(item.href);
          return (
            <li key={item.href} className="flex">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex h-10 items-center text-[13px] font-medium tracking-wide whitespace-nowrap transition-colors outline-none",
                  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-plate-foreground",
                  active
                    ? "text-plate-foreground after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-plate-signal"
                    : "text-plate-muted hover:text-plate-foreground"
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
