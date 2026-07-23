# Couverture unitaire — Tuteur (périmètre natif)

Agent-acteur : `actor-tutor`
Périmètre : **Espace Tuteur natif uniquement** (Dashboard, Candidatures profs,
Profil). L'Espace Enseignant accessible aux tuteurs à double rôle
(`/tutor/enseignant/*`) est **hors périmètre** — voir section « Écarts et
refus » ci-dessous ; ces routes relèvent d'`actor-teacher`
(`actingAs: 'tutor-secondary-role'`, coordonné par `scenario-director`).

Référence : `docs/CARTOGRAPHIE_FONCTIONNELLE.md`, section **Tuteur**.

## Suite de tests

Vitest + Testing Library, co-localisés, réseau systématiquement mocké.

```
npm run test:ui -- --run src/pages/tutor
```

État final : **3 fichiers de test, 19 tests, tous verts.**

## Tableau fonction × statut

| Fonction | Route / endpoint | Fichier de test | Statut |
|---|---|---|---|
| Tableau de bord (4 cartes stats + tableau candidatures récentes) | `GET /tutor/dashboard` | `src/pages/tutor/Dashboard.test.tsx` | Couvert |
| — succès : affichage 4 cartes + tableau | idem | idem | Couvert |
| — erreur réseau (réponse `ok:false`) : repli sur stats à zéro / liste vide, pas de crash | idem | idem | Couvert |
| — erreur réseau (fetch rejeté) : UI stable, pas de crash | idem | idem | Couvert |
| Candidatures profs — Onglet Entretien (date/heure + notes préparatoires) | `PATCH /teacher-applications/:id/interview` | `src/pages/tutor/TeacherApplications.test.tsx` | Couvert |
| — succès : planification avec date + notes, réinitialisation du formulaire | idem | idem | Couvert |
| — champs obligatoires manquants : bouton désactivé sans date | idem | idem | Couvert |
| — validation échouée (422 serveur) : UI ne casse pas, champ non réinitialisé | idem | idem | Couvert |
| — erreur réseau (fetch rejeté) : UI ne casse pas | idem | idem | Couvert |
| Candidatures profs — Onglet Rapport d'évaluation (3 scores, classification niveau/matière, recommandation) | `POST /tutor-evaluations` + `PATCH /teacher-applications/:id` | `src/pages/tutor/TeacherApplications.test.tsx` | Couvert |
| — succès : recommandation « Approuver » → mise à jour automatique du statut (`status: approved`, `reviewerRole: tutor`) | idem | idem | Couvert |
| — succès : les 3 scores 1-5 (Pédagogie, Ponctualité, Communication) sont bien transmis | idem | idem | Couvert |
| — champs obligatoires manquants : **écart constaté** (voir ci-dessous), documenté | idem | idem | Couvert (comportement réel documenté) |
| — validation échouée (422 sur l'évaluation) : le PATCH de statut n'est jamais déclenché | idem | idem | Couvert |
| — erreur réseau (fetch rejeté) : UI stable, bouton réutilisable | idem | idem | Couvert |
| Profil (`/tutor/profile`, ré-export de `src/pages/teacher/Profile.tsx`) — avatar, infos, badge dynamique rôle | `uploadUserAvatar`, `updateUserProfile` | `src/pages/tutor/Profile.test.tsx` | Couvert |
| — succès : chargement du profil, modification du nom, enregistrement | idem | idem | Couvert |
| — badge dynamique : rôle tuteur simple → « Tuteur Vérifié » seul | idem | idem | Couvert |
| — badge dynamique : double rôle tuteur/enseignant → « Tuteur Vérifié » + « Enseignant » + « Tuteur-Enseignant » | idem | idem | Couvert |
| — champs obligatoires manquants : aucun fichier sélectionné → pas d'appel `uploadUserAvatar` | idem | idem | Couvert |
| — succès : sélection d'un fichier → upload avatar déclenché | idem | idem | Couvert |
| — validation échouée (422 sur `updateUserProfile`) : pas de toast succès, bouton réutilisable | idem | idem | Couvert |
| — erreur réseau (fetch rejeté) : UI stable, pas de crash | idem | idem | Couvert |

**Résumé chiffré** : 4 capacités natives couvertes (Dashboard, Onglet
Entretien, Onglet Rapport d'évaluation, Profil), 19 tests ajoutés/corrigés,
0 test en échec.

## Corrections apportées pendant cette reprise

Aucune modification de code applicatif. Uniquement des corrections de tests
(mocks/sélecteurs), le comportement réel des composants ayant été vérifié
au préalable :

1. **`TeacherApplications.test.tsx`** — le mock `fetch` conditionnait le
   retour de la liste de candidatures sur `if (!opts)`, en supposant que la
   requête `GET /teacher-applications` initiale n'envoie aucune option.
   Or `fetchApplications` (dans `src/pages/tutor/TeacherApplications.tsx`)
   envoie toujours `{ headers: { Authorization: ... } }` — `opts` n'est
   donc jamais `undefined`. Résultat observé avant correction : la liste ne
   se rendait jamais (`apps` recevait `{}` au lieu d'un tableau), et
   `selectFirstApplication()` échouait à trouver « Marc Nkoulou » dans le
   DOM sur 8 des 9 tests de ce fichier. Correction : condition remplacée
   par `if (!opts?.method)`, qui distingue correctement la requête GET
   (sans `method`) des requêtes PATCH/POST (avec `method` explicite). Ceci
   ne change aucune assertion, seulement la fidélité du mock au
   comportement réel du composant.
2. **`Dashboard.test.tsx`** — l'assertion `screen.getByText(/En attente/i)`
   échouait car le libellé « En attente » apparaît deux fois dans le rendu
   réel (`src/pages/tutor/Dashboard.tsx` lignes 37 et 44) : une fois comme
   intitulé de la carte statistique « candidatures en attente », une fois
   comme badge de statut de la ligne du tableau. Remplacé par
   `screen.getAllByText(/En attente/i).length` égal à 2, qui reflète
   fidèlement le DOM sans affaiblir la couverture (les deux occurrences
   sont vérifiées).
3. **`Profile.test.tsx`** — déjà correct et vert, aucune modification
   nécessaire.
4. Polyfill `ResizeObserver` dans `src/test/setup.ts` (fichier partagé,
   déjà en place avant cette reprise, non retouché ici) — nécessaire pour
   les graphiques recharts utilisés ailleurs dans la suite globale ; sans
   effet direct sur les tests de ce périmètre mais condition
   d'environnement stabilisée.

## Écarts constatés (comportement applicatif réel, non corrigés — hors périmètre de modification du code)

- **Onglet Rapport d'évaluation — observations non bloquantes.** La
  cartographie présente le champ « observations » (`overallNotes`) comme
  partie intégrante du rapport d'évaluation, mais `TutorTeacherApplications`
  (`src/pages/tutor/TeacherApplications.tsx`) ne désactive **pas** le bouton
  « Soumettre l'évaluation » en l'absence d'observations : aucune
  vérification cliente n'existe sur `overallNotes` avant l'appel à
  `POST /tutor-evaluations`. Le test
  « champs obligatoires manquants : écart constaté — la soumission n'est
  pas bloquée sans observations » documente ce comportement réel (payload
  envoyé avec `overallNotes: ""`) plutôt que d'inventer une validation
  absente du composant. Aucune modification du composant n'a été faite,
  conformément à la contrainte de périmètre (tests uniquement).

## Redirections vers `actor-teacher`

Aucune demande de test sur l'Espace Enseignant (`/tutor/enseignant/*`) n'a
été formulée au cours de cette reprise — pas de redirection nécessaire
cette fois-ci. Pour rappel (déjà consigné dans le system prompt
`actor-tutor`) : toute capacité de cet espace relève d'`actor-teacher`,
invoqué par `scenario-director` avec `actingAs: 'tutor-secondary-role'`.
