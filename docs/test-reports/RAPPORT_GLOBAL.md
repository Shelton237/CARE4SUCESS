# Rapport global — Jeu de rôle multi-agents care4success

État au 2026-07-23. Source de vérité fonctionnelle : `docs/CARTOGRAPHIE_FONCTIONNELLE.md`.

## Phase 1 — Couverture unitaire (terminée)

| Rôle | Pages couvertes | Tests | Statut |
|---|---|---|---|
| Admin | 11/11 | 69 | ✅ vert |
| Conseiller | 7/7 | — | ✅ vert |
| Parent | 10/10 | 75 | ✅ vert |
| Élève | 10/10 | 62 | ✅ vert |
| Enseignant (mode standard) | 9/9 + Classe Virtuelle | — | ✅ vert |
| Tuteur (espace natif) | 3/3 | 19 | ✅ vert |

**Total suite complète du projet** : 380 tests, 377 verts, 3 échecs — les 3 échecs
concernent `src/pages/Inscription.test.tsx`, une page publique d'inscription
**hors périmètre des 6 rôles** (fix connu, présent sur `main` via la PR #9,
pas encore rebasé sur la branche de travail actuelle).

Détail par rôle : voir `docs/test-reports/unit/*.md`.

## Écarts applicatifs constatés pendant la phase 1 (non corrigés, hors périmètre des agents-testeurs)

- `Finance.tsx`, `Geography.tsx`, `Settings.tsx` (Admin) : pas de bannière
  d'erreur explicite en cas d'échec réseau, retombent silencieusement sur un
  état par défaut.
- `TeacherApplications.tsx` (Tuteur) : le bouton « Soumettre l'évaluation »
  n'est pas désactivé en l'absence d'observations — aucune validation cliente
  sur ce champ.
- `Homework.tsx` (Parent) : `ReferenceError: FileText is not defined` —
  probable import manquant, dans le travail en cours non commité (pas
  introduit par les agents-testeurs).
- Flakiness d'isolation constatée : `src/pages/student/Messages.test.tsx`
  passe isolément mais peut échouer dans la suite complète (« filtre par
  rôle »), signe d'un état partagé non réinitialisé entre fichiers de test
  (probablement lié au polling `refetchInterval`). À investiguer avant de
  brancher une CI stricte.

## Phase 2 — Scénarios d'intégration (`scenario-director`) — TERMINÉE

Backend Express réel démarré sur `.env.test` (globalSetup vitest) + base MySQL
dédiée `care4success_test` (WampServer, 127.0.0.1:3306, 35 tables). Suite
versionnée : `server/__tests__/integration/scenarios/` (config dédiée
`vitest.integration.config.ts`, harness `helpers/harness.js`, doc
`scenarios/README.md`). Seed/reset ciblé par marqueur (`it-*` / `[IT]`), aucune
pollution croisée, aucun TRUNCATE global.

**Résultat : 35 tests, 31 verts / 4 échecs.** Les 4 échecs correspondent
exactement à 2 bugs applicatifs bloquants documentés ci-dessous (scénario 01 :
3 assertions en cascade ; scénario 02 : 1 assertion). Les 5 autres scénarios
sont verts.

### Note d'orchestration

Le tool d'invocation de sous-agents (acteurs) n'était pas activé dans le runtime
de cette passe. L'orchestration « par acteur » a donc été assurée par le
scenario-director **au niveau intégration** : pour chaque étape, un jeton JWT
scopé au rôle de l'acteur est émis et seules les routes réellement consommées
par la page du rôle concerné sont appelées (exécution vs lecture seule selon
`verifier_ensuite`). Aucun ticket `hotfix-bugfix-dev` n'a été dispatché (consigne
de première passe) — les échecs sont documentés ici de façon reproductible.

### Détail par scénario

| # | Scénario | Statut | Effets croisés vérifiés |
|---|---|---|---|
| 01 | Candidature → validation → matching | ❌ ÉCHEC | validation candidature (admin), dispo /admin/matching + /advisor/matching (composant partagé) |
| 02 | Demande bilan → matching staff → visibilité croisée | ⚠️ PARTIEL | createRequest, confirmAssignment→student_teacher, propagation Élève/Enseignant, refus élève |
| 03 | Séance → devoir → correction → suivi parent | ✅ OK | séance→rapport→devoir lié→dépôt→correction→vue parent |
| 04 | Facturation | ✅ OK | génération admin → visibilité + statut + montant côté parent |
| 05 | Messagerie croisée | ✅ OK | envoi, badge non-lu, marquage lu, pièce jointe (3 paires) |
| 06 | Géographie → matching | ✅ OK | validation zone → dispo listes → « Zone ✓ » + score proximité |
| 07 | Double rôle tutor/teacher | ✅ OK | équivalence /teacher vs /tutor/enseignant, scope userId, cloisonnement |

### Bugs bloquants (preuve reproductible)

**B1 — Scénario 01 — `reviewTeacherApplication` (500).**
- Acteur/action : `actor-admin` → `PATCH /api/teacher-applications/:id`
  `{ status:"approved", reviewerName, reviewerRole:"admin", rateType:"hourly", negotiatedRate:8000 }`.
- Attendu : 200, statut `approved`, identifiants générés, compte `users`(teacher) +
  fiche `teachers` `actif` créés → enseignant candidat dans les 2 surfaces de matching.
- Observé : **500** `{"message":"Impossible de mettre a jour la candidature."}`.
  Log serveur : `Champ 'levels' inconnu dans field list`.
- Cause : `server/index.js` ~L2942-2947, le SELECT de relecture liste la colonne
  `levels` qui n'existe pas dans `teacher_applications`. L'`UPDATE` du statut
  (L2933-2937) s'exécute *avant* ce SELECT → la candidature reste `approved` mais
  aucun compte enseignant n'est créé (**état incohérent**), d'où absence dans
  `/admin/matching` et `/advisor/matching`.
- Résolution possible (revue humaine) : retirer `levels` du SELECT, OU ajouter la
  colonne `teacher_applications.levels`.

**B2 — Scénario 02 — automation « en traitement » (assignation non créée).**
- Acteur/action : `actor-parent` `POST /api/requests` puis passage
  `PATCH /api/requests/:id { status:"en traitement" }`.
- Attendu : création automatique d'une `assignment` (pending) avec candidats
  compatibles → matchable par le staff.
- Observé : requête 200 mais **aucune assignation créée**. Log serveur :
  `Champ 'geo_location_id' inconnu dans field list`.
- Cause : `server/index.js` ~L2041-2044, `SELECT location, geo_location_id FROM users`
  — la colonne `geo_location_id` n'existe pas sur `users` (le patch non appliqué
  `_agent/patch_geo_location_user.js` le confirme). L'erreur est avalée par le
  `try/catch` de l'automation → assignation silencieusement absente.
- Note : `confirmAssignment` (`PATCH /api/assignments/:id`) fonctionne
  correctement — validé indépendamment via une assignation seedée : liaison
  `student_teacher` créée, demande passée `assigné`, propagation OK vers
  Élève/Mes Professeurs et Enseignant/Mes Apprenants.
- Résolution possible : ajouter `users.geo_location_id`, OU retirer la référence
  du SELECT.

### Écarts non bloquants (comportement divergent de l'attendu scénario)

- **E1 — Scénario 07 / schéma `courses`** : `POST /api/courses` et
  `GET /api/courses?role=teacher` renvoient **500** — la table `courses` du schéma
  n'a pas les colonnes `mode/price/duration` (ni `teacher_id/teacher_name`) que le
  code exige (les deux INSERT et le SELECT). Impacte l'espace Enseignant
  « Mes Cours » indépendamment du double rôle. L'échec étant identique pour
  l'enseignant standard et le double rôle, **l'équivalence du scénario 07 reste
  vérifiée** (scope validé via lignes seedées en base).
- **E2 — Scénario 02 / Parent > Équipe Pédagogique** : `Team.tsx` reconstruit la
  liste des enseignants depuis les **séances** (`fetchScheduleByRole('parent')`),
  pas depuis `student_teacher`. Après un matching pur (sans séance), l'enseignant
  matché n'apparaît pas encore dans l'Équipe Pédagogique.
- **E3 — Scénario 03 / Parent > Progression** : `progress-report` est **statique**
  (assiduité codée en dur à 95, commentaires figés, notes issues des seuls
  `quiz_attempts`) : une correction de devoir n'est pas reflétée dans la
  progression/bilan.

### Observation sécurité (pour `security-boundary-tester`)

- `PATCH /api/assignments/:id` (confirmAssignment) n'a **aucun** middleware
  `authenticateRequest` ni contrôle de rôle : n'importe quel appelant peut
  confirmer une affectation. À rejouer côté frontière API.

### Signal schéma MySQL — aucune migration exécutée

Conformément à la contrainte non négociable, **aucune modification de schéma n'a
été appliquée**. Trois colonnes attendues par le code sont absentes du schéma de
test (et vraisemblablement du schéma généré par `initDB`) :
`teacher_applications.levels`, `users.geo_location_id`,
`courses.mode|price|duration`. Décision de résolution (ajout de colonne vs
correction de requête) laissée à la revue humaine.

## Remédiation (`hotfix-bugfix-dev`) — PR #11 ouverte

Suite à la Phase 3, correction immédiate validée par l'utilisateur sur les
failles CRITIQUES (branche `hotfix/critical-access-control`,
[PR #11](https://github.com/Shelton237/CARE4SUCESS/pull/11), non mergée) :

- **F-01, F-03, F-04, F-05 : corrigées et vérifiées** (tests de non-régression
  versionnés dans `server/__tests__/security/`, passage rouge→vert confirmé).
- **F-06 : corrigée et vérifiée** — `GET /api/advisor/match/:studentId` exige
  désormais un rôle admin/advisor (403 sinon). Test converti en régression
  (`06-matching-endpoint-role.security.test.js`).
- **F-02 : reclassée « comportement voulu », pas une faille.** Décision
  produit explicite de l'utilisateur (2026-07-23) : le modèle « file
  partagée » est intentionnel — tout conseiller peut légitimement voir et
  traiter n'importe quelle demande/affectation, il n'existe pas et il n'est
  pas prévu d'avoir de portefeuille exclusif par conseiller. Aucune colonne
  `advisor_id` n'a été ajoutée. Le test
  `02-matching-portefeuille-conseiller.security.test.js` reste local (non
  commité) : il documentait un scénario désormais qualifié de non-faille, pas
  utile de le publier tel quel. La mitigation déjà en place (accès
  staff-only sur `GET /api/assignments` et `GET /api/advisor/families`) est
  conservée — elle ferme l'accès anonyme/hors-staff, qui restait un vrai
  problème indépendamment de la question du portefeuille.

**Note de sécurité opérationnelle** : les messages de commit/PR ne détaillent
que les failles effectivement corrigées.

## Phase 3 — Tests de sécurité (`security-boundary-tester`) — TERMINÉE

Suite versionnée : `server/__tests__/security/` (6 fichiers `*.security.test.js`,
config dédiée `vitest.security.config.ts`, doc `README.md`) + une passe frontend
`src/pages/common/VirtualClassroom.security.test.tsx`. Réutilise l'infra Phase 2
(backend Express réel via globalSetup, MySQL `care4success_test`, harness,
marquage `it-*`/`[IT]`). Aucun code applicatif modifié.

**Résultat passe 1 (API) : 22 tests — 15 verts (PREUVE reproductible + SAIN),
7 rouges (chaque rouge = une frontière manquante, ticket ouvert pour
`hotfix-bugfix-dev`).** Passe 2 (frontend) : 4 tests verts.

Convention : `PREUVE-*` documente l'état vulnérable actuel (vert = attaque
reproduite) ; `ATTENDU SÉCURISÉ-*` exprime la frontière attendue (rouge tant que
non corrigé, deviendra garde de non-régression) ; `SAIN-*` confirme une frontière
déjà correcte.

### Règle de corrélation appliquée
API bloque + UI affiche → MOYEN ; API laisse passer + UI cache → CRITIQUE ;
API laisse passer + UI affiche → CRITIQUE + « double surface ».

### Failles confirmées (priorisées par sévérité)

**F-01 — CRITIQUE — `PATCH /api/assignments/:id` (confirmAssignment) sans authentification ni contrôle de rôle.**
- Scénario d'origine : 01/02 (matching). Passe 1.
- Preuve reproductible : `PATCH /api/assignments/<id>` avec body
  `{"selectedTeacher":"<nom>"}` **sans aucun header Authorization** → `200`, la
  liaison `student_teacher` officielle est créée et la demande passe `assigné`.
  Idem avec un jeton d'**élève** (hors périmètre matching) → `200`, statut
  `confirmed`.
- Règle cartographie violée : seuls Admin (`/admin/matching`) et Conseiller
  (`/advisor/matching`) « Confirmer l'assignation → confirmAssignment » ;
  Élève/Parent/Enseignant/Tuteur n'ont aucune capacité de matching.
- Corrélation : API laisse passer + UI cache le bouton aux non-staff → CRITIQUE.
- Code : `server/index.js` L2241 — aucun `authenticateRequest`, aucun check rôle.
- Confirme l'observation sécurité de la Phase 2.

**F-02 — CRITIQUE (double surface) — Absence totale de cloisonnement de portefeuille conseiller.**
- Scénario d'origine : point prioritaire `/admin/matching` vs `/advisor/matching`
  (composant partagé `Matching.tsx`). Passe 1.
- Preuve reproductible : un conseiller B (`GET /api/advisor/families`,
  `GET /api/assignments`) voit les familles et affectations « du portefeuille » du
  conseiller A, et **confirme** une affectation de A via
  `PATCH /api/assignments/<idA>` → `200`/`confirmed`.
- Règle cartographie violée : « un conseiller ne doit voir/confirmer que son
  propre portefeuille ». En réalité le modèle de données n'a **aucune** notion de
  portefeuille (pas de colonne `advisor_id`) : `/api/advisor/families` (L4034) et
  `/api/assignments` (L2134) renvoient toute la plateforme, sans auth.
- Corrélation : API laisse passer + UI affiche les mêmes données à tout conseiller
  → CRITIQUE, **double surface d'exposition**. Correction structurelle (rattacher
  familles/affectations à un conseiller) — pas un simple ajout de middleware.

**F-03 — CRITIQUE — check-in/check-out de session usurpables (`/virtual-class/:sessionId`).**
- Scénario d'origine : point prioritaire virtual-class (route non restreinte par
  rôle). Passes 1 + 2.
- Preuve reproductible (passe 1) : `PATCH /api/sessions/<id>/check-in` avec un
  jeton d'**élève** → `200`, `actual_start_time` renseigné ; `check-out` par un
  **enseignant tiers** → `200`, `actual_end_time` renseigné et statut `effectué`.
  La durée ainsi falsifiée alimente les revenus de l'enseignant victime.
- Passe 2 (frontend, `VirtualClassroom.security.test.tsx`, 4 verts) : pour un
  élève l'UI ne déclenche pas le check-in et n'affiche PAS les contrôles TERMINER
  / ASSIGNER UN DEVOIR (absence réelle du DOM, gardés par `role==='teacher'`).
- Règle cartographie violée : check-in/out « (enseignant) ». `authenticateRequest`
  présent (L2546/L2571) mais aucune vérification que l'appelant est l'enseignant
  de la session.
- Corrélation : API laisse passer + UI cache le contrôle → CRITIQUE (la garde UI
  ne protège rien).

**F-04 — CRITIQUE — Fuite des revenus d'un enseignant vers un tiers.**
- Scénario d'origine : point prioritaire Finance & Paie / Mes Revenus. Passe 1.
- Preuve reproductible : `GET /api/teachers/<idA>/earnings` avec le jeton de
  l'enseignant B → `200` + transactions et barème horaire (9000) de A ;
  `GET /api/teachers/<idA>/earnings-history` **sans aucun jeton** → `200`.
- Règle cartographie violée : Mes Revenus — chaque enseignant ne voit que ses
  gains. `server/index.js` L5507 et L5316 : aucun `authenticateRequest`, aucun
  contrôle `teacherId == appelant`.
- Corrélation : API laisse passer + UI n'interroge que son propre id (cache) →
  CRITIQUE.

**F-05 — CRITIQUE — Accès cross-tenant aux élèves d'un enseignant tiers (Espace Enseignant du tuteur).**
- Scénario d'origine : 07 (double rôle), rejoué en variante hostile. Passe 1.
- Preuve reproductible : un tuteur (rôle `tutor` + `secondary_role teacher`)
  appelle `GET /api/teachers/<idVictime>/students` avec son propre jeton →
  `200` + l'élève de l'enseignant victime. Idem `GET /api/students/<id>/course-history`.
- Nuance vs scénario 07 : la Phase 2 validait le scope quand chaque acteur
  utilisait SON PROPRE id ; ici l'acteur hostile **substitue l'id de la victime**
  dans le path, sans aucun contrôle (`server/index.js` L5540, pas d'auth).
- Rappel SAIN (test vert) : avec son propre id, le tuteur ne voit que son élève.
- Corrélation : API laisse passer + UI n'utilise que l'id courant (cache) → CRITIQUE.

**F-06 — MOYEN (latent) — Endpoint de matching sans contrôle de rôle.**
- Scénario d'origine : « un actor-student qui appelle directement un endpoint de
  matching ». Passe 1.
- Preuve reproductible : `GET /api/advisor/match/<studentId>` avec un jeton
  d'élève **n'oppose aucun refus de rôle** (pas de `403`). L'accès n'est
  actuellement pas exploité en lecture uniquement à cause d'un `500` de dérive
  schéma (colonnes `teachers.levels/user_id` absentes, cf. E1) — d'où sévérité
  MOYEN, mais frontière d'autorisation **absente** : latent CRITIQUE une fois le
  schéma corrigé. `server/index.js` L6977 : `authenticateRequest` sans check rôle.

### Frontières testées et confirmées SAINES
- `GET /api/admin/finance/teacher-payroll` (paie) : refuse un enseignant (`403`)
  et un appel anonyme (`401`) — cloisonnement admin correct (L4310-4311).
- Espace Enseignant du tuteur sur SON PROPRE id : aucun débordement vers l'élève
  d'un autre enseignant (rappel scénario 07, test vert).

### Dépendances / limites
- Playwright **absent** du projet (aucune config). La garantie bout-en-bout
  navigateur pour matching/virtual-class/finance n'a pas été introduite : son
  installation nécessite ton accord (choix laissé à validation, non décidé
  unilatéralement). La passe frontend utilise Testing Library (jsdom).
- Pré-requis d'exécution : l'instance MySQL de test doit tourner (démarrée
  manuellement pour cette passe, port 3306).
- Aucune correction appliquée : les 6 failles sont transmises à
  `hotfix-bugfix-dev` (les tests `ATTENDU SÉCURISÉ` passeront au vert après fix).

## Notes d'exécution

La phase 1 a été interrompue deux fois par la limite de session API du
compte (résolutions à 9:20am puis 2:30pm Africa/Lagos) et reprise à chaque
fois sans perte de travail. Un correctif d'environnement partagé a été
appliqué en cours de route : polyfill `ResizeObserver` dans
`src/test/setup.ts` (requis par les graphiques `recharts` sur tous les
tableaux de bord, absent de jsdom).

Phase 2 : progression suivie en continu dans `docs/test-reports/scenario-progress.md`
(reprise possible en cas d'interruption de session).
