# Changelog

Toutes les modifications notables de care4success sont documentées dans ce fichier.
Format basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/), tenu à jour
par l'agent `github-doc-agent` à chaque PR mergée.

## [Non publié]

### Corrigé
- Réparation de la suite de tests frontend : ajout du helper
  `src/test/test-utils.tsx` (`renderWithQueryClient`) fournissant un
  `QueryClientProvider` manquant dans `Inscription.test.tsx`, qui faisait échouer
  2 tests sur 3 liés à `GeoSelector`. (PR
  [#9](https://github.com/Shelton237/CARE4SUCESS/pull/9), issue
  [#5](https://github.com/Shelton237/CARE4SUCESS/issues/5), ticket `T-06` de
  `docs/backlog.md`, constat `[M2]` de `docs/audits/AUDIT_2026-07-22.md`)
