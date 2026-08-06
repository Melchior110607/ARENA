---
version: 1
slug: "frontend-src-app-page-tsx"
primary_target: "frontend/src/app/page.tsx"
related_targets: ["frontend/src/components/arena/home-folio.tsx","frontend/src/components/arena/chain-figure.tsx"]
---

# Home — the two-sector folio

Scope: `/` only. Mode: **Persuade** — the one Persuade surface in an Operate product.

Audience and job: a sourcing lead at a small European brand, plus investors/partners watching a demo. One viewport must say what Arena is and why it is different, then hand off into `/companies`.

Chosen direction (seed b8fbe43c, grounded candidate 6/7): **the two-sector folio with the living chain as its plate.** The catalogue opens in two sections — Textile and Construction — governed by one tablist; every data section below it (Fig. 1, specimen record, product register, open briefs) re-sets when the section turns. The brief-pinned signature interaction is Fig. 1: the five chain positions drawn as catalogue apparatus (bale, mill rolls, press, crate, nameplate), each station a tab with live company counts opening onto the real companies at that stage, linking into `/companies?sector=&chain_position=`.

Memorable moment: "One product, on the record" (Fig. 2) — a real traceability chain per sector (textile: heavyweight-tshirt-cmt; construction: recycled-precast-panel) with per-stage seals and notes that admit what is declared-only.

Proof/content rules: all content from the live API; specimen fetch degrades per-sector (never crashes the page); exactly one Signal-filled action (hero CTA); motion only on folio turn (`turned` gate) — never on load; chain figure scrolls with snap on mobile.

Unresolved: sector choice is local state (not deep-linked); "recommended suppliers" is fulfilled as the stage register, not a curated list.
