# ARENA

> Projet neuf — ce fichier est un squelette. Les sections marquées _(à définir)_ seront remplies
> une fois le stack et l'architecture arrêtés. Relancer `/init` quand du code existera.

## Vue d'ensemble

_(à définir)_ — objectif du produit, utilisateurs cibles, périmètre.

## Stack

_(à définir)_ — framework, langage, styling, base de données, hébergement.

## Commandes

_(à définir)_ — dev, build, test, lint, typecheck.

## Architecture

_(à définir)_ — arborescence, conventions de nommage, découpage des modules.

## Conventions

_(à définir)_ — style de code, gestion d'état, patterns d'erreur, tests.

---

## Design & UI — outillage installé

Ce projet dispose d'un outillage design dédié. **Ne pas produire d'UI générique** (dégradés
violet/bleu, glassmorphism, grilles de cartes identiques, Inter par défaut) : passer par ces outils.

### Skills (installés dans `.claude/skills/` — scope projet)

| Skill | Usage |
|---|---|
| `frontend-design` (Anthropic) | Direction artistique, typographie, choix visuels non-templatés. À charger **avant** d'écrire la première UI. |
| `impeccable` | 23 commandes `/impeccable <cmd>` : `init`, `audit`, `shape`, `craft`, `polish`, `critique`, `typeset`, `colorize`, `layout`, `animate`, `harden`, `live`… Lancer `/impeccable init` en début de projet pour poser le design context. |
| `ui-ux-pro-max` | Bases de données interrogeables : 67 styles UI, 161 palettes, 57 pairings de fonts, 99 guidelines UX, 25 types de charts, règles d'accessibilité (contraste, focus, touch targets). |
| `brand`, `design`, `design-system`, `ui-styling`, `banner-design`, `slides` | Skills complémentaires livrés avec ui-ux-pro-max : identité de marque, design tokens, systèmes de composants, bannières, slides. |

Mise à jour des skills : `npx impeccable update` · `uipro update` · `npx skills update`

### MCP servers (scope user)

| MCP | Usage |
|---|---|
| `21st` (21st.dev) | Recherche dans 10 000+ composants React/Tailwind, génération de composants shadcn/ui. Endpoint HTTP `https://21st.dev/api/mcp`. |
| `looba` | Snippets UI Looba (HTML/CSS/JS) : `propose_snippets`, `list_posts`, `get_post`, `integrate_post`, `get_popular_tags`. Pas de clé API. |

### Ordre de travail recommandé pour toute nouvelle UI

1. `/impeccable init` — établir la direction design du projet (une seule fois).
2. Charger le skill `frontend-design` pour l'intention visuelle avant de coder.
3. Chercher des références concrètes via `21st` et `looba` plutôt que d'improviser.
4. Consulter `ui-ux-pro-max` pour palette, pairing typographique et guidelines UX.
5. `/impeccable audit` puis `/impeccable polish` en passe finale.
