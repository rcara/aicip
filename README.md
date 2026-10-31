# Interactive Soft Skills Academy — dossier de lancement (v1.0)

Plateforme SaaS d'apprentissage de soft skills par simulations professionnelles interactives et feedback IA. Concept inspiré de la mécanique d'apprentissage active de Scrimba, sans reprise de ses éléments de marque, de code ou de contenus.

## Fichiers

1. `01_CAHIER_DES_CHARGES.md` : vision, positionnement, parcours, exigences fonctionnelles/non fonctionnelles, critères de réussite, risques.
2. `02_MVP_BACKLOG.md` : périmètre P0/P1/P2, user stories, critères d'acceptation, plan de sprints, pilotage.
3. `03_ARCHITECTURE_TECHNIQUE.md` : architecture Next.js/PostgreSQL/LLM, modèle de données, contrats, sécurité, Docker, CI/CD, sauvegardes.
4. `04_MASTER_PROMPT_CURSOR.md` : prompt principal, à coller dans Cursor en mode Agent, racine du dépôt ouverte.
5. `05_SCENARIO_PILOTE.json` : spécification de scénario de démonstration à transformer en seed conforme aux schémas de l'application.
6. `.cursor/rules/project.mdc` : règles permanentes de développement à importer dans le projet Cursor.

## Démarrage recommandé

1. Créer un dépôt GitHub **privé** vide ; ouvrir son dossier local dans Cursor.
2. Copier `.cursor/rules/project.mdc` dans le dépôt et déposer les autres documents dans `docs/`.
3. Coller le fichier `04_MASTER_PROMPT_CURSOR.md` dans Cursor Agent.
4. Laisser Cursor réaliser l'inspection et le **Sprint 1** ; valider les critères de recette avant la suite.
5. Tester la première simulation en environnement local, sans clé API obligatoire grâce au fournisseur IA simulé.

## Principes non négociables

- Le scénario, les règles de transition et les rubriques sont versionnés et déterministes.
- L'IA propose des formulations et des feedbacks **formatifs**, jamais des verdicts d'aptitude professionnelle ni des décisions RH.
- L'utilisateur peut voir ses décisions, revenir à un point, rejouer et comprendre le feedback.
- La confidentialité est intégrée dès le MVP ; les réponses sont privées par défaut.
- La couche LLM est interchangeable, limitée en coût, testable hors ligne.
- Le VPS de 16 Go/8+ vCPU est **partagé** avec d'autres applications : pas de services lourds superflus.

## Références utiles, à vérifier avant implémentation

- Scrimba : https://docs.scrimba.com/explain/scrims
- Next.js : https://nextjs.org/docs/app
- Auth Next.js : https://nextjs.org/docs/app/guides/authentication
- OWASP LLM Top 10 2026 : https://github.com/GenAI-Security-Project/GenAI-LLM-Top10
- Loi suisse protection des données/IA : https://www.edoeb.admin.ch/fr/ia-et-protection-des-donnees
- AI Act annexe III : https://ai-act-service-desk.ec.europa.eu/fr/ai-act/annex-3

Version : 31 octobre 2026. Hypothèses commerciales non validées par étude terrain.
