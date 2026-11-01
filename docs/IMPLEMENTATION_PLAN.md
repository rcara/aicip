> **Historique — plan de la simulation.** La feuille de route courante est [DEVELOPMENT_ROADMAP_V2.md](DEVELOPMENT_ROADMAP_V2.md).

# Plan d'implémentation

Le Sprint 1 est livré dans cette branche. Le détail de ce qui a été exécuté et vérifié est dans `docs/SPRINT1_REPORT.md`. Les choix déjà figés sont dans `docs/DECISIONS.md`.

Les fourchettes de jours du backlog (`docs/02_MVP_BACKLOG.md`) sont des hypothèses du dossier de lancement. Ce plan ne les reprend pas comme calendrier. Il décrit les composants, les dépendances et les risques.

Hors de ce plan, même plus tard, tant qu'une demande explicite ne les ajoute pas : facturation, voix, place de marché, microservices, score de personnalité ou d'employabilité, et déploiement de production.

## Déjà en place et réutilisé ensuite

- Moteur pur, graphe validé, versions immuables, rejeu non destructif, indicateur recalculé.
- Schéma better-auth et formulaire `/connexion`. Une inscription locale a répondu 200 ; le rôle renvoyé était `learner`. Les tests de bout en bout ne couvrent pas encore la connexion.
- Coach simulé, repli si le mode réel est demandé, validation Zod, aucune écriture de l'indicateur par l'IA.
- Analytique sans texte de dialogue. Trigger d'immuabilité. Cookie de démo distinct du compte.

## Sprint 2 — compte, historique, publication

Objectif : deux comptes ne se voient pas, une tentative reprend après une nouvelle session, et une version publiée s'ajoute sans réécrire la précédente.

### Identité

- Garder better-auth. Ne pas exposer `role` à l'inscription : c'est déjà le cas (`input: false`).
- Prévoir une commande serveur, hors interface publique, pour attribuer `admin` à un utilisateur existant. Ne pas semer de mot de passe d'administrateur.
- Lier toute nouvelle tentative d'un utilisateur connecté à `userId`. Ne pas recopier le hash du cookie de démo sur ces lignes.
- Décider du sort des tentatives anonymes au moment de la connexion : les laisser sur le cookie, sans les fusionner automatiquement avec le compte. Une fusion serait une décision produit séparée, parce qu'elle déplace des données privées.

### Parcours apprenant

- Page d'historique du compte : tentatives de l'utilisateur, tous scénarios, avec statut, indicateur s'il existe, et lien de reprise. Le filtre SQL par propriétaire existe déjà pour une page scénario ; l'étendre au compte sans charger les lignes des autres.
- Reprise : la page démo accepte déjà `?attempt=`. Vérifier qu'un rechargement et une nouvelle session retrouvent la même tentative, et qu'un identifiant étranger reste un 404.
- Comparaison : le débriefing compare déjà la branche et l'originale quand le même acteur possède le parent. Conserver cette règle.
- Export : un JSON limité aux tentatives, événements et note de transfert de l'acteur. Pas de texte d'un autre compte, pas de secret de session.
- Suppression : utiliser `deleted_at` sur l'utilisateur, supprimer ou détacher ses tentatives, et écrire un journal de suppression sans le contenu du dialogue. Rétention configurable par variable d'environnement, avec une valeur par défaut documentée. Ne pas supprimer une version de scénario publiée pour effacer un apprenant.

### Administration

- `/admin` reste inaccessible sans `role = admin`. Aujourd'hui la page répond 404. Le sprint 2 peut afficher un écran de publication seulement après ce contrôle, toujours côté serveur.
- Publier = valider le JSON (`parseScenario` / `validateScenarioGraph`), calculer l'empreinte, insérer une nouvelle `scenario_versions`. Ne jamais mettre à jour une ligne publiée. Le trigger est la garantie de dernier recours ; le code doit aussi refuser l'update.
- Une nouvelle version n'entraîne pas les tentatives anciennes. Le test d'intégration « version pinned » couvre déjà ce cas pour le moteur.

### Analytique

- Compter les kinds déjà définis (`scenario_viewed`, `decision_committed`, `attempt_completed`, `ai_request`) sans stocker le dialogue ni la note de transfert.
- Pas de tableau de bord produit prioritaire. Une liste de comptes suffit à l'admin pour vérifier le volume.

### Tests à ajouter

- Deux utilisateurs better-auth : A ne lit pas la tentative de B (API et page).
- Reprise après un nouveau cookie de session.
- Export et suppression n'affectent pas l'autre compte ni le scénario publié.
- Publication d'une version 2 : les tentatives v1 restent lisibles et gardent leur indicateur.

### Risques

- Mélanger cookie de démo et session : une tentative anonyme ne doit pas devenir visible pour le prochain visiteur du même navigateur après déconnexion si le cookie de démo est encore là. Documenter ce comportement dans l'interface.
- Un `loading.tsx` au-dessus d'une page qui appelle `notFound()` refait passer le statut HTTP à 200. Ne pas le réintroduire.

## Sprint 3 — coach réel, borné

Objectif : un fournisseur interchangeable peut commenter une tentative terminée. Il ne choisit pas la transition, ne modifie pas le scénario publié et ne change pas l'indicateur persisté.

### Dépendance

Le mode mock reste le défaut et doit continuer à fonctionner sans clé. Le mode réel dépend d'une clé fournie par l'opérateur dans l'environnement du serveur (`AI_API_KEY`). Ne pas inventer de fournisseur, de domaine ou de secret dans le dépôt.

### Fournisseur

- Remplacer le corps de l'appel réel, aujourd'hui `RealAiCoachDisabled`, par un client qui n'est construit que si `AI_COACH_MODE=real` et si la clé est présente.
- Contexte maximal : briefing, objectif, nœud courant, choix de cette tentative, extraits de rubrique, consignes pédagogiques du scénario. Pas d'autres tentatives, pas de profil RH.
- Entrée et sortie passent par Zod. La sortie attendue reste : résumé, points d'appui, pistes, reformulation, question de réflexion, drapeau d'incertitude. Longueurs maximales déjà ébauchées dans `src/lib/http.ts` ; les appliquer aussi à la réponse du modèle.
- Délai d'attente, quota par acteur et plafond global. Au-delà, ou si le JSON est invalide, repli sur le mock avec `source: "fallback"` et `certifying: false`. C'est déjà le contrat de `runCoach`.
- Après l'appel, relire `final_score`. S'il a changé, c'est un défaut bloquant. La route coach le vérifie déjà.
- Journaliser dans `ai_usage` le fournisseur, le modèle, le statut et l'acteur. Pas le prompt complet.

### Pédagogie

- Réponse libre facultative : le texte est stocké comme note ou comme événement de réflexion. Le prochain nœud reste celui du graphe, choisi par `commitChoice`.
- Afficher la mention déjà prévue : feedback non certifiant, et le détail « comment c'est calculé » pour l'indicateur déterministe.
- Tests d'injection : la consigne ne doit pas être répétée, `nextNodeId` ne doit pas sortir du modèle, et une sortie hors schéma est rejetée. Étendre les cas unitaires existants avec des fixtures, sans réseau dans le test par défaut.
- La relecture humaine d'une vingtaine de cas de référence est un jalon de contenu. Elle ne se remplace pas par un test automatique.

### Risques

- `compose.prod.yml` place l'application sur un réseau interne sans sortie. Un coach réel aura besoin d'une sortie explicite vers le seul hôte du fournisseur. Ne pas ouvrir toute l'egress pour ce sprint.
- Un prompt trop large recopierait des données d'un autre apprenant. Le test d'isolation du Sprint 2 est un prérequis.

## Sprint 4 — pilote local et préproduction, après accord

Objectif : le parcours est tenu sur les navigateurs ciblés, et une préproduction n'existe que si elle est demandée. Ce dépôt ne déploie pas.

### Qualité navigateur

- Chromium est couvert par `tests/e2e/demo.spec.ts` (parcours complet, rejeu, 360 px sans débordement, 404 admin et scénario inconnu).
- Ajouter les projets Playwright WebKit et Mobile Chrome sur le même parcours, clavier compris. Le test actuel couvre une flèche bas sur les boutons radio.
- Safari iOS et Android réels restent une vérification manuelle : Playwright ne les remplace pas.

### Préproduction

Uniquement après une demande explicite, sur une machine déjà décidée par l'opérateur. Ne pas inventer de nom de domaine.

- S'appuyer sur `Dockerfile` et `compose.prod.yml` comme hypothèse : pas de port public pour Postgres, limites mémoire et CPU, secret d'auth injecté, mode coach mock par défaut.
- TLS, sauvegardes chiffrées hors de la machine, essai de restauration, et une procédure d'arrêt. Le volume Postgres 18 est `/var/lib/postgresql`.
- Le workflow GitHub Actions actuel vérifie lint, types, scénario, tests, build et Playwright. Promouvoir une image n'en fait pas un déploiement tant que l'étape n'est pas ajoutée et approuvée.
- Surveiller `ai_usage` et le nombre de tentatives terminées ou rejouées. Pas de tableau de bord RH.

### Mesure pilote

- Complétion et rejeu via les kinds d'analytique, sans texte.
- Une collecte d'intérêt, si elle existe, est un formulaire volontaire séparé du score. Elle ne conditionne pas l'accès à la démo.

### Risques

- Lancer `compose.prod.yml` sur le VPS partagé sans plafond ni sauvegarde. Les plafonds du fichier sont une hypothèse, pas une autorisation de déploiement.
- Traiter l'indicateur 0–100 comme une note de performance. Le libellé reste « indicateur d'exercice ».
