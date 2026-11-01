# Critères d'acceptation — version 2

## Preuve Sprint 1

Entrée du film, storyboard écrit à la main :

« Explique le fonctionnement d'un processus de gestion des incidents IT, de la déclaration jusqu'à la résolution. »

Le document `incident-it.json` contient huit scènes : introduction, déclaration, qualification, priorisation, escalade, résolution, clôture, conclusion.

Attendu :

- objets animés dans le cadre
- fondu entre les scènes
- narration audio mesurée, sous-titres sur la durée de cette narration
- lecteur sur `/explain`
- MP4 `out/incident-it.mp4` avec une piste image et une piste audio
- durée du storyboard entre 60 et 180 secondes
- un changement de texte sur une scène ne déplace pas les objets des autres
- `inspectProject` retourne une liste vide
- le rendu ne crée pas une seconde tâche et n'altère pas le JSON

Mesure du 1er novembre 2026, 01:39 (Europe/Berlin), sur cette machine : `out/incident-it.mp4`, 4,3 Mo, durée 00:01:18.32, H.264 1280×720 à 30 images/s, AAC 48 kHz, 2349 images, code de sortie 0. Le fichier n'est pas versionné.

## Plus tard

- Un sujet produit un storyboard valide sans édition du JSON
- Une étape en échec se relance sans doublon et sans perdre le projet
- Les tests d'intégration couvrent la file, les tests bout en bout couvrent créer → voir → exporter
- La voix de production n'invente pas de temps de mots

## Tests de cette branche

```bash
npm run motion:storyboard   # régénère WAV et JSON
npm test -- tests/unit/motion.test.ts
npm run motion:render
```

Les tests historiques (`npm test`, lint, typecheck, e2e) doivent rester verts. L'e2e de démo exige encore le titre « entretien difficile » sur `/`.

Sur cette machine, le 1er novembre 2026 : lint, typecheck et 28 tests Vitest passent. L'e2e Playwright ne démarre pas : le navigateur demande `libnspr4` puis `libatk-1.0`, et WebKit une longue liste de bibliothèques graphiques. Elles n'ont pas été installées sur le système. `/` et `/explain` répondent 200 au serveur de développement.
