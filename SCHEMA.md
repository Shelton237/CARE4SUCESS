# CARE4SUCCESS - Database Schema & Technology Stack

## Technology Stack
- **Frontend**: React 18 + Vite 5 + TypeScript strict
- **Styling**: Tailwind CSS 4 + Shadcn UI
- **State Management**: React Query 5
- **Backend**: Express 5 (Node.js)
- **Database**: MySQL (mysql2/promise)
- **Storage**: Multer for file uploads

---

## MySQL Database Structure

### Table: `users`
Contient l'ensemble des utilisateurs de la plateforme (Admin, Prof, Parent, Conseiller, Élève).
- `id` (VARCHAR(255), PRIMARY KEY)
- `name` (VARCHAR(255), NOT NULL)
- `email` (VARCHAR(255), UNIQUE, NOT NULL)
- `password` (VARCHAR(255), NOT NULL)
- `role` (ENUM('admin','teacher','parent','advisor','student'), NOT NULL)
- `avatar` (VARCHAR(10))
- `phone` (VARCHAR(50))
- `location` (VARCHAR(120))
- `timezone` (VARCHAR(64), NOT NULL, DEFAULT 'Africa/Douala')
- `language` (VARCHAR(10), NOT NULL, DEFAULT 'fr')
- `bio` (TEXT)
- `notify_email` (TINYINT(1), NOT NULL, DEFAULT 1)
- `notify_sms` (TINYINT(1), NOT NULL, DEFAULT 0)
- `notify_whatsapp` (TINYINT(1), NOT NULL, DEFAULT 0)
- `parent_id` (VARCHAR(255), NULL) - Clé étrangère vers `users(id)`
- `last_login_at` (TIMESTAMP, NULL)
- `created_at` (TIMESTAMP, NOT NULL, DEFAULT CURRENT_TIMESTAMP)
- `updated_at` (TIMESTAMP, NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)

### Table: `teachers`
Profils détaillés des enseignants.
- `id` (CHAR(36), PRIMARY KEY, DEFAULT UUID)
- `name` (VARCHAR(191), NOT NULL)
- `email` (VARCHAR(191), NOT NULL)
- `subjects` (JSON, NOT NULL) - Liste des matières
- `level` (VARCHAR(120), NOT NULL)
- `city` (VARCHAR(120), NOT NULL)
- `status` (ENUM('actif', 'inactif', 'suspendu'), NOT NULL, DEFAULT 'actif')
- `rating` (DECIMAL(3,1), NOT NULL, DEFAULT 5.0)
- `students` (INT, NOT NULL, DEFAULT 0)
- `created_at` (TIMESTAMP, NOT NULL, DEFAULT CURRENT_TIMESTAMP)

### Table: `sessions`
Sessions de cours (calendrier, visio, rapports).
- `id` (CHAR(36), PRIMARY KEY, DEFAULT UUID)
- `session_day` (VARCHAR(20), NOT NULL)
- `session_date` (DATE, NOT NULL)
- `session_time` (VARCHAR(40), NOT NULL)
- `subject` (VARCHAR(120), NOT NULL)
- `location` (VARCHAR(120), NOT NULL)
- `status` (ENUM('effectué', 'à venir', 'planifié'), NOT NULL, DEFAULT 'planifié')
- `teacher_id` (VARCHAR(36), NOT NULL)
- `teacher_name` (VARCHAR(191), NOT NULL)
- `student_id` (VARCHAR(36), NOT NULL)
- `student_name` (VARCHAR(191), NOT NULL)
- `parent_id` (VARCHAR(36), NOT NULL)
- `parent_name` (VARCHAR(191), NOT NULL)
- `virtual_link` (VARCHAR(255), NULL)
- `actual_start_time` (TIMESTAMP, NULL)
- `actual_end_time` (TIMESTAMP, NULL)
- `report_text` (TEXT, NULL)
- `understanding_score` (INT, NULL)
- `is_paid` (BOOLEAN, NOT NULL, DEFAULT FALSE)
- `lesson_id` (VARCHAR(36), NULL)
- `course_id` (VARCHAR(36), NULL)
- `notes` (TEXT, NULL)
- `whiteboard_data` (LONGTEXT, NULL)
- `code_data` (TEXT, NULL)
- `created_at` (TIMESTAMP, NOT NULL, DEFAULT CURRENT_TIMESTAMP)

### Table: `teacher_feedback`
Évaluations des enseignants par les parents/élèves.
- `id` (CHAR(36), PRIMARY KEY)
- `teacher_id` (VARCHAR(36), NOT NULL)
- `teacher_name` (VARCHAR(191), NULL)
- `student_id` (VARCHAR(36), NOT NULL)
- `student_name` (VARCHAR(191), NOT NULL)
- `session_id` (VARCHAR(36), NULL)
- `rating` (INT, NOT NULL, DEFAULT 5)
- `comment` (TEXT)
- `created_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)

### Table: `student_evaluations`
Évaluations des élèves par les enseignants.
- `id` (CHAR(36), PRIMARY KEY)
- `student_id` (VARCHAR(36), NOT NULL)
- `teacher_id` (VARCHAR(36), NOT NULL)
- `teacher_name` (VARCHAR(191), NOT NULL)
- `rating` (TINYINT, NOT NULL, DEFAULT 5)
- `comment` (TEXT)
- `created_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)

### Table: `homework`
Devoirs assignés aux élèves.
- `id` (CHAR(36), PRIMARY KEY, DEFAULT UUID)
- `teacher_id` (VARCHAR(36), NOT NULL)
- `student_id` (VARCHAR(36), NOT NULL)
- `session_id` (VARCHAR(36), NULL)
- `title` (VARCHAR(255), NOT NULL)
- `description` (TEXT)
- `due_date` (DATE, NOT NULL)
- `subject` (VARCHAR(120), NOT NULL)
- `status` (ENUM('à faire', 'rendu', 'corrigé'), NOT NULL, DEFAULT 'à faire')
- `file_url` (VARCHAR(255))
- `submission_url` (VARCHAR(255))
- `feedback` (TEXT)
- `created_at` (TIMESTAMP, NOT NULL, DEFAULT CURRENT_TIMESTAMP)

### Table: `courses`
Parcours pédagogiques.
- `id` (CHAR(36), PRIMARY KEY)
- `title` (VARCHAR(255), NOT NULL)
- `description` (TEXT)
- `subject` (VARCHAR(120), NOT NULL)
- `level` (VARCHAR(120), NOT NULL)
- `status` (ENUM('draft', 'published'), NOT NULL, DEFAULT 'draft')
- `cover_url` (VARCHAR(255), NULL)
- `created_by` (VARCHAR(36), NULL)
- `created_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)

### Table: `course_lessons`
Leçons au sein d'un cours.
- `id` (CHAR(36), PRIMARY KEY)
- `course_id` (CHAR(36), NOT NULL) - FK vers `courses(id)`
- `title` (VARCHAR(255), NOT NULL)
- `content` (TEXT, NOT NULL)
- `video_url` (VARCHAR(255), NULL)
- `order_index` (INT, NOT NULL, DEFAULT 1)
- `created_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)

### Table: `course_enrollments`
Inscriptions des élèves aux cours.
- `id` (CHAR(36), PRIMARY KEY)
- `course_id` (CHAR(36), NOT NULL) - FK vers `courses(id)`
- `student_id` (VARCHAR(36), NOT NULL)
- `student_name` (VARCHAR(191), NOT NULL)
- `assigned_by` (VARCHAR(36), NULL)
- `assigned_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)

### Table: `quizzes`
- `id` (CHAR(36), PRIMARY KEY)
- `course_id` (CHAR(36), NOT NULL) - FK vers `courses(id)`
- `lesson_id` (CHAR(36), NULL)
- `title` (VARCHAR(255), NOT NULL)
- `instructions` (TEXT, NULL)
- `total_points` (INT, NOT NULL, DEFAULT 0)
- `created_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)

### Table: `quiz_questions`
- `id` (CHAR(36), PRIMARY KEY)
- `quiz_id` (CHAR(36), NOT NULL) - FK vers `quizzes(id)`
- `prompt` (TEXT, NOT NULL)
- `choices` (JSON, NOT NULL)
- `correct_answer` (VARCHAR(120), NOT NULL)
- `points` (INT, NOT NULL, DEFAULT 1)

### Table: `quiz_attempts`
- `id` (CHAR(36), PRIMARY KEY)
- `quiz_id` (VARCHAR(36), NOT NULL)
- `student_id` (VARCHAR(36), NOT NULL)
- `student_name` (VARCHAR(191), NOT NULL)
- `answers` (JSON, NOT NULL)
- `score` (DECIMAL(5,2), NOT NULL)
- `total_points` (INT, DEFAULT 20)
- `created_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)

### Table: `notifications`
- `id` (CHAR(36), PRIMARY KEY, DEFAULT UUID)
- `user_id` (VARCHAR(191), NOT NULL)
- `title` (VARCHAR(255), NOT NULL)
- `content` (TEXT, NOT NULL)
- `type` (VARCHAR(50), NOT NULL, DEFAULT 'info')
- `is_read` (BOOLEAN, NOT NULL, DEFAULT FALSE)
- `link` (VARCHAR(255), NULL)
- `created_at` (TIMESTAMP, NOT NULL, DEFAULT CURRENT_TIMESTAMP)

### Table: `requests`
Demandes d'inscription / Bilans.
- `id` (CHAR(36), PRIMARY KEY)
- `parent_name` (VARCHAR(191), NOT NULL)
- `child_name` (VARCHAR(191), NOT NULL)
- `level` (VARCHAR(120), NOT NULL)
- `subject` (VARCHAR(120), NOT NULL)
- `phone` (VARCHAR(50))
- `status` (ENUM('reçu', 'en traitement', 'assigné', 'clôturé'), NOT NULL, DEFAULT 'reçu')
- `request_date` (DATE, NOT NULL)
- `created_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)

### Table: `assignments`
Affectations prof/élève issues des demandes.
- `id` (CHAR(36), PRIMARY KEY)
- `child_name` (VARCHAR(191), NOT NULL)
- `level` (VARCHAR(120), NOT NULL)
- `subject` (VARCHAR(120), NOT NULL)
- `needs` (JSON, NULL)
- `schedule` (VARCHAR(255), NULL)
- `candidates` (JSON, NULL)
- `selected_teacher` (VARCHAR(191), NULL)
- `status` (ENUM('pending', 'confirmed', 'cancelled'), NOT NULL, DEFAULT 'pending')
- `created_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)
- `updated_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)

### Table: `teacher_applications`
Candidatures d'enseignants.
- `id` (CHAR(36), PRIMARY KEY)
- `full_name` (VARCHAR(255), NOT NULL)
- `email` (VARCHAR(255), NOT NULL)
- `phone` (VARCHAR(50), NOT NULL)
- `subjects` (JSON, NOT NULL)
- `experience_years` (INT, NOT NULL)
- `availability` (TEXT, NOT NULL)
- `motivation` (TEXT, NOT NULL)
- `cv_url` (TEXT)
- `status` (ENUM('pending', 'approved', 'rejected'), NOT NULL, DEFAULT 'pending')
- `reviewed_by` (VARCHAR(255))
- `reviewer_role` (ENUM('admin', 'advisor'))
- `review_notes` (TEXT)
- `reviewed_at` (TIMESTAMP, NULL)
- `created_at` (TIMESTAMP, NOT NULL, DEFAULT CURRENT_TIMESTAMP)

### Table: `messages`
- `id` (CHAR(36), PRIMARY KEY, DEFAULT UUID)
- `sender_id` (VARCHAR(191), NOT NULL)
- `sender_name` (VARCHAR(191), NOT NULL)
- `sender_role` (VARCHAR(50), NOT NULL)
- `receiver_id` (VARCHAR(191), NOT NULL)
- `receiver_name` (VARCHAR(191), NOT NULL)
- `receiver_role` (VARCHAR(50), NOT NULL)
- `content` (TEXT, NOT NULL)
- `attachment_url` (VARCHAR(255), NULL)
- `is_read` (BOOLEAN, NOT NULL, DEFAULT FALSE)
- `created_at` (TIMESTAMP, NOT NULL, DEFAULT CURRENT_TIMESTAMP)

### Table: `parent_child` (Relationship)
- `parent_id` (VARCHAR(255), NOT NULL) - FK `users(id)`
- `child_id` (VARCHAR(255), NOT NULL) - FK `users(id)`
- PRIMARY KEY (`parent_id`, `child_id`)

### Table: `student_teacher` (Relationship)
- `student_id` (VARCHAR(255), NOT NULL) - FK `users(id)`
- `teacher_id` (VARCHAR(255), NOT NULL) - FK `users(id)`
- PRIMARY KEY (`student_id`, `teacher_id`)

### Table: `course_bookmarks`
- `user_id` (VARCHAR(255), NOT NULL)
- `course_id` (VARCHAR(255), NOT NULL)
- PRIMARY KEY (`user_id`, `course_id`)

### Table: `user_course_progress`
- `user_id` (VARCHAR(255), NOT NULL)
- `course_id` (CHAR(36), NOT NULL)
- `last_lesson_id` (CHAR(36), NULL)
- `completed_lessons` (JSON, NOT NULL)
- `last_accessed_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)
- PRIMARY KEY (`user_id`, `course_id`)

### Table: `student_progress_points`
Points de progression mensuels pour les graphiques du dashboard élève.
- `id` (CHAR(36), PRIMARY KEY)
- `student_id` (VARCHAR(36), NOT NULL)
- `month_label` (VARCHAR(20), NOT NULL)
- `month_order` (INT, NOT NULL)
- `maths` (DECIMAL(4,1), NOT NULL)
- `francais` (DECIMAL(4,1), NOT NULL)
- `anglais` (DECIMAL(4,1), NOT NULL)
- `created_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)

### Table: `grade_disputes`
Réclamations de notes par les élèves.
- `id` (CHAR(36), PRIMARY KEY, DEFAULT UUID)
- `student_id` (VARCHAR(36), NOT NULL)
- `session_id` (VARCHAR(36), NOT NULL)
- `reason` (TEXT, NOT NULL)
- `status` (ENUM('pending', 'resolved', 'rejected'), NOT NULL, DEFAULT 'pending')
- `created_at` (TIMESTAMP, NOT NULL, DEFAULT CURRENT_TIMESTAMP)

### Table: `platform_settings`
Paramètres globaux de la plateforme (tarifs, centres, notifications).
- `id` (VARCHAR(64), PRIMARY KEY)
- `data` (JSON, NOT NULL)
- `updated_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)
