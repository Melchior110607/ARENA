# Product

<!-- impeccable:product-schema 1 -->

<!--
Written by the design foundation agent from the project brief, CLAUDE.md and the
codebase (src/lib/types.ts, backend API, existing routes). No user interview was
possible in this session; facts marked [inferred] were derived from that evidence
rather than confirmed by the user.
-->

## Platform

web

## Stack

Decided (not delegated): Next.js 16 (App Router) · React 19 · TypeScript ·
Tailwind CSS v4 (tokens in `@theme`, no `tailwind.config.js`) · shadcn/ui
(radix-nova preset, installed in `frontend/src/components/ui/`) · lucide-react ·
FastAPI backend serving fictional in-memory data on port 8100, frontend dev on
port 3100. Fonts only via `next/font/google` (self-hosted at build); the
prototype must run fully offline after install — no CDN, no remote images, no
external URLs of any kind in the rendered HTML.

## Users

- **Primary:** a sourcing lead at a small European brand (textile or
  construction) who needs a mill, factory or processor that will take a small
  order (~300 pieces) and can document where the material came from. She works
  through filters, capability sheets and traceability chains; her job is
  finding, qualifying and tracking suppliers.
- **Secondary:** the supplier side — mills, manufacturers, processors and raw
  material producers presenting their real capabilities (machines, processes,
  capacity, MOQ, certifications) to be found.
- **Demo audience:** partners and investors watching the prototype being
  driven. The interface itself is the argument for the product. [inferred from
  the brief: this is a demonstration prototype, not a production app]

## Product Purpose

Arena is a B2B network prototype connecting brands, suppliers, manufacturers,
processors and raw material producers across two sectors: textile and
construction. Professional directory × B2B marketplace × LinkedIn, for
industrial supply chains. Success for the prototype: a partner or investor
watching a demo understands the mechanism within minutes and finds the
interface credible enough to believe the product could exist.

## Positioning

Two claims a neighboring product could not truthfully copy:

1. Companies publish what they can **actually make** — machines, processes,
   production capacity, minimum order quantity, customization options,
   certifications — not marketing copy.
2. Products carry the **traceability chain** that produced them, stage by
   stage, company by company, each stage labelled `declared` → `confirmed` →
   `verified`. The verification gradient is the honest core: it admits what is
   not proven. Declared = stated by the company; confirmed = corroborated by
   the company upstream; verified = checked by a third party.

## Operating Context

- Ten routes, all live against the FastAPI backend: `/` (persuade-mode home),
  `/companies` (faceted directory), `/companies/[id]` (capability sheet +
  products + network), `/products` (faceted catalogue), `/products/[id]` (spec
  sheet), `/products/[id]/traceability` (the chain), `/connections`
  (accepted / incoming / outgoing / suggestions), `/messages` (conversations
  with company/product/opportunity context), `/opportunities` (open sourcing
  briefs), `/pipeline` (6-stage relationship kanban: to discover → contacted →
  connected → in discussion → evaluation → active partner).
- No auth. A **persona switcher** ("Viewing as …", cookie-backed) gives
  Connections, Messages and Pipeline a subject. It must remain prominent — it
  is how the demo changes point of view.
- The value chain reads upstream → downstream: raw material → processing →
  manufacturing → distribution → brand (`CHAIN_POSITION_ORDER`).
- All data is fictional and in memory; mutations (connect, message, move
  pipeline card, express interest) hit the real API but persist nothing across
  restarts. A permanent fictional-data disclosure must stay visible.
- Demo scene: shown on a laptop or projector to partners/investors, and
  self-driven exploration on desktop. Desktop-first, correct down to mobile.
  [inferred]

## Capabilities and Constraints

- Data model is fixed in `frontend/src/lib/types.ts` (mirrors
  `backend/app/models.py`): Company (with `Capabilities`: product_types,
  materials, machines, processes, production_capacity, customization, moq,
  certifications), Product (specs, processes, applications, moq, lead_time,
  certifications), TraceabilityChain/Step, Connection, Conversation,
  Opportunity, Relationship, Facets. Change one, change the other — the
  frontend does not own the schema.
- **No images anywhere, ever.** Company visuals are monogram + tone
  (`logo: {monogram, tone}`, tone 0–5); product visuals are generated patterns
  (`visual: {pattern, tone}`, pattern ∈ weave, knit, yarn, fibre, grain,
  aggregate, sheet, panel, glass, batt). All rendered as local SVG.
- Display labels for every enum ship in `types.ts`; the UI shows those labels,
  never machine values.
- Statuses (traceability, connection, relationship) must never be encoded by
  color alone.
- All interface copy in English.
- Off-limits to design work: `src/lib/**`, `next.config.ts`, `package.json`,
  `Dockerfile`, `backend/**`.
- `npx tsc --noEmit` and `npm run build` must pass at every hand-off.

## Brand Commitments

- Name: **Arena**. Wordmark only — no image logo exists or will exist.
- Register: industrial, European, evidence-driven, slightly severe. The
  interface should feel like it belongs to the world of mills, factories and
  material certificates, not to consumer social software. [binding, from brief]
- Banned outright: violet/blue gradients, glassmorphism as default, Inter,
  emoji as icons, identical card grids repeated across pages, decorative
  animation without purpose, and the three stock AI looks (cream +
  high-contrast serif + terracotta; near-black + one acid accent; broadsheet
  hairlines + zero radius). [binding, from brief]

## Evidence on Hand

- Full fictional dataset served by the backend: companies with complete
  capability sheets, products with specs and certifications, traceability
  chains with per-stage statuses and notes, conversations, opportunities,
  relationships. This is real demonstration content — design for its actual
  density, not for lorem ipsum.
- No real company is represented and none may appear to be. No testimonials,
  customer logos, pricing or benchmarks exist; none may be invented.

## Product Principles

1. **Evidence over claim.** Every surface leads with verifiable specifics —
   machines, MOQs, certifications, chain stages — and the UI's tone follows:
   labelled, measured, exact.
2. **Admit what is not proven.** The declared/confirmed/verified gradient is
   the product's honesty; the design must make the difference legible at a
   glance, never flatten it, and never dress `declared` up as `verified`.
3. **The chain is the mental model.** Upstream → downstream ordering
   (raw material → brand) structures how companies, products and traceability
   are read everywhere it appears.
4. **A working tool, demonstrated.** Surfaces are Operate-mode: scanability,
   density and task completion outrank expression. The home page alone is
   Persuade. Being a demo raises the craft bar; it does not license decoration.
5. **Fiction, disclosed.** The prototype never hides that its data is
   fictional; the disclosure is part of the product's honesty, designed rather
   than apologised for.
