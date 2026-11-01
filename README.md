# Aicip

Studio pour transformer un sujet en vidéo explicative animée. Le motion design est décrit par un document JSON, pas par une vidéo opaque. La spécification courante est dans `docs/PRODUCT_VISION_V2.md`.

La simulation de conversations difficiles reste dans le dépôt. Ce n'est plus le produit. Son ancien mode d'emploi est plus bas.

## Studio

La preuve locale n'appelle pas de modèle. Elle joue un storyboard déjà composé : la gestion d'un incident IT.

```bash
npm ci
npm run motion:storyboard
npm run dev
```

Ouvrir `http://127.0.0.1:3000/explain`.

L'export MP4, un rendu à la fois, écrit `out/incident-it.mp4` (non versionné) :

```bash
npm run motion:render
```

`npm test` inclut `tests/unit/motion.test.ts`. `motion:storyboard` régénère les voix avec espeak-ng et réécrit le JSON. Ne pas lancer `compose.prod.yml`.

## Documents courants

- `docs/PRODUCT_VISION_V2.md`
- `docs/PRODUCT_REQUIREMENTS_V2.md`
- `docs/MVP_SCOPE_V2.md`
- `docs/SYSTEM_ARCHITECTURE_V2.md`
- `docs/AI_GENERATION_PIPELINE.md`
- `docs/MOTION_DESIGN_ENGINE.md`
- `docs/SCENE_SCHEMA_SPECIFICATION.md`
- `docs/RENDERING_ARCHITECTURE.md`
- `docs/INFRASTRUCTURE_CAPACITY_PLAN.md`
- `docs/SECURITY_AND_COST_CONTROLS.md`
- `docs/DEVELOPMENT_ROADMAP_V2.md`
- `docs/MIGRATION_FROM_V1.md`
- `docs/ACCEPTANCE_CRITERIA_V2.md`

## Simulation historique

Les spécifications d'origine restent dans `docs/` :

- `docs/01_CAHIER_DES_CHARGES.md`
- `docs/02_MVP_BACKLOG.md`
- `docs/03_ARCHITECTURE_TECHNIQUE.md`
- `docs/04_MASTER_PROMPT_CURSOR.md`
- `docs/05_SCENARIO_PILOTE.json`
- `docs/IMPLEMENTATION_PLAN.md`
- `docs/DECISIONS.md`
- `docs/SPRINT1_REPORT.md`

## Prérequis

- Node.js 22 (vérifié ici : 22.23.4) et npm 10
- PostgreSQL local, ou Docker pour le service décrit dans `compose.dev.yml`

Le mot de passe `aicip` de `.env.example` et de Compose est un secret de développement local. Il ne doit pas servir en production. `BETTER_AUTH_SECRET` doit être une chaîne aléatoire d'au moins 32 caractères. L'application refuse une valeur qui commence par `replace-with`.

## Lancer en local

```bash
cp .env.example .env
openssl rand -base64 32
```

Coller le résultat dans `BETTER_AUTH_SECRET` du fichier `.env`. Ne pas commiter `.env`.

Base locale avec Docker, si le démon est disponible :

```bash
docker compose -f compose.dev.yml up -d postgres
```

Sans Docker, créer une base PostgreSQL 16+ dont l'URL correspond à `DATABASE_URL` (utilisateur, base et mot de passe locaux `aicip`).

Puis :

```bash
npm ci
npm run db:migrate
npm run db:seed
npm run dev
```

Ouvrir `http://127.0.0.1:3000`. Le parcours de démo est « Entretien difficile avec un technicien IT ». Le coach est simulé (`AI_COACH_MODE=mock`) et n'appelle aucun modèle.

`compose.prod.yml` n'est pas une procédure de mise en production. Ne pas l'exécuter pour publier le service.

## Vérifier

```bash
npm run lint
npm run typecheck
npm run scenario:validate
npm test
npm run build
npm run start
npm run test:e2e
```

`npm run test:e2e` démarre `npm run start` si le port 3000 est libre, et réutilise un serveur déjà lancé hors CI. Playwright utilise Chromium.

## Scénario et données

`npm run db:seed` publie la version 1 du scénario pilote si son empreinte est nouvelle. Une version déjà publiée n'est pas réécrite : un trigger PostgreSQL refuse la mutation du contenu publié. Rejouer une tentative crée une nouvelle branche et conserve l'originale.

Le compte (page `/compte`) garde l'historique, l'export JSON et la suppression. Les tentatives sans compte restent sur le navigateur et ne sont pas fusionnées à la connexion. `ACCOUNT_RETENTION_DAYS` (défaut 365) borne la conservation du journal de suppression.

```bash
npm run admin:grant -- learner@example.com
npm run account:purge
```

`admin:grant` n'accepte qu'un compte déjà créé. Aucun mot de passe d'administrateur n'est semé.

`docs/OPERATIONS.md` décrit une préproduction possible. Ce n'est pas une autorisation de déploiement. Playwright couvre Chromium, Chrome mobile et WebKit. Safari iOS et Android réels restent une vérification manuelle.
