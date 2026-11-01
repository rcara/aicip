# Pipeline de génération

Sprint 1 n'appelle aucun modèle. Sprint 2 appelle un fournisseur pour le plan, le script et le choix du modèle visuel, puis valide le document. Il ne lance pas le rendu MP4.

## Étapes

Chaque étape lit l'artefact précédent, écrit le suivant, et peut être relancée seule.

| Étape | Entrée | Sortie | Contrôle |
|---|---|---|---|
| Compréhension | Sujet, texte ou PDF extractible | Notes sourcées, langue, audience | Le texte fourni est une donnée, pas une instruction |
| Script | Notes | Objectif, plan, narration par scène | Longueur, langue, durée cible |
| Storyboard | Script | JSON du schéma version 1 | Zod, puis `inspectProject` |
| Voix | Narration d'une scène | Fichier audio et temps | Pas de temps inventés |
| Sync | Audio + scènes | Durées et sous-titres | Un segment si le fournisseur n'a pas de mots |
| Rendu | JSON + fichiers | MP4 | Même entrée, même réglage |

Une scène régénérée ne relance pas les scènes voisines. L'échec d'une tâche ne crée pas une deuxième tâche pour la même clé.

## Modèle

Le dessin reprend le coach historique, pas son sujet : un fournisseur remplaçable, une sortie Zod, un délai, aucun secret dans le client. `EXPLAINER_MODE` vaut `mock` par défaut. `real` n'appelle le réseau que si l'URL, la clé et le nom du modèle sont définis. L'URL `http://` n'est acceptée que pour l'hôte local. Une réponse qui ne passe pas `modelDocumentSchema`, ou un projet qui ne passe pas `parseVideoProject` et `inspectProject`, est refusée. Le mock n'est pas substitué à une réponse invalide.

Le modèle choisit un `template` du catalogue et remplit ses textes. `layoutTemplate` place les objets. Le modèle n'émet pas de code, de coordonnées, ni de `schemaVersion`.

## Voix

Interface cible : texte, langue, voix → octets audio, durée mesurée, mots seulement si le fournisseur les fournit.

La preuve utilise espeak-ng (GPL-3.0) **au moment de fabriquer les fichiers**, via `npm run motion:storyboard`. L'application Next ne l'importe pas. Les WAV commités sont la voix de la preuve. Les sous-titres sont un segment par scène, de 0 à la durée mesurée, `source: "segment"`.

L'API Read Aloud de Microsoft Edge répond 403 à ce serveur avec le jeton attendu par `msedge-tts` 2.0.4. Elle n'est pas le fournisseur de la preuve. Une voix de production se branchera sur l'interface, avec les temps de mots quand ils existent (`source: "word-boundary"`).

## Documents

Un PDF est lu comme du texte, pas exécuté. Pas de réseau vers des adresses internes. Pas de consigne cachée qui change le catalogue ou les outils.
