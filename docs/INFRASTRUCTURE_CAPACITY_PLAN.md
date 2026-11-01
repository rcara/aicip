# Capacité et infrastructure

## Machine actuelle

VPS Ubuntu partagé, 16 Go de RAM, 8 vCPU ou plus, Docker, d'autres applications déjà servies. Le rendu ne doit pas les affamer.

## Maintenant

- Postgres de développement : `docker compose -f compose.dev.yml`, boucle locale, déjà en place pour la simulation. Le studio n'en a pas besoin.
- Rendu : un Chrome, une vidéo à la fois, 1280×720, 30 images/s.
- Durée de la preuve : environ 78 secondes, soit environ 2 350 images.
- Pas de déploiement. `compose.prod.yml` n'est pas une mise en production.
- Les médias de la preuve sont dans le dépôt (`public/motion/incident`). Pas de seau S3.

## Quand le rendu devient un service

1. File BullMQ et Redis, un worker séparé du processus Next.
2. Un seul rendu actif sur cette machine, les autres attendent.
3. Plafond mémoire du worker, et arrêt si la file dépasse un seuil.
4. Au-delà de la charge confortable : worker externe (machine dédiée ou service de rendu), le VPS ne garde que l'API et les fichiers légers.
5. Objets audio et MP4 dans un stockage S3 compatible, avec durée de rétention et purge.
6. Les projets et les tâches survivent au redémarrage. Relancer une tâche échouée reprend le même identifiant.

## Rétention proposée

| Donnée | Durée de départ |
|---|---|
| Storyboard JSON | Vie du projet |
| Audio de travail | Vie de la version |
| MP4 | 30 jours après le dernier téléchargement, puis purge |
| Journaux de tâche | 30 jours, sans le texte source complet |

Ces durées ne sont pas encore appliquées. Elles ne remplacent pas `ACCOUNT_RETENTION_DAYS` de la simulation.
