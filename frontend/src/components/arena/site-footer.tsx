import Link from "next/link";

/**
 * Colophon — the catalogue's back cover. Repeats the index, states plainly
 * what the data is, and closes the page on the same ink plate the masthead
 * opened it with.
 */

const INDEX = [
  { href: "/", label: "Floor" },
  { href: "/companies", label: "Companies" },
  { href: "/products", label: "Products" },
  { href: "/connections", label: "Connections" },
  { href: "/messages", label: "Messages" },
] as const;

export function SiteFooter() {
  return (
    <footer className="bg-plate text-plate-muted">
      <div className="mx-auto grid w-full max-w-[1400px] gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.2fr_1fr_1.2fr] lg:px-8">
        <div className="space-y-4">
          <Link
            href="/"
            className="arena-nameplate inline-block border border-plate-border px-2.5 py-1.5 text-sm font-semibold text-plate-foreground outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-plate-foreground"
          >
            Arena
          </Link>
          <p className="max-w-xs text-sm leading-relaxed">
            The B2B network where brands, suppliers, manufacturers, processors
            and raw material producers publish what they can actually make.
          </p>
        </div>

        <nav aria-label="Footer index">
          <h2 className="arena-data mb-3 text-plate-muted/80">Index</h2>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            {INDEX.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-plate-muted transition-colors outline-none hover:text-plate-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-plate-foreground"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="arena-data mb-3 text-plate-muted/80">About the data</h2>
          <p className="max-w-sm text-sm leading-relaxed">
            Arena is a demonstration prototype. Every company, product,
            traceability chain, message and notice is fictional; no real
            company is represented. Data lives in memory and resets on
            restart.
          </p>
        </div>
      </div>
      <div className="border-t border-plate-border">
        <p className="arena-data mx-auto w-full max-w-[1400px] px-4 py-4 text-plate-muted/80 sm:px-6 lg:px-8">
          Arena · Demonstration prototype · Textile &amp; Construction · 2026
        </p>
      </div>
    </footer>
  );
}
