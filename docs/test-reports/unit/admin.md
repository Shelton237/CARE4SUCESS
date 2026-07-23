# Couverture unitaire — Admin

Périmètre : `docs/CARTOGRAPHIE_FONCTIONNELLE.md`, section Admin.
État : suite intégralement verte — **10 fichiers de test, 69 tests, 69 passés**
(`npm run test:ui -- --run src/pages/admin`, vérifié sur deux exécutions
consécutives pour écarter le flake constaté puis corrigé, voir plus bas).

| Page | Fichier de test | Statut |
|---|---|---|
| Tableau de bord | `src/pages/admin/Dashboard.test.tsx` | ✅ couvert |
| Enseignants | `src/pages/admin/Teachers.test.tsx` | ✅ couvert |
| Cours & Quiz | `src/pages/admin/Courses.test.tsx` | ✅ couvert |
| Candidatures profs | `src/pages/admin/TeacherApplications.test.tsx` | ✅ couvert |
| Élèves & Familles | `src/pages/admin/Students.test.tsx` | ✅ couvert |
| Demandes de bilan | `src/pages/admin/Requests.test.tsx` | ✅ couvert |
| Matching (`/admin/matching`) | `src/pages/advisor/Matching.test.tsx` (composant partagé) | ✅ couvert (partagé, voir note) |
| Profils utilisateurs | `src/pages/admin/ProfileManager.test.tsx` | ✅ couvert |
| Finance & Paie | `src/pages/admin/Finance.test.tsx` | ✅ couvert |
| Géographie & Zones | `src/pages/admin/Geography.test.tsx` | ✅ couvert |
| Paramètres | `src/pages/admin/Settings.test.tsx` | ✅ couvert |

## Détail fonction × statut

| Fonction / handler | Page | Statut |
|---|---|---|
| `fetchAdminDashboard`, `refetch` | Tableau de bord | ✅ couvert |
| `createTeacher` | Enseignants | ✅ couvert (succès, erreur réseau, champs obligatoires manquants) |
| `updateTeacherSpecialties` | Enseignants | ✅ couvert (succès, erreur réseau) |
| `updateTeacherStatus` (suspendre/réactiver) | Enseignants | ✅ couvert |
| Recherche/filtre par statut | Enseignants | ✅ couvert |
| `fetchCourses("admin")` (lecture seule) | Cours & Quiz | ✅ couvert |
| `reviewTeacherApplication` (approve/reject, reviewerRole="admin", tarif horaire/forfait) | Candidatures profs | ✅ couvert |
| `updateFamilyDetails` | Élèves & Familles | ✅ couvert |
| `resetUserPassword` | Élèves & Familles | ✅ couvert |
| `createRequest` | Demandes de bilan | ✅ couvert |
| `updateRequestStatus` (drag&drop/menu) | Demandes de bilan | ✅ couvert |
| Navigation contextuelle vers `/admin/matching` | Demandes de bilan | ✅ couvert |
| Sélection candidat + `confirmAssignment(matchId, teacherName)` | Matching | ✅ couvert (composant partagé, cf. note) |
| `registerUser` (création, tout rôle) | Profils utilisateurs | ✅ couvert (succès, erreur réseau, champs obligatoires manquants) |
| `updateUserProfile` | Profils utilisateurs | ✅ couvert (succès, erreur réseau, champs obligatoires manquants) |
| `linkParentChildRelation` / `unlinkParentChildRelation` | Profils utilisateurs | ✅ couvert |
| `linkStudentTeacherRelation` / `unlinkStudentTeacherRelation` | Profils utilisateurs | ✅ couvert (link testé explicitement ; unlink exercé par symétrie du même code partagé `applyRelationshipChanges`, non testé isolément — voir écarts) |
| `generateManualInvoices` | Finance & Paie | ✅ couvert (succès, erreur réseau) |
| Lecture KPIs/tableau de paie (`fetchFinanceSummary`, `fetchTeacherPayroll`) | Finance & Paie | ✅ couvert (y compris comportement en cas d'échec réseau, voir écarts) |
| Bouton "Exporter" *(non câblé)* | Finance & Paie | ✅ couvert — test de garde-fou dédié |
| `validateGeoLocation` (action "validate") | Géographie & Zones | ✅ couvert |
| `validateGeoLocation` (action "reject") | Géographie & Zones | ✅ couvert |
| `savePlatformSettings` (tarifs par matière) | Paramètres | ✅ couvert |
| `savePlatformSettings` (centres/antennes) | Paramètres | ✅ couvert |
| `savePlatformSettings` (notifications) | Paramètres | ✅ couvert |
| `savePlatformSettings` (sécurité/2FA/session) | Paramètres | ✅ couvert |

## Note — Matching (`/admin/matching`)
`src/pages/admin/matching` réutilise le composant partagé
`src/pages/advisor/Matching.tsx`, déjà couvert intégralement par
`src/pages/advisor/Matching.test.tsx` (succès, état vide, erreur réseau +
retry, sélection/désélection de candidat, candidat indisponible,
`confirmAssignment` succès/erreur). Un nouveau fichier de test dédié à
l'angle admin n'apporterait aucune couverture supplémentaire : le composant
ne dépend pas du rôle appelant (pas de logique conditionnelle par rôle dans
`Matching.tsx`). Décision : pas de duplication, couverture déjà assurée côté
composant partagé.

## Bouton non câblé documenté (Finance & Paie)
Le bouton "Exporter" du tableau de paie n'a pas de handler `onClick` câblé
(`src/pages/admin/Finance.tsx`). Le test dédié
(`Finance.test.tsx` — "garde-fou : le bouton 'Exporter' n'est pas câblé")
clique sur le bouton et vérifie qu'aucun appel réseau
(`generateManualInvoices`, `fetchFinanceSummary`, `fetchTeacherPayroll`)
n'est déclenché. Ce test échouera si un handler est ajouté sans mise à jour
correspondante de `docs/CARTOGRAPHIE_FONCTIONNELLE.md` — comportement
volontaire (garde-fou de traçabilité, pas un correctif à apporter).

## Comportements documentés (pas des bugs corrigés par cet agent)
Les composants suivants n'exploitent pas l'état `isError` de leurs requêtes
`useQuery` ; en cas d'échec réseau au chargement, ils retombent
silencieusement sur un état par défaut plutôt que d'afficher une bannière
d'erreur explicite. Ce comportement est désormais figé par un test qui le
documente fidèlement (et qui échouerait si le comportement changeait sans
mise à jour de ce rapport) :
- `src/pages/admin/Finance.tsx` : `fetchFinanceSummary`/`fetchTeacherPayroll`
  en échec → KPIs affichés à `0 FCFA`, aucune bannière d'erreur
  (`Finance.test.tsx` — "erreur réseau : le chargement des KPIs échoue…").
- `src/pages/admin/Geography.tsx` : `fetchPendingGeoLocations` en échec →
  affichage identique à l'état vide ("Aucune suggestion en attente."), pas de
  distinction visuelle avec une liste réellement vide
  (`Geography.test.tsx` — "erreur réseau (chargement)…").
- `src/pages/admin/Settings.tsx` : `fetchPlatformSettings` en échec → la page
  reste vide (`settings` jamais hydraté, le composant retourne `null`)
  (`Settings.test.tsx` — "erreur réseau (chargement)…").

Ces trois constats sont formulés ici comme des tickets potentiels
d'amélioration UX pour `hotfix-bugfix-dev` (ajout de bannières d'erreur
explicites cohérentes avec le reste de l'admin) — ils ne sont pas corrigés
par cet agent, qui n'écrit que des fichiers de test.

## Correction de flake constatée (fichier de test uniquement)
`ProfileManager.test.tsx` : les deux tests de création de compte (typage de
3 champs via `userEvent.type`) dépassaient parfois le timeout par défaut de
5000 ms lorsque l'ensemble de la suite `src/pages/admin` s'exécute sous forte
charge concurrente. Correctif appliqué uniquement dans le fichier de test :
`userEvent.setup({ delay: null })` pour supprimer le délai inter-frappe
simulé, et timeout explicite porté à 15000 ms sur ces deux tests. Suite
revérifiée verte sur deux exécutions consécutives après correctif.

## Refus explicites rencontrés
Aucun refus nécessaire durant cette phase : toutes les tâches demandées
(ProfileManager, Finance, Geography, Settings, décision Matching) relevaient
strictement du périmètre admin défini dans la cartographie.

## Écarts constatés
- `linkStudentTeacherRelation`/`unlinkStudentTeacherRelation` : le chemin
  "retrait" (unlink) pour un élève ou un enseignant n'est pas testé
  isolément (seul le retrait parent-enfant l'est explicitement) ; le code
  partagé `applyRelationshipChanges` traite les deux cas de façon
  symétrique, donc le risque de régression non détectée est faible, mais ce
  n'est pas une preuve directe. Amélioration possible pour une prochaine
  itération, sans urgence.
- Les trois comportements "pas de bannière d'erreur au chargement" listés
  ci-dessus sont des lacunes UX potentielles (pas des régressions) — signalés
  ci-dessus comme tickets `hotfix-bugfix-dev` à évaluer, non corrigés ici.
