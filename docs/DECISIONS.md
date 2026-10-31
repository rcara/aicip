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

## Compte et suppression (Sprint 2)

Une tentative créée avec une session est liée à `userId`. Le hash du cookie de démo n'est pas copié sur cette ligne. Les tentatives anonymes restent sur le cookie : la connexion ne les fusionne pas avec le compte. Ce choix est affiché sur la connexion, la page Compte et la page confidentialité.

L'export JSON contient le compte demandeur, ses tentatives, les identifiants de nœuds et de choix, et sa note de transfert. Il ne contient pas le mot de passe, le jeton de session, ni les données d'un autre compte.

La suppression exige la phrase « supprimer mon compte » ou « delete my account ». Elle efface les tentatives du compte et les sessions, retire le mot de passe, pose `deleted_at`, et écrit `deletion_journal` avec des compteurs seulement. Les versions de scénario ne sont pas modifiées. `ACCOUNT_RETENTION_DAYS` vaut 365 par défaut (borné de 1 à 3650). `npm run account:purge` retire ensuite les journaux et les lignes de compte plus anciens. `npm run admin:grant` attribue `admin` à un compte existant et n'en crée pas.

L'administration affiche des volumes (comptes, tentatives, kinds) sans liste d'adresses et sans texte de dialogue. Publier passe par `seedScenario` : même empreinte, aucun changement ; même numéro avec un autre contenu, refus avant même le trigger.

## Coach borné (Sprint 3)

Le mode par défaut reste `mock`. Le mode `real` n'appelle le réseau que si `AI_API_BASE_URL`, `AI_API_KEY` et `AI_MODEL` sont définis côté serveur. L'URL doit être `https` ou un hôte local : le dépôt ne choisit aucun fournisseur ni domaine. Le contexte envoyé est le briefing, l'objectif, la rubrique, les choix de cette tentative et le texte facultatif de l'apprenant. Pas d'autre tentative, pas de profil.

La sortie passe par Zod, avec des longueurs maximales. Un texte d'injection ou un `nextNodeId` est retiré et marque `uncertain`. Quota journalier par acteur (20) et global (200), délai 8 secondes. Au-delà, ou si l'appel échoue, le mock répond avec `source: "fallback"` et `certifying: false`. `ai_usage` enregistre le fournisseur, le modèle et le statut, pas le prompt.

La réponse libre est une colonne `reflection_note`. Elle ne crée pas d'événement de graphe et ne change pas le nœud courant. Le choix suivant reste `commitChoice`.
