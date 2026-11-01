> **Rapport historique de la simulation.**

# Rapport Sprint 4

Branche `cursor/sprint-4-pilot-quality-9ea1`, basée sur `cursor/sprint-3-bounded-coach-9ea1`. Aucun déploiement. `compose.prod.yml` n'a pas été lancé.

## Périmètre

Le même parcours Playwright (simulation, clavier, rejeu, 360 px, 404 admin, scénario inconnu, formulaire d'intérêt) tourne sur Chromium, Chrome mobile (Pixel 5) et WebKit. Le formulaire d'intérêt est volontaire et ne ferme pas la démo. L'administration compte les volumes déjà prévus, y compris `ai_usage` et l'intérêt, sans adresses et sans prompt. `docs/OPERATIONS.md` décrit une préproduction qui n'est pas lancée.

## Fichiers

- `playwright.config.ts` : projets Chromium, mobile-chrome, WebKit, un worker
- `tests/e2e/demo.spec.ts`, `tests/e2e/account.spec.ts` : intérêt, et attente du 429 better-auth
- `.github/workflows/ci.yml` : installation Playwright de Chromium et WebKit
- `drizzle/0003_interest_signups.sql`, `src/db/schema.ts`, `src/db/repository.ts`
- `src/app/api/v1/interest/route.ts`, `src/components/interest-form.tsx`, page d'accueil
- `src/app/admin/page.tsx` : nombre d'intérêts et statuts de `ai_usage`
- `src/lib/config.ts`, `src/modules/identity/session.ts`, `src/modules/identity/locale.ts` : cookie `Secure` seulement si `BETTER_AUTH_URL` est en `https`
- `src/lib/i18n.ts`, `README.md`, `docs/OPERATIONS.md`, `docs/DECISIONS.md`
- `tests/integration/account.test.ts` : l'intérêt n'a pas d'indicateur

## Commandes

| Commande | Résultat |
| --- | --- |
| `npm run lint` | exit 0 |
| `npm run typecheck` | exit 0 |
| `npm run scenario:validate` | exit 0, scénario pilote valide |
| `npm test` | exit 0, 4 fichiers, 24 tests |
| `npm run build` | exit 0, Next.js 16.4.3, route `/api/v1/interest` |
| `npx playwright install --with-deps webkit` | exit 0 |
| `npm run test:e2e` | exit 0, 15 tests, 1 worker, 26,4 s |

Les 15 tests couvrent Chromium, mobile-chrome et WebKit : isolation de deux comptes, simulation jusqu'aux indicateurs 66 puis 11, rejeu, débordement à 360 px, admin 404, scénario inconnu 404, formulaire d'intérêt puis accès à la démo.

`fuser` n'est pas installé sur cette machine. Playwright a servi le build qui contient le correctif de cookie : le parcours WebKit aboutit au débriefing.

## Critères

- Chromium, Chrome mobile et WebKit sur le même parcours, clavier compris : oui, 15 tests verts.
- Safari iOS et Android réels : non. Playwright ne les lance pas.
- Préproduction seulement sur demande, sans domaine inventé : `docs/OPERATIONS.md`. TLS devant `127.0.0.1:3000`, dump chiffré hors machine, essai de restauration, arrêt sans `down -v`, volume `/var/lib/postgresql`, retour arrière par l'image précédente. Rien de cela n'a été exécuté.
- La CI ne déploie pas. Le workflow installe WebKit en plus de Chromium. Il n'a pas été lancé ici.
- Volumes `ai_usage`, tentatives terminées et `replay_started` : comptés sur `/admin`, sans texte et sans liste d'adresses.
- Intérêt volontaire, séparé de l'indicateur, qui ne conditionne pas la démo : table `interest_signups`, test d'intégration et test navigateur.
- `compose.prod.yml` non exécuté. L'indicateur reste un indicateur d'exercice.

## Reste ouvert

- Docker n'est pas installé ici. L'image `postgres:18.6` et `compose.prod.yml` n'ont pas tourné.
- GitHub Actions n'a pas été exécuté sur ce dépôt depuis cette branche.
- Safari iOS et Android réels n'ont pas été vérifiés.
- Aucune préproduction : pas d'hôte, pas de domaine, pas de certificat, pas de sauvegarde réelle.
- Les 20 cas de référence du coach n'ont toujours pas été relus par un humain. Aucun endpoint de modèle n'a été appelé.
- Le plafond better-auth (3 inscriptions par 10 secondes et par adresse) reste en place. Le test de compte attend le délai au lieu de le relever.
