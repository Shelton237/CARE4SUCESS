# Changelog

Toutes les modifications notables de care4success sont documentées dans ce fichier.
Format basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/), tenu à jour
par l'agent `github-doc-agent` à chaque PR mergée.

## [Non publié]

### Sécurité
- Protection de `PATCH /api/requests/:id` par le middleware `authenticateRequest`
  (la route répondait auparavant sans aucune authentification) et retrait de deux
  écritures de debug oubliées vers `/tmp/debug_api.log` dans `server/index.js`.
  (PR [#7](https://github.com/Shelton237/CARE4SUCESS/pull/7), issue
  [#3](https://github.com/Shelton237/CARE4SUCESS/issues/3), ticket `T-02` de
  `docs/backlog.md`, constat `[B2]` de `docs/audits/AUDIT_2026-07-22.md`)
