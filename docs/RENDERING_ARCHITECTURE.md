# Architecture de rendu

## Lecture

`/explain` charge `@remotion/player` dans le navigateur seulement. La composition reçoit le projet en `inputProps`. Changer le thème ou le texte met à jour le lecteur sans nouveau MP4.

Les médias passent par `staticFile`. Un chemin `motion/incident/introduction.wav` est servi depuis `public/` par Next et par le serveur de rendu.

## Export

```bash
npm run motion:render
```

Le script `scripts/render-explainer.mjs` lance :

```text
remotion render src/remotion/index.ts IncidentIt out/incident-it.mp4
  --concurrency=1 --codec=h264 --overwrite
```

`out/` est ignoré par Git. Le MP4 n'est pas un artefact commité.

`--concurrency=1` limite Chrome à un onglet. Sur le VPS partagé, un rendu parallèle saturerait les autres applications.

Le Chromium de Playwright et le navigateur téléchargé par Remotion réclament `libnspr4`, `libnss3` et `libnssutil3`, absentes de cette image. Aucun paquet n'a été installé sur le système. Les bibliothèques ont été extraites dans `node_modules/.remotion/system-libs`, ignoré par Git, et le script de rendu les ajoute à `LD_LIBRARY_PATH` si le dossier existe. Sans ce dossier, le rendu échoue au lancement du navigateur.

## Déterminisme

Le document, les polices demandées (Inter, latin, graisses 400, 600, 700) et les WAV fixent la composition. Le codec H.264 peut encore différer d'un binaire à l'autre. La preuve de reproductibilité exigée ici est : même storyboard, mêmes médias, mêmes options, une seule tâche de rendu. Deux empreintes d'octets identiques ne sont pas garanties tant que l'encodeur n'est pas épinglé.

## Ce que le rendu ne fait pas

Pas de `compose.prod.yml`. Pas de proxy. Pas de vhost. Pas de file. L'échec du rendu ne relance rien tout seul : on relance la commande. Le projet JSON n'est pas modifié par le rendu.
