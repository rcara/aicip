# Pipeline de génération

Sprint 1 ne appelle aucun modèle. Le pipeline est spécifié pour que le sprint 2 s'y branche sans changer le document vidéo.

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

Reprendre le dessin du coach historique, pas son sujet : un fournisseur remplaçable, une sortie Zod, un quota, un délai, aucun secret dans le client. Le mode sans réseau doit rester possible pour les tests, avec un storyboard d'exemple.

Le modèle choisit un `template` du catalogue et remplit ses propriétés. Il ne choisit pas des coordonnées libres tant que la mise en page déterministe (`layoutTemplate`) suffit. Il n'émet pas de code.

## Voix

Interface cible : texte, langue, voix → octets audio, durée mesurée, mots seulement si le fournisseur les fournit.

La preuve utilise espeak-ng (GPL-3.0) **au moment de fabriquer les fichiers**, via `npm run motion:storyboard`. L'application Next ne l'importe pas. Les WAV commités sont la voix de la preuve. Les sous-titres sont un segment par scène, de 0 à la durée mesurée, `source: "segment"`.

L'API Read Aloud de Microsoft Edge répond 403 à ce serveur avec le jeton attendu par `msedge-tts` 2.0.4. Elle n'est pas le fournisseur de la preuve. Une voix de production se branchera sur l'interface, avec les temps de mots quand ils existent (`source: "word-boundary"`).

## Documents

Un PDF est lu comme du texte, pas exécuté. Pas de réseau vers des adresses internes. Pas de consigne cachée qui change le catalogue ou les outils.
