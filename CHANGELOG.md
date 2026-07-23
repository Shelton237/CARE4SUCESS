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

### Ajouté
- Mise en place de l'équipe d'agents Claude Code (diagnostician, tech-lead,
  unit-test-engineer, integration-test-engineer, hotfix-bugfix-dev, github-doc-agent)
  et des conventions associées (`docs/CONVENTIONS.md`, `.github/PULL_REQUEST_TEMPLATE.md`).
