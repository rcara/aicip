# Interactive Soft Skills Academy

Simulation courte pour s'exercer aux conversations difficiles : pause, décision, rejeu, débriefing. L'interface est en français. Les chaînes d'interface existent aussi en anglais ; le scénario publié reste en français.

Ce dépôt est un monolithe Next.js. Le Sprint 1 se lance en local, sans modèle de langage externe. Aucun déploiement de production n'est prévu par ces commandes.

Les spécifications produit sont dans `docs/` :

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
