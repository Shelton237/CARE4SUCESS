# Changelog

Toutes les modifications notables de care4success sont documentées dans ce fichier.
Format basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/), tenu à jour
par l'agent `github-doc-agent` à chaque PR mergée.

## [Non publié]

### Sécurité
- Durcissement du `.gitignore` avec des motifs explicites pour les artefacts de
  build/scratch (`dist_*.tar.gz`/`.zip`, `*.apk`, `*.id`) et les scripts d'admin à la
  racine, afin de réduire le risque de commit accidentel de credentials MySQL ou
  d'artefacts volumineux. (PR [#8](https://github.com/Shelton237/CARE4SUCESS/pull/8),
  issue [#4](https://github.com/Shelton237/CARE4SUCESS/issues/4), ticket `T-03` de
  `docs/backlog.md`, constats `[B3]`/`[M1]` de `docs/audits/AUDIT_2026-07-22.md`).
  Note de traçabilité : le nettoyage des credentials en clair dans les scripts
  scratch (ticket `T-04`, connexe) a été appliqué localement sur disque, non
  versionné (fichiers untracked, désormais couverts par ce `.gitignore` durci).
