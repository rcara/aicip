# Exigences produit — version 2

Statut : courant. Le cahier v1 reste dans `docs/01_CAHIER_DES_CHARGES.md` pour la simulation historique.

## Parcours

1. **Créer.** Un champ : « Que voulez-vous expliquer ? ». Sujet, texte collé ou PDF. Audience, langue, durée et style sont optionnels au départ.
2. **Scénario.** Objectif, plan, scènes, voix off, représentation visuelle. Le storyboard est lisible et modifiable.
3. **Animations.** Chaque scène instancie un modèle du catalogue. Le modèle ne reçoit pas de JavaScript arbitraire.
4. **Narration.** Voix à partir du script. Les temps viennent du fournisseur, ou d'un seul segment par scène si le fournisseur n'en donne pas.
5. **Prévisualiser.** Lecteur, texte, style, ordre et durée. Régénérer une scène sans refaire les autres.
6. **Exporter.** MP4 avec image, audio et sous-titres.

## Entrées du MVP

- Sujet ou texte collé
- PDF dont le texte est extractible
- Français et anglais
- Durée cible de 60 à 180 secondes

Le PDF, l'appel de modèle et la synthèse de production ne sont pas dans la preuve Sprint 1. Le schéma, le catalogue, le lecteur et l'export le sont.

## Catalogue visuel initial

Introduction, concept, flux, comparaison, chronologie, hiérarchie, graphique, cause et effet, à retenir, conclusion.

## Styles

Minimal professionnel, plan technique, tableau pédagogique, motion corporate, infographie moderne. Un style change les couleurs et le ton, pas la géométrie du storyboard.

## Hors produit

Photoréalisme, avatars 3D, clonage de voix, collaboration simultanée, marketplace, application native, soft skills interactifs, streaming continu.

## Exigences transverses

- Document JSON versionné, validé, source de vérité
- Reprise d'une étape sans dupliquer le travail ni perdre le projet
- Coût suivi par projet : jetons, voix, stockage, rendu
- Quotas et plafonds
- Documents et URL traités comme non fiables
- Rendu déterministe à storyboard et médias figés, hors réglage explicite
- Accessibilité du studio : clavier, libellés, état de chargement
