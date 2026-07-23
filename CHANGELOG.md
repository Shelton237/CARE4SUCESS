# Changelog

Toutes les modifications notables de care4success sont documentées dans ce fichier.
Format basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/), tenu à jour
par l'agent `github-doc-agent` à chaque PR mergée.

## [Non publié]

### Corrigé
- Correction des 6 erreurs ESLint bloquantes (`no-empty` dans
  `VirtualClassroom.tsx`/`teacher/Homework.tsx`,
  `no-non-null-asserted-optional-chain` dans `VirtualClassroom.tsx`,
  `no-useless-escape` dans `teacher/Schedule.tsx`), permettant à `npm run lint` de
  servir de gate CI (`T-09`). Comportement fonctionnel inchangé. (PR
  [#10](https://github.com/Shelton237/CARE4SUCESS/pull/10), issue
  [#6](https://github.com/Shelton237/CARE4SUCESS/issues/6), ticket `T-07` de
  `docs/backlog.md`, constat `[M6]` de `docs/audits/AUDIT_2026-07-22.md`)
