# Conventions — care4success

Ce document définit les conventions utilisées par l'équipe d'agents (diagnostician,
tech-lead, unit-test-engineer, integration-test-engineer, hotfix-bugfix-dev,
github-doc-agent) pour le développement, les commits et la traçabilité GitHub.

## 1. Branches

| Préfixe    | Usage                                                        |
|------------|---------------------------------------------------------------|
| `hotfix/`  | Correctif urgent, prod ou sécurité (ex: `hotfix/jwt-expiry`) |
| `fix/`     | Bugfix standard (ex: `fix/homework-date-filter`)             |
| `feat/`    | Nouvelle fonctionnalité                                        |
| `chore/`   | Tâche technique sans impact fonctionnel (deps, config)       |
| `docs/`    | Documentation seule                                            |
| `test/`    | Ajout de tests sans changement de comportement                |

## 2. Commits — Conventional Commits

Format : `type(scope): description courte à l'impératif`

Types autorisés :
- `feat` — nouvelle fonctionnalité
- `fix` — correction de bug
- `hotfix` — correctif urgent isolé
- `docs` — documentation
- `test` — ajout/modification de tests
- `refactor` — changement sans impact fonctionnel
- `chore` — maintenance, dépendances, config

Le `scope` désigne la zone touchée quand c'est pertinent : `auth`, `homework`,
`matching`, `mysql`, `supabase`, `mobile`, `ci`, etc.

Exemples :
```
fix(auth): corrige l'expiration prématurée du JWT
hotfix(matching): empêche le crash sur zone géographique nulle
test(homework): ajoute la couverture des cas de devoirs en retard
docs(audit): ajoute le rapport d'audit du 2026-07-22
```

## 3. Labels GitHub

| Label       | Description                                                   |
|-------------|-----------------------------------------------------------------|
| `hotfix`    | Correctif urgent, prod ou sécurité                              |
| `bugfix`    | Correction standard avec tests                                  |
| `tech-debt` | Amélioration structurelle non urgente                           |
| `test`      | Ajout de couverture sans changement de comportement             |
| `docs`      | Documentation seule (audit, backlog, ADR, changelog)            |

Chaque issue et PR doit porter au moins un de ces labels. Une PR de hotfix porte
systématiquement `hotfix` en plus de tout autre label pertinent.

## 4. Traçabilité issue ↔ PR ↔ audit

- Toute issue créée à partir d'un constat d'audit référence le fichier
  `docs/audits/AUDIT_<date>.md` et l'ID du ticket dans `docs/backlog.md`.
- Toute PR référence l'issue via `Closes #<numéro>` dans sa description.
- Le CHANGELOG.md référence le numéro de PR pour chaque entrée.

## 5. Décisions d'architecture (ADR)

Les décisions non triviales prises par le tech-lead sont tracées dans
`docs/adr/ADR-<NNN>-<slug>.md`, format court (20-30 lignes) :
Contexte / Options considérées / Décision / Conséquences.

## 6. Règles non négociables (rappel)

- Jamais de push direct sur `main`/`master`.
- Jamais de merge sans validation du tech-lead + confirmation humaine finale.
- Toute modification de schéma MySQL ou de fonction Supabase edge doit être signalée
  explicitement au tech-lead avant exécution.
- Toute action destructive (DB, force-push) nécessite une confirmation humaine explicite.
- Langue des rapports, commentaires de code et messages de commit : français.
