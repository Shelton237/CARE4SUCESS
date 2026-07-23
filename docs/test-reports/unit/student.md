# Couverture unitaire — Élève (student)

Agent-acteur : `actor-student`
Périmètre : section **Élève** de `docs/CARTOGRAPHIE_FONCTIONNELLE.md` (source
de vérité unique). Aucune capacité de matching, de correction/notation de
devoir, ou d'action réservée au staff (admin/advisor) n'a été implémentée ni
testée — voir « Écarts et refus » ci-dessous.

## Suite de tests

Vitest + Testing Library, co-localisés dans `src/pages/student/`, réseau
systématiquement mocké (`@/api/backoffice` et/ou `fetch` global selon la
page, `jspdf` mocké pour Mon Planning, `sonner` mocké pour les toasts).

```
npm run test:ui -- --run src/pages/student
```

État final : **10 fichiers de test, 62 tests, tous verts.**

## Tableau fonction × statut

| Capacité (cartographie) | Fonctions / endpoints | Fichier de test | Statut |
|---|---|---|---|
| Tableau de bord | `fetchStudentOverview`, `fetchScheduleByRole` | `Dashboard.test.tsx` | Couvert |
| — succès : moyenne, niveau, prochains cours affichés | idem | idem | Couvert |
| — erreur réseau : repli sur valeurs par défaut (`--/20`, `N/A`, aucun cours) | idem | idem | Couvert |
| — données vides : aucun cours à venir | idem | idem | Couvert |
| — navigation « Agenda complet » → `/student/schedule` | idem | idem | Couvert |
| — navigation « Lancer un Quiz » → `/student/quizzes` | idem | idem | Couvert |
| Mon Planning | `fetchScheduleByRole`, `jsPDF` | `Schedule.test.tsx` | Couvert |
| — succès : sessions affichées, « Rejoindre » → `/virtual-class/:id` | idem | idem | Couvert |
| — recherche : filtre par matière/enseignant | idem | idem | Couvert |
| — succès : « Résumé » ouvre le bilan pédagogique (session passée) | idem | idem | Couvert |
| — succès : téléchargement PDF du bilan (`jsPDF.save`) + toast succès | idem | idem | Couvert |
| — données vides / erreur réseau : « Aucun cours trouvé » | idem | idem | Couvert |
| Mes Professeurs | `fetchTeachersByStudent` | `Teachers.test.tsx` | Couvert |
| — succès : liste des tuteurs + coordonnées | idem | idem | Couvert |
| — navigation « Discuter » → `/student/messages` avec contact pré-sélectionné | idem | idem | Couvert |
| — données vides / erreur réseau : « Aucun tuteur assigné » | idem | idem | Couvert |
| Mes Messages | `fetchTeachersByStudent`, `fetch` (messages/envoi/lecture), `uploadMessageAttachment` | `Messages.test.tsx` | Couvert |
| — succès : contacts (profs assignés) + fil de discussion | idem | idem | Couvert |
| — filtre par rôle (Tous/Enseignant/Conseiller) | idem | idem | Couvert |
| — champs obligatoires manquants : envoi désactivé sans texte | idem | idem | Couvert |
| — succès : envoi de message (POST) + mise à jour optimiste | idem | idem | Couvert |
| — erreur réseau : échec d'envoi → annulation optimiste + toast d'erreur | idem | idem | Couvert |
| — succès / erreur réseau : upload de pièce jointe (`uploadMessageAttachment`) | idem | idem | Couvert |
| — état vide : « Aucune discussion active » sans professeur assigné | idem | idem | Couvert |
| Mes Devoirs | `fetchStudentHomework`, `uploadHomeworkFile` | `Homework.test.tsx` | Couvert |
| — succès : devoirs « à faire »/« corrigé » affichés avec statut | idem | idem | Couvert |
| — recherche : filtre par titre/matière | idem | idem | Couvert |
| — succès : lecture correction + retour du professeur (lecture seule stricte) | idem | idem | Couvert |
| — succès : dépôt de fichier via `uploadHomeworkFile` (« Déposer ») | idem | idem | Couvert |
| — erreur réseau / fichier invalide (rejet serveur) : toast d'erreur, modale non fermée | idem | idem | Couvert |
| — données vides / erreur réseau : « Aucun devoir à afficher » | idem | idem | Couvert |
| Tests & Quiz | `fetchCourses`, `fetchStudentQuizAttempts`, `fetchQuiz`, `submitQuizAttempt` | `Quizzes.test.tsx` | Couvert |
| — succès : quiz disponibles + derniers résultats | idem | idem | Couvert |
| — recherche : filtre par titre/matière | idem | idem | Couvert |
| — succès : lecture du quiz, réponse, soumission via `submitQuizAttempt` | idem | idem | Couvert |
| — champs obligatoires manquants : impossible de continuer sans réponse (bouton désactivé) | idem | idem | Couvert |
| — erreur réseau : échec de soumission → toast d'erreur | idem | idem | Couvert |
| — données vides / erreur réseau : listes vides | idem | idem | Couvert |
| Mes Cours | `fetchCourses`, `fetchCourseBookmarks`, `addCourseBookmark`, `removeCourseBookmark`, `fetchActiveCourse`, `fetchCourseDetails`, `updateCourseProgress` | `Courses.test.tsx` | Couvert |
| — succès : cours affichés avec progression | idem | idem | Couvert |
| — recherche : filtre par titre/matière | idem | idem | Couvert |
| — succès/erreur réseau : ajout/retrait de favori (`addCourseBookmark`/`removeCourseBookmark`) | idem | idem | Couvert |
| — succès : ouverture d'un cours, lecture de leçon, `updateCourseProgress` (terminée) | idem | idem | Couvert |
| — succès : « Rejoindre la Classe » → `/virtual-class/:id` (cours en ligne) | idem | idem | Couvert |
| — données vides / erreur réseau : « Aucun cours trouvé » | idem | idem | Couvert |
| Progression Académique | `fetchStudentProgressData`, `fetchStudentSessions`, `fetch` (diagnostic/plan/overview en lecture), `submitGradeDispute` | `Progress.test.tsx` | Couvert |
| — succès : historique des évaluations (note de session) | idem | idem | Couvert |
| — succès : diagnostic initial + plan pédagogique affichés en lecture | idem | idem | Couvert |
| — succès : contestation de note via `submitGradeDispute({ studentId, sessionId, reason })` | idem | idem | Couvert |
| — champs obligatoires manquants : contestation sans motif bloquée (toast d'avertissement) | idem | idem | Couvert |
| — erreur réseau : échec de `submitGradeDispute` → toast d'erreur | idem | idem | Couvert |
| — erreur réseau (chargement) : repli sur courbe/historique par défaut | idem | idem | Couvert |
| Historique des cours (lecture seule stricte) | `GET /api/students/:id/course-history` | `History.test.tsx` | Couvert |
| — succès : séances effectuées + rapport professeur affichés | idem | idem | Couvert |
| — lecture seule : aucun bouton/champ d'écriture proposé | idem | idem | Couvert |
| — données vides / erreur réseau : « Aucun cours effectué » | idem | idem | Couvert |
| Bibliothèque | lecture/filtrage ressources, `PATCH /api/resources/:id/download` | `Resources.test.tsx` | Couvert |
| — succès : ressources affichées (matière/niveau) | idem | idem | Couvert |
| — filtrage : recherche texte + filtre par matière | idem | idem | Couvert |
| — succès : ouverture → PATCH de comptage puis `window.open` du fichier | idem | idem | Couvert |
| — erreur réseau : le comptage échoue sans bloquer l'ouverture du fichier | idem | idem | Couvert |
| — données vides : « Aucune ressource disponible » | idem | idem | Couvert |

**Résumé chiffré** : 9 capacités élève couvertes (Tableau de bord, Mon
Planning, Mes Professeurs, Mes Messages, Mes Devoirs, Tests & Quiz, Mes
Cours, Progression Académique, Historique des cours, Bibliothèque —
soit les 10 pages listées dans la cartographie), 67 tests au total (5
préexistants sur le Tableau de bord dont 2 corrigés + 62 nouveaux/révisés
sur les 9 autres pages), 0 test en échec.

## Corrections apportées pendant cette reprise

1. **`Dashboard.test.tsx`** (préexistant, 2 échecs à la reprise) :
   - Le test de succès cherchait `screen.getByText("M. Konaté")`, alors que
     ce libellé apparaît deux fois dans le rendu réel de
     `src/pages/student/Dashboard.tsx` (carte « Prochains Cours » et carte
     « Mot du Tuteur »). Remplacé par `getAllByText(...).length > 0`.
   - Le test d'erreur réseau cherchait `screen.getByText("--/20")`, alors
     que ce libellé apparaît deux fois (cartes « Moyenne Générale » et
     « Objectif Visé », toutes deux à `null` par défaut). Remplacé par
     `getAllByText(...).length > 0`.
   - Le polyfill `ResizeObserver` de `src/test/setup.ts` (déjà en place,
     non retouché) était nécessaire au rendu des graphiques `recharts` de
     cette page ; aucune autre modification d'environnement n'a été faite.
2. Pattern récurrent sur les nouvelles pages : plusieurs libellés attendus
   apparaissent en double dans le DOM réel (ex. « M. Konaté » dans la
   sidebar de contacts *et* l'en-tête du fil de discussion sur Messages ;
   « À faire »/« Corrigé » dans la liste *et* le récapitulatif sur
   Homework ; « Quiz Fractions » dans la carte quiz *et* la ligne de
   résultat sur Quizzes ; « Maths » comme légende de graphique *et* comme
   matière de séance sur Progress). Systématiquement résolu par
   `getAllByText(...)`/`findAllByText(...)` plutôt que par une modification
   du composant, conformément à la contrainte « tests uniquement ».
3. **`Schedule.test.tsx`** : le mock `jspdf` doit renvoyer un constructeur
   utilisable avec `new jsPDF()` (`vi.fn().mockImplementation(function () {...})`
   et non une flèche fléchée), sans quoi `jsPDF` n'est pas reconnu comme
   constructeur par le moteur de test et `handleDownloadPDF` échoue
   silencieusement (catché par le `try/catch` du composant).
4. **`Messages.test.tsx`** : le mock `fetch` doit simuler un état serveur
   persistant (tableau de messages qui grossit à chaque `POST`), sinon
   l'invalidation de requête déclenchée par `onSettled` écrase le message
   optimiste avant l'assertion.
5. **`Progress.test.tsx`** : `submitGradeDispute` est branché directement
   comme `mutationFn` de `useMutation` (pas via une fonction wrapper), donc
   TanStack Query l'appelle avec un second argument de contexte
   (`{ client, meta, mutationKey }`). L'assertion `toHaveBeenCalledWith`
   a été ajustée avec `expect.anything()` en second argument plutôt que de
   modifier le composant.
6. **`Quizzes.test.tsx`** : l'icône `PlayCircle` de `lucide-react` est un
   alias de l'icône `circle-play` ; la classe CSS réellement rendue est
   `lucide-circle-play` (et non `lucide-play-circle`). Sélecteur corrigé en
   conséquence pour cibler le bouton de lancement de quiz.

## Écarts et refus rencontrés

- **Aucune demande de matching, de correction de devoir, de validation
  d'assignation enseignant↔élève ou de création de séance** n'a été
  formulée au cours de cette reprise. Pour mémoire (conformément au system
  prompt `actor-student`), ces capacités **n'existent pas côté élève**
  d'après la cartographie et relèvent exclusivement du staff
  (admin/advisor) : toute demande de ce type serait refusée explicitement,
  sans handler ni composant improvisé.
- **Mes Devoirs — validation du fichier côté client.** La cartographie
  mentionne un dépôt limité aux formats PDF/PNG/JPG et 10 Mo maximum, mais
  `src/pages/student/Homework.tsx` ne pose aucune contrainte `accept`/taille
  côté client sur l'`<input type="file">` : la validation de format/taille
  est entièrement déléguée au serveur (`uploadHomeworkFile`). Le test
  « erreur réseau / fichier invalide » documente ce comportement réel en
  simulant un rejet serveur (fichier trop volumineux) plutôt que d'inventer
  une validation cliente absente du composant.
- **Tests & Quiz — validation « sans réponse ».** Le bouton « Question
  suivante »/« Terminer le Quiz » de `QuizPlayer` est nativement désactivé
  tant qu'aucune réponse n'est sélectionnée pour la question courante
  (`disabled={!answers[currentQuestion?.id]}`) : il n'existe donc pas de
  scénario où `submitQuizAttempt` peut être appelé sans réponse. Le test
  correspondant vérifie cette désactivation plutôt que de forcer un appel
  qui ne peut pas se produire dans l'UI réelle.
- Aucune modification de code applicatif n'a été effectuée : uniquement
  des fichiers de test (`*.test.tsx`) et ce rapport.
