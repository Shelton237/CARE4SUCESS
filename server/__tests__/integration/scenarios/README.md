# Suite d'intégration — scénarios de jeu de rôle multi-agents (Phase 2)

Backend Express réel + base MySQL de test dédiée `care4success_test`.
Chaque scénario correspond à un fichier `tests/scenarios/<NN>-<slug>.yaml` et
exerce l'API exacte que consomme chaque rôle de la cartographie
(`docs/CARTOGRAPHIE_FONCTIONNELLE.md`).

## Exécution

```bash
# suite complète
npx vitest run --config vitest.integration.config.ts
# un scénario
npx vitest run --config vitest.integration.config.ts \
  server/__tests__/integration/scenarios/01-candidature-validation-matching.test.js
```

Le backend réel est démarré automatiquement (globalSetup) pointé sur `.env.test`
puis arrêté en fin de suite. Chaque suite fait un seed/reset ciblé (marqueurs
`it-*` / `[IT]`) — aucune pollution croisée, aucun TRUNCATE global.

## Note d'orchestration

Le tool d'invocation de sous-agents n'étant pas activé dans le runtime de cette
passe, l'orchestration « par acteur » est assurée par le scenario-director au
niveau intégration : pour chaque étape, un jeton JWT scopé au rôle de l'acteur
est émis (`tokenFor`) et seules les routes réellement consommées par la page de
ce rôle sont appelées (exécution vs lecture seule selon `verifier_ensuite`).

## Scénarios couverts

| # | Flux | Acteurs (exéc. → vérif. lecture) | Effets de bord vérifiés | Statut |
|---|---|---|---|---|
| 01 | Candidature → validation → matching | teacher → admin ; admin/advisor (matching) | compte enseignant créé, dispo dans /admin/matching ET /advisor/matching | ÉCHEC (bug `levels`) |
| 02 | Demande bilan → matching staff → visibilité croisée | parent/admin → advisor ; parent/student/teacher | liaison student_teacher, statut demande, propagation 3 espaces, refus élève | PARTIEL (automation bloquée) |
| 03 | Séance → devoir → correction → suivi parent | teacher → student → teacher ; parent | devoir lié séance, dépôt, correction+feedback, vue parent | OK |
| 04 | Facturation | admin ; parent | facture générée, montant, statut pending, idempotence, périmètre | OK |
| 05 | Messagerie croisée | teacher/advisor/student ; parent/teacher | envoi, badge non-lu, marquage lu, pièce jointe | OK |
| 06 | Géographie → matching | admin ; admin/advisor | zone validée dispo, « Zone ✓ », score proximité, tri | OK |
| 07 | Double rôle tutor/teacher | teacher (std + dual) ; tutor | équivalence stricte, scope par userId, cloisonnement tuteur | OK |

## Écarts / bugs révélés (détail dans `coverage/RAPPORT_GLOBAL.md` §Phase 2)

- **[BLOQUANT] Scénario 01** — `PATCH /api/teacher-applications/:id` : le SELECT de
  relecture (server/index.js ~L2943) référence la colonne `levels`, absente de
  `teacher_applications` → 500. L'UPDATE de statut passe *avant* → candidature
  laissée `approved` sans compte enseignant créé (état incohérent).
- **[BLOQUANT] Scénario 02** — automation `PATCH /api/requests/:id → 'en traitement'`
  (server/index.js ~L2042) : `SELECT ... geo_location_id FROM users` — colonne
  inexistante sur `users` → aucune assignation créée depuis une demande réelle.
  (`confirmAssignment` en aval fonctionne : validé via assignation seedée.)
- **[SCHÉMA] Scénario 07** — table `courses` sans colonnes `mode/price/duration`
  (ni `teacher_id/teacher_name`) : `POST /api/courses` et `GET /api/courses?role=teacher`
  renvoient 500. Impacte l'espace Enseignant « Mes Cours » pour tous les rôles.
- **[ÉCART] Scénario 02** — Parent > Équipe Pédagogique (Team.tsx) est reconstruit
  depuis les séances, pas depuis `student_teacher` : un enseignant matché
  n'apparaît qu'après création d'une séance.
- **[ÉCART] Scénario 03** — Parent > Progression (`progress-report`) est statique
  (assiduité figée à 95, notes issues des seuls quiz) : une correction de devoir
  ne s'y reflète pas.
- **[SÉCURITÉ] Scénario 02** — `PATCH /api/assignments/:id` (confirmAssignment) sans
  `authenticateRequest` ni contrôle de rôle → à transmettre à
  `security-boundary-tester`.

## Signal schéma MySQL (aucune migration exécutée)

Trois scénarios révèlent un besoin de modification de schéma. Conformément à la
contrainte non négociable du projet, **aucune migration n'a été exécutée** :

1. `teacher_applications` : colonne `levels` attendue par le code, absente.
2. `users` : colonne `geo_location_id` attendue par l'automation de matching, absente
   (un patch `_agent/patch_geo_location_user.js` non appliqué le confirme).
3. `courses` : colonnes `mode`, `price`, `duration` (+ `teacher_id`, `teacher_name`)
   attendues par le code, absentes.

Chaque cas admet deux résolutions possibles (ajouter la colonne OU corriger la
requête) — décision laissée à la revue humaine.
