# Rapport Sprint 1

Branche `cursor/sprint-1-simulation-9ea1`. Aucun déploiement.

## Ce qui fonctionne

Un visiteur ouvre l'accueil en français, choisit le scénario « Entretien difficile avec un technicien IT », joue le dialogue et les trois décisions, lit un débriefing explicable, rejoue depuis une décision et retrouve l'indicateur d'origine intact. Le coach affiché est simulé. Aucune clé de modèle n'est requise.

L'indicateur est déterministe : 66 pour `d1_a`, `d2_a`, `d3_a` et 11 pour `d1_b`, `d2_b`, `d3_b`. Formule dans `docs/DECISIONS.md`.

## Architecture retenue

Monolithe Next.js 16.4.3 (App Router, React 19.3.1, TypeScript 5.9.3 strict, Tailwind 4.3.3). PostgreSQL via Drizzle 0.45.4. Validation Zod 4.6.7. Authentification better-auth 1.7.14. Tests Vitest 5.0.5 et Playwright 1.64.1.

Modules : `src/modules/scenarios`, `simulation`, `learning`, `ai-coach`, `identity`, `analytics`. Le moteur n'écrit rien. La persistance est dans `src/db`. L'IA ne change ni les règles, ni le scénario publié, ni `final_score`.

`cacheComponents` est resté désactivé. Il n'y a pas de `loading.tsx` racine, parce que Next.js 16 commencerait alors la réponse en 200 avant `notFound()`.

## Fichiers

Spécifications déplacées à la racine du dépôt vers `docs/` :

- `docs/01_CAHIER_DES_CHARGES.md`
- `docs/02_MVP_BACKLOG.md`
- `docs/03_ARCHITECTURE_TECHNIQUE.md`
- `docs/04_MASTER_PROMPT_CURSOR.md`
- `docs/05_SCENARIO_PILOTE.json`

Documents de ce sprint : `docs/IMPLEMENTATION_PLAN.md`, `docs/DECISIONS.md`, ce rapport, et `README.md`.

Application et outillage ajoutés :

- `package.json`, `package-lock.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `vitest.config.ts`, `playwright.config.ts`, `drizzle.config.ts`
- `.env.example`, `.gitignore`, `AGENTS.md`
- `Dockerfile`, `compose.dev.yml`, `compose.prod.yml`
- `.github/workflows/ci.yml`
- `drizzle/0000_huge_martin_li.sql` et `drizzle/meta/` (migration, clé étrangère de branche, trigger d'immuabilité)
- `scripts/migrate.mjs`, `scripts/validate-scenario.ts`
- `src/app/` : accueil, catalogue, détail, démo, connexion, confidentialité, admin, erreurs, API santé, auth, scénarios et tentatives
- `src/components/` : lecteur, carte scénario, compte, formulaire d'auth, taille de texte, état de chargement
- `src/db/` : schéma, client, dépôt, seed
- `src/lib/` : config, erreurs, HTTP, i18n
- `src/modules/` : les six modules
- `tests/unit/engine.test.ts`, `tests/integration/attempts.test.ts`, `tests/e2e/demo.spec.ts`, `tests/setup.ts`
- `public/.gitkeep`

Le groupe de routes `src/app/(browse)/` porte le chargement des pages qui ne répondent pas 404. Les pages `scenarios/[slug]`, `demo/[slug]` et `admin` restent en dehors.

## Commandes et résultats

Machine : Node v22.23.4, npm 10.9.9, PostgreSQL 16.15 local. `docker` est absent. Les commandes ont été lancées dans `/workspace` le 31 octobre 2026.

| Commande | Résultat |
| --- | --- |
| `npm run lint` | exit 0, ESLint 9.39.5, aucune erreur |
| `npm run typecheck` | exit 0, `tsc --noEmit` |
| `npm run scenario:validate` | exit 0. `entretien-difficile-technicien-it valide — 3 décisions, 2 fins, 5 compétences.` |
| `npm test` | exit 0. Vitest 5.0.5, 2 fichiers, 15 tests passés, 1,42 s |
| `npm run build` | exit 0. Next.js 16.4.3 (Turbopack), compilation 2,3 s, TypeScript 3,4 s. Toutes les routes applicatives sont dynamiques |
| `npm run test:e2e` | exit 0. 3 tests Chromium passés en 3,8 s |

Détail Vitest : validation du graphe, transitions cassées, déterminisme, idempotence, choix invalide, rejeu, version épinglée, absence des effets avant le débriefing, coach sans réseau, isolement des acteurs, double soumission, 404 d'un autre acteur, rejeu persisté, publication d'une v2, trigger d'immuabilité.

Détail Playwright : parcours complet jusqu'à l'indicateur 66, rechargement, rejeu clavier vers l'indicateur 11 avec l'originale à 66, accueil en 360 px sans défilement horizontal, `/admin` en 404, slug inconnu en 404.

Après `npm run build` et `npm run start`, `curl` a mesuré : `/api/health` 200, `/` 200, `/admin` 404, `/scenarios/scenario-inexistant` 404, `/page-inconnue` 404. Le corps 404 contient « Cette page n'existe pas. » et ne contient pas le titre d'administration.

`POST /api/auth/sign-up/email` a répondu 200. Le corps indiquait `role: learner`. Le jeton de session n'est pas recopié ici. Cette inscription n'existe que dans la base locale de la machine d'exécution. Les tests Playwright ne passent pas par le formulaire de connexion.

Un premier `tsc --noEmit`, lancé juste après le déplacement des pages dans `(browse)`, a échoué sur des types `.next` périmés. `npm run build` les a régénérés. Le `tsc` suivant est celui du tableau.

Vitest affiche un avertissement : `vitest.config.ts` est chargé en CommonJS alors qu'il contient de l'ESM. Les tests passent. La migration Drizzle a aussi journalisé que le schéma `drizzle` existait déjà.

## Critères d'acceptation

- Accueil responsive, catalogue, page scénario, lecteur (dialogue, décisions, conséquences, débriefing) : couverts par l'interface et par le test Playwright du parcours.
- Rejeu non destructif : test unitaire, test d'intégration, et Playwright (originale toujours à 66).
- Scénario pilote semé depuis `docs/05_SCENARIO_PILOTE.json` : `npm run db:seed` et les tests d'intégration, qui migrent puis sèment.
- Validation JSON et graphe : `npm run scenario:validate` et les tests de graphe.
- Déterminisme, idempotence, rejeu : tests Vitest.
- Docker Compose de dev et Dockerfile : fichiers présents. Non exécutés, démon Docker absent.
- GitHub Actions : `.github/workflows/ci.yml` enchaîne lint, types, validation, Vitest, build et Playwright avec Postgres 18.6. Le workflow n'a pas été exécuté sur GitHub dans cet environnement.
- Documentation d'installation : `README.md`.
- Français, dictionnaire anglais prêt, pas de score RH : `src/lib/i18n.ts` et la formule d'indicateur.
- Clés seulement côté serveur, mock sans modèle : `.env.example` et `src/modules/ai-coach/provider.ts`. Le test unitaire vérifie qu'aucun `fetch` n'est appelé.
- Accessibilité de base : lien d'évitement, focus visible, radios au clavier dans le test, états vide et erreur sur l'accueil et le catalogue, chargement pendant les actions du lecteur.

## Problèmes restants

- Docker et Compose n'ont pas tourné. L'image `postgres:18.6` et le montage `/var/lib/postgresql` n'ont pas été vérifiés par un conteneur. La migration a été vérifiée sur PostgreSQL 16.15.
- Le workflow GitHub Actions n'a pas encore de résultat CI.
- `compose.prod.yml` n'a pas été lancé et ne doit pas servir de déploiement.
- La connexion better-auth est branchée et une inscription a répondu 200, mais elle n'a pas de test de bout en bout. L'historique privé complet, l'export et la suppression sont le Sprint 2.
- Le rate limit est en mémoire, par processus.
- Playwright ne lance que Chromium. Safari iOS et Android restent pour le Sprint 4.
- Avertissement Vitest sur la config CommonJS. Non bloquant.
- Aucun correctif `npm audit` n'a été appliqué.
