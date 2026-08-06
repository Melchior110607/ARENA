---
name: Arena
description: The B2B network for industrial supply chains, set in the grammar of the mid-century European works catalogue.
colors:
  ink: "oklch(0.24 0.012 260)"
  mill-white: "oklch(0.965 0.004 110)"
  plate-white: "oklch(0.995 0.002 110)"
  signal: "oklch(0.5 0.16 33)"
  steel: "oklch(0.46 0.022 255)"
  seal-green: "oklch(0.47 0.09 168)"
  ochre: "oklch(0.5 0.1 78)"
  crimson: "oklch(0.47 0.19 15)"
  plate: "oklch(0.24 0.012 260)"
  plate-foreground: "oklch(0.955 0.004 110)"
  plate-muted: "oklch(0.76 0.015 250)"
  plate-signal: "oklch(0.64 0.16 36)"
  border-rule: "oklch(0.885 0.006 110)"
  field-rule: "oklch(0.62 0.015 255)"
  tone-0: "oklch(0.88 0.015 250)"
  tone-0-deep: "oklch(0.4 0.045 250)"
  tone-1: "oklch(0.9 0.035 40)"
  tone-1-deep: "oklch(0.48 0.14 33)"
  tone-2: "oklch(0.91 0.045 85)"
  tone-2-deep: "oklch(0.46 0.09 78)"
  tone-3: "oklch(0.9 0.03 165)"
  tone-3-deep: "oklch(0.42 0.08 168)"
  tone-4: "oklch(0.89 0.025 230)"
  tone-4-deep: "oklch(0.4 0.07 240)"
  tone-5: "oklch(0.9 0.025 55)"
  tone-5-deep: "oklch(0.42 0.06 50)"
typography:
  display:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "2rem"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.25
  title:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: 1.4
  body:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Fragment Mono, ui-monospace, monospace"
    fontSize: "0.6875rem"
    fontWeight: 400
    letterSpacing: "0.08em"
  nameplate:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    letterSpacing: "0.16em"
    fontVariation: "'wdth' 125"
rounded:
  sm: "2px"
  md: "3px"
  lg: "4px"
  xl: "6px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  "2xl": "48px"
components:
  button-primary:
    backgroundColor: "{colors.signal}"
    textColor: "oklch(0.985 0.005 90)"
    rounded: "{rounded.lg}"
    height: "32px"
    padding: "0 10px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    height: "32px"
    padding: "0 10px"
  badge-chip:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    height: "20px"
    padding: "2px 6px"
  badge-signal:
    backgroundColor: "{colors.signal}"
    textColor: "oklch(0.985 0.005 90)"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    height: "20px"
    padding: "2px 6px"
  input-field:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    height: "32px"
    padding: "4px 10px"
---

# Design System: Arena

<!-- Written by the design foundation agent after the foundation build.
     Direction seed 271cd933 (Swiss industrial works catalogue, candidate 3 of 7).
     This file is the authority for every later surface agent. The token source
     of truth is frontend/src/app/globals.css; the frontmatter above mirrors it. -->

## Overview

**Creative North Star: "The Works Catalogue"**

Arena is set in the graphic world of the mid-century European machine-works
catalogue — the identity programs of Sulzer, Geigy and Brown Boveri: cool
coated paper, near-black ink, a strict grid, one vermilion signal colour, and
technical diagrams where other publications would use photographs. It is a
working tool first (Operate mode everywhere except the home page): scanability,
density and familiar affordances outrank expression, and the brand lives in
precise details — the mono data label, the fine inner rule, the seal.

The product's honesty is the design's honesty. Arena's core mechanism is a
verification gradient that admits what is not proven, so the interface never
decorates a claim: every visual is drawn evidence (monogram nameplates,
DIN-style material swatches, verification seals), every status is carried by
geometry before hue, and fictional data is disclosed in the first pixels of
every page.

**Key Characteristics:**
- Cool mill-white ground with near-white plates; ink masthead and footer bookend every page
- One vermilion signal for action and selection; everything else is ink, steel and rules
- A single grotesque (Archivo) at all sizes, with Fragment Mono reserved for data
- All imagery drawn as SVG line work — there is no photography and never will be
- Severe but not brutalist: 4px corners, real borders, flat surfaces, tabular figures

## Colors

An ink-on-coated-paper palette with one industrial signal and three status inks.

### Primary
- **Signal** (`oklch(0.5 0.16 33)` ≈ #AB331C): machine-nameplate vermilion. Primary buttons, active-state underlines (nav, tabs), focus rings, selected states, links that act. It is the only saturated colour allowed to claim attention on a surface.

### Secondary
- **Plate Signal** (`oklch(0.64 0.16 36)`): the same vermilion tuned for the dark ink plate — used only inside the masthead/footer (active nav underline). Never on light ground.

### Tertiary — status inks (always paired with the seal geometry, see Components)
- **Steel** (`oklch(0.46 0.022 255)` ≈ #505964): `declared`. Also the secondary-text colour.
- **Ochre** (`oklch(0.5 0.1 78)` ≈ #825B0C): `confirmed`.
- **Seal Green** (`oklch(0.47 0.09 168)` ≈ #106B51): `verified`. Success states.
- **Crimson** (`oklch(0.47 0.19 15)`): destructive only, and only as tint + text (`bg-destructive/10 text-destructive`), never a solid fill competing with Signal.

### Neutral
- **Ink** (`oklch(0.24 0.012 260)` ≈ #1C1F25): all primary text; the masthead, footer and tooltip plates.
- **Mill White** (`oklch(0.965 0.004 110)` ≈ #F3F4F1): the page ground. Cool coated stock — deliberately not cream.
- **Plate White** (`oklch(0.995 0.002 110)`): cards, popovers, menus.
- **Border Rule** (`oklch(0.885 0.006 110)`): hairline structure between content.
- **Field Rule** (`oklch(0.62 0.015 255)`): input and select borders — darker than decorative rules because a field's boundary is an affordance (≥3:1).

### The tone index (0–5)
Company `logo.tone` and product `visual.tone` map to six plate/ink pairs
(`--tone-N` fill, `--tone-N-deep` drawing ink): steel blue, vermilion, ochre,
viridian, prussian, umber. Use them **only** through the Monogram and
MaterialSwatch components and for chart series (`--chart-1..5` are the deeps).
Every deep-on-fill pair holds ≥4.5:1 in both themes.

### Named Rules
**The One Signal Rule.** Vermilion marks action and selection, nothing else. If a screen is more than ~10% Signal, elements are claiming decisions they cannot make.
**The Two Reds Rule.** Signal (hue 33) acts; Crimson (hue 15) destroys, and only ever as tint + text. They never appear as visual peers on one surface.
**The Geometry Before Hue Rule.** No status — traceability, connection, pipeline — may be encoded by colour alone. The mark, label or position changes first; the hue reinforces.

## Typography

**Display Font:** Archivo (variable, with `wdth` axis; fallback system-ui sans)
**Body Font:** Archivo — one grotesque carries every reading size
**Label/Mono Font:** Fragment Mono (Helvetica-flavoured monospace)

**Character:** A tight neo-grotesque doing calm, technical work at every scale, with the width axis giving the wordmark its expanded nameplate caps (`font-stretch: 125%`, tracked +0.16em, uppercase — the `.arena-nameplate` utility). Fragment Mono is the sound of measurement: article numbers, spec values, statuses, counts, timestamps.

### Hierarchy
- **Display** (600, 2rem, 1.15): page titles. One per page.
- **Headline** (600, 1.25rem, 1.25): section titles.
- **Title** (500, 1rem, 1.4): card and row titles.
- **Body** (400, 0.875rem, 1.5): the app default. Prose measures 65–75ch; tables and dense lists may run wider.
- **Label / Data** (Fragment Mono 400, 0.6875rem, +0.08em, uppercase — the `.arena-data` utility): table headers, spec labels, facet counts, status labels, the disclosure line.

### Named Rules
**The Mono Is Measurement Rule.** Fragment Mono appears only where a value is data — numbers, codes, statuses, labels of record. Never as a decorative "technical" voice for prose.
**The No Eyebrow Rule.** Headings carry their own weight. No kicker or label sits above a heading.

## Layout

The page is a catalogue spread: a slim fictional-data disclosure strip (mono
caps, hairline rule), the ink masthead (bordered ARENA nameplate left, the
"Viewing as" register right, and the index nav row beneath — active surface
underlined in Plate Signal), then content on mill-white, then the ink footer
colophon (description, index, data statement).

- **Container:** max-width 1400px, centered; horizontal padding 16px → 24px (sm) → 32px (lg). The masthead, disclosure, content and footer all share it.
- **Rhythm:** Tailwind's 4px scale. Tight groups at 8px, related blocks at 16–24px, sections at 32–48px. More space above a heading than below it.
- **Density:** desktop-first. Tables may be dense (rows ~40px); filters and facets live above or beside content, never in a drawer on desktop.
- **Responsive:** structural, not fluid — the nav row scrolls horizontally on mobile, the persona register collapses to monogram + chevron below `sm`, grids collapse by breakpoint. Fixed rem type sizes; no clamp() headings.

## Elevation & Depth

Flat by conviction. Depth is conveyed by ink: rules, borders and the contrast
between mill-white ground, plate-white cards and the dark ink plates. Cards
are bordered (`ring-1 ring-foreground/10`), not shadowed. Shadows exist only
where an element genuinely floats — menus, popovers, dialogs — using the stock
shadcn overlay shadows, unmodified.

**The Print Has No Shadows Rule.** If an element is in the page flow, it casts nothing. Only overlays float.

## Shapes

Squared but not severe: the radius scale derives from `--radius: 0.25rem`
(sm 2px · md 3px · lg 4px · xl 6px). Plates and fields sit at 4px; badges at
2px. The recurring device is the **fine inner rule**: a 1px inset stroke at
~40% opacity framing monogram plates and material swatches, the way a
catalogue plate frames its figure. Zero-radius broadsheet geometry and pill
shapes are both off-world (badges are stamped codes, not pills).

## Components

All primitives live in `frontend/src/components/ui/` (shadcn, themed) and
`frontend/src/components/arena/` (the drawn-evidence system). **These two
directories belong to the foundation; surface agents compose them and do not
edit them.**

### Buttons
- **Shape:** 4px radius, h-32px default, text 0.875rem/500.
- **Primary:** Signal fill, near-white text — one per view, the decision.
- **Outline:** the workhorse secondary (border, transparent fill, muted hover).
- **Secondary/Ghost:** quiet plate tints for tertiary actions. **Destructive:** crimson tint + crimson text.
- **Focus:** 3px Signal ring at 50% — never remove it.

### Badges (chips of record)
- **Style:** Fragment Mono 11px uppercase, 2px radius. The default (unmarked) variant is the **outline chip** — certifications, categories, materials, spec codes.
- **State:** the filled **Signal badge** must be requested explicitly (`variant="default"`) and means selection or action state, never a passive label.

### Cards / Containers
- **Corner Style:** ~6px (rounded-xl over the 0.25rem base).
- **Background:** Plate White on Mill White ground; border `ring-foreground/10`; no shadow.
- **Internal Padding:** 16px (`sm` cards 12px).

### Inputs / Fields
- **Style:** transparent fill, 1px Field Rule border, 4px radius, h-32px.
- **Focus:** border swaps to Signal + 3px Signal/50 ring. **Error:** crimson border + ring. **Disabled:** 50% opacity, no pointer.

### Tables (the register)
- **Headers:** Fragment Mono 11px uppercase in Steel; a heavier `foreground/25` rule closes the header row.
- **Rows:** hairline rules, hover tint `muted/50`, tabular figures throughout (set globally).

### Tabs
- **Line variant is the house style:** transparent list, active trigger underlined 2px in Signal with full-ink text; inactive triggers in Steel.

### Navigation
- Masthead nav: 13px/500 on the ink plate; idle Plate Muted, hover Plate Foreground, active = Plate Foreground text **plus** 2px Plate Signal underline (`aria-current="page"`). Focus on the plate uses a 2px Plate Foreground outline.

### Monogram (`components/arena/monogram.tsx`) — signature
`<Monogram logo={company.logo} size={32} />`. The company mark as a foundry
nameplate: tone-fill plate, fine inner rule, monogram struck in the tone's
drawing ink. Never render a company logo any other way.

### MaterialSwatch (`components/arena/material-swatch.tsx`) — signature
`<MaterialSwatch visual={product.visual} />` fills its container (size it with
a wrapper, e.g. `aspect-[4/3]`). Ten materials drawn as catalogue/DIN section
diagrams: weave, knit, yarn, fibre, grain, aggregate, sheet, panel, glass,
batt. `framed={false}` drops the inner rule for flush thumbnails. This is the
product's only "image" — never substitute gradients, icons or stock art.

### StatusSeal (`components/arena/status-seal.tsx`) — THE signature
`<StatusSeal status={step.status} showLabel />`. The verification gradient as
inspection stamps whose geometry changes before their colour: `declared` a
dashed open ring (Steel), `confirmed` a solid ring around a check (Ochre),
`verified` a sealed disc with check inside an outer ring (Seal Green). Use it
wherever a traceability status appears; prefer `showLabel` whenever space
allows. Do not invent alternative status glyphs.

### PersonaSwitcher (`components/arena/persona-switcher.tsx`)
The "Viewing as" register in the masthead. Cookie behaviour is load-bearing —
keep `writePersonaCookie` + `router.refresh()` exactly as implemented.

## Do's and Don'ts

### Do:
- **Do** route every colour through the semantic tokens in `globals.css`; raw hex in a component is a defect.
- **Do** pair every status with the seal geometry or an explicit text label; hue is reinforcement, never the message.
- **Do** use `.arena-data` for labels of record (spec labels, counts, table heads) and tabular figures for any column of numbers.
- **Do** keep one Signal-filled action per view and let outline/ghost carry the rest.
- **Do** design list rows and tables before reaching for card grids; the catalogue is a register, not a mosaic.
- **Do** keep both themes true: every new foreground/background pair ≥4.5:1 (text) or ≥3:1 (affordance), checked in light and dark.
- **Do** respect the motion budget: 150–250ms state transitions (hover, open, selection) with the global reduced-motion clamp; no page-load choreography.

### Don't:
- **Don't** use photography, stock art, gradients-as-imagery, or emoji icons — evidence is drawn (Monogram, MaterialSwatch, StatusSeal, lucide strokes at 1.5–2px).
- **Don't** ship violet/blue gradients, glassmorphism, Inter, cream+serif+terracotta, near-black+acid-accent, or broadsheet hairlines with zero radius — all banned by brief.
- **Don't** put a kicker/eyebrow above any heading, or number sections unless the sequence itself is information (chain stages qualify; marketing sections do not).
- **Don't** repeat one identical card grid across pages — each surface derives its structure from its own data shape.
- **Don't** touch `frontend/src/app/globals.css` or `frontend/src/components/ui/**` from a surface agent; request foundation changes instead.
- **Don't** dress `declared` up as `verified` — visual weight must track the verification gradient (dashed → ringed → sealed), never invert it.
