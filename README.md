# Care4Success

Plateforme marketing + backoffice pour Care4Success : site vitrine, portail conseillers/parents/eleves/profs et API Express/MySQL (compatible WampServer). Les mock data restent accessibles mais les ecrans critiques sont maintenant relies a la base (demandes, matching, plannings, candidatures profs, evaluations).

## Stack technique
- Vite 5 + React 18 + TypeScript
- Tailwind CSS 4, Shadcn UI, Lucide
- React Router 6 (HashRouter) + React Query 5
- Express 5, mysql2/promise, dotenv, cors
- Supabase SDK (client optionnel) + scripts `supabase/migrations` et `supabase/seed`

## Identifiants de demo
| Profil | Email | Mot de passe |
| --- | --- | --- |
| Admin | admin@care4success.cm | admin123 |
| Conseiller | conseiller@care4success.cm | conseil123 |
| Enseignant | prof@care4success.cm | prof123 |
| Parent | parent@care4success.cm | parent123 |
| Eleve | eleve@care4success.cm | eleve123 |

Backoffice (tous roles) : `http://localhost:8080/#/login`.

## Processus metier automatise
1. **Demandes familles** : le site public (formulaire Contact/Professeurs) cree une entree dans `requests`. Les admins voient le pipeline par statut dans `/admin/requests` et priorisent les relances.
2. **Matching conseiller** : les conseillers suivent la file `assignments` dans `/advisor/matching`, cochent le meilleur professeur disponible puis confirment; l'API bascule le statut en `confirmed`.
3. **Candidatures profs** : page publique Professeurs -> `TeacherApplicationForm` -> `POST /api/teacher-applications`. Admin et conseiller disposent du meme tableau pour valider/refuser (avec trace reviewer/notes).
4. **Plannings roles** : `/api/sessions?role=teacher|parent|student` alimente les pages Planning de chaque role. Les boards continuent a montrer les mock data pour la partie analytique.
5. **Evaluations enseignants** : parents/advisors peuvent noter un prof (Parent > Avis profs). Les avis sont stockes dans `teacher_feedback`, resumes dans `/admin` (TeacherRatingsBoard) et cote enseignant (TeacherRatingSummary).

Ces briques suffisent pour laisser tourner le systeme sans intervention : demandes -> matching -> validation profs -> plannings -> collecte d'avis.

## Evaluation des professeurs
- Parents : onglet `Avis profs` => formulaire React Hook Form avec verification (note 1-5, commentaire optionnel). Les options sont basees sur les profs du planning.
- Conseillers/Admins : voient les moyennes + derniers avis dans les tableaux de bord pour reperez les signaux faibles.
- Enseignants : `TeacherRatingSummary` integre a leur dashboard leur note moyenne + retours recents pour ajuster la pedagogie.

## Installation & tests locaux
1. **Prerequis** : Node 20+, npm, MySQL (WampServer ok), Supabase CLI optionnel si vous voulez rejouer les migrations Postgres.
2. **Variables** : copier `.env.example` vers `.env.local` puis ajuster :
   ```env
   VITE_API_URL=/api
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=care4success
   DB_USERNAME=root
   DB_PASSWORD=
   CLIENT_ORIGIN=http://localhost:8080
   ```
3. **Dependances** : `npm install`.
4. **Base MySQL** (depuis un terminal WampServer) :
   ```bash
   mysql -u root -p < server/schema.sql
   mysql -u root -p < server/seed.sql
   ```
   Les scripts creent/vident les tables `requests`, `assignments`, `sessions`, `teacher_applications`, `teacher_feedback`.
5. **API** : `npm run api` (Express sur http://localhost:4000, proxy via `/api`).
6. **Frontend** : `npm run dev` (Vite sur http://localhost:8080) ou `npm run dev:full` pour lancer API + front simultanement. Connexion sur `#/login` avec l'un des comptes ci-dessus.
7. **Tests/qualite** :
   - `npm run lint` (actuellement quelques alertes d'espacement historiques dans `src/components/Layout.tsx`, a traiter ulterieurement).
   - `npm run build` pour verifier le bundling.
8. **Relancer l'API** en cas de changement de schema : arreter le process en cours (`Ctrl+C`) puis `npm run api`.

## API REST disponible
- `GET /api/health` : ping DB.
- `GET /api/requests` : demandes familles.
- `GET /api/assignments` : liste matching conseiller.
- `PATCH /api/assignments/:id` : confirme le professeur (`{ "selectedTeacher": "Nom" }`).
- `GET /api/sessions?role=&userId=` : planning filtre par role (teacher|parent|student).
- `POST /api/teacher-applications` : depot candidature publique.
- `GET /api/teacher-applications?status=` : filtre admin/conseiller (`pending|approved|rejected`).
- `PATCH /api/teacher-applications/:id` : decision (reviwerName, reviewerRole, reviewNotes, status).
- `POST /api/teacher-feedback` : avis parent/advisor/student (note 1-5, commentaire optionnel).
- `GET /api/teachers/:teacherId/feedback` : historique des avis d'un prof.
- `GET /api/teacher-ratings` : aggregats (moyenne, nombre d'avis, derniere date).
- `GET /api/courses?role=admin|teacher|student&userId=` : liste des cours filtrée par rôle (assignations élèves via `course_enrollments`).
- `POST /api/courses` + `/courses/:courseId/lessons` + `/lessons/:lessonId/quizzes` + `/quizzes/:quizId/questions` : création du parcours (cours -> leçons -> quiz).
- `POST /api/courses/:courseId/enrollments` : assignation d’un élève à un cours.
- `GET /api/quizzes/:quizId` + `POST /api/quizzes/:quizId/attempts` : consultation et soumission des quiz.
- `GET /api/students/:studentId/quiz-attempts` + `GET /api/quizzes/:quizId/attempts` : suivi des résultats par élève ou par quiz.

## Base de donnees
| Table | Description |
| --- | --- |
| `requests` | Demandes de bilan gratuit (workflow admin). |
| `assignments` | File de matching conseiller -> enseignant. |
| `sessions` | Croneaux confirmes pour teachers/parents/eleves. |
| `teacher_applications` | Dossiers candidats profs + metadonnees de revue. |
| `teacher_feedback` | Avis notes/commentaires par role (parent, student, advisor). |
| `parent_overviews` / `student_progress_points` / `parent_invoices` | Synthèse familles (moyennes, factures, planning). |
| `courses` / `course_lessons` / `course_enrollments` | Parcours pédagogiques et assignations élèves. |
| `quizzes` / `quiz_questions` / `quiz_attempts` | Évaluations associées aux leçons. |

## Module cours -> leçons -> quiz

1. **Construction** (`/#/admin/courses`) : créez un cours, ajoutez les leçons, configurez un quiz (titre, instructions, total de points) puis ajoutez des questions QCM. Vous pouvez assigner les élèves via leur identifiant (ex: `s1`).
2. **Suivi enseignant** (`/#/teacher/courses`) : vue consolidée des leçons + quiz avec l’historique des copies envoyées.
3. **Parcours élève** (`/#/student/courses`) : consultation des contenus (texte/vidéo) et rendu des quiz depuis l’interface élève.
4. **Reporting parent** : les cinq dernières évaluations remontent automatiquement dans les écrans Parent (dashboard + progression) pour compléter les moyennes.

## Supabase (optionnel)
- `supabase/migrations/202403041400_backoffice.sql` reproduit le schema (UUID + arrays JSONB).
- `supabase/seed/backoffice_seed.sql` permet de recharger les memes donnees d'exemple via `supabase db reset` ou `psql`.
- Le client Supabase (`src/integrations/supabase/client.ts`) se mettra a disposition si vous renseignez `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`.

## Notes supplementaires
- Les composants front restent ecrits en TypeScript strict et utilisaient les mock data pour les vues analytiques; seules les sections metier critiques tirent depuis l'API.
- Pour deployer vers GitHub :
  ```bash
  git remote add origin https://github.com/Shelton237/CARE4SUCESS.git
  git branch -M main
  git push -u origin main
  ```
