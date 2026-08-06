# ARENA

## Vue d'ensemble

Arena est une plateforme B2B qui met en relation **marques**, **fournisseurs**, **fabricants**,
**transformateurs** et **producteurs de matières premières**. Le concept croise l'annuaire
professionnel, la marketplace B2B et le réseau à la LinkedIn. Secteurs couverts : **textile** et
**construction**.

Ce dépôt contient un **prototype de démonstration**, pas un produit commercialisable. Son but est de
valider le concept auprès de futurs utilisateurs, partenaires et investisseurs, et de confirmer quelles
données devront exister dans le produit réel.

Ce que le prototype doit prouver :

1. comment une entreprise est présentée ;
2. quelles informations collecter auprès des fournisseurs et des marques ;
3. comment une marque recherche un fournisseur ;
4. comment fonctionnent les connexions entre entreprises ;
5. comment présenter produits et capacités industrielles ;
6. comment représenter une chaîne de traçabilité.

**Hors périmètre, volontairement :** inscription, authentification, mots de passe, rôles et
permissions, base de données, messagerie réelle, notifications, paiements, abonnements, hébergement de
production, stockage sécurisé, conformité nLPD/RGPD, vérification réelle, CRM, intégration LinkedIn,
recommandation par IA, devis et commandes, tests de charge, garantie de sécurité, scalabilité.

Le code sert de référence visuelle et de source de structures de données pour une future équipe
technique. Il n'est pas une base de production garantie.

## Stack

| Couche | Choix |
|---|---|
| Frontend | Next.js 16 (App Router) · React 19 · TypeScript · **Tailwind CSS v4** · shadcn/ui · lucide-react |
| Backend | Python 3.13 · FastAPI · uvicorn · Pydantic v2 |
| Données | Fichiers JSON chargés en mémoire au démarrage. **Aucune base de données.** Les mutations sont perdues au redémarrage. |
| Conteneurisation | Docker · Docker Compose — un conteneur frontend, un conteneur backend |

**Ports** — le frontend est publié sur `localhost:3100`, le backend sur `localhost:8100`
(3000/3001 et 8000/8001 sont occupés par d'autres projets). Dans le réseau Docker, le backend est
joignable en `http://backend:8000`.

**Langue de l'interface : anglais.** Routes, libellés, copy et valeurs des données fictives sont en
anglais. La documentation du dépôt reste en français.

**Contrainte offline — critique.** Le prototype doit fonctionner sans Internet une fois les
dépendances installées. Donc : polices via `next/font/google` uniquement (auto-hébergées au build,
jamais de `<link>` vers `fonts.googleapis.com`), aucune image ou script distant, logos d'entreprises en
SVG générés localement, icônes via le paquet `lucide-react`.

## Commandes

```bash
# Démonstration — le livrable
docker compose up --build          # → http://localhost:3100

# Développement
cd backend  && uvicorn app.main:app --reload --port 8100
cd frontend && npm run dev -- -p 3100

# Qualité
cd frontend && npm run lint && npx tsc --noEmit
```

## Architecture

```
backend/app/            main.py · models.py · store.py · routers/
backend/data/           companies · products · traceability · connections ·
                        conversations · opportunities · relationships  (.json)
frontend/src/app/       les 10 surfaces (App Router)
frontend/src/components/ui/      primitives shadcn — voir règle d'accès plus bas
frontend/src/components/arena/   composants métier partagés
frontend/src/lib/       api.ts · types.ts · persona.ts
```

### Surfaces

`/` · `/companies` · `/companies/[id]` · `/products` · `/products/[id]` ·
`/products/[id]/traceability` · `/connections` · `/messages` · `/opportunities` · `/pipeline`

### API

`GET /health` · `GET|GET /companies[/{id}]` · `GET|GET /products[/{id}]` ·
`GET /products/{id}/traceability` · `GET /opportunities` · `POST /opportunities/{id}/interest` ·
`GET|POST /connections` · `PATCH /connections/{id}` · `GET /messages[/{conversation_id}]` ·
`POST /messages` · `GET /relationships` · `PATCH /relationships/{id}` · `GET /filters`

### Flux de données

Les lectures côté serveur (RSC) passent par `INTERNAL_API_URL` (`http://backend:8000`). Les appels
depuis le navigateur passent par `NEXT_PUBLIC_API_URL` (`http://localhost:8100`), CORS ouvert côté
FastAPI. Les pages qui lisent des données mutables déclarent `export const dynamic = 'force-dynamic'`.

### Entreprise simulée

Il n'y a pas d'authentification. Un sélecteur « Viewing as … » dans l'en-tête choisit l'entreprise du
point de vue de laquelle on navigue. La valeur est persistée en cookie et transmise au backend en
`?as=<company_id>` par les pages Connections, Messages et Pipeline.

## Conventions

- Données fictives assumées et signalées dans l'UI. Aucune entreprise réelle, aucun chiffre présenté
  comme véridique.
- Pas de hex bruts dans les composants : les couleurs passent par les tokens Tailwind v4 définis dans
  `src/app/globals.css` (`@theme`). Pas de `tailwind.config.js`.
- Les types TypeScript de `src/lib/types.ts` sont le miroir des schémas Pydantic de
  `backend/app/models.py`. Toute modification de l'un impose la modification de l'autre.
- Statuts jamais encodés par la couleur seule (traçabilité, connexions, pipeline).
- Plancher qualité UI : responsive desktop-first jusqu'au mobile, focus clavier visible, contraste
  ≥ 4.5:1, `prefers-reduced-motion` respecté.

---

## Design & UI — règle de délégation obligatoire

**Toute production visuelle est déléguée à un sous-agent.** Cela couvre pages, composants, styles,
tokens, layout, motion, copy d'interface et correctifs visuels — toute modification qui change ce qu'on
voit ou comment on interagit.

Reste hors délégation : `package.json`, `next.config.ts`, `tsconfig.json`, les `Dockerfile`,
`docker-compose.yml`, `src/lib/**`, tout le backend, les données JSON, `CLAUDE.md`, `README.md`.

### Invocation

`Agent` · `subagent_type: "claude"` · `model: "fable"` (Fable 5) · `run_in_background: false`.
Un agent de design à la fois — jamais en parallèle. Bascule sur `model: "opus"` (Opus 5) sur
instruction explicite de l'utilisateur, qui surveille ses crédits lui-même.

### Ce que chaque agent délégué doit faire, dans l'ordre

1. **Charger les skills** : `impeccable` (avec le sous-commande adéquate), puis
   `node .claude/skills/impeccable/scripts/context.mjs --target <surface>` une seule fois, puis
   `frontend-design`, puis `ui-ux-pro-max` avec
   `python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<requête>" --design-system -p "Arena"`.
2. **Chercher l'inspiration — étape bloquante.** Au moins deux requêtes ciblées sur le MCP `21st`
   (`mcp__21st__search`, `mcp__21st__get_inspiration`) **avant d'écrire la moindre ligne d'UI**.
   Le MCP `looba` (`mcp__looba__propose_snippets`) n'est sollicité **que si** les retours de 21st ne
   couvrent pas le besoin. Le rapport final dit ce qui a été retenu de 21st, et pourquoi looba a été
   ouvert le cas échéant.
3. **Respecter l'autorité visuelle** : `DESIGN.md` et `PRODUCT.md` à la racine font foi. Seuls l'agent
   de fondation et l'agent de polish final peuvent modifier `src/app/globals.css` et
   `src/components/ui/**`. Un agent de surface qui a besoin d'une primitive manquante la signale dans
   son rapport au lieu de l'ajouter.
4. **Livrer une interaction signature** par surface, et la documenter. Une grille de cartes plus des
   filtres en `<select>` est un échec : le cahier des charges décrit des fonctionnalités, l'UX reste à
   inventer.

### Interdits (anti-slop)

Dégradé violet/bleu · glassmorphism par défaut · Inter par défaut · emoji en guise d'icônes · hex bruts
dans les composants · grilles de cartes identiques d'une page à l'autre · animation décorative sans
intention. Plus les trois clichés que `frontend-design` identifie comme signatures de l'IA :
crème + serif + terracotta, near-black + accent acide, broadsheet à filets.

### Outillage disponible

| Skill | Usage |
|---|---|
| `impeccable` | 23 commandes (`init`, `shape`, `audit`, `polish`, `critique`, `typeset`, `layout`, `animate`, `harden`, `live`…) |
| `frontend-design` | Direction artistique, typographie, choix non-templatés |
| `ui-ux-pro-max` | 67 styles, 161 palettes, 57 pairings de fonts, 99 guidelines UX, règles d'accessibilité |
| `brand`, `design`, `design-system`, `ui-styling` | Compléments : identité, tokens, systèmes de composants |

| MCP | Usage |
|---|---|
| `21st` | 10 000+ composants React/Tailwind — **source d'inspiration principale, obligatoire** |
| `looba` | Snippets UI HTML/CSS/JS — **secours uniquement**, si 21st ne suffit pas |

Mise à jour des skills : `npx impeccable update` · `uipro update` · `npx skills update`
