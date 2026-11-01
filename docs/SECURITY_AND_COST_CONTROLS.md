# Sécurité et coûts

## Menaces de la génération

Le sujet, le texte collé, le PDF et les URL sont des données. Ils ne deviennent pas des consignes, du SQL, des chemins ou des requêtes réseau.

- Schéma strict : une clé inconnue est refusée.
- Catalogue fermé : pas de composant dont le nom vient du document hors liste.
- Pas de code généré exécuté.
- `audioSrc` limité à `motion/…​.wav` ou `.mp3` sous `public/`.
- Pas de lecture d'URL dans le rendu de cette preuve.
- Les secrets restent dans l'environnement. `.env` n'est pas commité. Le studio n'affiche aucune clé.

## Voix de la preuve

espeak-ng 1.0.2 est en dépendance de développement, licence GPL-3.0-or-later. Il sert à régénérer les WAV. Il n'est pas importé par Next. Si cette licence gêne la distribution du dépôt, on retire le paquet et on garde les WAV, ou on les refait avec un autre synthétiseur.

La voix neural Microsoft n'a pas été utilisée : le socket a répondu 403.

## Coûts à compter plus tard

| Poste | Unité |
|---|---|
| Modèle | jetons entrée et sortie |
| Voix | caractères ou secondes |
| Stockage | octets × durée |
| Rendu | secondes de CPU, et 0,01 USD Remotion par rendu réussi si la licence Automators s'applique |
| Remotion société | minimum 100 USD / mois au-delà du gratuit |

Plafonds prévus : durée 60–180 s au MVP, 24 scènes, taille de PDF, rendus par jour et par compte. Aucun plafond n'est encore branché sur le studio, parce qu'il ne consomme pas de modèle.

## Licence Remotion

Évaluation et petites équipes : gratuit, y compris un usage commercial sous les conditions publiées. Équipe de 4 personnes ou plus, ou produit déjà commercial : licence à acheter avant l'offre. Ne pas exposer un rendu de projets Remotion arbitraires.

## Vie privée

Le storyboard de la preuve ne contient pas de donnée personnelle. Les comptes de la simulation restent soumis aux règles déjà écrites dans `docs/DECISIONS.md`. Le studio ne les lit pas.
