# ADR-002 — Matrice d'authentification des routes Express

- Statut : proposé (attente validation humaine)
- Date : 2026-07-22
- Contexte audit : `docs/audits/AUDIT_2026-07-22.md` [B2] · tickets T-02, T-05, T-12

## Contexte

`server/index.js` définit 143 routes ; seules 66 passent par `authenticateRequest`.
Certaines routes d'écriture sont publiques. Toutes ne doivent pas l'être, mais
certaines le sont **légitimement** (formulaire d'inscription/contact anonyme).

Analyse des routes signalées :
- `PATCH /api/requests/:id` : change le statut métier d'une demande (`reçu` →
  `clôturé`). C'est une action **back-office** → doit être protégée. Aujourd'hui
  ouverte + écrit dans `/tmp/debug_api.log`. **Faille active.**
- `POST /api/requests` : soumission du formulaire d'inscription par un parent **non
  connecté** → publique par conception. À conserver publique.
- `POST /api/geo/suggest` : suggestion de zone géo depuis un formulaire public →
  probablement publique par conception, mais expose une écriture anonyme en base.

## Options considérées

1. Tout protéger uniformément — casse les formulaires publics d'inscription. Rejeté.
2. **Protéger au cas par cas selon la nature métier** (back-office = protégé, soumission
   publique anonyme = ouvert mais durci : validation stricte + rate-limiting).
3. Refonte complète en middleware par groupe de routes (routeurs séparés
   public/privé) — plus propre mais effort L, à planifier hors urgence.

## Décision

- **Immédiat (T-02, hotfix)** : protéger `PATCH /api/requests/:id` par
  `authenticateRequest` + contrôle de rôle (advisor/admin), retirer le debug `/tmp`.
- **Court terme (T-05, bugfix)** : établir la matrice complète des 143 routes,
  confirmer `POST /api/requests` et `POST /api/geo/suggest` comme publiques
  **intentionnelles** (avec validation + rate-limit), protéger tout le reste
  qui ne relève pas d'un flux anonyme légitime.
- La refonte en routeurs séparés (option 3) est notée comme dette, non planifiée ici.

## Conséquences

- T-12 (tests d'intégration) dépend de la matrice figée par T-05.
- Risque de régression si une route publique légitime est protégée par erreur : la
  matrice doit être revue explicitement avant merge (go/no-go tech-lead).
