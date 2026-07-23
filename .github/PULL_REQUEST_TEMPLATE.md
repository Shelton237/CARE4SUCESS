## Contexte
<!-- Pourquoi ce changement ? Lien vers l'issue et/ou le rapport d'audit d'origine
     (ex: docs/audits/AUDIT_2026-07-22.md, ticket docs/backlog.md#ID). -->

## Cause racine
<!-- Pour un hotfix/bugfix : qu'est-ce qui causait réellement le bug ? Pas seulement
     le symptôme observé. Pour une tâche de tech-debt/docs sans bug, indiquer "N/A". -->

## Correctif
<!-- Résumé du changement apporté (pas un diff brut). Périmètre touché. -->

## Tests ajoutés
<!-- Liste des tests unitaires/intégration ajoutés ou adaptés, et résultat
     d'exécution. Si aucun test n'a été ajouté, justifier explicitement pourquoi. -->

## Impact
<!-- Zones du produit affectées, utilisateurs concernés (parents/élèves/profs/admin),
     dépendances externes (MySQL, Supabase, notifications, cron). -->

## Rollback plan
<!-- Comment revenir en arrière si ce correctif pose problème en production ?
     (revert de commit, feature flag, migration réversible, etc.) -->

---
- [ ] Aucun commit direct sur `main`/`master`
- [ ] Aucune modification de schéma MySQL ou de fonction Supabase edge non signalée
      au tech-lead au préalable
- [ ] Labels appliqués (`hotfix` / `bugfix` / `tech-debt` / `test` / `docs`)
- [ ] `CHANGELOG.md` mis à jour
