# Rapport Sprint 2

Branche `cursor/sprint-2-account-privacy-9ea1`, basée sur `cursor/sprint-1-simulation-9ea1`. Aucun déploiement, aucun merge.

## Périmètre

Deux comptes ne se voient pas. Une tentative reprise après une nouvelle session reste la même. Une version publiée s'ajoute sans réécrire la précédente. Les tentatives anonymes restent sur le cookie de démo et ne sont pas fusionnées au compte.

## Fichiers

- `drizzle/0001_account_deletion.sql`, `drizzle/meta/_journal.json` : journal de suppression, compteurs seulement.
- `src/db/schema.ts`, `src/db/repository.ts` : historique, export, suppression, purge, attribution admin, volumes.
- `src/lib/config.ts`, `.env.example` : `ACCOUNT_RETENTION_DAYS`, défaut 365.
- `scripts/grant-admin.ts`, `scripts/purge-accounts.ts`, scripts npm `admin:grant` et `account:purge`.
- `src/app/(browse)/compte/page.tsx`, `src/components/delete-account-form.tsx`.
- `src/app/api/v1/account/export/route.ts`, `src/app/api/v1/account/delete/route.ts`.
- `src/app/admin/page.tsx`, `src/modules/identity/publish.ts` : volumes et publication, après contrôle du rôle.
- `src/modules/identity/session.ts` : un compte fermé n'a plus de session utile.
- `src/app/demo/[slug]/page.tsx` : une tentative d'un autre acteur répond 404.
- `src/lib/i18n.ts`, navigation, connexion, fiche scénario, accueil, `docs/DECISIONS.md`, `README.md`.
- `tests/integration/account.test.ts`, `tests/e2e/account.spec.ts`.

## Commandes

Machine : Node v22.23.4, PostgreSQL 16.15. Docker toujours absent.

| Commande | Résultat |
| --- | --- |
| `npm run lint` | exit 0 |
| `npm run typecheck` | exit 0 |
| `npm run scenario:validate` | exit 0, scénario pilote valide |
| `npm test` | exit 0, 3 fichiers, 19 tests |
| `npm run build` | exit 0, Next.js 16.4.3 |
| `npm run test:e2e` | exit 0, 4 tests Chromium |

Le premier passage Playwright échouait parce que le titre « Compte » correspondait aussi à « Supprimer le compte ». Le test exige maintenant le titre exact. Le second passage est vert, y compris l'isolement de deux comptes, la reprise après déconnexion, l'export, et le 404 d'une tentative étrangère.

## Critères

- Inscription better-auth inchangée : `role` n'est pas saisissable. Vérifié par le test de bout en bout d'inscription.
- Tentative connectée liée à `userId`, hash anonyme nul : test d'intégration.
- Historique de toutes les versions du compte, avec indicateur et lien de reprise : page `/compte` et test Playwright.
- Reprise après une nouvelle session : déconnexion, reconnexion, la même tentative affiche « Continuer ».
- Identifiant étranger : API 404 et page 404.
- Export limité au demandeur, sans note de l'autre compte : intégration et Playwright.
- Suppression : phrase exigée, autre compte intact, scénario publié intact, journal sans le texte de la note.
- `admin:grant` refuse une adresse inconnue et un compte fermé.
- Publication : même numéro et autre contenu refusé ; version 2 insérée ; tentative v1 toujours à 66.
- Volumes d'analytique sans texte de dialogue : page admin, kinds agrégés.
- `/admin` sans rôle admin reste 404 : test Playwright déjà présent.

## Reste ouvert

- Docker et GitHub Actions n'ont pas été exécutés.
- L'écran d'administration n'a pas de test navigateur : la publication est couverte par l'intégration, le 404 visiteur par Playwright.
- La purge n'a pas été lancée via `npm run account:purge` sur une base de démo réelle ; la fonction est couverte par le test d'intégration.
- Safari iOS et Android ne sont pas dans ce sprint.
