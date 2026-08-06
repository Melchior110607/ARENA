/*
 * DIRECTION CONTRACT — home page (Persuade)
 *
 * THESIS: The home page IS the value chain, published in two catalogue
 * sections. It refuses the category default — slogan hero over a gradient,
 * then a numbered how-it-works timeline.
 * OWN-WORLD: Arena's works-catalogue grammar — mill-white ground, ink,
 * one vermilion Signal, Archivo + Fragment Mono, drawn evidence only
 * (monograms, material swatches, seals, catalogue apparatus glyphs).
 * STORY: A sourcing lead or investor reads the two claims, turns the
 * catalogue section, works the chain figure, sees a real traceability
 * record admit what is not proven, and leaves into /companies.
 * FIRST VIEWPORT: Headline pair + support + one Signal action top-left;
 * below, the sector register and Fig. 1 — five drawn stations with live
 * counts — opening onto the company register for the selected stage.
 * FORM: Two-sector folio, candidate 6 of 7 on the grounded list,
 * seed key b8fbe43c; the brief-pinned living chain fused as its plate.
 * FINISH: unreviewed and undocumented is unfinished; this build ends with
 * the finish review, the verdict, and DESIGN.md.
 */

import Link from "next/link";

import { HomeFolio, type Specimen } from "@/components/arena/home-folio";
import { StatusSeal } from "@/components/arena/status-seal";
import { Button } from "@/components/ui/button";
import { getCompanies, getNotices, getProducts, getTraceability } from "@/lib/api";
import type { Sector, TraceabilityChain } from "@/lib/types";

/** One specimen record per catalogue section — real chains, chosen for range. */
const SPECIMEN_PRODUCT_IDS: Record<Sector, string> = {
  textile: "heavyweight-tshirt-cmt",
  construction: "recycled-precast-panel",
};

const HOW_IT_WORKS: { title: string; body: string }[] = [
  {
    title: "Publish capability",
    body: "A company's page is its capability sheet: machines, processes, production capacity, minimum order quantity, certifications. What it can actually make, on the record.",
  },
  {
    title: "Search by what is real",
    body: "Brands filter the directory by material, process, chain position and certification — not by who writes the best marketing copy.",
  },
  {
    title: "Deal directly",
    body: "Connections, messages and sourcing briefs run between the companies themselves. Arena is the register, not the middleman.",
  },
  {
    title: "Trace every stage",
    body: "Each product carries the chain that produced it, company by company. Every stage is stamped with one of three grades of proof — and the grade is allowed to be low.",
  },
];

export async function PublicLanding() {
  const [companies, products, notices, textileChain, constructionChain] = await Promise.all([
    getCompanies(),
    getProducts(),
    getNotices({ kind: "need" }),
    // A missing record degrades that sector's specimen section, never the page.
    getTraceability(SPECIMEN_PRODUCT_IDS.textile).catch(() => null),
    getTraceability(SPECIMEN_PRODUCT_IDS.construction).catch(() => null),
  ]);

  const productById = new Map(products.map((p) => [p.id, p]));
  const specimenFor = (sector: Sector, chain: TraceabilityChain | null): Specimen | null => {
    const product = productById.get(SPECIMEN_PRODUCT_IDS[sector]);
    return product && chain ? { product, chain } : null;
  };
  const specimens: Record<Sector, Specimen | null> = {
    textile: specimenFor("textile", textileChain),
    construction: specimenFor("construction", constructionChain),
  };

  const countryCount = new Set(companies.map((c) => c.country)).size;

  return (
    <div>
      {/* ----------------------------------- Hero ----------------------------------- */}
      <section className="pt-2 pb-10">
        <h1 className="max-w-3xl text-[2rem] leading-[1.15] font-semibold tracking-[-0.01em] text-balance lg:text-[2.75rem]">
          Publish what you can make.
          <br />
          Prove where it came from.
        </h1>
        <p className="mt-4 max-w-2xl text-base text-muted-foreground">
          Arena is a B2B network for industrial supply chains. {companies.length} companies in{" "}
          {countryCount} countries — brands, mills, factories, processors and raw-material
          producers across textile and construction — publish machines, capacity and minimum
          orders instead of marketing copy, and every product can carry the chain that made it,
          stage by stage.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <Button asChild>
            <Link href="/companies">Browse the {companies.length} companies</Link>
          </Button>
          {(specimens.textile || specimens.construction) && (
            <Link
              href="#specimen"
              className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
            >
              See a chain hold up ↓
            </Link>
          )}
        </div>
      </section>

      {/* --------------------- The folio: two sections, live data --------------------- */}
      <HomeFolio
        companies={companies}
        products={products}
        notices={notices}
        specimens={specimens}
      />

      {/* -------------------------------- How it works -------------------------------- */}
      <section aria-labelledby="how-heading" className="mt-16" id="how-it-works">
        <h2 id="how-heading" className="text-xl leading-tight font-semibold">
          How Arena works
        </h2>
        <div className="mt-4 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
          {HOW_IT_WORKS.map((item) => (
            <div key={item.title} className="border-t border-foreground/25 pt-3">
              <h3 className="text-base font-medium">{item.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{item.body}</p>
              {item.title === "Trace every stage" && (
                <ul className="mt-3 space-y-1.5" aria-label="The three grades of proof">
                  <li className="flex items-center gap-2">
                    <StatusSeal status="declared" showLabel />
                    <span className="text-xs text-muted-foreground">— stated by the company</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <StatusSeal status="confirmed" showLabel />
                    <span className="text-xs text-muted-foreground">— countersigned upstream</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <StatusSeal status="verified" showLabel />
                    <span className="text-xs text-muted-foreground">— checked by a third party</span>
                  </li>
                </ul>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------ Close ----------------------------------- */}
      <section className="mt-16 border-t pt-8 pb-2">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="max-w-xl text-base font-medium">
            Sourcing starts with knowing who can actually make it.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link href="/companies">Browse companies</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/products">Browse products</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
