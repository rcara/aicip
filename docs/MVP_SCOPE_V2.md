# Périmètre du MVP

## Dans le MVP, pas encore tout construit

| Capacité | Sprint prévu | État dans cette branche |
|---|---|---|
| Schéma de vidéo et validation géométrique | 1 | Fait |
| Dix modèles de scène | 1 | Fait, exercés par test |
| Storyboard d'incident IT | 1 | Fait, JSON + audio |
| Lecteur `/explain` | 1 | Fait |
| Changement de style et de texte de sous-titre | 1 | Fait, en mémoire |
| Export MP4 | 1 | Script `npm run motion:render` |
| Voix de production et temps de mots | 3 | Fixture espeak, sous-titre par segment |
| Modèle de langage et PDF | 2 | Fait pour le mock, le PDF texte et le refus avant rendu. Fournisseur HTTP inactif sans variables. Voix réelle au sprint 3 |
| File de rendu, objet S3, Redis | 3 | Non |
| Comptes, quotas, paiement | 5 | L'auth v1 existe, elle n'est pas branchée au studio |

## Hors MVP

Génération photoréaliste, avatars, clonage de voix, collaboration, marketplace, application mobile, vidéos interactives de soft skills, streaming.

## Ce que la preuve doit montrer

À partir du storyboard figé, une vidéo animée avec introduction, déclaration, qualification, priorisation, escalade, résolution, clôture et conclusion. Pas une suite de diapositives statiques.

## Ce que l'écran d'accueil ne fait pas encore

`/` reste la simulation historique, parce que les tests de bout en bout en dépendent. Le studio courant est `/explain`. Le basculement de l'accueil se fait quand cette suite de tests n'est plus le contrat du produit.
