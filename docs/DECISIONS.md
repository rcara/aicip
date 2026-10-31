# Décisions techniques — Sprint 1

Ces choix figent le socle. Les durées indiquées dans le backlog produit sont des hypothèses du dossier, pas des engagements de ce dépôt.

## Monolithe modulaire

Un seul processus Next.js sert l'interface, les routes `/api/v1` et l'authentification. Les modules sont `scenarios`, `simulation`, `learning`, `ai-coach`, `identity` et `analytics`. Il n'y a pas de microservices, pas de file de messages et pas de Redis. La limite de débit des créations de tentative est en mémoire, par processus.

## Moteur déterministe

`startAttempt`, `advance`, `commitChoice` et `replayFrom` sont des fonctions pures. Une tentative est liée à `scenarioVersionId` et à l'empreinte SHA-256 du JSON canonique (clés d'objet triées, tableaux dans l'ordre d'origine). Le rejeu copie le préfixe d'événements dont la séquence est inférieure ou égale au point choisi, dans une nouvelle tentative. L'originale n'est ni modifiée ni supprimée.

La même clé d'idempotence et la même action renvoient l'état courant. La même clé avec un autre choix lève `IDEMPOTENCY_CONFLICT`. Les insertions concurrentes sur la contrainte unique sont relues après le code Postgres `23505`.

## Indicateur d'exercice

L'indicateur n'est pas un score RH, de personnalité ou d'employabilité. Pour les décisions réellement traversées :

`Math.round(somme(effet_compétence × poids) / (nombre_de_décisions × 4))`

Le plafond d'effet est 4. Les poids du scénario pilote somment à 100. Le parcours `d1_a`, `d2_a`, `d3_a` vaut 66. Le parcours `d1_b`, `d2_b`, `d3_b` vaut 11. Le débriefing est recalculé depuis la version épinglée et les identifiants de choix. L'IA ne peut pas l'écrire.

Tant que la tentative n'est pas terminée, la projection envoyée au client ne contient ni `effects` ni `nextNodeId`.

## Scénario en JSONB

Les nœuds, choix et la rubrique vivent dans `scenario_versions.content_json`. Le backlog citait des tables séparées. Le document d'architecture autorise le document versionné : une version publiée est immuable, et le moteur lit un seul document. Un trigger refuse de modifier `content_json`, `content_hash`, `schema_version` ou `version_number` d'une ligne publiée.

Le graphe est validé avant publication : identifiants uniques, poids sommant à 100, effets connus, transitions existantes, tous les nœuds et toutes les fins atteignables, aucun cycle (pas de `maxVisits` en v1), au moins une décision et une fin.

## Drizzle et PostgreSQL

Drizzle ORM 0.45.4 et drizzle-kit 0.31.11, driver `postgres` 4.0.0. Un seul ORM.

L'image Compose est `postgres:18.6`, version stable vérifiée. Le volume Postgres 18 se monte sur `/var/lib/postgresql`, pas sur `/var/lib/postgresql/data`. Les tests de cette machine ont tourné sur PostgreSQL 16.15 (paquets Ubuntu), avec la même migration. Docker n'était pas installé ici : l'image n'a pas été exécutée.

## Authentification

better-auth 1.7.14 avec l'adaptateur Drizzle (`camelCase: false`, colonnes snake_case). Auth.js stable est encore la ligne 4 ; la ligne 5 reste en bêta, donc elle n'a pas été retenue.

Courriel et mot de passe, minimum 12 caractères. Champs ajoutés : `locale` (défaut `fr`) et `role` (défaut `learner`, non saisissable à l'inscription). Aucun administrateur n'est semé. `/admin` appelle `notFound()` si le rôle n'est pas `admin`.

La démo anonyme n'exige pas de compte. Un cookie `aicip_demo` (jeton aléatoire, seul son SHA-256 est stocké, expiration 7 jours) identifie la tentative. Un compte connecté lie `userId` et n'utilise pas ce hash. Un acteur qui n'est pas propriétaire reçoit 404, sans révéler l'existence de la tentative.

## Coach simulé

`AI_COACH_MODE` vaut `mock`, `off` ou `real`. Le défaut est `mock`. `MockAiCoach` ne fait aucun appel réseau. `RealAiCoachDisabled` lève `REAL_AI_DISABLED` sans `fetch`. Le mode `real` retombe sur le mock avec `source: "fallback"` et `certifying: false`. La sortie est validée par Zod. Un motif d'injection marque `uncertain` et n'est pas recopié. La clé éventuelle reste dans l'environnement serveur ; `.env.example` laisse `AI_API_KEY` vide.

Les événements d'analytique et `ai_usage` ne stockent pas le texte du dialogue.

## Next.js, TypeScript, interface

Next.js 16.4.3, React 19.3.1, Tailwind 4.3.3, Zod 4.6.7. `cacheComponents` est désactivé : les tentatives sont privées et ne doivent pas être mises en cache. Next 16 remplace `middleware.ts` par `proxy.ts` ; aucun proxy n'est nécessaire pour le Sprint 1.

TypeScript 5.9.3, pas 7 : `eslint-config-next` 16.4.3 suit la ligne 5. ESLint 9.39.5 pour la même raison.

Il n'y a pas de `loading.tsx` à la racine. Dans Next.js 16, ce fichier ouvre le flux de réponse avec le statut 200 avant que `notFound()` ne s'exécute. Le chargement des pages qui ne renvoient pas 404 est dans le groupe de routes `(browse)`. Les pages scénario, démo et admin appellent `notFound()` avant tout flux. Vérifié : `/admin`, un slug inconnu et une route inconnue répondent 404.

L'interface est française. `src/lib/i18n.ts` contient un dictionnaire anglais typé sur le français. Le cookie `aicip_locale` choisit la langue d'interface. Le contenu du scénario n'est pas traduit.

## Confidentialité

Les tentatives sont privées par défaut. La liste d'un scénario filtre en SQL sur le propriétaire et sur toutes les versions de ce scénario, pas seulement la dernière version publiée. Aucun score de personnalité, d'employabilité ou de performance RH n'est calculé.
