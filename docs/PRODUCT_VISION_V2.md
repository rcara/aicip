# Vision produit — studio d'explication animée

Statut : courant. La vision « Interactive Soft Skills Academy » est historique (`docs/01_CAHIER_DES_CHARGES.md`).

## Promesse

Transformer une idée, un texte ou un document en une explication animée, sans compétence de montage, d'animation ou de développement.

Formule : « Transform any idea into an animated explanation. »

Le dépôt reste `aicip`. Aucun nom commercial n'est choisi ici. L'interface ne reprend ni la marque, ni les visuels, ni les créations de Scrimba. Scrimba Explain est une référence de mécanisme : un sujet devient une présentation audiovisuelle structurée.

## Ce que le produit n'est plus

Les simulations de conversation, les embranchements, les scores comportementaux et les parcours managers ne structurent plus le MVP, l'architecture métier ni l'écran principal à construire. Ils restent dans le dépôt comme extension pédagogique possible. Les agents ne doivent pas les étendre comme si c'était le produit.

## Ce que l'utilisateur obtient

Une vidéo de motion design programmable :

1. une narration cohérente
2. des scènes ordonnées
3. des animations vectorielles
4. des schémas
5. des transitions
6. une voix off
7. des sous-titres
8. une prévisualisation, une modification et un export

Le rendu n'est pas une suite d'images photoréalistes. La source de vérité est un document JSON versionné. Une scène se modifie sans régénérer tout le film.

## Public

Formateurs, enseignants, consultants, professionnels techniques, créateurs, entreprises, étudiants, équipes de formation interne. Les soft skills sont un sujet parmi d'autres, pas le cadre du produit.

## Exemples

- « Explique comment fonctionne OAuth 2.0. » : acteurs, échanges, jetons, flux.
- « Explique la différence entre leadership et management. » : scènes comparatives.
- « Transforme ce PDF de gestion d'incidents en vidéo de trois minutes. » : synthèse, storyboard, animation.

## Preuve actuelle

Le premier film est composé à la main, pas par un modèle : la gestion d'un incident IT, de la déclaration à la clôture. Le lecteur est `/explain`. L'export est `npm run motion:render`.
