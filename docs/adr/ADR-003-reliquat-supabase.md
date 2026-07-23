# ADR-003 — Sort du reliquat Supabase

- Statut : proposé (attente validation humaine)
- Date : 2026-07-22
- Contexte audit : `docs/audits/AUDIT_2026-07-22.md` [m1], [m2] · ticket T-17

## Contexte

Le backend de production est MySQL (`server/index.js`). Supabase est un **reliquat
legacy non branché** : `getSupabaseClient()` (dans `src/integrations/supabase/client.ts`)
n'est appelé nulle part dans le code métier ; toutes les autres références n'importent
que des **types** depuis `@/integrations/supabase/types`. Le SDK `@supabase/supabase-js`
reste une dépendance directe, et un client complet est instancié en mémoire si les
variables d'env sont présentes, sans usage réel. Le dossier `supabase/edge_function/`
ne contient aucune fonction Deno (config + tests vides seulement).

## Options considérées

1. **Statu quo** — laisser le reliquat. Risque : un dev réutilise `getSupabaseClient()`
   par erreur en croyant que c'est le canal de données réel. Dette qui grossit.
2. **Suppression sèche du dossier `integrations/supabase` + SDK** — casse tous les
   `import type` qui pointent vers `types.ts`. Nécessite de reloger ces types d'abord.
3. **Extraction des types utiles vers un module local + retrait du client et du SDK**
   — supprime le risque de réutilisation accidentelle sans casser le typage.

## Décision

**Option 3**, mais **non urgente** (classée P3/T-17). Étapes : (a) inventorier les
types réellement consommés depuis `@/integrations/supabase/types`, (b) les extraire
dans un module local `src/types/`, (c) retirer `client.ts` + la dépendance
`@supabase/supabase-js`, (d) décider du dossier `supabase/edge_function/` (suppression
probable, car sans code — à me signaler explicitement, contrainte edge functions).

Aucune exécution avant validation humaine et confirmation que rien en prod ne dépend
de la présence du SDK.

## Conséquences

- Réduit la surface de dépendances et la confusion sur la source de vérité des données.
- Touche le typage back-office → à faire avec des tests frontend verts (dépend de T-06).
- La suppression de `supabase/edge_function/` relève de la contrainte "edge functions" :
  remontée explicite requise avant action.
