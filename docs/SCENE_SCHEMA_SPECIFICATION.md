# Schéma de scène — version 1

Le document validé par `videoProjectSchema` est la source de vérité. Zod 4, objets stricts.

## Projet

| Champ | Valeur |
|---|---|
| `schemaVersion` | `1` |
| `id`, `version` | identifiant stable, entier positif |
| `language` | `fr` ou `en` |
| `aspectRatio` | `16:9` |
| `theme` | un des cinq identifiants de `themeIds` |
| `fps`, `width`, `height` | `30`, `1280`, `720` |
| `scenes` | 1 à 24 |

## Scène

- `id`, `template`, `title`
- `narration.text`, `narration.audioSrc`, `narration.durationMs`, `narration.voice`
- `durationMs`, `durationInFrames`
- `transition.type` : `fade` ou `cut`, `durationMs` ≤ 1000
- `objects`, `subtitles`

`audioSrc` est un chemin relatif à `public/`, de la forme `motion/…​.mp3` ou `.wav`. Pas d'URL, pas de `..`, pas de chemin absolu.

## Objet

`id`, `type`, `x`, `y`, `width`, `height`, `fontSize`, `appearAtMs`, `animation`, `tone`, `emphasis`, et `text` quand le type porte des mots.

Les coordonnées sont des pixels du cadre 1280×720. Elles sont entières.

## Sous-titre

`startMs`, `endMs`, `text`, `source`.

- `word-boundary` : les bornes viennent du fournisseur. Le décodage Edge, en ticks de 100 ns, est testé. Il n'est pas utilisé par le film actuel.
- `segment` : un bloc, de 0 à la fin de l'audio, quand le fournisseur ne donne pas de mots. C'est le cas d'espeak dans cette preuve.

## Identifiants de modèles

`title-introduction`, `concept-explanation`, `process-flow`, `comparison`, `timeline`, `hierarchy-diagram`, `animated-chart`, `cause-effect`, `key-takeaway`, `conclusion`.

Les propriétés d'auteur vivent dans `TemplateProps` (`compile.ts`). Le JSON stocke le résultat compilé, pas ces propriétés. Recompiler une scène produit les mêmes objets pour les mêmes propriétés et la même durée audio.

## Version suivante

Un changement incompatible incrémente `schemaVersion`. Les documents version 1 restent lisibles ou sont refusés explicitement. On ne réécrit pas un projet rendu.
