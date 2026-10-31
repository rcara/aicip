# Cahier des charges fonctionnel — Interactive Soft Skills Academy
Version 1.0 — 31/10/2026 — statut : cadrage initial

## 1. Résumé exécutif

**Objectif** : concevoir une plateforme SaaS permettant de s'exercer aux compétences comportementales dans des scènes de travail réalistes. L'apprenant observe un contexte, prend une décision, découvre des conséquences, reçoit un débriefing et peut recommencer depuis un point de décision. Une couche d'IA joue le rôle de partenaire pédagogique, mais ne contrôle ni les règles ni les notes officielles.

**Analogon Scrimba** : « pause / edit / resume » devient **« pause / decide / replay / reflect »**. Le produit ne doit pas copier la marque, les supports ou la propriété intellectuelle de Scrimba.

**Proposition de valeur** : transformer la théorie en pratique volontaire, répétable et contextualisée. Une expérience brève, claire et privée, utilisable sur ordinateur et téléphone.

## 2. Public cible et scénario de lancement

### ICP prioritaire (hypothèse à valider)
- Managers de proximité, chefs d'équipe, tech leads, futurs managers dans l'IT, le support, le SaaS et le digital.
- Professionnels souvent âgés de 28–45 ans, mais segmentation fondée sur **l'étape de carrière et le problème**, sans restriction d'âge.
- Client initial : individu souhaitant progresser sans s'exposer devant ses collègues ; ultérieurement responsable L&D achetant des accès volontaires.
- France et Suisse romande d'abord (français) ; architecture i18n prévoyant anglais.

### Job-to-be-done
« Lorsque je dois mener une conversation difficile, gérer un conflit ou refuser une demande irréaliste, je veux m'entraîner dans un environnement sans risque pour apprendre quoi dire et comment réagir avant d'affronter la vraie situation. »

### Alternatives concurrentielles à comparer lors de la validation
- Vidéos et MOOCs passifs ; formation présentielle et coaching ; chatbots génériques ; outils de roleplay IA ; LXP corporate.
- Valeur distinctive hypothétique : scénarios professionnels courts et structurés, rejouabilité des branches, explications fondées sur des critères visibles, confidentialité, traduction des acquis en plan d'action.

## 3. Concept pédagogique

### Leçon type de 8 à 12 minutes
1. **Briefing (45 s)** : contexte, rôles, enjeu et objectif d'apprentissage.
2. **Situation initiale (1 min)** : dialogue présenté en séquence, texte accessible et option audio ultérieure.
3. **Point de décision** : 2–4 options pertinentes ; une réponse libre courte facultative.
4. **Conséquence** : réaction du personnage et évolution de la situation.
5. **Débriefing** : éléments observables, tensions créées, choix alternatifs ; recommandations, sans psychologie spéculative.
6. **Rejouer** : retour à n'importe quel point autorisé, création d'une nouvelle tentative/branche sans écraser l'ancienne.
7. **Transfert** : micro-engagement « ce que j'essaierai à ma prochaine réunion ».

### Cinq capacités à travailler dans le scénario pilote
Écoute active, formulation factuelle, empathie sans complaisance, clarification des attentes, conclusion avec action suivie. Rubrique sur 100 points ; pondération éditoriale visible et versionnée ; la note n'est **pas** une mesure de personnalité ou d'aptitude à l'emploi.

### Principe de notation
- Pour les **choix structurés**, contribution déterministe prévalidée par auteur, associée aux critères de la rubrique et aux conséquences.
- Pour **réponse libre**, l'IA fournit d'abord un feedback **formatif et non certifiant**, avec preuves textuelles courtes et niveau de confiance déclaré. Elle peut suggérer des intentions ; l'utilisateur confirme la direction de scénario en cas d'ambiguïté.
- Toute « note IA » expérimentale reste distincte du score déterministe, clairement étiquetée, jamais transmise à un employeur par défaut.
- L'IA ne peut ni générer de nouvelles transitions non autorisées, ni modifier des résultats ou les scores persistés.

## 4. Personas et accès

| Persona | Actions principales | MVP |
|---|---|---|
| Visiteur | Voir la promesse produit et lancer un aperçu | Oui |
| Apprenant | Compte, simulation, replay, historique, progression | Oui |
| Éditeur | Maintenir les scènes et rubriques | Oui, via JSON seed/admin simple |
| Administrateur | Publier contenus versionnés, voir métriques agrégées | Oui, minimal |
| Responsable formation B2B | Gérer sièges et rapports agrégés | Non, phase 3 |

## 5. Exigences fonctionnelles

### F01 — Accueil, orientation, catalogue
- Présenter 3 parcours thématiques : conversations difficiles, influence et gestion des priorités ; **un seul parcours complet** au MVP.
- Choix d'une situation en moins de trois actions depuis le dashboard.
- Aucun questionnaire de personnalité ni profilage sensible.

### F02 — Compte et confidentialité
- Identifiant sécurisé et session côté serveur ; utilisateur propriétaire de ses tentatives.
- Historique privé, suppression de compte et export de réponses dans le périmètre du MVP si données personnelles effectivement stockées.
- Politique de confidentialité accessible et consentement de transmission au prestataire IA expliqué.

### F03 — Simulation
- Afficher le contexte, une timeline de dialogues, le choix courant et la conséquence.
- Sauvegarder chaque décision comme événement immutable ; supporter reprise après fermeture.
- Rewind : créer une branche et conserver la traçabilité des tentatives, jamais éditer l'histoire.
- Scénario et version figés au démarrage d'une tentative.
- Activer un mode démo ne nécessitant pas de compte.

### F04 — Feedback et apprentissage
- Expliquer les dimensions observables et indiquer au moins une alternative pertinente.
- Indiquer quelles décisions ont favorisé ou limité le résultat.
- Permettre d'observer l'évolution entre deux tentatives sans comparaison entre personnes.
- Afficher « pédagogie, pas diagnostic ni appréciation RH ».

### F05 — IA contextuelle
- Aider à reformuler, clarifier et débriefer à partir du contexte du scénario, sans inventer de politique interne d'entreprise.
- Réponses JSON validées par schéma et assainies avant affichage ; fournisseur simulé sans réseau pour tests.
- Quota par apprenant et budget global ; repli sur feedback déterministe lorsque l'IA ne répond pas.
- Détection et limitation de contenu abusif/injection de prompt ; logs sans texte privé par défaut.

### F06 — Administration de contenu
- Format scénario versionné en JSON avec validation automatique.
- Draft/publish/archived ; migrations/compatibilité explicites.
- Éditeur visuel low-code reporté après les premières preuves d'usage.

### F07 — Analytics
- Événements : scenario_viewed, attempt_started, decision_committed, attempt_completed, replay_started, feedback_viewed, ai_request, ai_error.
- Dashboard propriétaire : activation, complétion, retour à 7 jours, rejouabilité, coûts IA agrégés.
- Pas d'enregistrement de données individuelles sensibles dans l'analytics.

## 6. UX/UI et accessibilité

- Interface professionnelle calme : navigation très visible, typographie lisible, menu latéral compact et fil d'Ariane.
- Écran de simulation en trois zones sur desktop : **contexte**, **dialogue + décision**, **progression / aide** ; sur mobile, une seule colonne avec CTA visible.
- Barre de progression montrant « chapitre X / Y » et non un chronomètre artificiel.
- Actions « pause », « reprendre », « rejouer depuis ici », « comparer ».
- Clavier et lecteurs d'écran ; respect des critères WCAG 2.2 AA comme cible de design et de test.
- Contrastes renforcés, taille de texte ajustable, aucun retour fondé uniquement sur la couleur ; possibilité de supprimer animations et son.
- Ne pas afficher des scores isolés sous forme de classement social ou jugement personnel.

## 7. Règles non fonctionnelles

| Domaine | Cible initiale / contrainte |
|---|---|
| Sécurité | Autorisations serveur pour toutes les données ; cookies sécurisés ; secrets hors repo ; limitation des requêtes |
| Performance | Page interactive utilisable sur téléphone 4G ; objectif indicatif LCP < 2,5s sur pages clés en tests représentatifs |
| IA | Délai p95 cible < 10s sous conditions normales ; feedback de repli immédiat ; budgets et quotas configurables |
| Reproductibilité | Relecture d'une tentative et scores déterministes identiques pour une même version de scénario |
| Résilience | Aucun blocage de simulation quand le prestataire LLM est en panne |
| Sauvegarde | Sauvegardes chiffrées hors VPS, test de restauration documenté |
| Internationalisation | Interface initiale FR, contenus prêts pour traduction EN |
| Observabilité | Health checks, erreurs structurées, métriques sans exposer contenu privé |
| Évolutivité | Monolithe modulaire, multi-organisation préparée mais interface B2B différée |

## 8. Conformité et éthique

- Produit initial d'entraînement **volontaire, personnel et formatif**.
- Ne jamais utiliser la plateforme comme outil de recrutement, d'avancement, de licenciement ou de surveillance professionnelle sans une analyse juridique, réglementaire et de risque approfondie distincte.
- Dans l'UE, certaines évaluations de résultats d'apprentissage en formation professionnelle et certains systèmes liés à l'emploi peuvent relever de l'AI Act, annexe III selon le contexte précis. Le statut ne peut pas être présumé exonéré sous prétexte que le produit est « éducatif ».
- En Suisse, respecter la LPD : transparence, minimisation, limitation de finalité, suppression, protection dès la conception, maîtrise des transferts vers sous-traitants IA. Déterminer les obligations RGPD pour la clientèle UE.
- Pas d'analyse d'émotions par voix/visage, pas de profilage sur critères protégés, pas de surveillance des salariés.
- Les contenus sont pédagogiques, n'ont pas vocation à se substituer à un psychologue, juriste ou spécialiste RH.

## 9. Validation commerciale (avant abonnement)

### Hypothèses de prix *à tester, non marché constaté*
- B2C : 19–29 CHF / mois ou 149–249 CHF / an.
- B2B ultérieur : pilote forfaitisé puis tarification par siège, sans surveillance individuelle des employés.

### Entretiens et signal d'achat
- 15–20 entretiens avec responsables d'équipes IT/Tech ; recueillir incidents concrets et comportements de substitution.
- Landing page + liste d'attente qualifiée ; 5–10 utilisateurs pilotes réalisant au moins 2 tentatives.
- 3–5 conversations avec responsables formation B2B ; obtenir une intention vérifiable (pilote payé, lettre d'intérêt, budget confirmé).
- Ne pas prendre un score NPS ou les inscriptions gratuits comme preuve suffisante de volonté de payer.

### KPI pilotes et seuils de décision (objectifs à challenger)
- ≥ 60 % des utilisateurs ayant commencé une simulation la terminent.
- ≥ 40 % des utilisateurs ayant terminé rejouent au moins un point.
- ≥ 70 % des retours pilotes qualifient le débriefing d'utile pour une vraie situation.
- Au moins trois intentions commerciales explicites ou un premier pilote payant pour poursuivre l'investissement.

## 10. Hors périmètre MVP

- Vidéo interactive multicaméra, capture d'écran, éditeur de code.
- Avatars 3D, analyse vocale / biométrique, réalité virtuelle.
- Bibliothèque de centaines de cours, marketplace de formateurs.
- Génération autonome de centaines de scénarios non validés.
- Scoring RH ou employeur, certifications officielles.
- Application native iOS/Android ; une PWA responsive suffit.
- Architecture microservices/Kubernetes ; inutile au stade initial.

## 11. Risques et parades

| Risque | Impact | Réponse |
|---|---|---|
| Simple chatbot sans différenciation | Fort | Moteur versionné + branches + replay + débriefing |
| Feedback IA incohérent | Fort | Rubriques explicites, modèles structurés, fallback, revue de contenu |
| Risque RGPD/LPD ou AI Act | Fort | Finalité formative, données privées, privacy-by-design, revue juridique selon cas d'usage |
| Contenu peu crédible | Fort | Validation par managers pilotes et spécialistes pédagogiques |
| Coûts IA incontrôlés | Moyen/fort | Quotas, budget mensuel global, cache des textes invariants, monitoring |
| VPS partagé saturé | Moyen | Limites conteneurs, pas de génération vidéo, stockage externe |
| Absence de volonté de payer | Fort | Validation terrain avant investissement contenus massif |

## 12. Definition of Done produit

Un utilisateur inconnu peut ouvrir la démo, comprendre la scène, prendre 2–3 décisions, voir les conséquences, consulter un débriefing et rejouer une décision. Avec un compte, il retrouve sa progression. Le contenu est versionné ; les transitions sont déterministes ; la panne d'IA n'interrompt pas le parcours ; les tests de sécurité, de qualité et la sauvegarde sont documentés.
