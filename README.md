# Arena — prototype

Arena est un réseau B2B qui met en relation **marques**, **fournisseurs**, **fabricants**,
**transformateurs** et **producteurs de matières premières**, dans le **textile** et la
**construction**.

Ce dépôt contient un **prototype de démonstration**. Il sert à visualiser le fonctionnement futur
d'Arena, tester les parcours principaux et confirmer quelles données devront exister dans le produit
réel. Ce n'est pas une plateforme commercialisable.

**Toutes les données sont fictives.** Aucune entreprise réelle n'est représentée.

---

## Lancement

Prérequis : Docker et Docker Compose.

```bash
docker compose up --build
```

Puis ouvrir **<http://localhost:3100>**.

| Service | URL | Dans le réseau Docker |
|---|---|---|
| Frontend (Next.js) | <http://localhost:3100> | `frontend:3000` |
| API (FastAPI) | <http://localhost:8100> | `backend:8000` |
| Documentation OpenAPI | <http://localhost:8100/docs> | — |

Les ports 3000/3001 et 8000/8001 étant occupés sur la machine de développement, le prototype publie
sur **3100** et **8100**.

Pour arrêter : `docker compose down`.

### Sans Docker

```bash
# API
cd backend
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/uvicorn app.main:app --reload --port 8100

# Frontend, dans un autre terminal
cd frontend
npm install
npm run dev -- -p 3100
```

Une fois les dépendances installées, le prototype fonctionne **sans connexion Internet** : les polices
sont auto-hébergées au build, et il n'y a ni image distante, ni CDN, ni appel externe. Tous les
visuels — logos d'entreprises, matières, sceaux de vérification — sont des SVG générés localement.

---

## Les 10 pages

| Page | Route | Contenu |
|---|---|---|
| Accueil | `/` | Proposition de valeur, la chaîne de valeur en figure interactive, fournisseurs et produits mis en avant, opportunités, fonctionnement d'Arena |
| Annuaire | `/companies` | 16 entreprises, rail de position dans la chaîne, 6 filtres à compteurs vivants |
| Profil d'entreprise | `/companies/[id]` | Informations générales, positionnement, capacités en fiche technique, produits, réseau |
| Catalogue | `/products` | 21 produits, planches matière dessinées, 5 filtres |
| Fiche produit | `/products/[id]` | Spécifications, matières, procédés, applications, quantité minimale, délais, certifications |
| **Traçabilité** | `/products/[id]/traceability` | La chaîne de fabrication étape par étape — pièce maîtresse du prototype |
| Connexions | `/connections` | Connexions établies, demandes reçues et envoyées, suggestions |
| Messagerie | `/messages` | Conversations ancrées à l'enregistrement qui les a ouvertes, rédaction et envoi |
| Opportunités | `/opportunities` | Besoins fictifs publiés par des marques et des fournisseurs |
| Tableau de suivi | `/pipeline` | Six statuts, de « à découvrir » à « partenaire actif » |

### Entreprise simulée

Il n'y a **pas d'authentification**. Le contrôle « Viewing as » dans l'en-tête choisit l'entreprise du
point de vue de laquelle on navigue. Trois entreprises sont disponibles : *Maison Vaudoise* (marque
textile suisse, par défaut), *Atelier Romand Construction* (entreprise de construction) et
*Confecções Douro* (fabricant portugais). Ce choix change ce qu'affichent Connexions, Messagerie et
Tableau de suivi.

### Traçabilité

Quatre chaînes complètes sont publiées, deux par secteur. Chaque étape porte un statut de
vérification fictif :

- **declared** — déclaré par l'entreprise, rien ne le corrobore ;
- **confirmed** — contresigné par l'entreprise située une étape en amont ;
- **verified** — contrôlé par un tiers indépendant.

Le joint entre deux étapes est **dessiné brisé** quand l'étape réceptrice n'est que déclarée : la
faiblesse d'une chaîne est une géométrie, pas une couleur. Le maillon faible est aussi visible que
le maillon fort — c'est le propos.

Produits avec chaîne publiée : `heavyweight-tshirt-cmt`, `natural-dye-linen`,
`recycled-precast-panel`, `flax-insulation-batt`.

---

## Parcours de démonstration

1. Arriver sur l'accueil et parcourir la chaîne de valeur.
2. Ouvrir l'annuaire.
3. Filtrer par secteur et par pays — les résultats changent réellement.
4. Ouvrir le profil d'un fournisseur.
5. Consulter ses capacités et ses produits.
6. Ouvrir une fiche produit.
7. Ouvrir sa chaîne de traçabilité et la parcourir.
8. Envoyer une demande de connexion depuis les suggestions de `/connections`.
9. Ouvrir la messagerie.
10. Envoyer un message fictif — il apparaît immédiatement.
11. Faire changer une relation de statut dans le tableau de suivi.

> Les actions conséquentes (accepter, refuser, se connecter, manifester son intérêt) s'inscrivent
> immédiatement mais laissent **cinq secondes d'annulation** avant d'être validées. En démonstration,
> laisser le compteur se remplir ou changer de page — quitter la page valide l'action.

---

## Stack

| Couche | Choix |
|---|---|
| Frontend | Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui · lucide-react |
| Backend | Python 3.13 · FastAPI · uvicorn · Pydantic v2 |
| Données | Fichiers JSON chargés en mémoire au démarrage |
| Conteneurisation | Docker · Docker Compose |

```
backend/app/        main.py · models.py · store.py · routers/
backend/data/       companies · products · traceability · connections ·
                    conversations · opportunities · relationships  (.json)
frontend/src/app/   les 10 surfaces
frontend/src/components/ui/       primitives shadcn
frontend/src/components/arena/    composants métier et système visuel SVG
frontend/src/lib/   api.ts · types.ts · persona.ts
```

`frontend/src/lib/types.ts` est le miroir exact de `backend/app/models.py`. C'est là que se lit le
modèle de données que le produit réel devra reprendre.

### API

```
GET    /health                          GET    /filters          GET  /personas
GET    /companies                       GET    /companies/{id}
GET    /products                        GET    /products/{id}
GET    /products/{id}/traceability
GET    /opportunities                   POST   /opportunities/{id}/interest
GET    /connections                     POST   /connections      PATCH /connections/{id}
GET    /messages                        GET    /messages/{id}    POST  /messages
GET    /relationships                   POST   /relationships    PATCH /relationships/{id}
```

Les lectures côté serveur passent par le réseau Docker (`backend:8000`), les appels du navigateur par
le port publié (`localhost:8100`). Les deux chemins sont de vraies requêtes HTTP, visibles dans
l'onglet réseau.

### Volume de données fictives

16 entreprises · 21 produits · 4 chaînes de traçabilité complètes · 12 connexions ·
5 conversations · 6 opportunités · 14 relations de suivi.

---

## Limites du prototype

Ce prototype ne comporte volontairement **pas** :

inscription · authentification · mots de passe · rôles et permissions · base de données ·
messagerie réelle · notifications · paiements · abonnements · hébergement de production ·
stockage sécurisé de documents · conformité nLPD/RGPD · système de vérification réel ·
connexion à un CRM · intégration LinkedIn · recommandation par intelligence artificielle ·
devis et commandes · tests de charge · garantie de sécurité · architecture scalable.

**Aucune persistance.** Les connexions, messages, marques d'intérêt et changements de statut
modifient l'état du processus backend et **disparaissent au redémarrage des conteneurs**. C'est le
comportement attendu : il n'y a pas de base de données.

**Les données de vérification sont fictives.** Les statuts *declared / confirmed / verified* illustrent
un mécanisme ; ils ne reposent sur aucun audit.

Le code sert à présenter le concept, tester les parcours, obtenir des retours, confirmer les données
nécessaires et préparer un cahier des charges. Il ne constitue pas une base de production garantie.
Une future équipe technique pourra en reprendre des composants, s'en servir de référence visuelle,
conserver certaines structures de données, ou reconstruire l'architecture.

---

## Design

La direction visuelle est documentée dans [`DESIGN.md`](DESIGN.md) et le contexte produit dans
[`PRODUCT.md`](PRODUCT.md). Le registre est celui du catalogue industriel européen : fond mill-white,
plaques encre, un seul signal vermillon, Archivo et Fragment Mono, et l'ensemble des preuves
dessinées en SVG plutôt que photographiées.

[`CLAUDE.md`](CLAUDE.md) décrit les conventions du dépôt et le protocole suivi pour la production de
l'interface.
