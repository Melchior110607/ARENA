import type { Metadata } from "next";
import Link from "next/link";
import { Archivo, Fragment_Mono } from "next/font/google";

import { MainNav } from "@/components/arena/main-nav";
import { PersonaSwitcher } from "@/components/arena/persona-switcher";
import { SiteFooter } from "@/components/arena/site-footer";
import { getPersonas } from "@/lib/api";
import { getPersonaId } from "@/lib/persona.server";
import { cn } from "@/lib/utils";
import "./globals.css";

// Self-hosted at build time by next/font — the prototype must run offline.
// Archivo carries display and body (its width axis gives the wordmark its
// expanded nameplate caps); Fragment Mono carries data: article numbers,
// specs, statuses, counts.
const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-sans",
  axes: ["wdth"],
});
const fragmentMono = Fragment_Mono({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Arena — B2B network for brands, suppliers and makers",
  description:
    "Prototype of a B2B network where brands, suppliers, manufacturers, processors and raw material producers discover each other and publish traceable value chains. All data is fictional.",
};

// The visual direction this shell implements is recorded in DESIGN.md at the repo
// root — that is where it belongs, not shipped inside every page.

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [personas, personaId] = await Promise.all([getPersonas(), getPersonaId()]);

  return (
    <html lang="en" className={cn("font-sans", archivo.variable, fragmentMono.variable)}>
      <body className="flex min-h-dvh flex-col bg-background text-foreground antialiased">
        <a
          href="#main"
          className="sr-only z-50 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground focus:not-sr-only focus:absolute focus:top-2 focus:left-2"
        >
          Skip to content
        </a>

        <div role="note" aria-label="Data disclosure" className="border-b bg-background">
          <p className="arena-data mx-auto w-full max-w-[1400px] px-4 py-1.5 text-muted-foreground sm:px-6 lg:px-8">
            Demonstration prototype — every company, product and chain is fictional
          </p>
        </div>

        <header className="bg-plate text-plate-foreground">
          <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between gap-4">
              <Link
                href="/"
                aria-label="Arena — home"
                className="arena-nameplate inline-block shrink-0 border border-plate-border px-2.5 py-1.5 text-sm font-semibold outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-plate-foreground"
              >
                Arena
              </Link>
              <PersonaSwitcher personas={personas} current={personaId} />
            </div>
            <div className="border-t border-plate-border">
              <MainNav />
            </div>
          </div>
        </header>

        <main id="main" className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </main>

        <SiteFooter />
      </body>
    </html>
  );
}
