> **Note d'exploitation de la simulation, pas une autorisation de déploiement.** Le rendu vidéo est décrit dans [INFRASTRUCTURE_CAPACITY_PLAN.md](INFRASTRUCTURE_CAPACITY_PLAN.md).

# Exploitation

Ce document décrit une préproduction possible. Il n'autorise pas à la lancer et il ne nomme aucun domaine. Aucune commande de ce fichier n'a été exécutée comme déploiement.

## Décision préalable

La préproduction n'existe qu'après une demande explicite, sur une machine déjà choisie par l'opérateur. Le fichier `compose.prod.yml` est une hypothèse : Postgres sans port public, limites de 1,5 Go et 1 CPU par service, secret d'authentification injecté, coach en mode `mock` par défaut. Le réseau `aicip_internal` n'a pas de sortie. Un coach réel demanderait une règle de sortie vers le seul endpoint de l'opérateur, pas une egress ouverte.

Le workflow GitHub Actions vérifie le code. Il ne publie pas d'image et ne se connecte pas à un serveur.

## TLS

Le service applicatif n'écoute que sur `127.0.0.1:3000`. Le certificat et le nom d'hôte viennent de l'opérateur, devant ce port. Ils ne sont pas dans le dépôt.

## Sauvegarde

Le volume Postgres 18 est `/var/lib/postgresql`. Une sauvegarde utile est un `pg_dump` en format custom, chiffré avec l'outil de l'opérateur, copié hors de la machine, puis restauré une fois sur une base vide pour vérifier le fichier. Exemple de forme, avec des variables fournies sur place :

```bash
pg_dump --format=custom --file=aicip.dump "$DATABASE_URL"
# chiffrer aicip.dump et le copier hors de la machine
pg_restore --dbname="$RESTORE_URL" --clean --if-exists aicip.dump
```

Ne pas laisser le dump en clair sur le VPS partagé.

## Arrêt et retour arrière

Arrêter les conteneurs sans supprimer le volume :

```bash
docker compose -f compose.prod.yml stop
```

`docker compose down -v` efface la base. Le retour arrière consiste à relancer l'image précédente déjà construite, pas à ajouter une étape de déploiement dans la CI tant que cette étape n'est pas décidée.

## Ce que l'administration montre

La page `/admin`, réservée au rôle `admin`, compte les comptes actifs, les tentatives, les tentatives terminées, les kinds d'analytique (dont `replay_started`), les statuts de `ai_usage` et le nombre de messages d'intérêt. Elle ne liste pas les adresses et ne stocke pas le prompt du coach. L'indicateur affiché aux apprenants reste un indicateur d'exercice.

## Intérêt

Le formulaire en bas de l'accueil est volontaire. Il n'est pas nécessaire pour ouvrir la démo et il n'enregistre pas l'indicateur.
