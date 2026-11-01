# Feuille de route — version 2

Les durées ne sont pas des engagements calendaires. L'ordre l'est.

## Sprint 0 — Recadrage

Fait dans cette branche : lecture du dépôt, documents v2, règles Cursor, simulation laissée en place et marquée historique.

## Sprint 1 — Preuve du moteur

Fait dans cette branche, à confirmer par le rendu MP4 :

- schéma, dix modèles, storyboard d'incident
- animations SVG, timeline, voix fixture, sous-titres par segment
- lecteur `/explain`
- `npm run motion:render`
- tests unitaires du document

Pas de modèle de langage.

## Sprint 2 — Génération

- fournisseur de modèle, sortie Zod
- plan, script, choix du modèle visuel
- refus des documents invalides avant tout rendu
- PDF texte extractible
- français et anglais

## Sprint 3 — Film complet depuis un sujet

- adaptateur de voix avec temps réels ou segment
- synchronisation
- file d'un worker, stockage, export
- reprise de tâche sans doublon
- coût par projet

## Sprint 4 — Studio

- réécriture du script
- régénération d'une scène
- réordre, durées, historique de versions
- le style, déjà prévisualisé, est persisté

## Sprint 5 — SaaS

Comptes et auth déjà présents côté simulation : les réutiliser, ne pas les réécrire. Projets, droits, quotas, abonnement, facturation, supervision, administration, mesure d'usage.

## Ordre interdit

Ne pas brancher un modèle qui « fait la vidéo » avant qu'un storyboard figé sorte un MP4. Ne pas déployer pour démontrer le sprint 1.
