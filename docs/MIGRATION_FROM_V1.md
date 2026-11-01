# Migration depuis la simulation

## Décision

On n'efface pas la simulation. On cesse de la traiter comme le produit. Les routes, le schéma Postgres, les tests de compte et de démo restent verts.

## Conserver

| Élément | Pourquoi |
|---|---|
| Next.js 16, React 19, TypeScript, Tailwind, Zod | Socle du studio |
| Postgres, Drizzle, better-auth | Comptes du sprint 5 |
| `ai-coach` : provider, Zod, quota, pas de réseau en test | Modèle du futur fournisseur, pas le métier |
| Tests unitaires, d'intégration et bout en bout | Filet de la simulation tant qu'elle est là |
| `compose.dev.yml` | Base locale, boucle seulement |
| `.env.example` | Secrets hors Git |

## Ne plus étendre

| Élément | Devenir |
|---|---|
| `src/modules/simulation`, scénarios, débriefing, indicateur | Figé, extension pédagogique éventuelle |
| `docs/01` à `docs/04`, `IMPLEMENTATION_PLAN.md` | Historique |
| `docs/05_SCENARIO_PILOTE.json` | Donnée de la démo. Ne pas l'éditer : l'empreinte publiée est immuable |
| Coach « entretien difficile » | Hors du nouveau MVP |
| Page `/` | Reste la démo tant que `tests/e2e/demo.spec.ts` l'exige |

## Ajouté

`src/modules/motion`, `src/remotion`, `/explain`, les documents `*_V2.md` et les trois documents de moteur, de rendu, de capacité et de sécurité.

## Adaptation des scripts locaux

`db:migrate` et `db:seed` chargent `.env` avec `--env-file-if-exists` si le fichier de travail le contient. C'est un détail d'exécution local, pas un changement de produit. Il est dans l'arbre parce que `package.json` porte aussi les scripts du moteur.

## Risques

- Deux produits dans un dépôt : un agent peut reprendre la simulation. Les règles `.cursor/rules/project.mdc` et `AGENTS.md` l'interdisent.
- Remotion alourdit `node_modules` et le client du studio. Le lecteur n'est pas sur `/`.
- La licence Remotion et la GPL d'espeak-ng sont des décisions ouvertes, écrites dans `SECURITY_AND_COST_CONTROLS.md`.
- L'accueil n'a pas encore la promesse du nouveau produit. `/explain` est l'entrée.

## Documents historiques

Ils restent à leur chemin, avec un bandeau. Les déplacer casserait les tests qui lisent `docs/05_SCENARIO_PILOTE.json` et les liens déjà cités.
