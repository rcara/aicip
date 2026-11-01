# Moteur de motion design

## Rôle

Composer une vidéo à partir d'un document, pas à partir d'un écran filmé.

## Code

- `src/modules/motion/schema.ts` — document, cadre 1280×720, 30 images/s
- `src/modules/motion/compile.ts` — propriétés de modèle → objets placés
- `src/modules/motion/validate.ts` — débordement, durées, chemins audio
- `src/modules/motion/cues.ts` — sous-titres, y compris les temps de mots quand ils existent
- `src/modules/motion/themes.ts` — cinq styles, couleurs seulement
- `src/remotion/SceneGraphics.tsx` — dessin SVG des objets
- `src/remotion/ExplainerComposition.tsx` — scènes, fondus, audio

Le cadre utile laisse 64 px sur les côtés, 48 px en haut, et 108 px en bas pour le sous-titre. `inspectProject` refuse un objet qui sort de cette zone.

## Objets

`text`, `panel`, `node`, `arrow`, `bar`, `badge`. Chacun a un identifiant stable, une boîte, un instant d'apparition et une animation : `fade-up`, `draw`, `grow`, `highlight`.

Le composant dessine ces objets. Il n'invente pas une position absente du document.

## Temps

La durée d'une scène est la durée audio mesurée plus 400 ms, ou davantage si une apparition tombe plus tard. La durée en images est `round(ms / 1000 × 30)`, au moins 1. Le test vérifie cette égalité.

Le fondu dure 240 ms. Il ne chevauche pas la scène suivante : la coupe reste simple et reproductible.

## Storyboard d'incident

`src/modules/motion/fixtures/incident-authoring.ts` décrit les huit scènes. `npm run motion:storyboard` écrit les WAV dans `public/motion/incident/` et le document compilé dans `incident-it.json`.

Ordre : introduction, déclaration (flux), qualification (comparaison), priorisation (graphique), escalade (hiérarchie), résolution (chronologie), clôture (à retenir), conclusion.

Les modèles cause-et-effet et concept sont dans le catalogue et couverts par le test unitaire. Ils ne sont pas dans ce film.

## Édition

Le studio peut changer le style et le texte du sous-titre en mémoire. La géométrie et le fichier audio ne bougent pas. C'est voulu : la voix de la preuve n'est pas régénérée dans le navigateur.
