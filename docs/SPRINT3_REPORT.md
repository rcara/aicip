> **Rapport historique de la simulation.**

# Rapport Sprint 3

Branche `cursor/sprint-3-bounded-coach-9ea1`, basée sur `cursor/sprint-2-account-privacy-9ea1`. Aucun déploiement. Aucun fournisseur de modèle n'est nommé dans le dépôt.

## Périmètre

Le coach simulé reste le défaut et fonctionne sans clé. Un appel HTTP réel n'existe que si l'opérateur définit `AI_API_BASE_URL`, `AI_API_KEY` et `AI_MODEL`. L'URL doit être en `https`, ou locale. Le contexte est limité à cette tentative. Une réponse libre ne choisit pas le nœud suivant.

## Fichiers

- `src/modules/ai-coach/output.ts`, `context.ts`, `http.ts`, `provider.ts`
- `src/lib/config.ts`, `.env.example`, `compose.prod.yml` (commentaire : pas d'egress ouverte)
- `drizzle/0002_reflection_and_ai_usage.sql` : `reflection_note`, `ai_usage.anonymous_id`
- `src/db/repository.ts` : `saveReflection`, quota du jour, journal d'usage sans prompt
- `src/app/api/v1/attempts/[id]/coach/route.ts`, `reflection/route.ts`, page démo
- `src/components/simulation/player.tsx`, `src/lib/i18n.ts`
- `src/modules/simulation/present.ts` : la note libre revient avec la tentative
- `tests/unit/coach.test.ts`, extension de `tests/unit/engine.test.ts` et `tests/integration/attempts.test.ts`
- `docs/DECISIONS.md`

## Commandes

| Commande | Résultat |
| --- | --- |
| `npm run lint` | exit 0 |
| `npm run typecheck` | exit 0 |
| `npm run scenario:validate` | exit 0 |
| `npm test` | exit 0, 4 fichiers, 23 tests |
| `npm run build` | exit 0 |
| `npm run test:e2e` | exit 0, 4 tests Chromium |

Les 20 cas de référence (18 parcours complets du pilote et 2 questions d'injection) sont exécutés sans `fetch`. Les indicateurs sont reproductibles, entre 0 et 100, et le coach mock n'est pas certifiant. Une charge utile qui cite `nextNodeId` est rejetée ou nettoyée. Un quota atteint ou un transport en échec retombe sur le mock.

## Critères

- Fournisseur réel derrière le drapeau, sinon mock : oui. Sans URL, clé et modèle, aucun appel.
- Contexte borné : briefing, objectif, rubrique, choix de la tentative, question et note. Test `contextLooksBounded`.
- Sortie Zod et longueurs maximales : `parseCoachPayload`.
- Quota, délai, repli : `quotaAllows` et le test de transport en échec.
- L'indicateur persisté n'est pas écrit par le coach : la route relit `final_score` ; la réponse libre vérifie qu'il ne change pas.
- Journal `ai_usage` sans prompt : provider, model, status, acteur.
- Mention non certifiante et explication du calcul : déjà dans le débriefing ; le panneau coach explique comment le texte est construit.
- Réponse libre : colonne dédiée, puis `d1_a` mène toujours à `d2_cooperative`.

## Reste ouvert

- Aucun humain n'a relu les 20 cas. Le test empêche une dérive du moteur ; il ne remplace pas cette relecture.
- Aucun endpoint réel n'a été appelé. Le transport par défaut n'a pas été exercé contre un service.
- Docker et GitHub Actions n'ont pas tourné.
- Safari iOS et Android restent au sprint suivant, et seulement en vérification manuelle pour les appareils réels.
