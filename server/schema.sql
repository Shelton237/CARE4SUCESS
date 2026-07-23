CREATE DATABASE IF NOT EXISTS care4success CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE care4success;

DROP TABLE IF EXISTS quiz_attempts;
DROP TABLE IF EXISTS quiz_questions;
DROP TABLE IF EXISTS quizzes;
DROP TABLE IF EXISTS course_enrollments;
DROP TABLE IF EXISTS course_lessons;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS parent_invoices;
DROP TABLE IF EXISTS student_progress_points;
DROP TABLE IF EXISTS parent_overviews;
DROP TABLE IF EXISTS platform_settings;
DROP TABLE IF EXISTS parent_child;
DROP TABLE IF EXISTS student_teacher;
DROP TABLE IF EXISTS users;

-- Utilisateurs et profils
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin','teacher','parent','advisor','student','tutor') NOT NULL,
    avatar VARCHAR(10) NULL,
    phone VARCHAR(50) NULL,
    location VARCHAR(120) NULL,
    geo_location_id INT UNSIGNED NULL,
    timezone VARCHAR(64) NOT NULL DEFAULT 'Africa/Douala',
    language VARCHAR(10) NOT NULL DEFAULT 'fr',
    bio TEXT NULL,
    notify_email TINYINT(1) NOT NULL DEFAULT 1,
    notify_sms TINYINT(1) NOT NULL DEFAULT 0,
    notify_whatsapp TINYINT(1) NOT NULL DEFAULT 0,
    parent_id VARCHAR(255) NULL,
    last_login_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uniq_users_email (email),
    CONSTRAINT fk_users_parent FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Liaison parents/enfants
CREATE TABLE IF NOT EXISTS parent_child (
    parent_id VARCHAR(255) NOT NULL,
    child_id VARCHAR(255) NOT NULL,
    PRIMARY KEY (parent_id, child_id),
    KEY idx_pc_child (child_id),
    CONSTRAINT fk_pc_parent FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_pc_child FOREIGN KEY (child_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Liaison élèves/enseignants
CREATE TABLE IF NOT EXISTS student_teacher (
    student_id VARCHAR(255) NOT NULL,
    teacher_id VARCHAR(255) NOT NULL,
    PRIMARY KEY (student_id, teacher_id),
    KEY idx_st_teacher (teacher_id),
    CONSTRAINT fk_st_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_st_teacher FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Demandes de bilan
CREATE TABLE IF NOT EXISTS requests (
    id CHAR(36) NOT NULL DEFAULT (UUID()),
    parent_name VARCHAR(191) NOT NULL,
    child_name VARCHAR(191) NOT NULL,
    level VARCHAR(100) NOT NULL,
    subject VARCHAR(120) NOT NULL,
    phone VARCHAR(40) NOT NULL,
    status ENUM('reçu', 'en traitement', 'assigné', 'clôturé') NOT NULL DEFAULT 'reçu',
    request_date DATE NOT NULL DEFAULT (CURRENT_DATE),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_requests_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Matching conseiller
CREATE TABLE IF NOT EXISTS assignments (
    id CHAR(36) NOT NULL DEFAULT (UUID()),
    child_name VARCHAR(191) NOT NULL,
    level VARCHAR(100) NOT NULL,
    subject VARCHAR(120) NOT NULL,
    needs JSON NOT NULL,
    schedule VARCHAR(120) NOT NULL,
    candidates JSON NOT NULL,
    selected_teacher VARCHAR(191) NULL,
    status ENUM('pending', 'selected', 'confirmed') NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (id),
    KEY idx_assignments_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Créneaux par rôle
CREATE TABLE IF NOT EXISTS sessions (
    id CHAR(36) NOT NULL DEFAULT (UUID()),
    session_day VARCHAR(20) NOT NULL,
    session_date DATE NOT NULL,
    session_time VARCHAR(40) NOT NULL,
    subject VARCHAR(120) NOT NULL,
    location VARCHAR(120) NOT NULL,
    status ENUM('effectué', 'à venir', 'planifié') NOT NULL DEFAULT 'planifié',
    teacher_id VARCHAR(36) NOT NULL,
    teacher_name VARCHAR(191) NOT NULL,
    student_id VARCHAR(36) NOT NULL,
    student_name VARCHAR(191) NOT NULL,
    parent_id VARCHAR(36) NOT NULL,
    parent_name VARCHAR(191) NOT NULL,
    virtual_link VARCHAR(255) NULL,
    actual_start_time TIMESTAMP NULL,
    actual_end_time TIMESTAMP NULL,
    report_text TEXT NULL,
    understanding_score INT NULL,
    course_id CHAR(36) NULL,
    lesson_id CHAR(36) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_sessions_teacher (teacher_id),
    KEY idx_sessions_parent (parent_id),
    KEY idx_sessions_student (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Candidatures enseignants
CREATE TABLE IF NOT EXISTS teacher_applications (
    id CHAR(36) NOT NULL DEFAULT (UUID()),
    full_name VARCHAR(191) NOT NULL,
    email VARCHAR(191) NOT NULL,
    phone VARCHAR(40) NOT NULL,
    subjects JSON NOT NULL,
    levels JSON NULL,
    experience_years INT NOT NULL,
    availability VARCHAR(120) NOT NULL,
    motivation TEXT NOT NULL,
    cv_url VARCHAR(255) NULL,
    status ENUM('pending', 'interview_scheduled', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    reviewed_by VARCHAR(191) NULL,
    reviewer_role ENUM('admin', 'advisor', 'tutor') NULL,
    review_notes TEXT NULL,
    reviewed_at TIMESTAMP NULL,
    interview_date TIMESTAMP NULL,
    interview_notes TEXT NULL,
    interview_status ENUM('scheduled', 'done', 'cancelled') NULL,
    level_classification JSON NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_teacher_applications_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Evaluations enseignants
CREATE TABLE IF NOT EXISTS teacher_feedback (
    id CHAR(36) NOT NULL DEFAULT (UUID()),
    teacher_id VARCHAR(36) NOT NULL,
    teacher_name VARCHAR(191) NOT NULL,
    reviewer_name VARCHAR(191) NOT NULL,
    reviewer_type ENUM('parent', 'student', 'advisor') NOT NULL,
    rating TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT NULL,
    session_id VARCHAR(36) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_teacher_feedback_teacher (teacher_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Evaluations des élèves par les enseignants
CREATE TABLE IF NOT EXISTS student_evaluations (
    id CHAR(36) NOT NULL DEFAULT (UUID()),
    student_id VARCHAR(36) NOT NULL,
    teacher_id VARCHAR(36) NOT NULL,
    teacher_name VARCHAR(191) NOT NULL,
    rating TINYINT NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
    comment TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_student_eval_student (student_id),
    KEY idx_student_eval_teacher (teacher_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Donnees de synthese parent
CREATE TABLE IF NOT EXISTS parent_overviews (
    parent_id VARCHAR(36) NOT NULL,
    parent_name VARCHAR(191) NOT NULL,
    student_id VARCHAR(36) NOT NULL,
    child_name VARCHAR(191) NOT NULL,
    child_level VARCHAR(120) NOT NULL,
    focus_subject VARCHAR(120) NOT NULL,
    sessions_this_month INT NOT NULL,
    current_avg DECIMAL(5,2) NOT NULL,
    previous_avg DECIMAL(5,2) NOT NULL,
    total_paid_this_month INT NOT NULL,
    PRIMARY KEY (parent_id),
    KEY idx_parent_overviews_student (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS student_progress_points (
    id CHAR(36) NOT NULL DEFAULT (UUID()),
    student_id VARCHAR(36) NOT NULL,
    month_label VARCHAR(20) NOT NULL,
    month_order INT NOT NULL,
    maths DECIMAL(4,1) NOT NULL,
    francais DECIMAL(4,1) NOT NULL,
    anglais DECIMAL(4,1) NOT NULL,
    PRIMARY KEY (id),
    KEY idx_progress_student (student_id),
    KEY idx_progress_order (student_id, month_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS parent_invoices (
    id CHAR(36) NOT NULL DEFAULT (UUID()),
    parent_id VARCHAR(36) NOT NULL,
    invoice_date DATE NOT NULL,
    description VARCHAR(255) NOT NULL,
    amount INT NOT NULL,
    status ENUM('paid', 'pending') NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_invoices_parent (parent_id),
    KEY idx_invoices_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Gestion des cours
CREATE TABLE IF NOT EXISTS courses (
    id CHAR(36) NOT NULL DEFAULT (UUID()),
    title VARCHAR(191) NOT NULL,
    description TEXT NOT NULL,
    subject VARCHAR(120) NOT NULL,
    level VARCHAR(120) NOT NULL,
    mode ENUM('presentiel','online','hybride') NOT NULL DEFAULT 'presentiel',
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    duration VARCHAR(50) NULL,
    status ENUM('draft', 'published') NOT NULL DEFAULT 'draft',
    cover_url VARCHAR(255) NULL,
    created_by VARCHAR(36) NULL,
    teacher_id CHAR(36) NULL,
    teacher_name VARCHAR(191) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_courses_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS course_lessons (
    id CHAR(36) NOT NULL DEFAULT (UUID()),
    course_id CHAR(36) NOT NULL,
    title VARCHAR(191) NOT NULL,
    content TEXT NOT NULL,
    video_url VARCHAR(255) NULL,
    order_index INT NOT NULL DEFAULT 1,
    PRIMARY KEY (id),
    KEY idx_lessons_course (course_id),
    CONSTRAINT fk_lessons_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS course_enrollments (
    id CHAR(36) NOT NULL DEFAULT (UUID()),
    course_id CHAR(36) NOT NULL,
    student_id VARCHAR(36) NOT NULL,
    student_name VARCHAR(191) NOT NULL,
    assigned_by VARCHAR(36) NULL,
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_enrollments_course (course_id),
    KEY idx_enrollments_student (student_id),
    CONSTRAINT fk_enrollments_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS quizzes (
    id CHAR(36) NOT NULL DEFAULT (UUID()),
    course_id CHAR(36) NOT NULL,
    lesson_id CHAR(36) NULL,
    title VARCHAR(191) NOT NULL,
    instructions TEXT NULL,
    total_points INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_quizzes_course (course_id),
    KEY idx_quizzes_lesson (lesson_id),
    CONSTRAINT fk_quizzes_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    CONSTRAINT fk_quizzes_lesson FOREIGN KEY (lesson_id) REFERENCES course_lessons(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS quiz_questions (
    id CHAR(36) NOT NULL DEFAULT (UUID()),
    quiz_id CHAR(36) NOT NULL,
    prompt TEXT NOT NULL,
    choices JSON NOT NULL,
    correct_answer VARCHAR(120) NOT NULL,
    points INT NOT NULL DEFAULT 1,
    PRIMARY KEY (id),
    KEY idx_questions_quiz (quiz_id),
    CONSTRAINT fk_questions_quiz FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS quiz_attempts (
    id CHAR(36) NOT NULL DEFAULT (UUID()),
    quiz_id CHAR(36) NOT NULL,
    student_id VARCHAR(36) NOT NULL,
    student_name VARCHAR(191) NOT NULL,
    answers JSON NOT NULL,
    score INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_attempts_quiz (quiz_id),
    KEY idx_attempts_student (student_id),
    CONSTRAINT fk_attempts_quiz FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS platform_settings (
    id VARCHAR(64) NOT NULL,
    data JSON NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Contestation de notes
CREATE TABLE IF NOT EXISTS grade_disputes (
    id CHAR(36) NOT NULL DEFAULT (UUID()),
    student_id VARCHAR(191) NOT NULL,
    session_id CHAR(36) NOT NULL,
    reason TEXT NOT NULL,
    status ENUM('pending', 'resolved', 'rejected') NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_disputes_student (student_id),
    CONSTRAINT fk_disputes_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Devoirs
CREATE TABLE IF NOT EXISTS homework (
    id CHAR(36) NOT NULL DEFAULT (UUID()),
    teacher_id VARCHAR(255) NOT NULL,
    student_id VARCHAR(255) NOT NULL,
    session_id CHAR(36) NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    due_date DATE NOT NULL,
    subject VARCHAR(120) NOT NULL,
    status ENUM('à faire', 'rendu', 'corrigé') NOT NULL DEFAULT 'à faire',
    file_url VARCHAR(255) NULL,
    submission_url VARCHAR(255) NULL,
    feedback TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_homework_student (student_id),
    KEY idx_homework_teacher (teacher_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Ressources de cours
CREATE TABLE IF NOT EXISTS lesson_resources (
    id CHAR(36) NOT NULL DEFAULT (UUID()),
    teacher_id VARCHAR(255) NOT NULL,
    student_id VARCHAR(255) NULL,
    title VARCHAR(255) NOT NULL,
    file_url VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL DEFAULT 'link',
    subject VARCHAR(120) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_resources_student (student_id),
    KEY idx_resources_teacher (teacher_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Feedback parent sur une séance (distinct du teacher_feedback)
CREATE TABLE IF NOT EXISTS session_feedback (
    id CHAR(36) NOT NULL DEFAULT (UUID()),
    session_id CHAR(36) NOT NULL,
    parent_id VARCHAR(36) NOT NULL,
    parent_name VARCHAR(191) NOT NULL,
    student_id VARCHAR(36) NOT NULL,
    teacher_id VARCHAR(36) NOT NULL,
    rating TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_sfeedback_session (session_id),
    KEY idx_sfeedback_parent (parent_id),
    KEY idx_sfeedback_teacher (teacher_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Observations conseiller sur un élève
CREATE TABLE IF NOT EXISTS advisor_notes (
    id CHAR(36) NOT NULL DEFAULT (UUID()),
    student_id VARCHAR(36) NOT NULL,
    student_name VARCHAR(191) NOT NULL,
    advisor_id VARCHAR(36) NOT NULL,
    advisor_name VARCHAR(191) NOT NULL,
    note_type ENUM('observation','recommandation','alerte','positif') NOT NULL DEFAULT 'observation',
    content TEXT NOT NULL,
    is_visible_to_parent TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_anotes_student (student_id),
    KEY idx_anotes_advisor (advisor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Rapport d'évaluation tuteur sur un enseignant
CREATE TABLE IF NOT EXISTS tutor_evaluations (
    id CHAR(36) NOT NULL DEFAULT (UUID()),
    application_id CHAR(36) NULL,
    teacher_id VARCHAR(36) NULL,
    teacher_name VARCHAR(191) NOT NULL,
    tutor_id VARCHAR(36) NOT NULL,
    tutor_name VARCHAR(191) NOT NULL,
    pedagogical_score TINYINT NOT NULL DEFAULT 3 CHECK (pedagogical_score BETWEEN 1 AND 5),
    punctuality_score TINYINT NOT NULL DEFAULT 3 CHECK (punctuality_score BETWEEN 1 AND 5),
    communication_score TINYINT NOT NULL DEFAULT 3 CHECK (communication_score BETWEEN 1 AND 5),
    level_classification JSON NULL,
    overall_notes TEXT NULL,
    recommendation ENUM('approved','rejected','pending_training') NOT NULL DEFAULT 'pending_training',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_teval_application (application_id),
    KEY idx_teval_teacher (teacher_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Diagnostic initial (évaluation d'entrée élève)
CREATE TABLE IF NOT EXISTS academic_diagnostics (
    id CHAR(36) NOT NULL DEFAULT (UUID()),
    student_id VARCHAR(36) NOT NULL,
    student_name VARCHAR(191) NOT NULL,
    evaluator_id VARCHAR(36) NOT NULL,
    evaluator_name VARCHAR(191) NOT NULL,
    scores JSON NOT NULL,
    strengths TEXT NULL,
    weaknesses TEXT NULL,
    recommended_subjects JSON NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_diag_student (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Plan pédagogique personnalisé
CREATE TABLE IF NOT EXISTS academic_plans (
    id CHAR(36) NOT NULL DEFAULT (UUID()),
    student_id VARCHAR(36) NOT NULL,
    student_name VARCHAR(191) NOT NULL,
    created_by VARCHAR(36) NOT NULL,
    title VARCHAR(191) NOT NULL,
    weeks JSON NOT NULL,
    status ENUM('draft','active','completed') NOT NULL DEFAULT 'active',
    start_date DATE NOT NULL,
    end_date DATE NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_aplan_student (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id CHAR(36) NOT NULL DEFAULT (UUID()),
    user_id VARCHAR(191) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'info',
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    link VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_notif_user (user_id),
    KEY idx_notif_read (is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
