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

## Les pages

| Page | Route | Contenu |
|---|---|---|
| **The Floor** | `/` (connecté) | Le fil : les notices des entreprises connectées, puis celles adressées à votre type d'entreprise. Compositeur de publication en tête |
| Page publique | `/` (visiteur) | L'argumentaire : proposition de valeur, chaîne de valeur en figure interactive, besoins ouverts |
| Notice | `/floor/[id]` | Une publication en permalien, avec son registre d'intérêts |
| Annuaire | `/companies` | 16 entreprises, rail de position dans la chaîne, 6 filtres à compteurs vivants |
| Profil d'entreprise | `/companies/[id]` | Général, positionnement, capacités en fiche technique, produits, réseau, **demande de connexion** |
| Catalogue | `/products` | 21 produits, planches matière dessinées, 5 filtres |
| Fiche produit | `/products/[id]` | Spécifications, matières, procédés, délais, certifications, **demande de connexion au sujet de cet article** |
| **Traçabilité** | `/products/[id]/traceability` | La chaîne de fabrication étape par étape — pièce maîtresse du prototype |
| Connexions | `/connections` | Demandes reçues et envoyées avec leur objet, réseau connecté, suggestions |
| Messagerie | `/messages` | Conversations ancrées à l'enregistrement qui les a ouvertes |

### Le fil et les notices

Une **notice** est une publication. Deux genres :

- **need** — un besoin : ce qu'une entreprise cherche. Porte une région, des compétences attendues, une échéance.
- **offer** — un produit qu'une entreprise met en avant, avec sa planche matière.

Chaque notice déclare **à qui elle s'adresse** parmi les cinq types d'entreprise (marque, fournisseur,
fabricant, transformateur, producteur de matières premières). Une liste vide signifie « ouvert à
tous ». C'est ce qu'aucun réseau généraliste ne fait, et la raison d'être d'un fil sectoriel : le
lecteur voit immédiatement si une publication lui parle.

Le fil se lit en deux registres : d'abord les notices des entreprises connectées, puis un « For you »
classé par un score explicable — adressage, secteur, position en amont dans la chaîne, matières
partagées. La raison de la remontée est imprimée sur chaque notice.

**Publier** : depuis le compositeur en tête du fil, soit un besoin rédigé, soit un produit de son
propre catalogue. Les marques ne possèdent aucun produit dans ce jeu de données — c'est la dynamique
réelle du secteur, et le compositeur le dit franchement plutôt que de masquer le mode.

### Se connecter

Une demande de connexion part de trois endroits et **porte toujours son objet** :

- depuis un **profil d'entreprise** ;
- depuis une **fiche produit** — « je veux vous parler de cet article précis » ;
- depuis une **notice** du fil.

**Accepter ouvre une conversation**, amorcée par la note de la demande et portant le même objet. Être
connecté, ici, veut dire qu'on se parle déjà.

### Entreprise simulée et mode visiteur

Il n'y a **pas d'authentification**. Le contrôle en haut à droite choisit l'entreprise du point de vue
de laquelle on navigue : *Maison Vaudoise* (marque textile suisse, par défaut), *Atelier Romand
Construction* ou *Confecções Douro* (fabricant portugais). Ce choix change le fil, les connexions et
la messagerie.

Le même contrôle permet de **se déconnecter**. En visiteur, `/` affiche la page publique, l'annuaire
et le catalogue restent consultables, et les surfaces réservées aux membres renvoient à l'accueil.
C'est ce qui permet de démontrer les deux faces du produit sans construire d'authentification.

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

1. Se déconnecter depuis l'en-tête : `/` devient la page publique, l'argumentaire.
2. Se reconnecter comme *Maison Vaudoise* : `/` devient le fil.
3. Parcourir les deux registres — les connexions d'abord, le « For you » ensuite, chaque notice
   indiquant à qui elle s'adresse et pourquoi elle est remontée.
4. Publier un besoin adressé aux fabricants et transformateurs — il apparaît en tête du fil.
5. Depuis une notice, demander une connexion à son auteur.
6. Ouvrir l'annuaire, filtrer par secteur et par pays, ouvrir un profil, demander une connexion.
7. Ouvrir une fiche produit, demander une connexion au sujet de cet article.
8. Ouvrir sa chaîne de traçabilité et la parcourir.
9. Basculer sur l'entreprise destinataire, accepter la demande dans `/connections`.
10. Vérifier dans `/messages` qu'une conversation s'est ouverte, portant l'objet et la note d'origine.
11. Répondre — le message apparaît immédiatement.

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
                    conversations · notices  (.json)
frontend/src/app/   les surfaces
frontend/src/components/ui/       primitives shadcn
frontend/src/components/arena/    composants métier et système visuel SVG
frontend/src/lib/   api.ts · types.ts · persona.ts
```

`frontend/src/lib/types.ts` est le miroir exact de `backend/app/models.py`. C'est là que se lit le
modèle de données que le produit réel devra reprendre.

### API

```
GET    /health            GET  /filters              GET  /personas
GET    /feed              ?as=<company_id>           → { from_connections, for_you }
GET    /notices           GET  /notices/{id}         POST /notices
POST   /notices/{id}/interest
GET    /companies         GET  /companies/{id}
GET    /products          GET  /products/{id}        GET  /products/{id}/traceability
GET    /connections       POST /connections          PATCH /connections/{id}
GET    /messages          GET  /messages/{id}        POST /messages
```

Les lectures côté serveur passent par le réseau Docker (`backend:8000`), les appels du navigateur par
le port publié (`localhost:8100`). Les deux chemins sont de vraies requêtes HTTP, visibles dans
l'onglet réseau.

### Volume de données fictives

16 entreprises · 21 produits · 4 chaînes de traçabilité complètes · 15 notices (6 besoins,
9 offres) · 12 connexions · 5 conversations.

---

## Limites du prototype

Ce prototype ne comporte volontairement **pas** :

inscription · authentification · mots de passe · rôles et permissions · base de données ·
messagerie réelle · notifications · paiements · abonnements · hébergement de production ·
stockage sécurisé de documents · conformité nLPD/RGPD · système de vérification réel ·
connexion à un CRM · intégration LinkedIn · recommandation par intelligence artificielle ·
devis et commandes · tests de charge · garantie de sécurité · architecture scalable ·
tableau de suivi des relations (retiré en v2 au profit du modèle réseau).

**Aucune persistance.** Les notices publiées, connexions, conversations, messages et marques
d'intérêt modifient l'état du processus backend et **disparaissent au redémarrage des conteneurs**.
C'est le comportement attendu : il n'y a pas de base de données.

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
