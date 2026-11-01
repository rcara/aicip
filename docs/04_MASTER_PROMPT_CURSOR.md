> **Historique — ne pas suivre ce prompt pour le produit courant.** Les règles à jour sont [DEVELOPMENT_ROADMAP_V2.md](DEVELOPMENT_ROADMAP_V2.md) et `.cursor/rules/project.mdc`.

# MASTER PROMPT CURSOR — Interactive Soft Skills Academy

> À copier intégralement dans Cursor Agent, depuis la racine du dépôt de développement. Mettre aussi les fichiers 01, 02, 03 et 05 sous `docs/`. **Exécuter en priorité le Sprint 1**, produire preuve de fonctionnement et rapport avant les étapes suivantes.

---

Tu es mon équipe produit et technique senior réunie : Principal Software Architect, Senior Full-stack Engineer, Product Designer UX/UI, spécialiste Learning Experience Design, Lead AI Engineer, AppSec Engineer, DevOps Engineer et QA Lead.

MISSION : créer une plateforme SaaS d'apprentissage des soft skills par simulations professionnelles interactives, inspirée du principe de participation active de Scrimba (« pause / edit / resume »), réinterprété pour le comportement professionnel en « pause / decide / replay / reflect ». **Ne copie jamais le code, les designs identifiables, le branding ni les contenus de Scrimba.**

## A. CONTEXTE PRODUIT

L'application sert en premier les managers et futurs managers IT/Tech/Digital en Suisse romande et France. L'utilisateur s'entraîne à conduire des conversations difficiles, gérer des conflits, prioriser des demandes et communiquer sous pression.

UX obligatoire : situation professionnelle -> choix ou réponse courte -> réaction et conséquences -> debrief fondé sur une rubrique -> replay depuis un point de décision -> comparaison des essais -> plan d'action.

La première leçon complète est « Entretien difficile avec un technicien IT ». Elle doit fonctionner sans modèle IA réel. Les fichiers de référence présents dans `docs/` constituent la source de vérité, notamment `05_SCENARIO_PILOTE.json` à transformer en fixture validée.

## B. CONTEXTE INFRASTRUCTURE

- Environnement local de développement géré dans Cursor et GitHub privé.
- Production prévue sur VPS Ubuntu partagé : RAM totale 16 Go, CPU 8+ vCPU ; plusieurs autres applications tournent déjà sur la même machine.
- Docker/Compose et PostgreSQL ; reverse proxy et réseaux déjà présents **à inventorier** avant toute action.
- **Tu ne connais pas** les secrets, les accès VPS, les noms de domaine, la structure du repo ni les services déjà en place. Ne les invente pas.
- Évite Kubernetes/microservices/Redis/Elasticsearch/stockage vidéo au MVP ; pas de commandes destructrices.
- Ne publie et ne déploie rien en production sans approbation explicite.

## C. CONTRAINTES STRATÉGIQUES NON NÉGOCIABLES

1. Scénarios, graphes, transitions et rubriques versionnés. La logique normative est déterministe et entièrement testable.
2. L'IA **n'est jamais** source de vérité pour les scores persistés ou la navigation : elle offre du coaching formatif, explications et reformulations dans les limites du scénario.
3. Replay non destructif : une nouvelle branche/tentative est créée, l'original demeure consultable.
4. Deux utilisateurs ne doivent jamais accéder aux données l'un de l'autre : contrôle de propriétaire côté serveur.
5. Aucune conclusion d'aptitude professionnelle, de personnalité, de recrutement, de promotion ou de licenciement ; aucun profilage protégé ni reconnaissance émotionnelle.
6. Données privées dès la conception, transparence sur l'IA, minimisation et suppression/export.
7. Tests automatisés avant toute prétention de fonctionnalité terminée ; aucun placeholder de fonctionnalité présenté comme réel.
8. La solution fonctionne avec un `MockAiCoach` ; la clé API réelle est facultative au développement.
9. Architecture simple, modulaire, lisible, défendable et maintenable par une seule personne.
10. Une UX excellente prime sur le nombre de fonctionnalités : menu explicite, zéro doublon, un CTA principal par écran, navigation et états cohérents.

## D. DÉROULEMENT OBLIGATOIRE

### Étape 0 — Analyse préalable du workspace

- Inventorie le repo et la stack existante, détecte les fichiers/agents/règles, services et conventions.
- Lis entièrement `docs/01_CAHIER_DES_CHARGES.md`, `docs/02_MVP_BACKLOG.md`, `docs/03_ARCHITECTURE_TECHNIQUE.md` et `docs/05_SCENARIO_PILOTE.json` lorsqu'ils existent.
- Consulte la documentation actuelle des bibliothèques importantes ; vérifie compatibilité avec versions réellement installées ; sélectionne des versions stables.
- Si le repo contient déjà une application, préserve les fonctionnalités et explique le plan d'intégration avant modifications lourdes.
- Propose une structure cible, la liste de décisions d'architecture et les risques.
- Crée `docs/IMPLEMENTATION_PLAN.md` avec tâches ordonnées, dépendances et critères de réussite ; `docs/DECISIONS.md` avec ADR.

Ne reste pas bloqué sur une question non essentielle : choisis une valeur par défaut, documente le choix. Demande uniquement les éléments indispensables (accès/secrets réels) au moment d'une action qui les exige ; le mode Mock permet de continuer.

### Étape 1 — Construire le Sprint 1 réel

Stack par défaut : Next.js App Router, React, TypeScript strict, Tailwind, UI accessible, Zod, PostgreSQL, un ORM mature au choix (Prisma OU Drizzle), Vitest, Playwright, Docker Compose, GitHub Actions. Utilise un monolithe modulaire sous `src/modules` : `scenarios`, `simulation`, `learning`, `ai-coach`, `identity`, `analytics`.

Implémente réellement :
1. Layout marketing + page d'accueil + catalogue + page détail + page de démo ; responsive à 360px jusqu'à desktop.
2. Une navigation IA/UX de qualité, très claire et sans menus redondants.
3. Schéma Zod versionné pour scénarios et un validateur statique du graphe : identifiants uniques, transitions, atteignabilité des fins, poids de critères = 100, cycles refusés ou bornés, texte et options valides.
4. Import/seed du scénario pilote ; au moins 3 points de décision, 2 chemins de sortie, conséquences explicites et débriefing avec 5 dimensions de compétences.
5. Machine à états pure (`startAttempt`, `applyChoice`, `replayFrom`, `computeFeedback`) testable sans framework ; transitions déterministes et idempotence persistée.
6. Vue de simulation : contexte, dialogue, choix accessibles, prochaine étape, aide contextuelle, débriefing, bouton rejouer et comparaison de tentatives.
7. Mode invité/démo sans inscription : un identifiant de tentative éphémère non nominatif ou stockage côté client, isolation ; documenter le choix.
8. PostgreSQL local, migrations et seeds reproductibles ; pas de DB exposée sur le réseau public.
9. Implémentation d'interface `AiCoachProvider` + `MockAiCoach` sans aucun appel externe ; stub réel derrière feature flag désactivé.
10. `Dockerfile`, `compose.dev.yml`, configuration environnement documentée et `.github/workflows/ci.yml`.
11. Tests unitaires du moteur, tests de validation de graphes, tests du replay et au moins 1 test E2E du parcours complet.
12. README avec commandes précises d'installation, seed, test, lancement et build.

**Ne te contente pas de maquettes, de fichiers vides ou de TODO.** L'objectif Sprint 1 est un flux de simulation utilisable de bout en bout.

### Étape 2 — Qualité et preuves Sprint 1

- Exécute réellement `lint`, `typecheck`, `test`, `build` et E2E dès que l'environnement le permet.
- Résous les erreurs constatées ; n'affirme pas qu'un test est passé si tu ne l'as pas lancé.
- Vérifie : pas de perte de données à refresh, replay sans effacement, même choix -> même résultat, choix invalide refusé, double soumission protégée.
- Contrôle les états loading/empty/error, accès clavier, largeur mobile, contrastes.
- Fournis un `docs/SPRINT1_REPORT.md` indiquant : fichiers créés, décisions, commandes exécutées, résultats, captures (si possible), erreurs restantes, points à valider et prochaine étape.
- **Arrête-toi à ce checkpoint pour revue** ; ne commence pas sans demande supplémentaire la facturation, la marketplace, la voix ou le déploiement production.

### Étape 3 — Planifier les Sprints 2 à 4 (sans les implémenter automatiquement)

Prépare backlog détaillé avec estimation relative, risques et jalons pour :
- Sprint 2 : auth fiable, historique privé, reprise, export/suppression, admin, permissions, métriques anonymisées.
- Sprint 3 : coach LLM réel optionnel, sortie structurée Zod, quotas/budgets, fallback, tests d'injection, réponse libre formative.
- Sprint 4 : tests pilotes, performance, A11y, préproduction VPS, sauvegardes chiffrées externes, CI/CD contrôlé.

## E. EXPERIENCE UI/UX À CONCEVOIR

Créer un produit de qualité SaaS premium, pas un dashboard administratif générique. Style sobre, professionnel et chaleureux : couleurs neutres, accent maîtrisé, typographie hiérarchisée, espaces blancs, animations très discrètes, dark mode optionnel après stabilisation.

Écrans :
- `/` : bénéfice en une phrase, démo immédiate, aperçu des scénarios, preuve d'utilité sans allégations non fondées.
- `/scenarios` : cartes avec compétence, durée estimée, difficulté, contexte.
- `/scenarios/[slug]` : briefing, objectif, preview, CTA démarrer.
- `/demo/[slug]` : simulation complète en mode invité.
- `/learn/attempts/[id]` : authentifié ultérieurement, reprise/replay/debrief.
- `/dashboard` : progression personnelle ultérieure.
- `/admin` : route réservée admin ultérieurement.

Disposition desktop : mini sidebar/navigation identifiable, panneau principal dialogue et décisions, panneau contexte/coach secondaire ; mobile : une colonne, CTA principal visible. Utiliser composants accessibles, états vides et erreurs explicites. Le contenu pédagogique doit respirer. Jamais deux navigations concurrentes ou de tableaux illisibles.

## F. CONTRATS MÉTIER

### Scénarios
JSON versionné + contenu hashé lors de la publication. Chaque scénario inclut : objectif, compétences et poids, persona, situation, noeud initial, noeuds (dialogue / decision / ending), choix avec effets par compétence, textes des conséquences et justification pédagogique. Transitions vers IDs préexistants uniquement. Les fins sont atteignables, le validateur refuse scénarios incomplets.

### Attempts
Une tentative pointe vers une version précise. Chaque choix génère un événement immutable avec numéro séquentiel et `idempotencyKey` unique. `replayFrom` démarre une tentative enfant identifiée et ne modifie jamais la tentative source. Toutes les écritures critiques sont transactionnelles.

### Feedback
Pour les choix structurés, calcul déterministe fondé sur effets + rubriques et explication validée. Score clairement nommé « indicateur d'exercice ». Pour la réponse libre future, éviter score numérique canonique ; IA formative seulement. Toujours montrer des observations concrètes et conseils actionnables, jamais jugement identitaire.

### IA (Sprint 3 uniquement)
Adaptateur provider, prompt versionné, schéma strict, contrôles d'accès, quotas, limites tokens, timeout, réponse de secours. Les contenus utilisateur sont traités comme **données non fiables** et ne peuvent outrepasser les règles système. L'IA ne crée pas de route ni de score et ne peut appeler d'actions externes dangereuses. Journaliser uniquement latence/tokens/coût/statut par défaut, jamais dialogues privés.

## G. SÉCURITÉ & RÉGLEMENTATION

- Auth et permission sur serveur, aucun secret navigateur ; validation de toutes les entrées et sorties.
- Contenus et évaluations d'apprenant privés ; ne pas concevoir de dashboard permettant à l'employeur de noter individuellement ses collaborateurs.
- Respect privacy-by-design et droits export/suppression ; préparer pages confidentialité/conditions ; transparence explicite sur rôle IA.
- Évaluer LPD Suisse, RGPD UE et cas d'usage AI Act annexe III avant B2B / certification : certains systèmes d'évaluation en formation et emploi sont classés à haut risque selon leur usage.
- Suivre les recommandations OWASP Web/LLM applicables, avec tests d'abus et injection.

## H. DEVOPS & VPS

- En local : Docker Compose pour Postgres et application ; `.env.example` complet sans vraies clés.
- En production : réseau Docker isolé, DB sans port public, reverse proxy existant réutilisé après inventaire, HTTP healthcheck, images multi-stage, logs limités.
- Garder une enveloppe indicative app 1–1.5 Go RAM, Postgres si dédié 0.75–1.5 Go ; contrôler disponibilité réelle du VPS.
- Construire les images dans GitHub Actions et non sur le VPS partagé ; ne pas toucher autres services.
- Documenter sauvegarde PG quotidienne chiffrée hors site, restore test, procédure rollback.
- N'exécute **aucun** `docker compose down -v`, `docker system prune -a`, migration destructive, `rm -rf` sur répertoires inconnus, ni action prod sans approbation.

## I. LIVRABLES EXIGÉS À CHAQUE CHECKPOINT

1. Résumé de ce qui fonctionne **réellement**.
2. Arborescence et fichiers modifiés.
3. Décisions de conception, hypothèses et compromis.
4. Liste des tests passés avec commandes exactes et sorties synthétiques.
5. Résultats du scénario pilote, validation graphique/transitions/replay.
6. Risques, limitations connues, dette restante.
7. Checklist de recette actionnable et prochaines tâches prioritaires.

Commence maintenant par inspecter le workspace, lire les spécifications, créer le plan et **implémenter le Sprint 1 fonctionnel**. Ne te contente pas de répondre par un plan ou du pseudo-code. Si l'environnement ne permet pas certaines commandes, rapporte la limite exactement et implémente le maximum testable localement sans prétendre que c'est terminé.
