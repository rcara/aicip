> **Historique — vision abandonnée comme produit principal.** Le périmètre courant est [MVP_SCOPE_V2.md](MVP_SCOPE_V2.md). Ce backlog décrit la simulation, qui n'est plus le MVP.

# MVP, backlog et plan de livraison — Interactive Soft Skills Academy
Version 1.0 — 31/10/2026

## 1. Résultat concret du MVP

Une PWA francophone permettant de réaliser **un scénario complet de management**, avec 3 à 5 points de décision, au moins deux branches significativement différentes, un débriefing pédagogique, une tentative supplémentaire depuis un point antérieur et un feedback IA facultatif. Authentification, historique personnel, catalogue minimal et console d'administration technique sont inclus.

Lancement initial : **premiers managers/tech leads IT/Tech**, B2C volontaire. Le futur B2B n'est pas une obligation de la V1.

## 2. Priorisation

| ID | User story | Priorité | Critère d'acceptation observable |
|---|---|---|---|
| US-001 | Comme visiteur, voir la proposition de valeur | P0 | Accueil /, « démarrer démo » visible, rendu mobile sans débordement |
| US-002 | Comme apprenant, parcourir les scénarios | P0 | Liste triable et détail /scenarios/[slug] ; 1 scénario seed publié |
| US-003 | Comme apprenant, lancer un scénario | P0 | Instance Attempt avec scenarioVersionId figé, état initial persistant |
| US-004 | Comme apprenant, choisir une réponse | P0 | Choix validé serveur, événement idempotent persisté, transition déterministe |
| US-005 | Comme apprenant, revenir et rejouer | P0 | Nouvelle tentative dérivée, historique intact, comparaison de branches |
| US-006 | Comme apprenant, obtenir un débriefing | P0 | Rubriques calculées selon règles, preuves/explications visibles |
| US-007 | Comme apprenant, reprendre plus tard | P0 | Rafraîchissement navigateur sans perte de progression |
| US-008 | Comme visiteur, tester sans inscription | P0 | Mode démo anonyme isolé et éphémère, sans données durables identifiantes |
| US-009 | Comme apprenant, créer un compte sécurisé | P0 | Login, logout, protection serveur, flux de récupération approprié |
| US-010 | Comme administrateur, publier un contenu versionné | P0 | Schéma validé + seed JSON + statut publié + contrôle admin serveur |
| US-011 | Comme apprenant, demander une explication IA | P1 | Schéma JSON, quota, fallback, avis de transparence, pas de contrôle de transition |
| US-012 | Comme apprenant, soumettre une réponse libre | P1 | Feedback formatif ; branche confirmée ou inchangée, pas de note RH |
| US-013 | Comme administrateur, voir métriques d'usage | P1 | Compteurs agrégés, budget IA, aucune réponse privée affichée |
| US-014 | Comme apprenant, exporter/supprimer mes données | P0 | Export et effacement documentés, vérifiables, suppression propagée |
| US-015 | Comme apprenant, utiliser le produit au clavier | P0 | Focus visible, labels, navigation stable, contrôles accessibles |
| US-016 | Comme formateur, éditer visuellement un graphe | P2 | Réservé à phase ultérieure |
| US-017 | Comme client entreprise, gérer des sièges | P2 | Réservé à phase ultérieure |
| US-018 | Comme apprenant, utiliser la voix en temps réel | P2 | Réservé à phase ultérieure |
| US-019 | Comme client, régler un abonnement | P2 | Après validation willingness-to-pay et conditions légales |
| US-020 | Comme apprenant, voir mon historique | P0 | Mes tentatives seulement, filtre par scénario, comparaison de deux tentatives |

**Politique P0/P1** : P0 suffit pour démontrer la mécanique complète, avec feedback déterministe. P1 ajoute la valeur IA avant un pilote élargi ; aucun appel IA obligatoire dans le test E2E primaire.

## 3. Critères d'acceptation transverses

1. Même scénario/version, mêmes choix → même chemin et même score (unit tests).
2. Un choix répété par double clic/réessai HTTP ne crée pas de double événement (idempotency key).
3. Un utilisateur A ne peut lire, éditer ni supprimer les tentatives de B (tests d'intégration).
4. Une tentative reste attachée à sa version même après publication d'une nouvelle.
5. Une tentative rejouée est une **nouvelle branche** ; l'original reste consultable.
6. L'erreur d'un prestataire LLM affiche un feedback préécrit et une explication claire.
7. Les champs texte IA sont validés, assainis et limités en longueur ; aucune clé n'est envoyée au navigateur.
8. Les visiteurs ne peuvent accéder à l'administration par saisie directe d'URL.
9. Le produit est utilisable sans souris pour les scénarios P0.
10. Le pipeline CI valide lint, typecheck, unit, integration et au moins 1 E2E critique.

## 4. Sprint 0 — validation du problème (3 à 5 jours estimatifs)

- [ ] Définir 3 situations réelles et fréquentes pour managers IT/Tech.
- [ ] Interroger 5 utilisateurs pilotes potentiels avant d'investir dans l'IA.
- [ ] Rédiger une grille d'évaluation pédagogique observable.
- [ ] Définir les métriques de succès et la politique d'usage des données.
- [ ] Confirmer les contraintes d'hébergement et les services déjà présents sur le VPS.

**Gate** : la scène pilote est jugée crédible, utile et non triviale par au moins 3 interlocuteurs.

## 5. Sprint 1 — socle et démonstration déterministe (5–7 jours indicatifs)

### Backend/qualité
- [ ] Inspecter le dépôt, vérifier versions, ne pas écraser des fichiers existants.
- [ ] Initialiser Next.js, TypeScript strict, Tailwind, design tokens et routes structurées.
- [ ] Installer PostgreSQL local via Docker Compose ; migrations via Prisma ou Drizzle (choisir un seul ORM, documenter).
- [ ] Créer les entités Scenario, ScenarioVersion, ScenarioNode, ScenarioChoice, Rubric, Attempt, AttemptEvent, User.
- [ ] Schéma Zod des scénarios, validation statique des graphes (IDs uniques, transitions valides, terminaux atteignables, pas de boucle involontaire).
- [ ] Seed scénario pilote à partir de `05_SCENARIO_PILOTE.json`.
- [ ] Écrire moteur `startAttempt`, `applyChoice`, `replayFrom`, `computeOutcome`, sans IA.
- [ ] Ajouter tests unitaires déterminisme, versioning, idempotence et validation du graphe.
- [ ] Ajouter un `MockAiProvider` pur, aucune clé requise pour lancer la démo.

### UI
- [ ] Accueil responsive avec proposition de valeur claire.
- [ ] Catalogue minimal et page détail.
- [ ] Interface /demo/[scenarioSlug] avec briefing, dialogues, options, conséquences, progression.
- [ ] Débriefing statique avec dimensions de rubrique et bouton rejouer.
- [ ] Focus clavier et tests accessibilité de base.

### DevOps
- [ ] `.env.example` documenté, aucun secret Git.
- [ ] Dockerfile multi-stage et Compose pour dev/prod distincts.
- [ ] GitHub Actions lint, typecheck, tests et build.
- [ ] `README.md` avec 5 commandes pour lancer, tester et seed.

**Gate Sprint 1** : un navigateur neuf accède à `/demo`, exécute toute la scène, voit un débriefing, rejoue sans perdre l'original ; tests verts ; aucun appel API LLM.

## 6. Sprint 2 — apprentissage et confidentialité (5–7 jours indicatifs)

- [ ] Auth via une bibliothèque mature et contrôle serveur centralisé ; vérifier la compatibilité des versions.
- [ ] Stockage tentatives privées, reprise, historique et comparaison.
- [ ] Export utilisateur, suppression, rétention configurable et journaux de suppression.
- [ ] Tests d'isolement utilisateur et de permissions admin.
- [ ] Gestion de publication de versions et commandes d'administration simples.
- [ ] Instrumentation des événements sans texte privé.

**Gate Sprint 2** : deux comptes distincts, aucune fuite inter-comptes, reprise après session, versioning vérifié.

## 7. Sprint 3 — IA pédagogique bornée (5–7 jours indicatifs)

- [ ] Créer interface `AiCoachProvider` et implémentation réelle derrière feature flag.
- [ ] Fournir contexte limité : briefing, objectif, nœud courant, choix/texte utilisateur, rubrique, historique de cette tentative uniquement.
- [ ] Sortie JSON Zod : strengths, improvement, evidence, alternative, nextQuestion, confidenceFlag.
- [ ] Limites en longueur, quotas utilisateur, budget global et timeouts/fallback.
- [ ] Prompt injection/red-team tests ; refus de questions hors contexte ; PII minimisée.
- [ ] Afficher « Comment ce feedback a été construit » et « feedback IA non certifiant ».
- [ ] Ajouter réponses libres facultatives sans autoriser l'IA à imposer seule un chemin.

**Gate Sprint 3** : 20 cas de référence relus par un humain ; 0 transition arbitraire de graphe ; pannes gérées proprement.

## 8. Sprint 4 — pilote et conversion (5–10 jours indicatifs)

- [ ] QA sur Chrome, Safari iOS et Android ; navigation clavier et mobile.
- [ ] Déploiement VPS préprod avec ressources plafonnées, TLS et sauvegardes hors site.
- [ ] Monitoring, compteur d'appels IA et coût par scénario.
- [ ] Landing page proposition de valeur + collecte volontaire d'intérêt.
- [ ] 5–10 utilisateurs pilotes, mesure de complétion et de replay.
- [ ] Guide de déploiement / rollback / restore, journal décisions et dette technique.

**Gate pilote** : comportement utilisateur mesuré et premiers signes de volonté de payer ; pas de dette sécurité bloquante.

## 9. Six scénarios commerciaux candidats

1. **Conduire un entretien difficile** (scénario pilote).
2. **Refuser une urgence irréaliste** à un directeur métier.
3. **Gérer une escalade d'incident critique** sans promettre l'impossible.
4. **Donner un feedback à un collègue senior** sans susciter de fermeture.
5. **Déléguer un sujet sensible** en clarifiant autonomie et responsabilité.
6. **Désamorcer un conflit entre deux experts** lors d'une réunion.

Ne produire complètement que le n°1 au Sprint 1. Les autres servent de backlog et de tests de généricité du moteur.

## 10. Mesure produit

- `activation_rate = attempts_started / visitors_qualified`
- `completion_rate = completed_attempts / started_attempts`
- `replay_rate = learners_with_replay / learners_with_completed_attempt`
- `feedback_utility = pilotes déclarant feedback utile / pilotes répondants`
- `ai_cost_per_completed_attempt = coûts LLM / tentatives complètes`
- `D7_return = nouveaux utilisateurs de cohorte revenus à J+7 / nouveaux utilisateurs de cohorte`

Décrire les bases de calcul, suivre de petits échantillons sans fausse précision.

## 11. Budget indicatif et hypothèses

Ne pas confondre les estimations et des devis : développement en autonomie Cursor + hébergement VPS existant + paiement à l'usage du fournisseur LLM et du stockage externe. Plafonds proposés **à configurer**, p.ex. 30 CHF/mois de dépense IA en pilote, puis adaptation selon usages. L'usage d'un outil de transcription, de streaming voix ou vidéo changerait fortement les coûts, d'où leur exclusion du MVP.
