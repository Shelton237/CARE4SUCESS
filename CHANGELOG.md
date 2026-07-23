# Changelog

Toutes les modifications notables de care4success sont documentées dans ce fichier.
Format basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/), tenu à jour
par l'agent `github-doc-agent` à chaque PR mergée.

## [Non publié]

### Sécurité
- Retrait de `store.prod.env.fix` du suivi git et suppression du fallback
  `JWT_SECRET` en dur dans `server/index.js` ; le serveur refuse désormais de
  démarrer si `JWT_SECRET` est absent (`server/jwtSecret.js`). Rotation du
  `JWT_SECRET` de production et purge de l'historique git effectuées en
  complément. (PR [#2](https://github.com/Shelton237/CARE4SUCESS/pull/2),
  issue [#1](https://github.com/Shelton237/CARE4SUCESS/issues/1), ticket
  `T-01` de `docs/backlog.md`, constat `[B1]` de
  `docs/audits/AUDIT_2026-07-22.md`, `docs/adr/ADR-001-rotation-secret-jwt-compromis.md`)
- Protection de `PATCH /api/requests/:id` par le middleware `authenticateRequest`
  (la route répondait auparavant sans aucune authentification) et retrait de deux
  écritures de debug oubliées vers `/tmp/debug_api.log` dans `server/index.js`.
  (PR [#7](https://github.com/Shelton237/CARE4SUCESS/pull/7), issue
  [#3](https://github.com/Shelton237/CARE4SUCESS/issues/3), ticket `T-02` de
  `docs/backlog.md`, constat `[B2]` de `docs/audits/AUDIT_2026-07-22.md`)
- Durcissement du `.gitignore` avec des motifs explicites pour les artefacts de
  build/scratch (`dist_*.tar.gz`/`.zip`, `*.apk`, `*.id`) et les scripts d'admin à la
  racine, afin de réduire le risque de commit accidentel de credentials MySQL ou
  d'artefacts volumineux. (PR [#8](https://github.com/Shelton237/CARE4SUCESS/pull/8),
  issue [#4](https://github.com/Shelton237/CARE4SUCESS/issues/4), ticket `T-03` de
  `docs/backlog.md`, constats `[B3]`/`[M1]` de `docs/audits/AUDIT_2026-07-22.md`).
  Note de traçabilité : le nettoyage des credentials en clair dans les scripts
  scratch (ticket `T-04`, connexe) a été appliqué localement sur disque, non
  versionné (fichiers untracked, désormais couverts par ce `.gitignore` durci).

### Corrigé
- Réparation de la suite de tests frontend : ajout du helper
  `src/test/test-utils.tsx` (`renderWithQueryClient`) fournissant un
  `QueryClientProvider` manquant dans `Inscription.test.tsx`, qui faisait échouer
  2 tests sur 3 liés à `GeoSelector`. (PR
  [#9](https://github.com/Shelton237/CARE4SUCESS/pull/9), issue
  [#5](https://github.com/Shelton237/CARE4SUCESS/issues/5), ticket `T-06` de
  `docs/backlog.md`, constat `[M2]` de `docs/audits/AUDIT_2026-07-22.md`)

### Ajouté
- Mise en place de l'équipe d'agents Claude Code (diagnostician, tech-lead,
  unit-test-engineer, integration-test-engineer, hotfix-bugfix-dev, github-doc-agent)
  et des conventions associées (`docs/CONVENTIONS.md`, `.github/PULL_REQUEST_TEMPLATE.md`).
