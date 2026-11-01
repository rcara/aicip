# Architecture — version 2

## Décision

Un monolithe Next.js conserve l'interface, l'API et les données. Le moteur visuel est un module pur à côté, pas un service séparé. Le rendu vidéo est un processus borné, aujourd'hui lancé à la main, demain une file.

```text
sujet ou document
  → compréhension (Sprint 2)
  → script (Sprint 2)
  → storyboard JSON (source de vérité)
  → catalogue de scènes
  → timeline
  → voix
  → synchronisation
  → lecteur
  → rendu MP4
```

Chaque flèche produit un artefact réexécutable. Sprint 1 commence au storyboard.

## Modules

| Module | Rôle | Statut |
|---|---|---|
| `src/modules/motion` | Schéma, mise en page, validation, storyboard | Courant |
| `src/modules/motion/generation` | Fournisseur, Zod, PDF texte, refus avant rendu | Sprint 2 |
| `src/remotion` | Composition, dessin SVG, audio | Courant |
| `src/app/explain` | Studio de prévisualisation | Courant |
| `src/modules/simulation` et scénarios | Produit v1 | Historique, ne pas étendre |
| `src/modules/ai-coach` | Coach de simulation | Historique. L'abstraction « provider + Zod + quota » est le modèle à reprendre pour la génération, pas le domaine. |
| `src/db` Drizzle, better-auth | Comptes et Postgres | Conservés pour le SaaS |

## Alternatives écartées pour la preuve

- Envoyer le sujet à un modèle et filmer le HTML. Opaque, non éditable, non rejouable.
- Laisser le modèle écrire du JavaScript. Surface d'exécution inacceptable.
- Remotion comme format que l'utilisateur téléverse. La licence l'interdit, et ce n'est pas notre propriété.
- Microservices, Kubernetes, Redis dès maintenant. Le VPS est partagé. La file arrive quand le rendu quitte le poste de développement.

## Remotion

Remotion 4.0.539 est le moteur de lecture et d'export de cette preuve. Il n'est pas encore le choix définitif de production.

Licence constatée (conditions Remotion v5.0, octobre 2026) :

- Gratuit pour une personne, une équipe jusqu'à 3 personnes, une organisation à but non lucratif, ou une évaluation non commerciale.
- Au-delà, licence société. Pour un outil de création automatique, « Remotion for Automators » : 0,01 USD par rendu réussi, minimum 100 USD par mois, télémétrie obligatoire à partir de Remotion 5.
- Usage accepté : nos modèles, paramétrés, rendus pour l'utilisateur.
- Usage refusé : l'utilisateur envoie un projet Remotion arbitraire à rendre.

Avant une offre commerciale avec une équipe de 4 personnes ou plus, acheter cette licence ou remplacer le rasterizer. Le catalogue, le schéma et la synchronisation restent les nôtres dans les deux cas.

Le dépôt utilise Zod 4.6.7. Remotion signale qu'il a été testé avec Zod 4.5.4. Nous ne passons pas par `@remotion/zod-types`. La validation est la nôtre.

## Données

Le projet vidéo n'est pas encore une table. Le fichier `src/modules/motion/fixtures/incident-it.json` est l'artefact de la preuve. Postgres reste en place pour les comptes. Les projets, versions, tâches et coûts seront des tables au sprint 3, sans réutiliser le graphe de scénario.

## Interface

Next.js 16, React 19, TypeScript strict, Tailwind 4. Le lecteur est `@remotion/player`, chargé seulement dans le navigateur.
