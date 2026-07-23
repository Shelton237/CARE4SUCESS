# Backlog priorisé — care4success

> Source : `docs/audits/AUDIT_2026-07-22.md` (audit produit par `diagnostician`).
> Priorisation et découpage par le tech-lead. **Statut global : à valider** — aucun
> ticket n'est délégué ni lancé tant que l'utilisateur humain n'a pas validé ce backlog.
> Ordre de traitement recommandé = ordre des lignes (P0 → P3).

## Légende

- **Type** : `hotfix` (correctif urgent isolé) · `bugfix` (correction + tests) · `tech-debt` (structurel non urgent) · `test` (couverture seule) · `chore` (maintenance/config).
- **Sévérité** : reprise du diagnostic (Bloquant / Majeur / Mineur).
- **Effort** : S (< ½ j) · M (½ à 2 j) · L (> 2 j).
- **Statut** : `à valider` pour tous à ce stade.
- 🔒 = touche la sécurité · 🗄️ = touche potentiellement le schéma MySQL · ⚠️ = action destructive/irréversible nécessitant confirmation humaine explicite.

## Priorité P0 — Sécurité active / risque immédiat (à traiter en premier)

| ID   | Titre | Type | Sévérité | Effort | Agent proposé | Statut |
|------|-------|------|----------|--------|---------------|--------|
| T-01 | 🔒⚠️ Retirer `store.prod.env.fix` du dépôt + rotation des secrets exposés (JWT/NEXTAUTH/Stripe/Cloudinary) — décision de purge d'historique à part (voir ADR-001) | hotfix | Bloquant [B1] | S (retrait) / L (purge historique) | tech-lead + humain, exécution `hotfix-bugfix-dev` | à valider |
| T-02 | 🔒 Protéger `PATCH /api/requests/:id` par `authenticateRequest` + autorisation rôle ; retirer le debug `/tmp/debug_api.log` | hotfix | Bloquant [B2] | S | hotfix-bugfix-dev | à valider |
| T-03 | 🔒 Durcir le `.gitignore` (motifs `dist_*.tar.gz`, `dist_*.zip`, `*.apk`, `*.id`, scripts scratch racine) AVANT tout `git add` pour empêcher le commit des credentials MySQL | hotfix | Bloquant [B3]/[M1] | S | hotfix-bugfix-dev | à valider |
| T-04 | 🔒 Sortir les credentials MySQL en clair des scripts racine vers variables d'environnement (`check_db.cjs`, `create_admin.js`, `db_check.cjs`, `db_cleanup.cjs`, `db_desc.cjs`, `deep_clean.js`, `del_session.cjs`, `fix_json_columns.mjs`, `fix_relation.cjs`, `resend_teacher_emails.mjs`) | hotfix | Bloquant [B3] | S | hotfix-bugfix-dev | à valider |

## Priorité P1 — Arbitrage sécurité + baseline verte (déblocage CI)

| ID   | Titre | Type | Sévérité | Effort | Agent proposé | Statut |
|------|-------|------|----------|--------|---------------|--------|
| T-05 | 🔒 Auditer la matrice des 143 routes Express : arbitrer publiques vs protégées (`POST /api/requests`, `POST /api/geo/suggest` volontairement publics ? sinon protéger) — voir ADR-002 | bugfix | Bloquant [B2] | M | tech-lead (décision) + hotfix-bugfix-dev | à valider |
| T-06 | Réparer la suite frontend rouge : wrapper `QueryClientProvider` manquant dans `Inscription.test.tsx`/`GeoSelector` (3 tests KO sur 5) | bugfix | Majeur [M2] | S | unit-test-engineer | à valider |
| T-07 | Corriger les 6 erreurs ESLint bloquantes (`no-empty` VirtualClassroom:292,325 / Homework:59 ; `no-non-null-asserted-optional-chain` VirtualClassroom:573,590 ; `no-useless-escape` Schedule:327) pour rendre `npm run lint` verte en gate | bugfix | Majeur [M6] | S | hotfix-bugfix-dev | à valider |
| T-08 | 🔒 Durcir HTTP backend : `CLIENT_ORIGIN` obligatoire (CORS non permissif par défaut), limite de taille `express.json({ limit })`, échec au démarrage si `JWT_SECRET` absent (retrait du fallback `"care4success_dev_secret"`) | bugfix | Majeur [M5] | M | hotfix-bugfix-dev | à valider |

## Priorité P2 — Filet de sécurité automatisé + dépendances

| ID   | Titre | Type | Sévérité | Effort | Agent proposé | Statut |
|------|-------|------|----------|--------|---------------|--------|
| T-09 | Mettre en place la CI GitHub Actions (`lint`, `test:ui`, `npm audit`, build) sur PR | chore/tech-debt | Majeur [M3] | M | github-doc-agent | à valider |
| T-10 | Traiter les vulnérabilités npm prioritaires exposées aux flux utilisateur : `jspdf` (critique, XSS PDF), `multer` (haute, DoS upload), puis `axios`, `nodemailer`, `concurrency`/`concurrently` (dev) | tech-debt | Majeur [M4] | M | hotfix-bugfix-dev | à valider |
| T-11 | Tests unitaires backend : authentification (`authenticateRequest`), matching géographique (`feat(geo)`/`feat(matching)`), validation des statuts de requêtes | test | Majeur [M2] | L | unit-test-engineer | à valider |
| T-12 | 🗄️ Tests d'intégration routes Express ↔ MySQL réel : `/api/requests` (POST/PATCH), `/api/geo/suggest`, auth JWT — dépend de T-05 (matrice de routes figée) | test | Majeur [M2] | L | integration-test-engineer | à valider |
| T-13 | Introduire une validation d'entrée serveur systématique (Zod côté backend, en remplacement des `if (!champ)` épars) | tech-debt | Majeur [M5] | M | hotfix-bugfix-dev | à valider |

## Priorité P3 — Dette de nettoyage (non urgent)

| ID   | Titre | Type | Sévérité | Effort | Agent proposé | Statut |
|------|-------|------|----------|--------|---------------|--------|
| T-14 | Nettoyer les artefacts racine hors périmètre code (archives `dist_*`, `*.apk`, `server/out.txt`/`output.log`, `_agent/scratch/`) — déplacement/suppression à confirmer, certains scripts servent encore d'outillage | tech-debt | Majeur [M1] | S | hotfix-bugfix-dev | à valider |
| T-15 | Réduire le bruit de logs serveur (44 `console.log`) + retrait du debug `/tmp` résiduel (recoupe T-02) | tech-debt | Mineur [m3] | S | hotfix-bugfix-dev | à valider |
| T-16 | Réduire les 395 warnings ESLint (`no-explicit-any` concentrés `backoffice.ts`, `no-unused-vars`, `exhaustive-deps`) — chantier progressif | tech-debt | Majeur [M6] | L | hotfix-bugfix-dev | à valider |
| T-17 | Trancher le sort du reliquat Supabase : client `getSupabaseClient()` jamais appelé, edge functions sans code — extraire les types utiles puis retirer le SDK ? (voir ADR-003) | tech-debt | Mineur [m1]/[m2] | S/M | tech-lead + hotfix-bugfix-dev | à valider |
| T-18 | Exclure `examples/third-party-integrations/stripe/` du périmètre `eslint` (7 warnings parasites, pas d'intégration Stripe active) | chore | Mineur [m4] | S | hotfix-bugfix-dev | à valider |
| T-19 | Trier les 6 TODO/FIXME résiduels (`server/index.js` + `src/`) pour vérifier qu'aucun ne cache une dette critique | tech-debt | Mineur [m5] | S | hotfix-bugfix-dev | à valider |

## Signalements explicites (contraintes non négociables)

- 🗄️ **Schéma MySQL** : T-12 (intégration ↔ MySQL réel) touche la base en lecture/écriture de test. Toute modification de schéma (`server/schema.sql`, `server/seed.sql`, `seed_geo.sql`) découverte pendant les correctifs matching/geo doit m'être remontée AVANT exécution. Aucune migration n'est prévue dans ce backlog en l'état.
- ⚠️ **Purge d'historique git** (option de T-01, ADR-001) : opération destructive irréversible (réécriture d'historique / force-push) — nécessite une confirmation humaine explicite, non exécutée sans validation.
- **Edge functions Supabase** (T-17) : scaffolding sans code. Toute décision de suppression/complétion à arbitrer explicitement, non exécutée seul.

## Dépendances entre tickets

- T-03 doit précéder tout `git add` massif (protège T-04 contre la fuite).
- T-12 (intégration) dépend de T-05 (matrice de routes publiques/protégées figée).
- T-09 (CI) gagne à être posée après T-06 + T-07 (sinon la CI est rouge au premier run).
- T-15 recoupe T-02 (même debug `/tmp` à retirer).
