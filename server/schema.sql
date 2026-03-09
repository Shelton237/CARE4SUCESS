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
    experience_years INT NOT NULL,
    availability VARCHAR(120) NOT NULL,
    motivation TEXT NOT NULL,
    cv_url VARCHAR(255) NULL,
    status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    reviewed_by VARCHAR(191) NULL,
    reviewer_role ENUM('admin', 'advisor') NULL,
    review_notes TEXT NULL,
    reviewed_at TIMESTAMP NULL,
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
    parent_id VARCHAR(36) NOT NULL,
    month_label VARCHAR(20) NOT NULL,
    month_order INT NOT NULL,
    maths DECIMAL(4,1) NOT NULL,
    francais DECIMAL(4,1) NOT NULL,
    anglais DECIMAL(4,1) NOT NULL,
    PRIMARY KEY (id),
    KEY idx_progress_parent (parent_id),
    KEY idx_progress_order (parent_id, month_order)
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
    status ENUM('draft', 'published') NOT NULL DEFAULT 'draft',
    cover_url VARCHAR(255) NULL,
    created_by VARCHAR(36) NULL,
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
