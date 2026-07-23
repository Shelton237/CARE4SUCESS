# Suite de tests de sécurité — `security-boundary-tester` (Phase 3)

Rejoue les scénarios multi-agents en **variante hostile** (acteur hors périmètre
ou hors portefeuille) pour vérifier que les frontières de rôle et de portefeuille
tiennent réellement au niveau API, et pas seulement dans l'interface.

Source de vérité fonctionnelle : `docs/CARTOGRAPHIE_FONCTIONNELLE.md`.
Dépend des données/infra de la Phase 2 (`scenario-director`) : base MySQL
`care4success_test`, `.env.test`, harness `../integration/helpers/harness.js`,
globalSetup `../integration/globalSetup.js` (backend Express réel).

## Exécution

Pré-requis : l'instance MySQL de test (WampServer, 127.0.0.1:3306) doit tourner.

```bash
# Passe 1 — API directe (backend réel + MySQL de test)
npx vitest run --config vitest.security.config.ts

# Passe 2 — frontend (jsdom, Testing Library) : co-localisée dans src/
npx vitest run src/pages/common/VirtualClassroom.security.test.tsx
```

## Convention de lecture des tests

Chaque fichier `*.security.test.js` contient deux familles d'assertions :

- **`PREUVE — ...`** : documente l'ÉTAT VULNÉRABLE ACTUEL (test **vert**).
  C'est la reproduction exacte de l'attaque (méthode, route, payload, jeton).
- **`ATTENDU SÉCURISÉ [sévérité, ouvert] — ...`** : exprime la frontière
  attendue (test **rouge** tant que la faille n'est pas corrigée). Chaque rouge
  est un ticket ouvert pour `hotfix-bugfix-dev`. Il passera au vert une fois le
  contrôle d'accès ajouté — servant alors de garde de non-régression.
- **`SAIN — ...`** : confirme une frontière déjà correctement appliquée.

Aucun code applicatif n'est modifié : cette suite documente, elle ne corrige pas.

## Isolation

Réutilise le marquage `it-*` / `[IT]` du harness d'intégration. `cleanupTestData()`
en `beforeAll`/`afterAll` ne supprime que les lignes marquées — aucun TRUNCATE.

## Correspondance fichier → faille

| Fichier | Frontière testée | Endpoint(s) | Statut |
|---|---|---|---|
| `01-assignments-confirm-non-authentifie` | confirmAssignment sans auth ni rôle | `PATCH /api/assignments/:id` | ✅ corrigé |
| `03-virtual-class-checkin-usurpation` | check-in/out usurpable | `PATCH /api/sessions/:id/check-in|check-out` | ✅ corrigé |
| `04-finance-revenus-fuite` | fuite revenus enseignant | `GET /api/teachers/:id/earnings(-history)` | ✅ corrigé |
| `05-tutor-espace-enseignant-cross-tenant` | accès cross-tenant élèves d'un tiers | `GET /api/teachers/:id/students` | ✅ corrigé |

Passe 2 (frontend) : `src/pages/common/VirtualClassroom.security.test.tsx`
corrèle la faille 03 (l'UI cache les contrôles à un élève → aucune protection réelle).

Deux cas supplémentaires identifiés par la Phase 3 (cloisonnement fin par
portefeuille conseiller, et un contrôle de rôle additionnel sur un endpoint
de matching) font l'objet d'un suivi interne séparé — non détaillés ici tant
qu'ils ne sont pas corrigés, pour ne pas documenter publiquement une
faille ouverte.
