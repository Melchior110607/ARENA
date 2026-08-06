import type { Metadata } from "next";
import Link from "next/link";
import { Geist } from "next/font/google";

import { PersonaSwitcher } from "@/components/arena/persona-switcher";
import { getPersonas } from "@/lib/api";
import { getPersonaId } from "@/lib/persona.server";
import { cn } from "@/lib/utils";
import "./globals.css";

// Self-hosted at build time by next/font — the prototype must run offline.
const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Arena — B2B network for brands, suppliers and makers",
  description:
    "Prototype of a B2B network where brands, suppliers, manufacturers, processors and raw material producers discover each other and publish traceable value chains. All data is fictional.",
};

// PLACEHOLDER SHELL — replaced by the design foundation agent.
// It exists so routing and data flow can be verified before any design work starts.
const NAV = [
  { href: "/", label: "Home" },
  { href: "/companies", label: "Companies" },
  { href: "/products", label: "Products" },
  { href: "/opportunities", label: "Opportunities" },
  { href: "/connections", label: "Connections" },
  { href: "/messages", label: "Messages" },
  { href: "/pipeline", label: "Pipeline" },
] as const;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [personas, personaId] = await Promise.all([getPersonas(), getPersonaId()]);

  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <div className="border-b border-dashed px-6 py-2 text-xs text-muted-foreground">
          Fictional demo data. Arena is a prototype — no real company is represented.
        </div>
        <header className="flex flex-wrap items-center justify-between gap-4 border-b px-6 py-4">
          <nav className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
            <span className="text-lg font-semibold tracking-tight">Arena</span>
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="text-sm hover:underline">
                {item.label}
              </Link>
            ))}
          </nav>
          <PersonaSwitcher personas={personas} current={personaId} />
        </header>
        <main className="px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
