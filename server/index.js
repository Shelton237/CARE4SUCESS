import path from "path";
import fs from "fs";
import crypto from "crypto";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";
import multer from "multer";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const rootDir = process.cwd();
const envFiles = [".env.local", ".env"];
envFiles.forEach((file) => {
  const full = path.resolve(rootDir, file);
  if (fs.existsSync(full)) {
    dotenv.config({ path: full, override: false });
  }
});

const PORT = Number(process.env.API_PORT ?? 4000);
const corsOrigin = process.env.CLIENT_ORIGIN?.split(",").map((o) => o.trim()).filter(Boolean) ?? true;

const pool = mysql.createPool({
  host: process.env.DB_HOST ?? "127.0.0.1",
  user: process.env.DB_USERNAME ?? "root",
  password: process.env.DB_PASSWORD ?? "",
  database: process.env.DB_DATABASE ?? "care4success",
  port: Number(process.env.DB_PORT ?? 3306),
  waitForConnections: true,
  connectionLimit: 10,
});

const JWT_SECRET = process.env.JWT_SECRET || "care4success_dev_secret";
console.log("DEBUG: JWT_SECRET start with:", JWT_SECRET[0]);
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "12h";
const allowedUserRoles = new Set(["admin", "teacher", "parent", "advisor", "student"]);

const generateToken = (payload) =>
  jwt.sign({ sub: payload.id, role: payload.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

const authenticateRequest = (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7).trim() : null;
    if (!token) {
      return res.status(401).json({ message: "Jeton d'authentification manquant." });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.warn("JWT verification failed:", error.message, "Token:", token?.substring(0, 10) + "...");
    return res.status(401).json({ message: "Authentification invalide." });
  }
};

const formatDate = (value) => {
  if (!value) return value;
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit" }).format(date);
  } catch {
    return value;
  }
};

const parseJson = (value, fallback) => {
  if (!value) return fallback;
  if (Array.isArray(value)) return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const REQUEST_STATUS_ALIASES = new Map([
  ["reçu", "reçu"],
  ["reçu", "reçu"],
  ["re├ºu", "reçu"],
  ["en traitement", "en traitement"],
  ["assign�", "assign�"],
  ["assigné", "assign�"],
  ["assign├®", "assign�"],
  ["cl�tur�", "cl�tur�"],
  ["clôturé", "cl�tur�"],
  ["cl├┤tur├®", "cl�tur�"],
]);

const normalizeRequestStatus = (value) => {
  if (!value) return "reçu";
  const key = typeof value === "string" ? value.trim() : String(value);
  return REQUEST_STATUS_ALIASES.get(key) || "reçu";
};

const DEFAULT_PLATFORM_SETTINGS = {
  hourlyRates: [
    { id: "math", label: "Mathématiques", baseRate: 10000, premiumRate: 15000 },
    { id: "physics", label: "Physique-Chimie", baseRate: 10000, premiumRate: 15000 },
    { id: "french", label: "Français / Philosophie", baseRate: 8000, premiumRate: 12000 },
    { id: "english", label: "Anglais", baseRate: 8000, premiumRate: 12000 },
    { id: "svt", label: "SVT / Sciences", baseRate: 8000, premiumRate: 12000 },
    { id: "it", label: "Informatique", baseRate: 12000, premiumRate: 18000 },
  ],
  centers: [
    {
      id: "ctr-dla",
      name: "Care4Success Douala Akwa",
      city: "Douala",
      address: "Rue Bonanjo, face Hôtel Ibis",
      active: true,
    },
    {
      id: "ctr-yde",
      name: "Care4Success Yaoundé Centre",
      city: "Yaoundé",
      address: "Av. Ahmadou Ahidjo, Bastos",
      active: true,
    },
    {
      id: "ctr-online",
      name: "Care4Success En ligne",
      city: "Tous",
      address: "Plateforme digitale",
      active: true,
    },
  ],
  notifications: [
    { key: "course_reminder", label: "Rappel de cours (SMS, 2h avant)", enabled: true },
    { key: "registration", label: "Confirmation d'inscription", enabled: true },
    { key: "invoice", label: "Facture générée automatiquement en fin de mois", enabled: true },
    { key: "lead", label: "Nouvelle demande de bilan reçue", enabled: true },
    { key: "weekly_report", label: "Rapport hebdomadaire admin", enabled: false },
  ],
  security: {
    sessionTimeout: "1h",
    passwordPolicy: "strong",
    enforce2FA: true,
  },
};

const allowedSessionTimeouts = new Set(["30m", "1h", "4h", "24h"]);
const allowedPasswordPolicies = new Set(["standard", "strong"]);

const normalizeArrayEntry = (value, fallback) => (value && typeof value === "object" ? value : fallback);

const normalizeMoney = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return 0;
  return Math.round(num);
};

const sanitizeHourlyRates = (value) => {
  const source = Array.isArray(value) ? value : [];
  if (!source.length) {
    return DEFAULT_PLATFORM_SETTINGS.hourlyRates;
  }
  return source.map((rate, index) => {
    const normalized = normalizeArrayEntry(rate, {});
    const id =
      typeof normalized.id === "string" && normalized.id.trim()
        ? normalized.id.trim()
        : `rate-${index + 1}`;
    const label =
      typeof normalized.label === "string" && normalized.label.trim()
        ? normalized.label.trim()
        : `Matière ${index + 1}`;
    return {
      id,
      label,
      baseRate: normalizeMoney(normalized.baseRate),
      premiumRate: normalizeMoney(normalized.premiumRate),
    };
  });
};

const sanitizeCenters = (value) => {
  const source = Array.isArray(value) ? value : [];
  if (!source.length) {
    return DEFAULT_PLATFORM_SETTINGS.centers;
  }
  return source.map((center, index) => {
    const normalized = normalizeArrayEntry(center, {});
    const id =
      typeof normalized.id === "string" && normalized.id.trim()
        ? normalized.id.trim()
        : `center-${index + 1}`;
    return {
      id,
      name: typeof normalized.name === "string" && normalized.name.trim() ? normalized.name.trim() : "Centre",
      city: typeof normalized.city === "string" && normalized.city.trim() ? normalized.city.trim() : "Douala",
      address:
        typeof normalized.address === "string" && normalized.address.trim()
          ? normalized.address.trim()
          : "Adresse à préciser",
      active: Boolean(normalized.active),
    };
  });
};

const sanitizeNotifications = (value) => {
  const source = Array.isArray(value) ? value : [];
  if (!source.length) {
    return DEFAULT_PLATFORM_SETTINGS.notifications;
  }
  return source.map((notif, index) => {
    const normalized = normalizeArrayEntry(notif, {});
    const key =
      typeof normalized.key === "string" && normalized.key.trim()
        ? normalized.key.trim()
        : `notification-${index + 1}`;
    return {
      key,
      label:
        typeof normalized.label === "string" && normalized.label.trim()
          ? normalized.label.trim()
          : "Notification",
      enabled: Boolean(normalized.enabled),
    };
  });
};

const sanitizeSecurity = (value) => {
  const normalized = value && typeof value === "object" ? value : {};
  const timeout = typeof normalized.sessionTimeout === "string" ? normalized.sessionTimeout : "";
  const passwordPolicy = typeof normalized.passwordPolicy === "string" ? normalized.passwordPolicy : "";
  return {
    sessionTimeout: allowedSessionTimeouts.has(timeout) ? timeout : DEFAULT_PLATFORM_SETTINGS.security.sessionTimeout,
    passwordPolicy: allowedPasswordPolicies.has(passwordPolicy)
      ? passwordPolicy
      : DEFAULT_PLATFORM_SETTINGS.security.passwordPolicy,
    enforce2FA:
      typeof normalized.enforce2FA === "boolean"
        ? normalized.enforce2FA
        : DEFAULT_PLATFORM_SETTINGS.security.enforce2FA,
  };
};

const sanitizePlatformSettings = (value) => {
  const source = value && typeof value === "object" ? value : {};
  return {
    hourlyRates: sanitizeHourlyRates(source.hourlyRates),
    centers: sanitizeCenters(source.centers),
    notifications: sanitizeNotifications(source.notifications),
    security: sanitizeSecurity(source.security),
  };
};

const ensurePlatformSettingsTable = async () => {
  await pool.query(
    `CREATE TABLE IF NOT EXISTS platform_settings (
      id VARCHAR(64) NOT NULL,
      data JSON NOT NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
  );
};

const ensureTeachersTable = async () => {
  await pool.query(
    `CREATE TABLE IF NOT EXISTS teachers (
      id CHAR(36) NOT NULL DEFAULT (UUID()),
      name VARCHAR(191) NOT NULL,
      email VARCHAR(191) NOT NULL,
      subjects JSON NOT NULL,
      level VARCHAR(120) NOT NULL,
      city VARCHAR(120) NOT NULL,
      status ENUM('actif', 'inactif', 'suspendu') NOT NULL DEFAULT 'actif',
      rating DECIMAL(3,1) NOT NULL DEFAULT 5.0,
      students INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
  );
};

const ensureSessionsTable = async () => {
  await pool.query(
    `CREATE TABLE IF NOT EXISTS sessions (
      id CHAR(36) NOT NULL DEFAULT (UUID()),
      session_day VARCHAR(20) NOT NULL,
      session_date DATE NOT NULL,
      session_time VARCHAR(40) NOT NULL,
      subject VARCHAR(120) NOT NULL,
      location VARCHAR(120) NOT NULL,
      status ENUM('effectué�', 'à venir', 'planifié') NOT NULL DEFAULT 'planifié',
      teacher_id VARCHAR(36) NOT NULL,
      teacher_name VARCHAR(191) NOT NULL,
      student_id VARCHAR(36) NOT NULL,
      student_name VARCHAR(191) NOT NULL,
      parent_id VARCHAR(36) NOT NULL,
      parent_name VARCHAR(191) NOT NULL,
      virtual_link VARCHAR(255) DEFAULT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_sessions_teacher (teacher_id),
      KEY idx_sessions_parent (parent_id),
      KEY idx_sessions_student (student_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
  );
  // Migration for existing tables
  try {
    const [colsV] = await pool.query("SHOW COLUMNS FROM sessions LIKE 'virtual_link'");
    if (colsV.length === 0) {
      await pool.query("ALTER TABLE sessions ADD COLUMN virtual_link VARCHAR(255) NULL AFTER parent_name");
      console.log("Migration: Added virtual_link to sessions table");
    }
    const [colsN] = await pool.query("SHOW COLUMNS FROM sessions LIKE 'notes'");
    if (colsN.length === 0) {
      await pool.query("ALTER TABLE sessions ADD COLUMN notes TEXT NULL AFTER virtual_link");
      console.log("Migration: Added notes to sessions table");
    }
    const [colsW] = await pool.query("SHOW COLUMNS FROM sessions LIKE 'whiteboard_data'");
    if (colsW.length === 0) {
      await pool.query("ALTER TABLE sessions ADD COLUMN whiteboard_data LONGTEXT NULL AFTER notes");
      console.log("Migration: Added whiteboard_data to sessions table");
    }
    const [colsC] = await pool.query("SHOW COLUMNS FROM sessions LIKE 'code_data'");
    if (colsC.length === 0) {
      await pool.query("ALTER TABLE sessions ADD COLUMN code_data TEXT NULL AFTER whiteboard_data");
      console.log("Migration: Added code_data to sessions table");
    }
    const [colsAST] = await pool.query("SHOW COLUMNS FROM sessions LIKE 'actual_start_time'");
    if (colsAST.length === 0) {
      await pool.query("ALTER TABLE sessions ADD COLUMN actual_start_time TIMESTAMP NULL AFTER virtual_link");
      console.log("Migration: Added actual_start_time to sessions table");
    }
    const [colsAET] = await pool.query("SHOW COLUMNS FROM sessions LIKE 'actual_end_time'");
    if (colsAET.length === 0) {
      await pool.query("ALTER TABLE sessions ADD COLUMN actual_end_time TIMESTAMP NULL AFTER actual_start_time");
      console.log("Migration: Added actual_end_time to sessions table");
    }
    const [colsRT] = await pool.query("SHOW COLUMNS FROM sessions LIKE 'report_text'");
    if (colsRT.length === 0) {
      await pool.query("ALTER TABLE sessions ADD COLUMN report_text TEXT NULL AFTER actual_end_time");
      console.log("Migration: Added report_text to sessions table");
    }
    const [colsUS] = await pool.query("SHOW COLUMNS FROM sessions LIKE 'understanding_score'");
    if (colsUS.length === 0) {
      await pool.query("ALTER TABLE sessions ADD COLUMN understanding_score INT DEFAULT NULL AFTER report_text");
      console.log("Migration: Added understanding_score to sessions table");
    }
    const [colsIP] = await pool.query("SHOW COLUMNS FROM sessions LIKE 'is_paid'");
    if (colsIP.length === 0) {
      await pool.query("ALTER TABLE sessions ADD COLUMN is_paid BOOLEAN NOT NULL DEFAULT FALSE AFTER understanding_score");
      console.log("Migration: Added is_paid to sessions table");
    }
    const [colsLid] = await pool.query("SHOW COLUMNS FROM sessions LIKE 'lesson_id'");
    if (colsLid.length === 0) {
      await pool.query("ALTER TABLE sessions ADD COLUMN lesson_id VARCHAR(36) DEFAULT NULL AFTER is_paid");
      console.log("Migration: Added lesson_id to sessions table");
    }
    const [colsCid] = await pool.query("SHOW COLUMNS FROM sessions LIKE 'course_id'");
    if (colsCid.length === 0) {
      await pool.query("ALTER TABLE sessions ADD COLUMN course_id VARCHAR(36) DEFAULT NULL AFTER lesson_id");
      console.log("Migration: Added course_id to sessions table");
    }
    // Fix ENUM status
    try {
      await pool.query("ALTER TABLE sessions MODIFY COLUMN status ENUM('planifié', 'à venir', 'en cours', 'effectué', 'annulé', 'effectué') NOT NULL DEFAULT 'planifié'");
      console.log("Migration: Modified status ENUM in sessions table");
    } catch (e) {
      console.error("Migration: Failed to modify status ENUM", e.message);
    }
  } catch (err) {
    console.error("Migration failed for sessions table", err.message);
  }
};

const ensureMessagesTable = async () => {
  await pool.query(
    `CREATE TABLE IF NOT EXISTS messages (
      id CHAR(36) NOT NULL DEFAULT (UUID()),
      sender_id VARCHAR(191) NOT NULL,
      sender_name VARCHAR(191) NOT NULL,
      sender_role VARCHAR(50) NOT NULL,
      receiver_id VARCHAR(191) NOT NULL,
      receiver_name VARCHAR(191) NOT NULL,
      receiver_role VARCHAR(50) NOT NULL,
      content TEXT NOT NULL,
      attachment_url VARCHAR(255) DEFAULT NULL,
      is_read BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
  );
};

const ensureAdvisorAppointmentsTable = async () => {
  await pool.query(
    `CREATE TABLE IF NOT EXISTS advisor_appointments (
      id CHAR(36) NOT NULL DEFAULT (UUID()),
      advisor_id VARCHAR(36) NOT NULL,
      contact_name VARCHAR(191) NOT NULL,
      appointment_type VARCHAR(100) NOT NULL,
      appointment_date DATE NOT NULL,
      appointment_time VARCHAR(20) NOT NULL,
      status ENUM('planifié', 'réalisé', 'annulé') NOT NULL DEFAULT 'planifié',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_advisor_appt_advisor (advisor_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
  );
};

const ensureTeacherApplicationsTable = async () => {
  await pool.query(
    `CREATE TABLE IF NOT EXISTS teacher_applications (
      id CHAR(36) NOT NULL,
      full_name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(50) NOT NULL,
      subjects JSON NOT NULL,
      experience_years INT NOT NULL,
      availability TEXT NOT NULL,
      motivation TEXT NOT NULL,
      cv_url TEXT,
      status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
      reviewed_by VARCHAR(255),
      reviewer_role ENUM('admin', 'advisor'),
      review_notes TEXT,
      reviewed_at TIMESTAMP NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
  );
};

const ensureCoursesTable = async () => {
  await pool.query(
    `CREATE TABLE IF NOT EXISTS courses (
      id CHAR(36) NOT NULL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      subject VARCHAR(120) NOT NULL,
      level VARCHAR(120) NOT NULL,
      status ENUM('draft', 'published') NOT NULL DEFAULT 'draft',
      cover_url VARCHAR(255) NULL,
      created_by VARCHAR(36) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
  );
};

const ensureCourseLessonsTable = async () => {
  await pool.query(
    `CREATE TABLE IF NOT EXISTS course_lessons (
      id CHAR(36) NOT NULL PRIMARY KEY,
      course_id CHAR(36) NOT NULL,
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      video_url VARCHAR(255) NULL,
      order_index INT NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_lessons_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
  );
};

const ensureCourseEnrollmentsTable = async () => {
  await pool.query(
    `CREATE TABLE IF NOT EXISTS course_enrollments (
      id CHAR(36) NOT NULL PRIMARY KEY,
      course_id CHAR(36) NOT NULL,
      student_id VARCHAR(36) NOT NULL,
      student_name VARCHAR(191) NOT NULL,
      assigned_by VARCHAR(36) NULL,
      assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_enrollments_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
  );
};

const ensureQuizzesTable = async () => {
  await pool.query(
    `CREATE TABLE IF NOT EXISTS quizzes (
      id CHAR(36) NOT NULL PRIMARY KEY,
      course_id CHAR(36) NOT NULL,
      lesson_id CHAR(36) NULL,
      title VARCHAR(255) NOT NULL,
      instructions TEXT NULL,
      total_points INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_quizzes_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
  );
};

const ensureQuizQuestionsTable = async () => {
  await pool.query(
    `CREATE TABLE IF NOT EXISTS quiz_questions (
      id CHAR(36) NOT NULL PRIMARY KEY,
      quiz_id CHAR(36) NOT NULL,
      prompt TEXT NOT NULL,
      choices JSON NOT NULL,
      correct_answer VARCHAR(120) NOT NULL,
      points INT NOT NULL DEFAULT 1,
      CONSTRAINT fk_questions_quiz FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
  );
};

const ensureQuizAttemptsTable = async () => {
  await pool.query(
    `CREATE TABLE IF NOT EXISTS quiz_attempts (
      id CHAR(36) NOT NULL PRIMARY KEY,
      quiz_id VARCHAR(36) NOT NULL,
      student_id VARCHAR(36) NOT NULL,
      student_name VARCHAR(191) NOT NULL,
      answers JSON NOT NULL,
      score DECIMAL(5,2) NOT NULL,
      total_points INT DEFAULT 20,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
  );
};

const ensureTeacherFeedbackTable = async () => {
  await pool.query(
    `CREATE TABLE IF NOT EXISTS teacher_feedback (
      id CHAR(36) NOT NULL PRIMARY KEY,
      teacher_id VARCHAR(36) NOT NULL,
      teacher_name VARCHAR(191) DEFAULT NULL,
      student_id VARCHAR(36) NOT NULL,
      student_name VARCHAR(191) NOT NULL,
      rating INT NOT NULL DEFAULT 5,
      comment TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
  );
  // Migration
  try {
    const [cols] = await pool.query("SHOW COLUMNS FROM teacher_feedback LIKE 'teacher_name'");
    if (cols.length === 0) {
      await pool.query("ALTER TABLE teacher_feedback ADD COLUMN teacher_name VARCHAR(191) DEFAULT NULL AFTER teacher_id");
      console.log("Migration: Added teacher_name to teacher_feedback");
    }
    const [colsSid] = await pool.query("SHOW COLUMNS FROM teacher_feedback LIKE 'session_id'");
    if (colsSid.length === 0) {
      await pool.query("ALTER TABLE teacher_feedback ADD COLUMN session_id VARCHAR(36) DEFAULT NULL AFTER student_name");
      console.log("Migration: Added session_id to teacher_feedback");
    }
  } catch (err) {
    console.warn("Migration skip for teacher_feedback", err.message);
  }
};

const ensureCourseBookmarksTable = async () => {
  await pool.query(
    `CREATE TABLE IF NOT EXISTS course_bookmarks (
      user_id VARCHAR(255) NOT NULL,
      course_id VARCHAR(255) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, course_id),
      KEY idx_bookmarks_user (user_id),
      KEY idx_bookmarks_course (course_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
  );
};

const ensureUserCourseProgressTable = async () => {
  await pool.query(
    `CREATE TABLE IF NOT EXISTS user_course_progress (
      user_id VARCHAR(255) NOT NULL,
      course_id CHAR(36) NOT NULL,
      last_lesson_id CHAR(36) NULL,
      completed_lessons JSON NOT NULL,
      last_accessed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, course_id),
      KEY idx_progress_user (user_id),
      KEY idx_progress_last_access (last_accessed_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
  );
};

const ensureTeacherRatingsTable = async () => {
  await pool.query(
    `CREATE TABLE IF NOT EXISTS teacher_ratings (
      id CHAR(36) NOT NULL PRIMARY KEY,
      teacher_id VARCHAR(36) NOT NULL,
      student_id VARCHAR(36),
      rating INT NOT NULL,
      comment TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
  );
};

const ensureRequestsTable = async () => {
  await pool.query(
    `CREATE TABLE IF NOT EXISTS requests (
      id CHAR(36) NOT NULL PRIMARY KEY,
      parent_name VARCHAR(191) NOT NULL,
      child_name VARCHAR(191) NOT NULL,
      level VARCHAR(120) NOT NULL,
      subject VARCHAR(120) NOT NULL,
      phone VARCHAR(50),
      status ENUM('reçu', 'en traitement', 'assign�', 'cl�tur�') NOT NULL DEFAULT 'reçu',
      request_date DATE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
  );
};

const ensureAssignmentsTable = async () => {
  await pool.query(
    `CREATE TABLE IF NOT EXISTS assignments (
      id CHAR(36) NOT NULL PRIMARY KEY,
      child_name VARCHAR(191) NOT NULL,
      level VARCHAR(120) NOT NULL,
      subject VARCHAR(120) NOT NULL,
      needs JSON DEFAULT NULL,
      schedule VARCHAR(255) DEFAULT NULL,
      candidates JSON DEFAULT NULL,
      selected_teacher VARCHAR(191) DEFAULT NULL,
      status ENUM('pending', 'confirmed', 'cancelled') NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
  );
};

const initDB = async () => {
  console.log("Initializing database...");
  try {
    await ensurePlatformSettingsTable();
    await ensureUsersTable();
    await ensureTeachersTable();
    await ensureTeacherApplicationsTable();
    await ensureSessionsTable();
    await ensureMessagesTable();
    await ensureAdvisorAppointmentsTable();
    await ensureHomeworkTable();
    await ensureLessonResourcesTable();
    await ensureCoursesTable();
    await ensureCourseLessonsTable();
    await ensureCourseEnrollmentsTable();
    await ensureQuizzesTable();
    await ensureQuizQuestionsTable();
    await ensureQuizAttemptsTable();
    await ensureTeacherFeedbackTable();
    await ensureTeacherRatingsTable();
    await ensureRequestsTable();
    await ensureParentInvoicesTable();
    await ensureAssignmentsTable();
    await ensureParentChildTable();
    await ensureStudentTeacherTable();
    await ensureParentOverviewTable();
    await ensureStudentProgressPointsTable();
    await ensureGradeDisputesTable();
    await ensureNotificationsTable();
    await ensureCourseBookmarksTable();
    await ensureUserCourseProgressTable();
    console.log("Database initialized successfully.");
  } catch (error) {
    console.error("Database initialization failed:", error);
    process.exit(1);
  }
};

const ensureStudentEvaluationsTable = async () => {
  await pool.query(
    `CREATE TABLE IF NOT EXISTS student_evaluations (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
  );
};

const ensureHomeworkTable = async () => {
  await pool.query(
    `CREATE TABLE IF NOT EXISTS homework (
      id CHAR(36) NOT NULL DEFAULT (UUID()),
      teacher_id VARCHAR(36) NOT NULL,
      student_id VARCHAR(36) NOT NULL,
      session_id VARCHAR(36) DEFAULT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      due_date DATE NOT NULL,
      subject VARCHAR(120) NOT NULL,
      status ENUM('à faire', 'rendu', 'corrigé') NOT NULL DEFAULT 'à faire',
      file_url VARCHAR(255) DEFAULT NULL,
      submission_url VARCHAR(255) DEFAULT NULL,
      feedback TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_homework_teacher (teacher_id),
      KEY idx_homework_student (student_id),
      KEY idx_homework_session (session_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
  );
};

const ensureLessonResourcesTable = async () => {
  await pool.query(
    `CREATE TABLE IF NOT EXISTS lesson_resources (
      id CHAR(36) NOT NULL DEFAULT (UUID()),
      teacher_id VARCHAR(36) NOT NULL,
      student_id VARCHAR(36) DEFAULT NULL,
      title VARCHAR(255) NOT NULL,
      file_url VARCHAR(255) NOT NULL,
      file_type VARCHAR(50) DEFAULT 'link',
      subject VARCHAR(120) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_res_teacher (teacher_id),
      KEY idx_res_student (student_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
  );
};

const getPlatformSettings = async () => {
  await ensurePlatformSettingsTable();
  const [rows] = await pool.query("SELECT data FROM platform_settings WHERE id = 'platform' LIMIT 1");
  if (!rows.length) {
    await pool.query(
      `INSERT INTO platform_settings (id, data)
       VALUES ('platform', ?)
       ON DUPLICATE KEY UPDATE data = VALUES(data), updated_at = CURRENT_TIMESTAMP`,
      [JSON.stringify(DEFAULT_PLATFORM_SETTINGS)]
    );
    return DEFAULT_PLATFORM_SETTINGS;
  }
  const raw = rows[0].data;
  let parsed = raw;
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = DEFAULT_PLATFORM_SETTINGS;
    }
  }
  return sanitizePlatformSettings(parsed);
};

const savePlatformSettings = async (payload) => {
  await ensurePlatformSettingsTable();
  const sanitized = sanitizePlatformSettings(payload);
  await pool.query(
    `INSERT INTO platform_settings (id, data)
     VALUES ('platform', ?)
     ON DUPLICATE KEY UPDATE data = VALUES(data), updated_at = CURRENT_TIMESTAMP`,
    [JSON.stringify(sanitized)]
  );
  return sanitized;
};

const mapRequestRow = (row) => ({
  id: row.id,
  parent: row.parent_name,
  child: row.child_name,
  level: row.level,
  subject: row.subject,
  phone: row.phone,
  status: normalizeRequestStatus(row.status),
  date: formatDate(row.request_date),
});

const fixEncoding = (str) => {
  if (!str || typeof str !== "string") return str;
  // Dictionnaire de correspondances pour les erreurs d'encodage courantes (UTF-8 lu en Latin-1)
  const replacements = {
    'Ã©': 'é', 'Ã ': 'à', 'Ã¨': 'è', 'Ã¹': 'ù', 'Ã¢': 'â',
    'Ãª': 'ê', 'Ã®': 'î', 'Ã´': 'ô', 'Ã»': 'û', 'Ã«': 'ë',
    'Ã¯': 'ï', 'Ã¼': 'ü', 'Ã§': 'ç', 'Ã‰': 'É', 'Ã€': 'À',
    'Â°': '°', 'Â': ''
  };

  let fixed = str;
  for (const [bad, good] of Object.entries(replacements)) {
    fixed = fixed.split(bad).join(good);
  }

  try {
    // Si c'est encore encodé en escape sequence
    if (fixed.includes('%')) return decodeURIComponent(fixed);
  } catch {
    // ignore
  }

  return fixed;
};

const fixJsonEncoding = (value) => {
  if (Array.isArray(value)) return value.map((item) =>
    typeof item === "string" ? fixEncoding(item)
      : typeof item === "object" && item !== null
        ? Object.fromEntries(Object.entries(item).map(([k, v]) => [k, typeof v === "string" ? fixEncoding(v) : v]))
        : item
  );
  return value;
};

const mapAssignmentRow = (row) => ({
  id: row.id,
  child: fixEncoding(row.child_name),
  level: fixEncoding(row.level),
  subject: fixEncoding(row.subject),
  needs: fixJsonEncoding(parseJson(row.needs, [])),
  schedule: fixEncoding(row.schedule),
  candidates: fixJsonEncoding(parseJson(row.candidates, [])),
  selectedTeacher: fixEncoding(row.selected_teacher),
  status: row.status,
});


const mapSessionRow = (row) => ({
  id: row.id,
  day: row.session_day,
  date: formatDate(row.session_date),
  time: row.session_time,
  subject: row.subject,
  location: row.location,
  status: row.status,
  teacher: row.teacher_name,
  teacherId: row.teacher_id,
  student: row.student_name,
  studentId: row.student_id,
  parent: row.parent_name,
  parentId: row.parent_id,
  virtualLink: row.virtual_link,
  notes: row.notes,
  whiteboardData: row.whiteboard_data,
  codeData: row.code_data,
  actualStartTime: row.actual_start_time,
  actualEndTime: row.actual_end_time,
  reportText: row.report_text,
  understandingScore: row.understanding_score,
  isPaid: Boolean(row.is_paid),
  lessonId: row.lesson_id,
  courseId: row.course_id,
});

const mapTeacherApplicationRow = (row) => ({
  id: row.id,
  fullName: row.full_name,
  email: row.email,
  phone: row.phone,
  subjects: parseJson(row.subjects, []),
  experienceYears: row.experience_years,
  availability: row.availability,
  motivation: row.motivation,
  cvUrl: row.cv_url,
  status: row.status,
  reviewedBy: row.reviewed_by,
  reviewerRole: row.reviewer_role,
  reviewNotes: row.review_notes,
  reviewedAt: row.reviewed_at,
  createdAt: row.created_at,
});

const mapTeacherRow = (row) => ({
  id: row.id,
  name: row.name,
  email: row.email,
  subjects: parseJson(row.subjects, []),
  level: row.level,
  city: row.city,
  status: row.status,
  rating: Number(row.rating),
  students: row.students,
});

const mapHomeworkRow = (row) => ({
  id: row.id,
  teacherId: row.teacher_id,
  studentId: row.student_id,
  sessionId: row.session_id,
  title: row.title,
  description: row.description,
  dueDate: formatDate(row.due_date),
  subject: row.subject,
  status: row.status,
  fileUrl: row.file_url,
  submissionUrl: row.submission_url,
  feedback: row.feedback,
  teacherName: row.teacher_name,
  studentName: row.student_name,
  createdAt: row.created_at,
});

const mapLessonResourceRow = (row) => ({
  id: row.id,
  teacherId: row.teacher_id,
  studentId: row.student_id,
  title: row.title,
  fileUrl: row.file_url,
  fileType: row.file_type,
  subject: row.subject,
  teacherName: row.teacher_name,
  createdAt: row.created_at,
});

const mapTeacherFeedbackRow = (row) => ({
  id: row.id,
  teacherId: row.teacher_id,
  teacherName: row.teacher_name,
  reviewerName: row.reviewer_name,
  reviewerType: row.reviewer_type,
  rating: row.rating,
  comment: row.comment,
  sessionId: row.session_id,
  createdAt: row.created_at,
});

const mapTeacherRatingRow = (row) => ({
  teacherId: row.teacher_id,
  teacherName: row.teacher_name,
  averageRating: Number(row.average_rating),
  reviewCount: Number(row.review_count),
  lastReviewAt: row.last_review_at,
});

const mapParentOverviewRow = (row) => ({
  parentId: row.parent_id,
  parentName: row.parent_name,
  studentId: row.student_id,
  childName: row.child_name,
  childLevel: row.child_level,
  focusSubject: row.focus_subject,
  sessionsThisMonth: row.sessions_this_month,
  currentAvg: Number(row.current_avg),
  previousAvg: Number(row.previous_avg),
  totalPaidThisMonth: row.total_paid_this_month,
});

const mapCourseRow = (row) => ({
  id: row.id,
  title: fixEncoding(row.title),
  description: fixEncoding(row.description),
  subject: fixEncoding(row.subject),
  level: fixEncoding(row.level),
  status: row.status,
  coverUrl: row.cover_url,
  createdBy: row.created_by,
  createdAt: row.created_at,
  lessons: [],
});

const mapLessonRow = (row) => ({
  id: row.id,
  course_id: row.course_id,
  title: fixEncoding(row.title),
  content: fixEncoding(row.content),
  videoUrl: row.video_url,
  order: row.order_index,
  quiz: null,
});

const mapMessageRow = (row) => ({
  id: row.id,
  senderId: row.sender_id,
  senderName: row.sender_name,
  senderRole: row.sender_role,
  receiverId: row.receiver_id,
  receiverName: row.receiver_name,
  receiverRole: row.receiver_role,
  content: row.content,
  attachmentUrl: row.attachment_url,
  isRead: Boolean(row.is_read),
  createdAt: row.created_at,
});

const mapQuizSummaryRow = (row) => ({
  id: row.id,
  courseId: row.course_id,
  lessonId: row.lesson_id,
  title: row.title,
  instructions: row.instructions,
  totalPoints: row.total_points,
  questionCount: row.question_count ? Number(row.question_count) : undefined,
});

const mapQuizQuestionRow = (row, includeCorrect = false) => {
  const base = {
    id: row.id,
    quizId: row.quiz_id,
    prompt: row.prompt,
    choices: parseJson(row.choices, []),
    points: row.points,
  };
  return includeCorrect ? { ...base, correctAnswer: row.correct_answer } : base;
};

const mapQuizAttemptRow = (row) => ({
  id: row.id,
  quizId: row.quiz_id,
  studentId: row.student_id,
  studentName: row.student_name,
  answers: parseJson(row.answers, []),
  score: row.score,
  createdAt: row.created_at,
});

const buildCoursesPayload = async (courseRows, studentId = null) => {
  if (!courseRows.length) return [];
  const courseIds = courseRows.map((row) => row.id);
  const [lessonRows] = await pool.query(
    `SELECT id, course_id, title, content, video_url, order_index
     FROM course_lessons
     WHERE course_id IN (?)
     ORDER BY order_index ASC`,
    [courseIds]
  );
  const [quizRows] = await pool.query(
    `SELECT q.id, q.course_id, q.lesson_id, q.title, q.instructions, q.total_points, COUNT(qq.id) AS question_count
     FROM quizzes q
     LEFT JOIN quiz_questions qq ON qq.quiz_id = q.id
     WHERE q.course_id IN (?)
     GROUP BY q.id`,
    [courseIds]
  );

  let progressMap = new Map();
  if (studentId) {
    const [progRows] = await pool.query(
      "SELECT course_id, last_lesson_id, completed_lessons FROM user_course_progress WHERE user_id = ?",
      [studentId]
    );
    progRows.forEach(row => {
      progressMap.set(row.course_id, {
        lastLessonId: row.last_lesson_id,
        completedLessons: parseJson(row.completed_lessons, [])
      });
    });
  }

  const courseMap = new Map(courseRows.map((row) => {
    const prog = progressMap.get(row.id) || { lastLessonId: null, completedLessons: [] };
    return [row.id, {
      ...mapCourseRow(row),
      lessons: [],
      progress: 0, // Will calculate after lessons are added
      lastLessonId: prog.lastLessonId,
      completedLessons: prog.completedLessons
    }];
  }));

  lessonRows.forEach((lesson) => {
    const parent = courseMap.get(lesson.course_id);
    if (!parent) return;
    parent.lessons.push(mapLessonRow(lesson));
  });

  // Calculate progress
  courseMap.forEach(course => {
    if (course.lessons.length > 0) {
      const completed = course.completedLessons.length;
      course.progress = Math.min(100, Math.floor((completed / course.lessons.length) * 100));
    }
  });

  quizRows.forEach((quiz) => {
    const summary = mapQuizSummaryRow(quiz);
    if (summary.lessonId) {
      const course = courseMap.get(summary.courseId);
      if (!course) return;
      const lesson = course.lessons.find((l) => l.id === summary.lessonId);
      if (lesson) {
        lesson.quiz = summary;
      }
    }
  });

  return Array.from(courseMap.values());
};

const fetchCourseDetails = async (courseId, includeQuestions = false) => {
  const [courseRows] = await pool.query(
    `SELECT id, title, description, subject, level, status, cover_url, created_by, created_at
     FROM courses
     WHERE id = ?`,
    [courseId]
  );
  if (!courseRows.length) return null;
  const courses = await buildCoursesPayload(courseRows);
  const course = courses[0];
  if (includeQuestions) {
    const lessonIds = course.lessons.map((lesson) => lesson.id);
    if (lessonIds.length) {
      const [quizRows] = await pool.query(
        `SELECT id, course_id, lesson_id
         FROM quizzes
         WHERE course_id = ?`,
        [courseId]
      );
      const quizIds = quizRows.map((row) => row.id);
      if (quizIds.length) {
        const [questionRows] = await pool.query(
          `SELECT id, quiz_id, prompt, choices, correct_answer, points
           FROM quiz_questions
           WHERE quiz_id IN (?)`,
          [quizIds]
        );
        course.lessons.forEach((lesson) => {
          if (!lesson.quiz) return;
          lesson.quiz.questions = questionRows
            .filter((row) => row.quiz_id === lesson.quiz.id)
            .map((row) => mapQuizQuestionRow(row, true));
        });
      }
    }
  }
  return course;
};

const mapParentInvoiceRow = (row) => ({
  id: row.id,
  parentId: row.parent_id,
  date: row.invoice_date,
  description: row.description,
  amount: row.amount,
  status: row.status,
});

const mapParentProgressRow = (row) => ({
  month: row.month_label,
  maths: Number(row.maths),
  francais: Number(row.francais),
  anglais: Number(row.anglais),
});

const USER_PUBLIC_COLUMNS = `id, name, email, role, avatar, avatar_url, phone, location, timezone, language, bio,
  notify_email, notify_sms, notify_whatsapp, parent_id, last_login_at, created_at, updated_at`;

const mapUserRow = (row) => ({
  id: row.id,
  name: fixEncoding(row.name),
  email: row.email,
  role: row.role,
  avatar: row.avatar,
  phone: row.phone,
  location: row.location ? fixEncoding(row.location) : row.location,
  timezone: row.timezone,
  language: row.language,
  bio: row.bio ? fixEncoding(row.bio) : row.bio,
  notifyEmail: Boolean(row.notify_email),
  notifySms: Boolean(row.notify_sms),
  notifyWhatsapp: Boolean(row.notify_whatsapp),
  parentId: row.parent_id,
  avatarUrl: row.avatar_url || null,
  lastLoginAt: row.last_login_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  // Teacher specific fields
  bankName: row.bank_name || null,
  bankIban: row.bank_iban || null,
  bankAccountHolder: row.bank_account_holder || null,
  availability: parseJson(row.availability_json, []),
});

const ensureParentChildTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS parent_child (
      parent_id VARCHAR(255) NOT NULL,
      child_id VARCHAR(255) NOT NULL,
      PRIMARY KEY (parent_id, child_id),
      KEY idx_pc_child (child_id),
      CONSTRAINT fk_pc_parent FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT fk_pc_child FOREIGN KEY (child_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
};

const ensureParentInvoicesTable = async () => {
  await pool.query(`
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
};

const ensureParentOverviewTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS parent_overviews (
      parent_id VARCHAR(36) NOT NULL,
      parent_name VARCHAR(191) NOT NULL,
      student_id VARCHAR(36) NOT NULL,
      child_name VARCHAR(191) NOT NULL,
      child_level VARCHAR(120) NOT NULL,
      focus_subject VARCHAR(120) NOT NULL,
      sessions_this_month INT NOT NULL DEFAULT 0,
      current_avg DECIMAL(5,2) NOT NULL DEFAULT 0,
      previous_avg DECIMAL(5,2) NOT NULL DEFAULT 0,
      total_paid_this_month INT NOT NULL DEFAULT 0,
      PRIMARY KEY (parent_id),
      KEY idx_parent_overviews_student (student_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
};

const ensureStudentProgressPointsTable = async () => {
  await pool.query(
    `CREATE TABLE IF NOT EXISTS student_progress_points (
      id CHAR(36) NOT NULL PRIMARY KEY,
      student_id VARCHAR(36) NOT NULL,
      month_label VARCHAR(20) NOT NULL,
      month_order INT NOT NULL,
      maths DECIMAL(4,1) NOT NULL,
      francais DECIMAL(4,1) NOT NULL,
      anglais DECIMAL(4,1) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      KEY idx_progress_student (student_id),
      KEY idx_progress_order (student_id, month_order)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
  );
};

const ensureGradeDisputesTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS grade_disputes (
      id CHAR(36) NOT NULL DEFAULT (UUID()),
      student_id VARCHAR(36) NOT NULL,
      session_id VARCHAR(36) NOT NULL,
      reason TEXT NOT NULL,
      status ENUM('pending', 'resolved', 'rejected') NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_disputes_student (student_id),
      KEY idx_disputes_session (session_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
};

const ensureStudentTeacherTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS student_teacher (
      student_id VARCHAR(255) NOT NULL,
      teacher_id VARCHAR(255) NOT NULL,
      PRIMARY KEY (student_id, teacher_id),
      KEY idx_st_teacher (teacher_id),
      CONSTRAINT fk_st_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT fk_st_teacher FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
};

const linkParentChild = async (parentId, childId) => {
  if (!parentId || !childId) return;
  await ensureParentChildTable();
  await pool.query(
    "INSERT IGNORE INTO parent_child (parent_id, child_id) VALUES (?, ?)",
    [parentId, childId]
  );
};

const unlinkParentChild = async (parentId, childId) => {
  if (!parentId || !childId) return;
  await pool.query(
    "DELETE FROM parent_child WHERE parent_id = ? AND child_id = ?",
    [parentId, childId]
  );
};

const linkStudentTeacherRelation = async (studentId, teacherId) => {
  if (!studentId || !teacherId) return;
  await ensureStudentTeacherTable();
  await pool.query(
    "INSERT IGNORE INTO student_teacher (student_id, teacher_id) VALUES (?, ?)",
    [studentId, teacherId]
  );
};

const unlinkStudentTeacherRelation = async (studentId, teacherId) => {
  if (!studentId || !teacherId) return;
  await pool.query(
    "DELETE FROM student_teacher WHERE student_id = ? AND teacher_id = ?",
    [studentId, teacherId]
  );
};

const app = express();
app.use(cors({ origin: corsOrigin }));
app.use(express.json());

const uploadDir = path.join(rootDir, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

app.use("/uploads", express.static(uploadDir));

app.post("/api/parents/enroll", async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { parentName, parentEmail, parentPassword, parentPhone, childName, childEmail, childPassword, childLevel, subject } = req.body;
    console.log("DEBUG: Enrollment start for", parentEmail);

    if (!parentEmail || !parentPassword || !childName) {
      return res.status(400).json({ message: "Champs obligatoires manquants." });
    }

    // Check if emails already exist
    const [existing] = await connection.query("SELECT email FROM users WHERE email IN (?, ?)", [parentEmail, childEmail]);
    if (existing.length > 0) {
      const existingEmails = existing.map(u => u.email).join(", ");
      return res.status(400).json({ message: `Erreur: Les emails suivants sont déjà utilisés : ${existingEmails}` });
    }

    await ensureParentChildTable();
    await connection.beginTransaction();

    // 1. Create Parent User
    const parentId = crypto.randomUUID();
    const hashedParentPwd = bcrypt.hashSync(parentPassword, 10);
    await connection.query(
      "INSERT INTO users (id, name, email, password, role, phone, avatar) VALUES (?, ?, ?, ?, 'parent', ?, ?)",
      [parentId, parentName, parentEmail, hashedParentPwd, parentPhone || null, parentName[0]]
    );

    // 2. Create Student User (if email provided, else use a placeholder)
    const studentId = crypto.randomUUID();
    const finalStudentEmail = childEmail || `student.${crypto.randomBytes(4).toString('hex')}@care4success.cm`;
    const hashedStudentPwd = bcrypt.hashSync(childPassword || "eleve123", 10);
    await connection.query(
      "INSERT INTO users (id, name, email, password, role, parent_id, avatar) VALUES (?, ?, ?, ?, 'student', ?, ?)",
      [studentId, childName, finalStudentEmail, hashedStudentPwd, parentId, childName[0]]
    );

    await connection.query(
      "INSERT IGNORE INTO parent_child (parent_id, child_id) VALUES (?, ?)",
      [parentId, studentId]
    );

    // 3. Create initial Request (lead)
    await ensureRequestsTable();
    const requestId = crypto.randomUUID();
    await connection.query(
      `INSERT INTO requests (id, parent_name, child_name, level, subject, phone, status, request_date)
       VALUES (?, ?, ?, ?, ?, ?, 'reçu', CURRENT_DATE)`,
      [requestId, parentName, childName, childLevel || "", subject || "", parentPhone || ""]
    );

    await connection.commit();
    res.status(201).json({
      message: "Enrôlement réussi.",
      parent: { id: parentId, email: parentEmail },
      student: { id: studentId, email: finalStudentEmail }
    });
  } catch (error) {
    await connection.rollback();
    console.error("Enrollment Error:", error);
    res.status(500).json({ message: error.message || "Erreur lors de l'enrôlement." });
  } finally {
    connection.release();
  }
});

app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok" });
  } catch (error) {
    console.error("Health check failed", error);
    res.status(500).json({ status: "error", message: "Database connection failed" });
  }
});

app.get("/api/search", authenticateRequest, async (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) {
    return res.json({ courses: [], teachers: [], homework: [] });
  }

  const query = `%${q}%`;

  try {
    // Search courses
    const [courses] = await pool.query(
      "SELECT id, title, subject, level FROM courses WHERE title LIKE ? OR subject LIKE ? OR description LIKE ? LIMIT 5",
      [query, query, query]
    );

    // Search teachers (users with role 'teacher')
    const [teachers] = await pool.query(
      "SELECT id, name, email as subject, avatar FROM users WHERE role = 'teacher' AND (name LIKE ? OR email LIKE ?) LIMIT 5",
      [query, query]
    );

    // Search homework
    const [homework] = await pool.query(
      "SELECT id, title, subject, status FROM homework WHERE title LIKE ? OR subject LIKE ? OR description LIKE ? LIMIT 5",
      [query, query, query]
    );

    res.json({
      courses: courses.map(c => ({ ...c, type: 'course', link: `/student/courses` })), // simplified link
      teachers: teachers.map(t => ({ ...t, type: 'teacher', link: `/student/teachers` })),
      homework: homework.map(h => ({ ...h, type: 'homework', link: `/student/homework` }))
    });
  } catch (error) {
    console.error("Global search failed", error);
    res.status(500).json({ message: "Erreur lors de la recherche globale." });
  }
});

app.get("/api/requests", async (_req, res) => {
  try {
    await ensureRequestsTable();
    const [rows] = await pool.query(
      "SELECT id, parent_name, child_name, level, subject, phone, status, request_date FROM requests ORDER BY request_date DESC"
    );
    res.json(rows.map(mapRequestRow));
  } catch (error) {
    console.error("Failed to fetch requests", error);
    res.status(500).json({ message: "Impossible de récupérer les demandes." });
  }
});

app.post("/api/requests", async (req, res) => {
  const { parentName, childName, level, subject, phone } = req.body ?? {};
  if (!parentName || !childName || !phone) {
    return res.status(400).json({ message: "Champs obligatoires manquants (parent, enfant, téléphone)." });
  }
  try {
    const id = crypto.randomUUID();
    await pool.query(
      `INSERT INTO requests (id, parent_name, child_name, level, subject, phone, status, request_date)
       VALUES (?, ?, ?, ?, ?, ?, 'reçu', CURRENT_DATE)`,
      [id, parentName, childName, level || "", subject || "", phone]
    );
    const [rows] = await pool.query("SELECT * FROM requests WHERE id = ?", [id]);
    res.status(201).json(mapRequestRow(rows[0]));
  } catch (error) {
    console.error("Failed to create request", error);
    res.status(500).json({ message: "Impossible d'enregistrer la demande." });
  }
});

app.patch("/api/requests/:id", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body ?? {};
  const validStatuses = new Set(["reçu", "en traitement", "assign�", "cl�tur�"]);

  console.log(`PATCH /api/requests/${id} - New Status: ${status}`);
  fs.appendFileSync('/tmp/debug_api.log', `PATCH /api/requests/${id} - New Status: ${status}\n`);
  if (!status || !validStatuses.has(status)) {
    console.log(`Invalid status: ${status}`);
    return res.status(400).json({ message: "Statut invalide." });
  }

  try {
    fs.appendFileSync('/tmp/debug_api.log', `Updating database for request ${id} to ${status}...\n`);
    await pool.query(
      "UPDATE requests SET status = ? WHERE id = ?",
      [status, id]
    );
    console.log(`Update successful. Checking if automation trigger 'en traitement' is met...`);

    if (status === "en traitement") {
      try {
        const [reqRows] = await pool.query("SELECT * FROM requests WHERE id = ?", [id]);
        const r = reqRows[0];
        if (r) {
          console.log(`Automation: Processing assignment for ${r.child_name} (${r.subject})`);
          await ensureAssignmentsTable();
          // Look for candidate teachers matching the subject
          // Since subjects is a JSON column, use JSON_CONTAINS
          const [teachers] = await pool.query(
            "SELECT name, rating FROM teachers WHERE JSON_CONTAINS(subjects, JSON_QUOTE(?)) AND status = 'actif' LIMIT 5",
            [r.subject]
          );
          console.log(`Automation: Found ${teachers.length} candidate teachers for subject: ${r.subject}`);
          const candidates = teachers.map(t => ({ name: t.name, rating: t.rating || 5, available: true }));

          const assignmentId = crypto.randomUUID();
          await pool.query(
            `INSERT IGNORE INTO assignments (id, child_name, level, subject, status, candidates)
             VALUES (?, ?, ?, ?, 'pending', ?)`,
            [assignmentId, r.child_name, r.level, r.subject, JSON.stringify(candidates)]
          );
          console.log(`Automation: Assignment created with ID ${assignmentId}`);
        }
      } catch (autoError) {
        console.error("Automation Error during assignment creation:", autoError);
      }
    }

    const [rows] = await pool.query("SELECT * FROM requests WHERE id = ?", [id]);
    res.json(mapRequestRow(rows[0]));
  } catch (error) {
    console.error("Failed to update request", error);
    res.status(500).json({ message: "Impossible de modifier le statut." });
  }
});

app.get("/api/assignments", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, child_name, level, subject, needs, schedule, candidates, selected_teacher, status FROM assignments ORDER BY created_at ASC"
    );
    res.json(rows.map(mapAssignmentRow));
  } catch (error) {
    console.error("Failed to fetch assignments", error);
    res.status(500).json({ message: "Impossible de récupérer les matching." });
  }
});

app.patch("/api/assignments/:id", async (req, res) => {
  const { id } = req.params;
  const { selectedTeacher } = req.body ?? {};
  if (!selectedTeacher) {
    return res.status(400).json({ message: "selectedTeacher est requis." });
  }
  try {
    // 1. Mettre à jour l'assignation
    const [result] = await pool.query(
      "UPDATE assignments SET selected_teacher = ?, status = 'confirmed', updated_at = NOW() WHERE id = ?",
      [selectedTeacher, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Affectation introuvable." });
    }

    // 2. Récupérer les détails de l'assignation
    const [assignmentRows] = await pool.query(
      "SELECT * FROM assignments WHERE id = ?",
      [id]
    );
    const assignment = assignmentRows[0];

    // 3. Mettre à jour la demande correspondante dans 'requests' (statut métier)
    await pool.query(
      "UPDATE requests SET status = 'assign�' WHERE child_name = ? AND level = ? AND subject = ?",
      [assignment.child_name, assignment.level, assignment.subject]
    );

    // 4. Automatisation : Création d'une première session
    try {
      await ensureSessionsTable();
      await ensureUsersTable();

      // Récupérer le nom du parent depuis la requête
      const [reqRows] = await pool.query(
        "SELECT parent_name FROM requests WHERE child_name = ? AND level = ? LIMIT 1",
        [assignment.child_name, assignment.level]
      );
      const parentName = reqRows.length > 0 ? reqRows[0].parent_name : "Parent";

      // Rechercher les IDs utilisateurs correspondants (logic de recherche par nom pour le MVP)
      const [[student]] = await pool.query("SELECT id FROM users WHERE name = ? AND role = 'student' LIMIT 1", [assignment.child_name]);
      const [[parent]] = await pool.query("SELECT id FROM users WHERE name = ? AND role = 'parent' LIMIT 1", [parentName]);
      const [[teacher]] = await pool.query("SELECT id FROM users WHERE name = ? AND role = 'teacher' LIMIT 1", [selectedTeacher]);

      if (student && parent && teacher) {
        const sessionId = crypto.randomUUID();
        // Planifier par défaut dans 7 jours
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        const dateStr = nextWeek.toISOString().split('T')[0];

        await pool.query(
          `INSERT INTO sessions (id, session_day, session_date, session_time, subject, location, status, teacher_id, teacher_name, student_id, student_name, parent_id, parent_name)
             VALUES (?, 'À confirmer', ?, '16:00', ?, 'À domicile', 'planifié', ?, ?, ?, ?, ?, ?)`,
          [
            sessionId,
            dateStr,
            assignment.subject,
            teacher.id,
            selectedTeacher,
            student.id,
            assignment.child_name,
            parent.id,
            parentName
          ]
        );
        console.log(`Automation: Session créée pour ${assignment.child_name} avec ${selectedTeacher}`);
      }
    } catch (autoErr) {
      console.warn("Automation partial failure:", autoErr.message);
    }

    res.json(mapAssignmentRow(assignment));
  } catch (error) {
    console.error("Failed to update assignment", error);
    res.status(500).json({ message: "Impossible de confirmer le matching." });
  }
});

const roleColumn = {
  teacher: "teacher_id",
  parent: "parent_id",
  student: "student_id",
};

app.get("/api/sessions", async (req, res) => {
  const { role, userId } = req.query;
  if (!role || !userId || !(role in roleColumn)) {
    return res.status(400).json({ message: "role et userId sont requis." });
  }
  try {
    await ensureSessionsTable();
    const column = roleColumn[role];
    const [rows] = await pool.query(
      `SELECT id, session_day, session_date, session_time, subject, location, status, teacher_id, teacher_name, student_id, student_name, parent_id, parent_name, virtual_link, notes, whiteboard_data, code_data, actual_start_time, actual_end_time, report_text, understanding_score, is_paid, lesson_id, course_id
       FROM sessions
       WHERE ${column} = ?
       ORDER BY session_date ASC, session_time ASC`,
      [userId]
    );
    res.json(rows.map(mapSessionRow));
  } catch (error) {
    console.error("Failed to fetch sessions", error);
    res.status(500).json({ message: "Impossible de récupérer le planning." });
  }
});

app.patch("/api/sessions/:id/sync", async (req, res) => {
  const { id } = req.params;
  const { notes, whiteboardData, codeData } = req.body ?? {};
  try {
    const updates = [];
    const params = [];
    if (notes !== undefined) { updates.push("notes = ?"); params.push(notes); }
    if (whiteboardData !== undefined) { updates.push("whiteboard_data = ?"); params.push(whiteboardData); }
    if (codeData !== undefined) { updates.push("code_data = ?"); params.push(codeData); }

    if (updates.length > 0) {
      params.push(id);
      await pool.query(`UPDATE sessions SET ${updates.join(", ")} WHERE id = ?`, params);
    }
    res.json({ success: true });
  } catch (error) {
    console.error("Failed to sync session data", error);
    res.status(500).json({ message: "Impossible de synchroniser les données." });
  }
});

app.patch("/api/sessions/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body ?? {};
  if (!status) return res.status(400).json({ message: "Statut requis." });
  try {
    await pool.query("UPDATE sessions SET status = ? WHERE id = ?", [status, id]);
    const [rows] = await pool.query("SELECT * FROM sessions WHERE id = ?", [id]);
    res.json(mapSessionRow(rows[0]));
  } catch (error) {
    console.error("Failed to update session status", error);
    res.status(500).json({ message: "Impossible de modifier le statut." });
  }
});

app.patch("/api/sessions/:id/check-in", authenticateRequest, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("UPDATE sessions SET actual_start_time = NOW(), status = 'en cours' WHERE id = ?", [id]);
    res.json({ success: true });
  } catch (error) {
    console.error("Check-in failed", error);
    res.status(500).json({ message: "Erreur lors du check-in." });
  }
});

app.patch("/api/sessions/:id/check-out", authenticateRequest, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("UPDATE sessions SET actual_end_time = NOW(), status = 'effectué' WHERE id = ?", [id]);
    res.json({ success: true });
  } catch (error) {
    console.error("Check-out failed", error);
    res.status(500).json({ message: "Erreur lors du check-out." });
  }
});

app.post("/api/sessions/:id/report", authenticateRequest, async (req, res) => {
  const { id } = req.params;
  const { reportText, understandingScore, rating, comment, lessonId, courseId } = req.body;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Update session
    await connection.query(
      "UPDATE sessions SET report_text = ?, understanding_score = ?, status = 'effectué', lesson_id = ? WHERE id = ?",
      [reportText, understandingScore, lessonId || null, id]
    );

    // Get session details for feedback
    const [sessionRows] = await connection.query("SELECT * FROM sessions WHERE id = ?", [id]);
    const s = sessionRows[0];

    await connection.commit();
    res.json({ success: true });
  } catch (error) {
    await connection.rollback();
    console.error("Feedback report failed", error);
    res.status(500).json({ message: "Erreur lors de l'enregistrement du rapport." });
  } finally {
    connection.release();
  }
});

app.post("/api/homework", authenticateRequest, async (req, res) => {
  const { teacherId, studentId, sessionId, title, description, dueDate, subject } = req.body;
  if (!teacherId || !studentId || !title || !dueDate || !subject) {
    return res.status(400).json({ message: "Champs obligatoires manquants." });
  }
  try {
    const id = crypto.randomUUID();
    await pool.query(
      `INSERT INTO homework (id, teacher_id, student_id, session_id, title, description, due_date, subject, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'à faire')`,
      [id, teacherId, studentId, sessionId || null, title, description || "", dueDate, subject]
    );
    res.status(201).json({ id, success: true });
  } catch (error) {
    console.error("Failed to create homework", error);
    res.status(500).json({ message: "Impossible d'assigner le devoir." });
  }
});

app.patch("/api/sessions/:id/notes", async (req, res) => {
  const { id } = req.params;
  const { notes } = req.body ?? {};
  try {
    await pool.query("UPDATE sessions SET notes = ? WHERE id = ?", [notes, id]);
    res.json({ success: true });
  } catch (error) {
    console.error("Failed to update session notes", error);
    res.status(500).json({ message: "Impossible d'enregistrer le compte-rendu." });
  }
});

const allowedApplicationStatuses = new Set(["pending", "approved", "rejected"]);
const allowedReviewerRoles = new Set(["admin", "advisor"]);
const allowedFeedbackReviewerTypes = new Set(["parent", "student", "advisor"]);

const DB_CONNECTION_ERROR_CODES = new Set([
  "ECONNREFUSED",
  "ER_ACCESS_DENIED_ERROR",
  "ENOTFOUND",
  "PROTOCOL_CONNECTION_LOST",
]);

const isDbConnectionError = (error) =>
  Boolean(error && typeof error === "object" && error.code && DB_CONNECTION_ERROR_CODES.has(error.code));

const cloneTeacherApplication = (app = {}) => ({
  ...app,
  subjects: Array.isArray(app.subjects) ? [...app.subjects] : [],
});

let fallbackTeacherApplications = [
  {
    id: "mock-app-rebecca-ndzana",
    fullName: "Rebecca Ndzana",
    email: "rebecca.ndzana@example.com",
    phone: "+237 699 112 233",
    subjects: ["Mathématiques", "Physique"],
    experienceYears: 6,
    availability: "Soirs & week-end",
    motivation:
      "Ancienne enseignante de lycée passionnée par la pédagogie active. Je souhaite rejoindre Care4Success pour accompagner davantage de familles.",
    cvUrl: null,
    status: "pending",
    reviewedBy: null,
    reviewerRole: null,
    reviewNotes: null,
    reviewedAt: null,
    createdAt: "2026-03-01T10:00:00.000Z",
  },
  {
    id: "mock-app-pauline-tchoumi",
    fullName: "Pauline Tchoumi",
    email: "pauline.tchoumi@example.com",
    phone: "+237 677 889 000",
    subjects: ["Français", "Philosophie"],
    experienceYears: 10,
    availability: "Journée et samedi",
    motivation:
      "Formatrice en expression écrite avec une solide expérience en terminale. Je peux prendre en charge les élèves préparant le BAC.",
    cvUrl: "https://example.com/cv/pauline.pdf",
    status: "approved",
    reviewedBy: "Directeur Ngono",
    reviewerRole: "admin",
    reviewNotes: "Très bon profil confirmé lors de l’entretien de mars.",
    reviewedAt: "2026-03-02T09:30:00.000Z",
    createdAt: "2026-02-25T08:00:00.000Z",
  },
].map(cloneTeacherApplication);

const listFallbackTeacherApplications = (status) => {
  const normalizedStatus =
    typeof status === "string" && allowedApplicationStatuses.has(status) ? status : undefined;
  const apps = fallbackTeacherApplications.map(cloneTeacherApplication);
  if (!normalizedStatus) {
    return apps;
  }
  return apps.filter((app) => app.status === normalizedStatus);
};

const createFallbackTeacherApplication = (payload) => {
  const entry = {
    id: crypto.randomUUID(),
    fullName: payload.fullName,
    email: payload.email,
    phone: payload.phone,
    subjects: Array.isArray(payload.subjects) ? [...payload.subjects] : [],
    experienceYears: Number(payload.experienceYears) || 0,
    availability: payload.availability,
    motivation: payload.motivation,
    cvUrl: payload.cvUrl || null,
    status: "pending",
    reviewedBy: null,
    reviewerRole: null,
    reviewNotes: null,
    reviewedAt: null,
    createdAt: new Date().toISOString(),
  };
  fallbackTeacherApplications = [entry, ...fallbackTeacherApplications];
  return cloneTeacherApplication(entry);
};

const reviewFallbackTeacherApplication = (id, payload) => {
  const index = fallbackTeacherApplications.findIndex((app) => app.id === id);
  if (index === -1) {
    return null;
  }
  const updated = {
    ...fallbackTeacherApplications[index],
    status: payload.status,
    reviewedBy: payload.reviewerName,
    reviewerRole: payload.reviewerRole,
    reviewNotes: payload.reviewNotes || null,
    reviewedAt: new Date().toISOString(),
  };
  fallbackTeacherApplications[index] = updated;
  return cloneTeacherApplication(updated);
};

const clonePlatformSettings = (settings) => JSON.parse(JSON.stringify(settings));

let fallbackPlatformSettingsCache = sanitizePlatformSettings(DEFAULT_PLATFORM_SETTINGS);

const getFallbackPlatformSettings = () => clonePlatformSettings(fallbackPlatformSettingsCache);

const saveFallbackPlatformSettings = (payload) => {
  fallbackPlatformSettingsCache = sanitizePlatformSettings(payload);
  return getFallbackPlatformSettings();
};

app.post("/api/teacher-applications", upload.single("cv"), async (req, res) => {
  const {
    fullName,
    email,
    phone,
    subjects,
    experienceYears,
    availability,
    motivation,
    cvUrl,
  } = req.body ?? {};

  if (!fullName || !email || !phone || !motivation || !availability) {
    return res.status(400).json({ message: "Champs obligatoires manquants." });
  }

  // S'il y a un fichier envoyé via multer, on a sa référence dans req.file
  let finalCvUrl = cvUrl || null;
  if (req.file) {
    // On construit l'url publique. Par ex: http://localhost:4000/uploads/...
    const protocol = req.protocol;
    const host = req.get('host');
    finalCvUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
  }

  const subjectsList =
    Array.isArray(subjects) && subjects.length > 0
      ? subjects
      : typeof subjects === "string" && subjects.length > 0
        ? subjects.split(",").map((s) => s.trim()).filter(Boolean)
        : [];
  if (!subjectsList.length) {
    return res.status(400).json({ message: "Veuillez preciser au moins une matiere." });
  }
  const parsedExperience = Number(experienceYears ?? 0);
  if (Number.isNaN(parsedExperience) || parsedExperience < 0) {
    return res.status(400).json({ message: "Le nombre d'annees d'experience est invalide." });
  }

  const normalizedApplication = {
    fullName,
    email,
    phone,
    subjects: subjectsList,
    experienceYears: parsedExperience,
    availability,
    motivation,
    cvUrl: finalCvUrl,
  };

  const applicationId = crypto.randomUUID();

  try {
    await pool.query(
      `INSERT INTO teacher_applications
        (id, full_name, email, phone, subjects, experience_years, availability, motivation, cv_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        applicationId,
        fullName,
        email,
        phone,
        JSON.stringify(subjectsList),
        parsedExperience,
        availability,
        motivation,
        normalizedApplication.cvUrl,
      ]
    );
    const [rows] = await pool.query(
      `SELECT id, full_name, email, phone, subjects, experience_years, availability, motivation, cv_url,
              status, reviewed_by, reviewer_role, review_notes, reviewed_at, created_at
       FROM teacher_applications
       WHERE id = ?`,
      [applicationId]
    );
    res.status(201).json(mapTeacherApplicationRow(rows[0]));
  } catch (error) {
    if (isDbConnectionError(error)) {
      console.warn("DB indisponible, enregistrement de la candidature en mémoire.", error.message);
      const fallback = createFallbackTeacherApplication(normalizedApplication);
      return res.status(201).json(fallback);
    }
    console.error("Failed to create teacher application", error);
    res.status(500).json({ message: "Impossible denregistrer la candidature." });
  }
});

app.get("/api/teacher-applications", async (req, res) => {
  const { status } = req.query;
  const statusFilter = typeof status === "string" ? status : undefined;
  const filters = [];
  const params = [];

  if (statusFilter && allowedApplicationStatuses.has(statusFilter)) {
    filters.push("status = ?");
    params.push(statusFilter);
  }

  const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

  try {
    const [rows] = await pool.query(
      `SELECT id, full_name, email, phone, subjects, experience_years, availability, motivation, cv_url,
              status, reviewed_by, reviewer_role, review_notes, reviewed_at, created_at
       FROM teacher_applications
       ${whereClause}
       ORDER BY created_at DESC`,
      params
    );
    res.json(rows.map(mapTeacherApplicationRow));
  } catch (error) {
    if (isDbConnectionError(error)) {
      console.warn("DB indisponible, utilisation des candidatures en mémoire.", error.message);
      return res.json(listFallbackTeacherApplications(statusFilter));
    }
    console.error("Failed to fetch teacher applications", error);
    res.status(500).json({ message: "Impossible de recuperer les candidatures." });
  }
});

app.patch("/api/teacher-applications/:id", async (req, res) => {
  const { id } = req.params;
  const { status, reviewNotes, reviewerName, reviewerRole } = req.body ?? {};

  if (!allowedApplicationStatuses.has(status) || status === "pending") {
    return res.status(400).json({ message: "Statut invalide." });
  }
  if (!reviewerName || !allowedReviewerRoles.has(reviewerRole)) {
    return res.status(400).json({ message: "Informations relecteur manquantes." });
  }

  try {
    const [result] = await pool.query(
      `UPDATE teacher_applications
       SET status = ?, reviewed_by = ?, reviewer_role = ?, review_notes = ?, reviewed_at = NOW()
       WHERE id = ?`,
      [status, reviewerName, reviewerRole, reviewNotes || null, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Candidature introuvable." });
    }
    const [rows] = await pool.query(
      `SELECT id, full_name, email, phone, subjects, experience_years, availability, motivation, cv_url,
              status, reviewed_by, reviewer_role, review_notes, reviewed_at, created_at
       FROM teacher_applications
       WHERE id = ?`,
      [id]
    );

    const updatedApplication = rows[0];

    // Si la candidature est approuvée, on crée automatiquement le profil Enseignant + compte utilisateur
    let generatedCredentials = null;
    if (status === "approved") {
      try {
        await ensureTeachersTable();
        await ensureUsersTable();

        const teacherId = crypto.randomUUID();

        // 1. Créer le profil enseignant
        await pool.query(
          `INSERT IGNORE INTO teachers (id, name, email, subjects, level, city, status)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            teacherId,
            updatedApplication.full_name,
            updatedApplication.email,
            JSON.stringify(updatedApplication.subjects),
            "",
            "",
            "actif"
          ]
        );

        // 2. Générer un mot de passe aléatoire lisible (ex: Prof#4729)
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        const generatedPassword = `Prof#${randomSuffix}`;
        const avatar = updatedApplication.full_name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase();

        // 3. Créer le compte de connexion (ou ignorer si l'email existe déjà)
        const [existingUser] = await pool.query(
          "SELECT id FROM users WHERE email = ?",
          [updatedApplication.email]
        );

        if (existingUser.length === 0) {
          const hashedPassword = bcrypt.hashSync(generatedPassword, 10);
          await pool.query(
            "INSERT INTO users (id, name, email, password, role, avatar, phone) VALUES (?, ?, ?, ?, 'teacher', ?, ?)",
            [
              teacherId,
              updatedApplication.full_name,
              updatedApplication.email,
              hashedPassword,
              avatar,
              updatedApplication.phone || null,
            ]
          );
          generatedCredentials = {
            email: updatedApplication.email,
            password: generatedPassword,
            name: updatedApplication.full_name,
          };
        } else {
          // Compte déjà existant — on renvoie juste l'email sans le mot de passe
          generatedCredentials = {
            email: updatedApplication.email,
            name: updatedApplication.full_name,
            alreadyExists: true,
          };
        }

        console.log(`Compte enseignant créé : ${updatedApplication.email} / ${generatedPassword}`);
      } catch (insertError) {
        console.error("Erreur technique lors de la création automatique du prof:", insertError);
      }
    }

    res.json({
      ...mapTeacherApplicationRow(updatedApplication),
      ...(generatedCredentials ? { credentials: generatedCredentials } : {}),
    });
  } catch (error) {
    if (isDbConnectionError(error)) {
      console.warn("DB indisponible, mise à jour de la candidature en mémoire.", error.message);
      const updated = reviewFallbackTeacherApplication(id, {
        status,
        reviewNotes,
        reviewerName,
        reviewerRole,
      });
      if (!updated) {
        return res.status(404).json({ message: "Candidature introuvable." });
      }
      return res.json(updated);
    }
    console.error("Failed to review teacher application", error);
    res.status(500).json({ message: "Impossible de mettre a jour la candidature." });
  }
});

app.get("/api/teachers", async (req, res) => {
  try {
    await ensureTeachersTable();
    const [rows] = await pool.query(
      `SELECT id, name, email, subjects, level, city, status, rating, students, created_at
       FROM teachers
       ORDER BY name ASC`
    );
    res.json(rows.map(mapTeacherRow));
  } catch (error) {
    if (isDbConnectionError(error)) {
      console.warn("DB indisponible, impossible de lister les teachers.", error.message);
      return res.status(503).json({ message: "Base de données indisponible." });
    }
    console.error("Failed to fetch teachers", error);
    res.status(500).json({ message: "Impossible de récupérer les enseignants." });
  }
});

app.post("/api/teachers", async (req, res) => {
  const { name, email, subject, level, city } = req.body ?? {};

  if (!name || !email) {
    return res.status(400).json({ message: "Le nom et l'email sont obligatoires." });
  }

  const subjectsList = subject ? [subject] : [];

  try {
    await ensureTeachersTable();
    const teacherId = crypto.randomUUID();
    await pool.query(
      `INSERT INTO teachers (id, name, email, subjects, level, city, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [teacherId, name, email, JSON.stringify(subjectsList), level || "", city || "", "actif"]
    );
    const [rows] = await pool.query(
      `SELECT id, name, email, subjects, level, city, status, rating, students, created_at
       FROM teachers
       WHERE id = ?`,
      [teacherId]
    );
    res.status(201).json(mapTeacherRow(rows[0]));
  } catch (error) {
    console.error("Failed to create teacher", error);
    res.status(500).json({ message: "Impossible d'ajouter l'enseignant." });
  }
});

app.patch("/api/teachers/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body ?? {};

  const validStatuses = new Set(["actif", "inactif", "suspendu"]);
  if (!status || !validStatuses.has(status)) {
    return res.status(400).json({ message: "Statut invalide." });
  }

  try {
    await ensureTeachersTable();
    const [result] = await pool.query(
      `UPDATE teachers SET status = ? WHERE id = ?`,
      [status, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Enseignant introuvable." });
    }
    const [rows] = await pool.query(
      `SELECT id, name, email, subjects, level, city, status, rating, students, created_at
       FROM teachers
       WHERE id = ?`,
      [id]
    );
    res.json(mapTeacherRow(rows[0]));
  } catch (error) {
    console.error("Failed to update teacher status", error);
    res.status(500).json({ message: "Impossible de modifier le statut." });
  }
});

app.post("/api/teacher-feedback", async (req, res) => {
  const {
    teacherId,
    teacherName,
    reviewerName,
    reviewerType,
    rating,
    comment,
    sessionId,
  } = req.body ?? {};

  if (!teacherId || !teacherName || !reviewerName || !allowedFeedbackReviewerTypes.has(reviewerType)) {
    return res.status(400).json({ message: "Informations obligatoires manquantes." });
  }
  const numericRating = Number(rating);
  if (Number.isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
    return res.status(400).json({ message: "La note doit etre comprise entre 1 et 5." });
  }

  try {
    const feedbackId = crypto.randomUUID();
    await pool.query(
      `INSERT INTO teacher_feedback
        (id, teacher_id, teacher_name, reviewer_name, reviewer_type, rating, comment, session_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [feedbackId, teacherId, teacherName, reviewerName, reviewerType, numericRating, comment || null, sessionId || null]
    );
    const [rows] = await pool.query(
      `SELECT id, teacher_id, teacher_name, reviewer_name, reviewer_type, rating, comment, session_id, created_at
       FROM teacher_feedback
       WHERE id = ?`,
      [feedbackId]
    );
    res.status(201).json(mapTeacherFeedbackRow(rows[0]));
  } catch (error) {
    console.error("Failed to submit teacher feedback", error);
    res.status(500).json({ message: "Impossible denregistrer l'evaluation." });
  }
});

app.get("/api/teachers/:teacherId/feedback", async (req, res) => {
  const { teacherId } = req.params;
  if (!teacherId) {
    return res.status(400).json({ message: "teacherId requis." });
  }
  try {
    const [rows] = await pool.query(
      `SELECT id, teacher_id, teacher_name, reviewer_name, reviewer_type, rating, comment, session_id, created_at
       FROM teacher_feedback
       WHERE teacher_id = ?
       ORDER BY created_at DESC`,
      [teacherId]
    );
    res.json(rows.map(mapTeacherFeedbackRow));
  } catch (error) {
    console.error("Failed to fetch teacher feedback", error);
    res.status(500).json({ message: "Impossible de recuperer les evaluations." });
  }
});

app.get("/api/teacher-ratings", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
          teacher_id,
          teacher_name,
          AVG(rating) AS average_rating,
          COUNT(*) AS review_count,
          MAX(created_at) AS last_review_at
       FROM teacher_feedback
       GROUP BY teacher_id, teacher_name
       ORDER BY average_rating DESC`
    );
    res.json(rows.map(mapTeacherRatingRow));
  } catch (error) {
    console.error("Failed to fetch teacher ratings", error);
    res.status(500).json({ message: "Impossible de recuperer les notes enseignants." });
  }
});

app.get("/api/courses", async (req, res) => {
  const { role, userId } = req.query;
  try {
    let rows;
    if (role === "student") {
      if (!userId) {
        return res.status(400).json({ message: "userId requis pour le role student." });
      }
      [rows] = await pool.query(
        `SELECT c.id, c.title, c.description, c.subject, c.level, c.status, c.cover_url, c.created_by, c.created_at
         FROM courses c
         INNER JOIN course_enrollments ce ON ce.course_id = c.id
         WHERE ce.student_id = ? AND c.status = 'published'
         ORDER BY c.created_at DESC`,
        [userId]
      );
    } else if (role === "teacher") {
      if (!userId) {
        return res.status(400).json({ message: "userId requis pour le role teacher." });
      }
      [rows] = await pool.query(
        `SELECT id, title, description, subject, level, status, cover_url, created_by, created_at
         FROM courses
         WHERE created_by = ?
         ORDER BY created_at DESC`,
        [userId]
      );
    } else {
      [rows] = await pool.query(
        `SELECT id, title, description, subject, level, status, cover_url, created_by, created_at
         FROM courses
         ORDER BY created_at DESC`
      );
    }

    const payload = await buildCoursesPayload(rows, role === 'student' ? userId : null);
    res.json(payload);
  } catch (error) {
    console.error("Failed to fetch courses", error);
    res.status(500).json({ message: "Impossible de recuperer les cours." });
  }
});

app.get("/api/courses/:courseId", async (req, res) => {
  const { courseId } = req.params;
  try {
    const course = await fetchCourseDetails(courseId, true);
    if (!course) {
      return res.status(404).json({ message: "Cours introuvable." });
    }
    res.json(course);
  } catch (error) {
    console.error("Failed to fetch course", error);
    res.status(500).json({ message: "Impossible de recuperer le cours." });
  }
});

app.post("/api/courses", async (req, res) => {
  const { title, description, subject, level, status = "draft", coverUrl, createdBy } = req.body ?? {};
  if (!title || !description || !subject || !level) {
    return res.status(400).json({ message: "Champs obligatoires manquants." });
  }
  try {
    const courseId = crypto.randomUUID();
    await pool.query(
      `INSERT INTO courses (id, title, description, subject, level, status, cover_url, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [courseId, title, description, subject, level, status, coverUrl || null, createdBy || null]
    );
    const course = await fetchCourseDetails(courseId);
    res.status(201).json(course);
  } catch (error) {
    console.error("Failed to create course", error);
    res.status(500).json({ message: "Impossible de creer le cours." });
  }
});

app.post("/api/courses/:courseId/lessons", async (req, res) => {
  const { courseId } = req.params;
  const { title, content, videoUrl, order = 1 } = req.body ?? {};
  if (!title || !content) {
    return res.status(400).json({ message: "Titre et contenu obligatoires." });
  }
  try {
    const lessonId = crypto.randomUUID();
    await pool.query(
      `INSERT INTO course_lessons (id, course_id, title, content, video_url, order_index)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [lessonId, courseId, title, content, videoUrl || null, order]
    );
    const course = await fetchCourseDetails(courseId, true);
    res.status(201).json(course);
  } catch (error) {
    console.error("Failed to create lesson", error);
    res.status(500).json({ message: "Impossible de creer la lecon." });
  }
});

app.post("/api/lessons/:lessonId/quizzes", async (req, res) => {
  const { lessonId } = req.params;
  const { title, instructions, totalPoints = 0 } = req.body ?? {};
  if (!title) {
    return res.status(400).json({ message: "Titre du quiz requis." });
  }
  try {
    const quizId = crypto.randomUUID();
    const [lessonRows] = await pool.query(
      `SELECT course_id FROM course_lessons WHERE id = ?`,
      [lessonId]
    );
    if (!lessonRows.length) {
      return res.status(404).json({ message: "Lecon introuvable." });
    }
    const courseId = lessonRows[0].course_id;
    await pool.query(
      `INSERT INTO quizzes (id, course_id, lesson_id, title, instructions, total_points)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [quizId, courseId, lessonId, title, instructions || null, totalPoints]
    );
    const quiz = await fetchCourseDetails(courseId, true);
    res.status(201).json({ quizId, course: quiz });
  } catch (error) {
    console.error("Failed to create quiz", error);
    res.status(500).json({ message: "Impossible de creer le quiz." });
  }
});

app.post("/api/quizzes/:quizId/questions", async (req, res) => {
  const { quizId } = req.params;
  const { prompt, choices, correctAnswer, points = 1 } = req.body ?? {};
  if (!prompt || !Array.isArray(choices) || choices.length === 0 || !correctAnswer) {
    return res.status(400).json({ message: "Question invalide." });
  }
  try {
    const questionId = crypto.randomUUID();
    await pool.query(
      `INSERT INTO quiz_questions (id, quiz_id, prompt, choices, correct_answer, points)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [questionId, quizId, prompt, JSON.stringify(choices), correctAnswer, points]
    );
    const [quizRow] = await pool.query(`SELECT course_id FROM quizzes WHERE id = ?`, [quizId]);
    if (!quizRow.length) {
      return res.status(404).json({ message: "Quiz introuvable apres creation." });
    }
    const course = await fetchCourseDetails(quizRow[0].course_id, true);
    res.status(201).json(course);
  } catch (error) {
    console.error("Failed to create quiz question", error);
    res.status(500).json({ message: "Impossible d'ajouter la question." });
  }
});

app.get("/api/quizzes/:quizId", async (req, res) => {
  const { quizId } = req.params;
  const includeCorrect = req.query.includeCorrect === "true";
  try {
    const [quizRows] = await pool.query(
      `SELECT id, course_id, lesson_id, title, instructions, total_points
       FROM quizzes
       WHERE id = ?`,
      [quizId]
    );
    if (!quizRows.length) {
      return res.status(404).json({ message: "Quiz introuvable." });
    }
    const quiz = mapQuizSummaryRow(quizRows[0]);
    const [questions] = await pool.query(
      `SELECT id, quiz_id, prompt, choices, correct_answer, points
       FROM quiz_questions
       WHERE quiz_id = ?
       ORDER BY id ASC`,
      [quizId]
    );
    quiz.questions = questions.map((row) => mapQuizQuestionRow(row, includeCorrect));
    res.json(quiz);
  } catch (error) {
    console.error("Failed to fetch quiz", error);
    res.status(500).json({ message: "Impossible de recuperer le quiz." });
  }
});

app.post("/api/courses/:courseId/enrollments", async (req, res) => {
  const { courseId } = req.params;
  const { studentId, studentName, assignedBy } = req.body ?? {};
  if (!studentId || !studentName) {
    return res.status(400).json({ message: "Informations eleve requises." });
  }
  try {
    await pool.query(
      `INSERT INTO course_enrollments (course_id, student_id, student_name, assigned_by)
       VALUES (?, ?, ?, ?)`,
      [courseId, studentId, studentName, assignedBy || null]
    );
    const course = await fetchCourseDetails(courseId);

    // Notification élève
    await createNotification(
      studentId,
      "Nouveau cours disponible",
      `Vous avez été inscrit au parcours : ${course.title}`,
      'success',
      '/student/courses'
    );

    res.status(201).json(course);
  } catch (error) {
    console.error("Failed to enroll student", error);
    res.status(500).json({ message: "Impossible d'assigner le cours." });
  }
});

app.get("/api/users/:userId/course-bookmarks", async (req, res) => {
  const { userId } = req.params;
  try {
    const [rows] = await pool.query(
      "SELECT course_id FROM course_bookmarks WHERE user_id = ?",
      [userId]
    );
    res.json(rows.map(r => r.course_id));
  } catch (error) {
    console.error("Failed to fetch bookmarks", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

app.post("/api/users/:userId/course-bookmarks/:courseId", async (req, res) => {
  const { userId, courseId } = req.params;
  try {
    await pool.query(
      "INSERT IGNORE INTO course_bookmarks (user_id, course_id) VALUES (?, ?)",
      [userId, courseId]
    );
    res.json({ success: true });
  } catch (error) {
    console.error("Failed to add bookmark", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

app.delete("/api/users/:userId/course-bookmarks/:courseId", async (req, res) => {
  const { userId, courseId } = req.params;
  try {
    await pool.query(
      "DELETE FROM course_bookmarks WHERE user_id = ? AND course_id = ?",
      [userId, courseId]
    );
    res.json({ success: true });
  } catch (error) {
    console.error("Failed to remove bookmark", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

app.post("/api/users/:userId/courses/:courseId/progress", async (req, res) => {
  const { userId, courseId } = req.params;
  const { lessonId, completed } = req.body ?? {};
  try {
    // Get existing progress
    const [rows] = await pool.query(
      "SELECT completed_lessons FROM user_course_progress WHERE user_id = ? AND course_id = ?",
      [userId, courseId]
    );

    let completedLessons = [];
    if (rows.length > 0) {
      completedLessons = parseJson(rows[0].completed_lessons, []);
    }

    if (completed && lessonId && !completedLessons.includes(lessonId)) {
      completedLessons.push(lessonId);
    }

    await pool.query(
      `INSERT INTO user_course_progress (user_id, course_id, last_lesson_id, completed_lessons)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
       last_lesson_id = IFNULL(?, last_lesson_id),
       completed_lessons = ?,
       last_accessed_at = CURRENT_TIMESTAMP`,
      [userId, courseId, lessonId || null, JSON.stringify(completedLessons), lessonId || null, JSON.stringify(completedLessons)]
    );
    res.json({ success: true });
  } catch (error) {
    console.error("Failed to update course progress", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

app.get("/api/users/:userId/active-course", async (req, res) => {
  const { userId } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT cp.course_id, cp.last_lesson_id, c.title, c.subject, cl.title as lesson_title
       FROM user_course_progress cp
       JOIN courses c ON c.id = cp.course_id
       LEFT JOIN course_lessons cl ON cl.id = cp.last_lesson_id
       WHERE cp.user_id = ?
       ORDER BY cp.last_accessed_at DESC
       LIMIT 1`,
      [userId]
    );
    if (rows.length === 0) {
      return res.json(null);
    }
    res.json({
      courseId: rows[0].course_id,
      lastLessonId: rows[0].last_lesson_id,
      courseTitle: rows[0].title,
      subject: rows[0].subject,
      lessonTitle: rows[0].lesson_title
    });
  } catch (error) {
    console.error("Failed to fetch active course", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

app.post("/api/quizzes/:quizId/attempts", async (req, res) => {
  const { quizId } = req.params;
  const { studentId, studentName, answers } = req.body ?? {};
  if (!studentId || !studentName || !Array.isArray(answers) || answers.length === 0) {
    return res.status(400).json({ message: "Submission invalide." });
  }
  try {
    const [quizRows] = await pool.query(
      `SELECT id, total_points
       FROM quizzes
       WHERE id = ?`,
      [quizId]
    );
    if (!quizRows.length) {
      return res.status(404).json({ message: "Quiz introuvable." });
    }
    const [questionRows] = await pool.query(
      `SELECT id, correct_answer, points
       FROM quiz_questions
       WHERE quiz_id = ?`,
      [quizId]
    );
    if (!questionRows.length) {
      return res.status(400).json({ message: "Quiz sans question." });
    }
    const answerMap = new Map(answers.map((ans) => [ans.questionId, ans.answer]));
    let score = 0;
    questionRows.forEach((question) => {
      if (answerMap.get(question.id) === question.correct_answer) {
        score += question.points;
      }
    });
    const attemptId = crypto.randomUUID();
    await pool.query(
      `INSERT INTO quiz_attempts (id, quiz_id, student_id, student_name, answers, score)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [attemptId, quizId, studentId, studentName, JSON.stringify(answers), score]
    );
    // Notification Professeur
    const [courseRows] = await pool.query(
      `SELECT c.created_by_id, c.title, q.title as quiz_title 
       FROM quizzes q 
       JOIN courses c ON c.id = q.course_id 
       WHERE q.id = ?`, [quizId]
    );
    if (courseRows.length && courseRows[0].created_by_id) {
      await createNotification(
        courseRows[0].created_by_id,
        "Nouvelle réponse au Quiz",
        `${studentName} a terminé le quiz "${courseRows[0].quiz_title}" (${score}/${quizRows[0].total_points || score})`,
        'success',
        '/teacher/courses'
      );
    }

    res.status(201).json({ attemptId, score, totalPoints: quizRows[0].total_points || score });
  } catch (error) {
    console.error("Failed to submit quiz attempt", error);
    res.status(500).json({ message: "Impossible d'enregistrer la copie." });
  }
});

app.get("/api/quizzes/:quizId/attempts", async (req, res) => {
  const { quizId } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT id, quiz_id, student_id, student_name, answers, score, created_at
       FROM quiz_attempts
       WHERE quiz_id = ?
       ORDER BY created_at DESC`,
      [quizId]
    );
    res.json(rows.map(mapQuizAttemptRow));
  } catch (error) {
    console.error("Failed to fetch quiz attempts", error);
    res.status(500).json({ message: "Impossible de recuperer les copies." });
  }
});

app.get("/api/students/:studentId/quiz-attempts", async (req, res) => {
  const { studentId } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT a.id, a.quiz_id, a.student_id, a.student_name, a.answers, a.score, a.created_at, q.title as quiz_title, q.total_points
       FROM quiz_attempts a
       JOIN quizzes q ON q.id = a.quiz_id
       WHERE a.student_id = ?
       ORDER BY a.created_at DESC`,
      [studentId]
    );
    res.json(rows.map(r => ({
      ...mapQuizAttemptRow(r),
      quizTitle: r.quiz_title,
      totalPoints: r.total_points
    })));
  } catch (error) {
    console.error("Failed to fetch student quiz attempts", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

// Routes parent/student simplifiées gérées plus loin


app.get("/api/platform-settings", async (_req, res) => {
  try {
    const settings = await getPlatformSettings();
    res.json(settings);
  } catch (error) {
    if (isDbConnectionError(error)) {
      console.warn("DB indisponible, retour des paramètres en mémoire.", error.message);
      return res.json(getFallbackPlatformSettings());
    }
    console.error("Failed to fetch platform settings", error);
    res.status(500).json({ message: "Impossible de récupérer les paramètres." });
  }
});

app.put("/api/platform-settings", async (req, res) => {
  try {
    const saved = await savePlatformSettings(req.body ?? {});
    res.json(saved);
  } catch (error) {
    if (isDbConnectionError(error)) {
      console.warn("DB indisponible, sauvegarde des paramètres en mémoire.", error.message);
      const saved = saveFallbackPlatformSettings(req.body ?? {});
      return res.json(saved);
    }
    console.error("Failed to save platform settings", error);
    res.status(500).json({ message: "Impossible d'enregistrer les paramètres." });
  }
});

// ==========================================
// MESSAGERIE
// ==========================================

app.get("/api/messages/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    await ensureMessagesTable();
    const [rows] = await pool.query(
      `SELECT * FROM messages 
       WHERE sender_id = ? OR receiver_id = ? 
       ORDER BY created_at ASC`,
      [userId, userId]
    );
    res.json(rows.map(mapMessageRow));
  } catch (error) {
    console.error("Failed to fetch messages", error);
    res.status(500).json({ message: "Impossible de récupérer les messages." });
  }
});

app.post("/api/messages", async (req, res) => {
  const { senderId, senderName, senderRole, receiverId, receiverName, receiverRole, content, attachmentUrl } = req.body ?? {};

  if (!senderId || !receiverId || !content) {
    return res.status(400).json({ message: "Champs obligatoires manquants." });
  }

  try {
    await ensureMessagesTable();
    const id = crypto.randomUUID();
    await pool.query(
      `INSERT INTO messages (id, sender_id, sender_name, sender_role, receiver_id, receiver_name, receiver_role, content, attachment_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, senderId, senderName, senderRole, receiverId, receiverName, receiverRole, content, attachmentUrl || null]
    );
    const [rows] = await pool.query(`SELECT * FROM messages WHERE id = ?`, [id]);
    res.status(201).json(mapMessageRow(rows[0]));
  } catch (error) {
    console.error("Failed to send message", error);
    res.status(500).json({ message: "Impossible d'envoyer le message." });
  }
});

app.patch("/api/messages/:messageId/read", async (req, res) => {
  const { messageId } = req.params;
  try {
    await ensureMessagesTable();
    await pool.query(`UPDATE messages SET is_read = TRUE WHERE id = ?`, [messageId]);
    res.json({ success: true, message: "Message marqué comme lu." });
  } catch (error) {
    console.error("Failed to mark message as read", error);
    res.status(500).json({ message: "Impossible de mettre à jour le message." });
  }
});

app.post("/api/messages/upload", authenticateRequest, upload.single("attachment"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Aucun fichier n'a été fourni." });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ fileUrl });
  } catch (error) {
    console.error("Message attachment upload error:", error);
    res.status(500).json({ message: "Erreur lors de l'upload." });
  }
});

app.get("/api/teachers/:teacherId/contacts", async (req, res) => {
  const { teacherId } = req.params;
  try {
    const [students] = await pool.query(
      `SELECT DISTINCT u.id, u.name, u.role, u.avatar 
       FROM student_teacher st
       JOIN users u ON st.student_id = u.id
       WHERE st.teacher_id = ?`,
      [teacherId]
    );

    const [advisors] = await pool.query(
      `SELECT id, name, role, avatar FROM users WHERE role = 'advisor'`
    );

    const contacts = [...students, ...advisors].map(c => ({
      id: c.id,
      name: c.name,
      role: c.role,
      avatar: c.avatar || c.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    }));

    res.json(contacts);
  } catch (error) {
    console.error("Failed to fetch teacher contacts", error);
    res.status(500).json({ message: "Erreur lors de la récupération des contacts." });
  }
});

// ==========================================
// CONSEILLER — FAMILLES
// ==========================================

app.get("/api/advisor/families", async (_req, res) => {
  const FALLBACK = [
    { id: "af1", parent: "Aminata Diallo", child: "Koffi Diallo", level: "3e", subject: "Mathématiques", teacher: "Dr. Abanda", nextRdv: "12/03", status: "suivi actif" },
    { id: "af2", parent: "Kouassi Ébène", child: "Awa Ébène", level: "Tle C", subject: "Physique-Chimie", teacher: "Th. Nkoulou", nextRdv: "14/03", status: "suivi actif" },
    { id: "af3", parent: "Narcisse Essomba", child: "Léa Essomba", level: "CM2", subject: "Français", teacher: "S. Fouda", nextRdv: "10/03", status: "suivi actif" },
    { id: "af4", parent: "Fatou Konaté", child: "Ibrahima Konaté", level: "5e", subject: "Anglais", teacher: "Rebecca Ateba", nextRdv: "—", status: "matching" },
    { id: "af5", parent: "Mariama Bah", child: "Salif Bah", level: "6e", subject: "Mathématiques", teacher: "—", nextRdv: "—", status: "bilan planifié" },
    { id: "af6", parent: "Hélène Noa", child: "Christelle Noa", level: "3e", subject: "Français", teacher: "—", nextRdv: "—", status: "nouveau" },
  ];

  try {
    // Récupère les demandes avec leur assignment et la prochaine session à venir
    const [rows] = await pool.query(
      `SELECT
         r.id,
         r.parent_name,
         r.child_name,
         r.level,
         r.subject,
         r.status          AS request_status,
         a.selected_teacher,
         a.status          AS assignment_status,
         MIN(CASE WHEN DATE(s.session_date) >= CURDATE() THEN s.session_date END) AS next_date,
         MIN(CASE WHEN DATE(s.session_date) >= CURDATE() THEN s.session_time  END) AS next_time
       FROM requests r
       LEFT JOIN assignments a
              ON a.child_name = r.child_name AND a.level = r.level
       LEFT JOIN sessions s
              ON s.student_name = r.child_name AND s.parent_name = r.parent_name
       GROUP BY r.id, r.parent_name, r.child_name, r.level, r.subject, r.status,
                a.selected_teacher, a.assignment_status
       ORDER BY r.request_date DESC`
    );

    const families = rows.map((row) => {
      // Calcule le statut métier
      let status = "nouveau";
      if (row.assignment_status === "confirmed" && row.selected_teacher) {
        status = "suivi actif";
      } else if (
        row.assignment_status === "pending" ||
        row.request_status === "en traitement"
      ) {
        status = "matching";
      } else if (row.request_status === "assign�") {
        status = "bilan planifié";
      }

      // Formate la prochaine date RDV
      let nextRdv = "—";
      if (row.next_date) {
        try {
          const d = new Date(row.next_date);
          nextRdv = d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
          if (row.next_time) {
            const timePart = String(row.next_time).substring(0, 5);
            nextRdv += ` ${timePart}`;
          }
        } catch {
          nextRdv = "—";
        }
      }

      return {
        id: row.id,
        parent: row.parent_name,
        child: row.child_name,
        level: row.level,
        subject: row.subject || undefined,
        teacher: row.selected_teacher || "—",
        nextRdv,
        status,
      };
    });

    res.json(families);
  } catch (error) {
    if (isDbConnectionError(error)) {
      console.warn("DB indisponible, retour des familles mock.", error.message);
      return res.json(FALLBACK);
    }
    console.error("Failed to fetch advisor families", error);
    // En cas d'erreur SQL (ex: table inexistante), on retourne le fallback 
    return res.json(FALLBACK);
  }
});

// ==========================================
// ADMIN DASHBOARD
// ==========================================

app.get("/api/admin/dashboard", authenticateRequest, async (req, res) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Accès réservé aux administrateurs." });
  }
  try {
    await Promise.all([ensureUsersTable(), ensureRequestsTable(), ensureTeacherFeedbackTable(), ensureParentInvoicesTable()]);

    const [[teachersRow]] = await pool.query("SELECT COUNT(*) as count FROM users WHERE role = 'teacher'");
    const [[studentsRow]] = await pool.query("SELECT COUNT(*) as count FROM users WHERE role = 'student'");
    const [requestStatusRows] = await pool.query("SELECT status FROM requests");
    const [[familiesRow]] = await pool.query(
      "SELECT COUNT(*) as count FROM requests WHERE YEAR(request_date) = YEAR(CURDATE()) AND MONTH(request_date) = MONTH(CURDATE())"
    );
    const [[ratingRow]] = await pool.query("SELECT AVG(rating) as avgRating FROM teacher_feedback");

    const [invoiceRows] = await pool.query(
      `SELECT DATE_FORMAT(invoice_date, '%Y-%m') AS month_key, SUM(amount) AS total_amount
       FROM parent_invoices
       WHERE invoice_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
       GROUP BY month_key`
    );
    const revenueMap = new Map(invoiceRows.map((row) => [row.month_key, Number(row.total_amount) || 0]));
    const monthlyRevenue = [];
    for (let i = 5; i >= 0; i -= 1) {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setMonth(date.getMonth() - i);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const label = new Intl.DateTimeFormat("fr-FR", { month: "short" }).format(date);
      monthlyRevenue.push({
        month: label.charAt(0).toUpperCase() + label.slice(1),
        amount: revenueMap.get(key) ?? 0,
      });
    }

    const currentRevenue = monthlyRevenue[monthlyRevenue.length - 1]?.amount ?? 0;
    const previousRevenue = monthlyRevenue.length > 1 ? monthlyRevenue[monthlyRevenue.length - 2].amount : 0;

    const pendingRequests = requestStatusRows.filter((row) => {
      const status = normalizeRequestStatus(row.status);
      return status === "reçu" || status === "en traitement";
    }).length;

    const [latestRequestRows] = await pool.query(
      `SELECT id, parent_name, child_name, level, subject, phone, status, request_date
       FROM requests
       ORDER BY request_date DESC
       LIMIT 10`
    );

    res.json({
      stats: {
        totalTeachers: teachersRow?.count ?? 0,
        activeStudents: studentsRow?.count ?? 0,
        pendingRequests,
        monthlyRevenue: currentRevenue,
        previousRevenue,
        satisfactionRate: Number(ratingRow?.avgRating ?? 0),
        newFamiliesThisMonth: familiesRow?.count ?? 0,
      },
      monthlyRevenue,
      latestRequests: latestRequestRows.map(mapRequestRow),
    });
  } catch (error) {
    console.error("Failed to fetch admin dashboard", error);
    res.status(500).json({ message: "Impossible de récupérer les statistiques administrateur." });
  }
});



// ==========================================
// AUTH & USERS
// ==========================================

const ensureUsersTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role ENUM('admin','teacher','parent','advisor','student') NOT NULL,
      avatar VARCHAR(10),
      phone VARCHAR(50),
      location VARCHAR(120),
      timezone VARCHAR(64) NOT NULL DEFAULT 'Africa/Douala',
      language VARCHAR(10) NOT NULL DEFAULT 'fr',
      bio TEXT NULL,
      notify_email TINYINT(1) NOT NULL DEFAULT 1,
      notify_sms TINYINT(1) NOT NULL DEFAULT 0,
      notify_whatsapp TINYINT(1) NOT NULL DEFAULT 0,
      parent_id VARCHAR(255) DEFAULT NULL,
      last_login_at TIMESTAMP NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_parent FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  const ensureColumn = async (column, ddl) => {
    const [cols] = await pool.query("SHOW COLUMNS FROM users LIKE ?", [column]);
    if (cols.length === 0) {
      await pool.query(`ALTER TABLE users ADD COLUMN ${column} ${ddl}`);
      console.log(`Migration: Added ${column} to users table`);
    }
  };

  try {
    await ensureColumn("parent_id", "VARCHAR(255) DEFAULT NULL");
    await ensureColumn("location", "VARCHAR(120) NULL");
    await ensureColumn("timezone", "VARCHAR(64) NOT NULL DEFAULT 'Africa/Douala'");
    await ensureColumn("language", "VARCHAR(10) NOT NULL DEFAULT 'fr'");
    await ensureColumn("bio", "TEXT NULL");
    await ensureColumn("notify_email", "TINYINT(1) NOT NULL DEFAULT 1");
    await ensureColumn("notify_sms", "TINYINT(1) NOT NULL DEFAULT 0");
    await ensureColumn("notify_whatsapp", "TINYINT(1) NOT NULL DEFAULT 0");
    await ensureColumn("last_login_at", "TIMESTAMP NULL");
    await ensureColumn("created_at", "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP");
    await ensureColumn("updated_at", "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
  } catch (err) {
    console.warn("Migration skip for users table", err.message);
  }

  const [rows] = await pool.query("SELECT COUNT(*) as count FROM users");
  if (rows[0].count === 0) {
    const MOCK_USERS = [
      {
        id: "a1",
        name: "Directeur Ngono",
        email: "admin@care4success.cm",
        password: "admin123",
        role: "admin",
        avatar: "DN",
        phone: "+237 675 252 048",
        parentId: null,
        location: "Douala, Cameroun",
        timezone: "Africa/Douala",
        language: "fr",
        bio: "Direction Care4Success et coordination des pôles pédagogiques.",
        notifyEmail: 1,
        notifySms: 1,
        notifyWhatsapp: 0
      },
      {
        id: "t1",
        name: "Dr. Clémentine Abanda",
        email: "prof@care4success.cm",
        password: "prof123",
        role: "teacher",
        avatar: "CA",
        phone: "+237 699 001 122",
        parentId: null,
        location: "Bonapriso, Douala",
        timezone: "Africa/Douala",
        language: "fr",
        bio: "Spécialiste Mathématiques & Physique, 12 ans d'expérience.",
        notifyEmail: 1,
        notifySms: 0,
        notifyWhatsapp: 0
      },
      {
        id: "p1",
        name: "Aminata Diallo",
        email: "parent@care4success.cm",
        password: "parent123",
        role: "parent",
        avatar: "AD",
        phone: "+237 677 334 455",
        parentId: null,
        location: "Akwa Nord, Douala",
        timezone: "Africa/Douala",
        language: "fr",
        bio: "Parent coordinatrice du suivi pédagogique de Koffi.",
        notifyEmail: 1,
        notifySms: 1,
        notifyWhatsapp: 0
      },
      {
        id: "c1",
        name: "Brice Owona",
        email: "conseiller@care4success.cm",
        password: "conseil123",
        role: "advisor",
        avatar: "BO",
        phone: "+237 691 556 677",
        parentId: null,
        location: "Bastos, Yaoundé",
        timezone: "Africa/Douala",
        language: "fr",
        bio: "Conseiller pédagogique senior en charge des familles premium.",
        notifyEmail: 1,
        notifySms: 1,
        notifyWhatsapp: 1
      },
      {
        id: "s1",
        name: "Koffi Diallo",
        email: "eleve@care4success.cm",
        password: "eleve123",
        role: "student",
        avatar: "KD",
        phone: "+237 697 889 900",
        parentId: "p1",
        location: "Akwa Nord, Douala",
        timezone: "Africa/Douala",
        language: "fr",
        bio: "Élève de 3e préparant le BEPC.",
        notifyEmail: 1,
        notifySms: 0,
        notifyWhatsapp: 0
      }
    ];
    for (const u of MOCK_USERS) {
      const hashedPassword = bcrypt.hashSync(u.password, 10);
      await pool.query(
        `INSERT INTO users
          (id, name, email, password, role, avatar, phone, location, timezone, language, bio, notify_email, notify_sms, notify_whatsapp, parent_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          u.id,
          u.name,
          u.email,
          hashedPassword,
          u.role,
          u.avatar,
          u.phone,
          u.location,
          u.timezone,
          u.language,
          u.bio,
          u.notifyEmail,
          u.notifySms,
          u.notifyWhatsapp,
          u.parentId
        ]
      );
    }
  }
};

app.post("/api/auth/register", async (req, res) => {
  const {
    name,
    email,
    password,
    role,
    phone,
    avatar,
    location,
    timezone = "Africa/Douala",
    language = "fr",
    bio,
    notifyEmail = true,
    notifySms = false,
    notifyWhatsapp = false,
    childrenIds = [],
    parentIds = [],
    teacherIds = [],
    studentIds = [],
  } = req.body ?? {};

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: "Nom, email, mot de passe et rôle sont obligatoires." });
  }
  if (!allowedUserRoles.has(role)) {
    return res.status(400).json({ message: "Rôle utilisateur invalide." });
  }

  try {
    await ensureUsersTable();
    const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: "Cet email est déjà utilisé." });
    }

    const userId = crypto.randomUUID();
    const hashedPassword = bcrypt.hashSync(password, 10);
    const inferredAvatar = (avatar || name || "C4")
      .split(" ")
      .map((part) => part?.[0] ?? "")
      .join("")
      .slice(0, 2)
      .toUpperCase() || "C4";

    await pool.query(
      `INSERT INTO users
        (id, name, email, password, role, avatar, phone, location, timezone, language, bio, notify_email, notify_sms, notify_whatsapp, parent_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
      [
        userId,
        name.trim(),
        email.trim(),
        hashedPassword,
        role,
        inferredAvatar,
        phone || null,
        location || null,
        timezone || "Africa/Douala",
        language || "fr",
        bio || null,
        notifyEmail ? 1 : 0,
        notifySms ? 1 : 0,
        notifyWhatsapp ? 1 : 0,
      ]
    );

    const linkOps = [];
    if (role === "parent" && Array.isArray(childrenIds)) {
      childrenIds.forEach((childId) => linkOps.push(linkParentChild(userId, childId)));
    }
    if (role === "student") {
      if (Array.isArray(parentIds)) {
        parentIds.forEach((pid) => linkOps.push(linkParentChild(pid, userId)));
      }
      if (Array.isArray(teacherIds)) {
        teacherIds.forEach((tid) => linkOps.push(linkStudentTeacherRelation(userId, tid)));
      }
    }
    if (role === "teacher" && Array.isArray(studentIds)) {
      studentIds.forEach((sid) => linkOps.push(linkStudentTeacherRelation(sid, userId)));
    }
    if (linkOps.length) {
      await Promise.all(linkOps);
    }

    const [rows] = await pool.query(
      `SELECT ${USER_PUBLIC_COLUMNS}
       FROM users
       WHERE id = ?`,
      [userId]
    );
    const safeUser = mapUserRow(rows[0]);
    const token = generateToken(safeUser);
    res.status(201).json({ token, user: safeUser });
  } catch (error) {
    console.error("Failed to register user", error);
    res.status(500).json({ message: "Impossible de créer le compte." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email et mot de passe requis." });
  }

  try {
    await ensureUsersTable();
    const [rows] = await pool.query(
      `SELECT ${USER_PUBLIC_COLUMNS}, password
       FROM users
       WHERE email = ?`,
      [email]
    );
    if (rows.length === 0) {
      return res.status(401).json({ message: "Email ou mot de passe incorrect." });
    }
    const user = rows[0];
    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Email ou mot de passe incorrect." });
    }
    await pool.query("UPDATE users SET last_login_at = NOW() WHERE id = ?", [user.id]);
    const safeUser = mapUserRow(user);
    const token = generateToken(safeUser);
    res.json({ token, user: safeUser });
  } catch (error) {
    console.error("Failed to login", error);
    res.status(500).json({ message: "Erreur serveur lors de la connexion." });
  }
});

app.get("/api/users/:userId", authenticateRequest, async (req, res) => {
  const { userId } = req.params;
  if (req.user?.sub !== userId && req.user?.role !== "admin") {
    return res.status(403).json({ message: "Accès refusé." });
  }
  try {
    await ensureUsersTable();
    const [rows] = await pool.query(
      `SELECT u.*, u.avatar_url, 
              t.bank_name, t.bank_iban, t.bank_account_holder, t.availability_json
       FROM users u
       LEFT JOIN teachers t ON t.id = u.id
       WHERE u.id = ?`,
      [userId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Utilisateur introuvable." });
    }
    res.json(mapUserRow(rows[0]));
  } catch (error) {
    console.error("Failed to fetch user profile", error);
    res.status(500).json({ message: "Impossible de récupérer le profil utilisateur." });
  }
});

app.get("/api/users", authenticateRequest, async (req, res) => {
  try {
    await ensureUsersTable();
    const { role } = req.query ?? {};
    const clauses = [];
    const params = [];
    if (role && typeof role === "string") {
      if (!allowedUserRoles.has(role)) {
        return res.status(400).json({ message: "Rôle invalide." });
      }
      clauses.push("role = ?");
      params.push(role);
    }
    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    const [rows] = await pool.query(
      `SELECT ${USER_PUBLIC_COLUMNS}
       FROM users
       ${where}
       ORDER BY name ASC`,
      params
    );
    res.json(rows.map(mapUserRow));
  } catch (error) {
    console.error("Failed to list users", error);
    res.status(500).json({ message: "Impossible de récupérer les utilisateurs." });
  }
});

// Avatar photo upload
app.post("/api/users/:userId/avatar", upload.single("avatar"), async (req, res) => {
  const { userId } = req.params;
  if (!req.file) {
    return res.status(400).json({ message: "Aucune image reçue." });
  }
  try {
    const protocol = req.protocol;
    const host = req.get("host");
    const avatarUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
    // Ensure avatar_url column exists
    const [cols] = await pool.query("SHOW COLUMNS FROM users LIKE 'avatar_url'");
    if (cols.length === 0) {
      await pool.query("ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500) NULL");
    }
    await pool.query("UPDATE users SET avatar_url = ?, updated_at = NOW() WHERE id = ?", [avatarUrl, userId]);
    // Return full user to refresh frontend
    const [rows] = await pool.query(`SELECT ${USER_PUBLIC_COLUMNS}, avatar_url FROM users WHERE id = ?`, [userId]);
    const u = rows[0] ? { ...mapUserRow(rows[0]), avatarUrl } : { avatarUrl };
    res.json(u);
  } catch (error) {
    console.error("Avatar upload error", error);
    res.status(500).json({ message: "Impossible d'enregistrer l'avatar." });
  }
});

app.put("/api/users/:userId", authenticateRequest, async (req, res) => {
  const { userId } = req.params;
  if (req.user?.sub !== userId && req.user?.role !== "admin") {
    return res.status(403).json({ message: "Accès refusé." });
  }
  const {
    name,
    phone,
    avatar,
    location,
    timezone,
    language,
    bio,
    notifyEmail,
    notifySms,
    notifyWhatsapp,
    bankName,
    bankIban,
    bankAccountHolder,
    availability,
  } = req.body ?? {};

  const allowedLanguages = new Set(["fr", "en"]);
  if (language && !allowedLanguages.has(language)) {
    return res.status(400).json({ message: "Langue non supportée." });
  }
  if (typeof name === "string" && !name.trim()) {
    return res.status(400).json({ message: "Le nom ne peut pas être vide." });
  }

  const updates = [];
  const params = [];

  const pushUpdate = (column, value) => {
    updates.push(`${column} = ?`);
    params.push(value);
  };

  if (typeof name === "string") pushUpdate("name", name.trim());
  if (typeof phone === "string") pushUpdate("phone", phone.trim());
  if (typeof avatar === "string") pushUpdate("avatar", avatar.trim().slice(0, 2).toUpperCase());
  if (typeof location === "string") pushUpdate("location", location.trim());
  if (typeof timezone === "string") pushUpdate("timezone", timezone.trim());
  if (typeof language === "string") pushUpdate("language", language);
  if (typeof bio === "string") pushUpdate("bio", bio.trim());
  if (typeof notifyEmail === "boolean") pushUpdate("notify_email", notifyEmail ? 1 : 0);
  if (typeof notifySms === "boolean") pushUpdate("notify_sms", notifySms ? 1 : 0);
  if (typeof notifyWhatsapp === "boolean") pushUpdate("notify_whatsapp", notifyWhatsapp ? 1 : 0);

  if (updates.length === 0) {
    return res.status(400).json({ message: "Aucun champ à mettre à jour." });
  }

  try {
    await ensureUsersTable();
    const [result] = await pool.query(
      `UPDATE users
       SET ${updates.join(", ")}
       WHERE id = ?`,
      [...params, userId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Utilisateur introuvable." });
    }

    // Update teacher info if it's a teacher
    const [[userRoleRow]] = await pool.query("SELECT role FROM users WHERE id = ?", [userId]);
    if (userRoleRow?.role === 'teacher') {
      const teacherUpdates = [];
      const teacherParams = [];
      if (typeof bankName === "string") { teacherUpdates.push("bank_name = ?"); teacherParams.push(bankName); }
      if (typeof bankIban === "string") { teacherUpdates.push("bank_iban = ?"); teacherParams.push(bankIban); }
      if (typeof bankAccountHolder === "string") { teacherUpdates.push("bank_account_holder = ?"); teacherParams.push(bankAccountHolder); }
      if (availability && Array.isArray(availability)) { teacherUpdates.push("availability_json = ?"); teacherParams.push(JSON.stringify(availability)); }

      if (teacherUpdates.length > 0) {
        await pool.query(
          `UPDATE teachers SET ${teacherUpdates.join(", ")} WHERE id = ?`,
          [...teacherParams, userId]
        );
      }
    }

    const [rows] = await pool.query(
      `SELECT u.*, u.avatar_url, 
              t.bank_name, t.bank_iban, t.bank_account_holder, t.availability_json
       FROM users u
       LEFT JOIN teachers t ON t.id = u.id
       WHERE u.id = ?`,
      [userId]
    );
    res.json(mapUserRow(rows[0]));
  } catch (error) {
    console.error("Failed to update user profile", error);
    res.status(500).json({ message: "Impossible de mettre à jour le profil." });
  }
});

app.patch("/api/users/:userId/password", authenticateRequest, async (req, res) => {
  const { userId } = req.params;
  if (req.user?.sub !== userId && req.user?.role !== "admin") {
    return res.status(403).json({ message: "Accès refusé." });
  }
  const { currentPassword, newPassword } = req.body ?? {};

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: "Mot de passe actuel et nouveau mot de passe requis." });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ message: "Le nouveau mot de passe doit contenir au moins 8 caractères." });
  }

  try {
    await ensureUsersTable();
    const [rows] = await pool.query(
      "SELECT id, password FROM users WHERE id = ?",
      [userId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Utilisateur introuvable." });
    }
    const user = rows[0];
    const isMatch = bcrypt.compareSync(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Mot de passe actuel incorrect." });
    }
    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    await pool.query(
      "UPDATE users SET password = ? WHERE id = ?",
      [hashedPassword, userId]
    );
    res.json({ success: true });
  } catch (error) {
    console.error("Failed to update password", error);
    res.status(500).json({ message: "Impossible de mettre à jour le mot de passe." });
  }
});

app.get("/api/relationships/parent-child", authenticateRequest, async (req, res) => {
  const { parentId, childId } = req.query ?? {};
  if (!parentId && !childId) {
    return res.status(400).json({ message: "parentId ou childId est requis." });
  }
  try {
    await ensureParentChildTable();
    if (parentId) {
      const [rows] = await pool.query(
        `SELECT u.id, u.name, u.email, u.role, u.avatar, u.phone, u.location, u.timezone, u.language, u.bio,
                u.notify_email, u.notify_sms, u.notify_whatsapp, u.parent_id, u.last_login_at, u.created_at, u.updated_at
         FROM parent_child pc
         JOIN users u ON u.id = pc.child_id
         WHERE pc.parent_id = ?`,
        [parentId]
      );
      return res.json(rows.map(mapUserRow));
    }
    const [rows] = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.avatar, u.phone, u.location, u.timezone, u.language, u.bio,
              u.notify_email, u.notify_sms, u.notify_whatsapp, u.parent_id, u.last_login_at, u.created_at, u.updated_at
       FROM parent_child pc
       JOIN users u ON u.id = pc.parent_id
       WHERE pc.child_id = ?`,
      [childId]
    );
    res.json(rows.map(mapUserRow));
  } catch (error) {
    console.error("Failed to fetch parent-child relationships ERROR:", error);
    res.status(500).json({ message: "Impossible de récupérer les liaisons parent/enfant.", error: error.message });
  }
});

app.post("/api/relationships/parent-child", authenticateRequest, async (req, res) => {
  const { parentId, childId } = req.body ?? {};
  if (!parentId || !childId) {
    return res.status(400).json({ message: "parentId et childId sont requis." });
  }
  try {
    await linkParentChild(parentId, childId);
    res.status(201).json({ parentId, childId });
  } catch (error) {
    console.error("Failed to link parent-child", error);
    res.status(500).json({ message: "Impossible de créer la liaison parent/enfant." });
  }
});

app.delete("/api/relationships/parent-child", authenticateRequest, async (req, res) => {
  const { parentId, childId } = req.body ?? {};
  if (!parentId || !childId) {
    return res.status(400).json({ message: "parentId et childId sont requis." });
  }
  try {
    await unlinkParentChild(parentId, childId);
    res.json({ success: true });
  } catch (error) {
    console.error("Failed to unlink parent-child", error);
    res.status(500).json({ message: "Impossible de supprimer la liaison parent/enfant." });
  }
});

app.get("/api/relationships/student-teacher", authenticateRequest, async (req, res) => {
  const { studentId, teacherId } = req.query ?? {};
  if (!studentId && !teacherId) {
    return res.status(400).json({ message: "studentId ou teacherId est requis." });
  }
  try {
    await ensureStudentTeacherTable();
    if (studentId) {
      const [rows] = await pool.query(
        `SELECT u.id, u.name, u.email, u.role, u.avatar, u.phone, u.location, u.timezone, u.language, u.bio,
                u.notify_email, u.notify_sms, u.notify_whatsapp, u.parent_id, u.last_login_at, u.created_at, u.updated_at
         FROM student_teacher st
         JOIN users u ON u.id = st.teacher_id
         WHERE st.student_id = ?`,
        [studentId]
      );
      return res.json(rows.map(mapUserRow));
    }
    const [rows] = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.avatar, u.phone, u.location, u.timezone, u.language, u.bio,
              u.notify_email, u.notify_sms, u.notify_whatsapp, u.parent_id, u.last_login_at, u.created_at, u.updated_at
       FROM student_teacher st
       JOIN users u ON u.id = st.student_id
       WHERE st.teacher_id = ?`,
      [teacherId]
    );
    res.json(rows.map(mapUserRow));
  } catch (error) {
    console.error("Failed to fetch student-teacher relationships", error);
    res.status(500).json({ message: "Impossible de récupérer les liaisons élèves/enseignants." });
  }
});

app.post("/api/relationships/student-teacher", authenticateRequest, async (req, res) => {
  const { studentId, teacherId } = req.body ?? {};
  if (!studentId || !teacherId) {
    return res.status(400).json({ message: "studentId et teacherId sont requis." });
  }
  try {
    await linkStudentTeacherRelation(studentId, teacherId);
    res.status(201).json({ studentId, teacherId });
  } catch (error) {
    console.error("Failed to link student-teacher", error);
    res.status(500).json({ message: "Impossible de créer la liaison élève/enseignant." });
  }
});

app.delete("/api/relationships/student-teacher", authenticateRequest, async (req, res) => {
  const { studentId, teacherId } = req.body ?? {};
  if (!studentId || !teacherId) {
    return res.status(400).json({ message: "studentId et teacherId sont requis." });
  }
  try {
    await unlinkStudentTeacherRelation(studentId, teacherId);
    res.json({ success: true });
  } catch (error) {
    console.error("Failed to unlink student-teacher", error);
    res.status(500).json({ message: "Impossible de supprimer la liaison élève/enseignant." });
  }
});

// ==========================================
// NOTES & PROGRESSIONS (DB/MOCK)
// ==========================================

const studentProgressData = [
  { month: "Oct", maths: 8, francais: 11, anglais: 12, histgeo: 10, svt: 9 },
  { month: "Nov", maths: 9, francais: 11, anglais: 13, histgeo: 11, svt: 10 },
  { month: "Déc", maths: 10, francais: 12, anglais: 13, histgeo: 12, svt: 10 },
  { month: "Jan", maths: 12, francais: 13, anglais: 14, histgeo: 12, svt: 11 },
  { month: "Fév", maths: 13, francais: 13, anglais: 14, histgeo: 12, svt: 11 },
  { month: "Mar", maths: 14.5, francais: 14, anglais: 15, histgeo: 12.5, svt: 11 }
];

const studentGrades = [
  {
    subject: "Mathématiques", teacher: "Dr. Clémentine Abanda", coefficient: 5, avg: 14.5,
    history: [{ date: "Oct", note: 8 }, { date: "Nov", note: 9 }, { date: "Déc", note: 10 }, { date: "Jan", note: 12 }, { date: "Fév", note: 13 }, { date: "Mar", note: 14.5 }],
    exams: [
      { label: "DS n°1", date: "15/10", note: 8, max: 20 },
      { label: "Interrogation", date: "12/11", note: 10, max: 20 },
      { label: "DS n°2", date: "10/12", note: 11, max: 20 },
      { label: "Devoir maison", date: "20/01", note: 15, max: 20 },
      { label: "DS n°3", date: "18/02", note: 14, max: 20 }
    ],
    trend: "+6.5 pts", color: "#1A6CC8"
  },
  {
    subject: "Français", teacher: "M. Essomba Paul", coefficient: 4, avg: 14.0,
    history: [{ date: "Oct", note: 11 }, { date: "Nov", note: 11 }, { date: "Déc", note: 12 }, { date: "Jan", note: 13 }, { date: "Fév", note: 13 }, { date: "Mar", note: 14 }],
    exams: [
      { label: "Rédaction n°1", date: "20/10", note: 11, max: 20 },
      { label: "Dict. / Gram.", date: "14/11", note: 12, max: 20 },
      { label: "Commentaire", date: "15/12", note: 13, max: 20 }
    ],
    trend: "+3 pts", color: "#F5A623"
  },
  {
    subject: "Anglais", teacher: "Rebecca Ateba", coefficient: 3, avg: 15.0,
    history: [{ date: "Oct", note: 12 }, { date: "Nov", note: 13 }, { date: "Déc", note: 13 }, { date: "Jan", note: 14 }, { date: "Fév", note: 14 }, { date: "Mar", note: 15 }],
    exams: [
      { label: "Oral n°1", date: "10/11", note: 13, max: 20 },
      { label: "Compréhension", date: "12/12", note: 14, max: 20 },
      { label: "Oral n°2", date: "15/02", note: 15, max: 20 }
    ],
    trend: "+3 pts", color: "#22c55e"
  },
  {
    subject: "Histoire-Géo", teacher: "Mme. Nkengne Claire", coefficient: 3, avg: 12.5,
    history: [{ date: "Oct", note: 10 }, { date: "Nov", note: 11 }, { date: "Déc", note: 12 }, { date: "Jan", note: 12 }, { date: "Fév", note: 12 }, { date: "Mar", note: 12.5 }],
    exams: [
      { label: "DS n°1", date: "08/11", note: 11, max: 20 },
      { label: "DS n°2", date: "16/01", note: 12, max: 20 }
    ],
    trend: "+2.5 pts", color: "#a855f7"
  },
  {
    subject: "SVT", teacher: "M. Tchamba René", coefficient: 3, avg: 11.0,
    history: [{ date: "Oct", note: 9 }, { date: "Nov", note: 10 }, { date: "Déc", note: 10 }, { date: "Jan", note: 11 }, { date: "Fév", note: 11 }, { date: "Mar", note: 11 }],
    exams: [
      { label: "TP n°1", date: "05/11", note: 10, max: 20 },
      { label: "DS n°1", date: "18/12", note: 11, max: 20 }
    ],
    trend: "+2 pts", color: "#ef4444"
  }
];

app.get("/api/parents/:parentId/overview", async (req, res) => {
  const { parentId } = req.params;
  try {
    const [[parent]] = await pool.query("SELECT name FROM users WHERE id = ?", [parentId]);
    if (!parent) return res.status(404).json({ message: "Parent introuvable." });

    const [[student]] = await pool.query("SELECT id, name FROM users WHERE parent_id = ? AND role = 'student' LIMIT 1", [parentId]);
    const childName = student?.name || "Enfant";
    const [requests] = await pool.query("SELECT level, subject FROM requests WHERE parent_name = ? LIMIT 1", [parent.name]);
    const childLevel = requests[0]?.level || "N/A";

    let latestEvaluations = [];
    let currentAvg = 14.5;

    if (student) {
      const [attempts] = await pool.query(
        `SELECT a.id, q.title as quizTitle, c.title as courseTitle, q.subject, a.score, q.total_points as totalPoints, a.created_at as createdAt
         FROM quiz_attempts a
         JOIN quizzes q ON q.id = a.quiz_id
         JOIN courses c ON c.id = q.course_id
         WHERE a.student_id = ?
         ORDER BY a.created_at DESC LIMIT 3`, [student.id]
      );
      latestEvaluations = attempts;
      if (attempts.length > 0) {
        const sum = attempts.reduce((acc, curr) => acc + (Number(curr.score) / Number(curr.totalPoints || 20)) * 20, 0);
        currentAvg = Number((sum / attempts.length).toFixed(1));
      }
    }

    const [[upcoming]] = await pool.query(
      "SELECT DATE_FORMAT(session_date, '%d/%m') as date, session_time as time FROM sessions WHERE parent_id = ? AND session_date >= CURDATE() ORDER BY session_date ASC LIMIT 1", [parentId]
    );

    const [[{ sessionsThisMonth }]] = await pool.query(
      "SELECT COUNT(*) as count FROM sessions WHERE parent_id = ? AND MONTH(session_date) = MONTH(CURDATE())", [parentId]
    );

    res.json({
      childName,
      childLevel,
      currentAvg,
      previousAvg: 11.8,
      focusSubject: requests[0]?.subject || "Mathématiques",
      sessionsThisMonth: sessionsThisMonth || 0,
      totalPaidThisMonth: (sessionsThisMonth || 0) * 15000,
      latestEvaluations,
      upcomingSession: upcoming || null,
      pendingInvoice: sessionsThisMonth > 0 ? { description: "Mensualité Mars", amount: sessionsThisMonth * 15000 } : null
    });
  } catch (error) {
    console.error("Parent overview error", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

app.get("/api/parents/:parentId/invoices", async (req, res) => {
  const { parentId } = req.params;
  try {
    const [[{ sessionsThisMonth }]] = await pool.query(
      "SELECT COUNT(*) as count FROM sessions WHERE parent_id = ? AND status = 'effectué�'", [parentId]
    );
    const count = sessionsThisMonth || 0;

    // Simulation d'une liste de factures basées sur les données
    const invoices = [
      { id: "INV-2026-001", date: "2026-03-01", description: "Frais de scolarité Mars", amount: count * 15000, status: count > 0 ? "pending" : "paid" },
      { id: "INV-2026-000", date: "2026-02-01", description: "Frais de scolarité Février", amount: 45000, status: "paid" }
    ];
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur." });
  }
});

app.get("/api/parents/:parentId/progress-report", async (req, res) => {
  const { parentId } = req.params;
  try {
    const [[parent]] = await pool.query("SELECT name FROM users WHERE id = ?", [parentId]);
    if (!parent) return res.status(404).json({ message: "Parent introuvable." });

    // Déduction de l'élève par lien parent_id
    const [[student]] = await pool.query("SELECT id, name FROM users WHERE parent_id = ? AND role = 'student' LIMIT 1", [parentId]);
    const childName = student?.name;

    let grades = [];
    if (student) {
      const [attempts] = await pool.query(
        `SELECT q.subject, AVG(a.score) as average, COUNT(*) as count
         FROM quiz_attempts a
         JOIN quizzes q ON q.id = a.quiz_id
         WHERE a.student_id = ?
         GROUP BY q.subject`, [student.id]
      );
      grades = attempts;
    }

    res.json({
      parentName: parent.name,
      childName: childName || "N/A",
      reportDate: new Date().toLocaleDateString('fr-FR'),
      grades: grades.length > 0 ? grades : [
        { subject: "Mathématiques", average: 14.5, count: 5 },
        { subject: "Français", average: 12.0, count: 3 },
        { subject: "Anglais", average: 15.5, count: 4 }
      ],
      attendance: 95,
      teacherComments: "Une progression constante et une excellente participation aux sessions live."
    });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur." });
  }
});

app.get("/api/teachers/:teacherId/earnings-history", async (req, res) => {
  const { teacherId } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT 
         DATE_FORMAT(s.session_date, '%Y-%m') as month,
         SUM(ROUND(IF(s.actual_start_time IS NOT NULL AND s.actual_end_time IS NOT NULL, TIMESTAMPDIFF(MINUTE, s.actual_start_time, s.actual_end_time) / 60, 2) * IFNULL(t.hourly_rate, 7500), 0)) as amount,
         COUNT(*) as sessions
       FROM sessions s
       JOIN teachers t ON t.id = s.teacher_id
       WHERE s.teacher_id = ? AND s.status = 'effectué'
       GROUP BY month
       ORDER BY month ASC`, [teacherId]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur." });
  }
});

app.get("/api/students/:studentId/overview", async (req, res) => {
  const { studentId } = req.params;
  try {
    const [[student]] = await pool.query("SELECT name FROM users WHERE id = ?", [studentId]);
    if (!student) return res.status(404).json({ message: "Élève introuvable." });

    const [[{ avgScore }]] = await pool.query("SELECT AVG(score) as avgScore FROM quiz_attempts WHERE student_id = ?", [studentId]);
    const [[session]] = await pool.query("SELECT teacher_name, subject FROM sessions WHERE student_id = ? LIMIT 1", [studentId]);

    res.json({
      name: student.name,
      level: "3e",
      currentAvg: avgScore ? Number((avgScore / 20 * 20).toFixed(1)) : 14.5,
      previousAvg: 11.8,
      teacher: session?.teacher_name || "Directeur Ngono",
      subject: session?.subject || "Mathématiques",
      streak: 6
    });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur." });
  }
});

app.get("/api/teachers/:teacherId/dashboard", async (req, res) => {
  const { teacherId } = req.params;
  try {
    const [[{ activeStudents }]] = await pool.query(
      "SELECT COUNT(DISTINCT student_id) as activeStudents FROM sessions WHERE teacher_id = ?", [teacherId]
    );
    const [[{ upcomingCount }]] = await pool.query(
      "SELECT COUNT(*) as upcomingCount FROM sessions WHERE teacher_id = ? AND status IN ('à venir', 'planifié') AND session_date >= CURDATE()", [teacherId]
    );

    // KPI: Devoirs rendus par les élèves mais non encore corrigés par ce tuteur
    const [[{ pendingHomework }]] = await pool.query(
      "SELECT COUNT(*) as pendingHomework FROM homework WHERE teacher_id = ? AND status = 'rendu'", [teacherId]
    );

    // KPI: Sessions effectuées mais sans rapport (report_text) ou note (understanding_score)
    const [[{ pendingReports }]] = await pool.query(
      "SELECT COUNT(*) as pendingReports FROM sessions WHERE teacher_id = ? AND status = 'effectué' AND (report_text IS NULL OR understanding_score IS NULL)", [teacherId]
    );

    // Calcul des revenus réels basés sur la durée et le statut effectuer (utilisant le taux du prof)
    const [[{ monthlyEarnings, totalEarnings }]] = await pool.query(
      `SELECT 
         IFNULL(SUM(ROUND(IF(s.actual_start_time IS NOT NULL AND s.actual_end_time IS NOT NULL, TIMESTAMPDIFF(MINUTE, s.actual_start_time, s.actual_end_time) / 60, 2) * IFNULL(t.hourly_rate, 7500), 0)), 0) as totalEarnings,
         IFNULL(SUM(IF(DATE_FORMAT(s.session_date, '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m'), ROUND(IF(s.actual_start_time IS NOT NULL AND s.actual_end_time IS NOT NULL, TIMESTAMPDIFF(MINUTE, s.actual_start_time, s.actual_end_time) / 60, 2) * IFNULL(t.hourly_rate, 7500), 0), 0)), 0) as monthlyEarnings
       FROM sessions s
       JOIN teachers t ON t.id = s.teacher_id
       WHERE s.teacher_id = ? AND s.status = 'effectué'`, 
      [teacherId]
    );
    const previousEarnings = totalEarnings - monthlyEarnings;

    const [[ratingRow]] = await pool.query(
      "SELECT AVG(rating) as avgRating FROM teacher_feedback WHERE teacher_id = ?", [teacherId]
    );
    const avgRating = ratingRow?.avgRating ? Number(ratingRow.avgRating).toFixed(1) : "5.0";

    const [scheduleRows] = await pool.query(
      "SELECT * FROM sessions WHERE teacher_id = ? AND status IN ('à venir', 'planifié') AND session_date >= CURDATE() ORDER BY session_date ASC, session_time ASC LIMIT 5", [teacherId]
    );

    const [studentBaseRows] = await pool.query(
      `SELECT DISTINCT 
         s.student_id as id, 
         s.student_name as name, 
         s.subject,
         u.bio as level
       FROM sessions s 
       LEFT JOIN users u ON u.id = s.student_id
       WHERE s.teacher_id = ?`, [teacherId]
    );

    const studentRows = await Promise.all(studentBaseRows.map(async (st) => {
      const [attempts] = await pool.query(
        `SELECT a.score, q.total_points, a.created_at
         FROM quiz_attempts a
         JOIN quizzes q ON q.id = a.quiz_id
         WHERE a.student_id = ?
         ORDER BY a.created_at DESC`, [st.id]
      );

      let avgGrade = "0.0"; // Dynamic default
      let trend = "+0.0";

      if (attempts.length > 0) {
        const scores20 = attempts.map(a => (a.score / (a.total_points || 20)) * 20);
        avgGrade = (scores20.reduce((a, b) => a + b, 0) / scores20.length).toFixed(1);
        
        if (attempts.length >= 2) {
          const last = scores20[0];
          const prev = scores20[1];
          const diff = last - prev;
          trend = (diff >= 0 ? "+" : "") + diff.toFixed(1);
        }
      }

      return {
        ...st,
        level: st.level || "3e",
        avgGrade,
        trend
      };
    }));

    res.json({
      stats: {
        activeStudents,
        upcomingSessions: upcomingCount,
        monthlyEarnings,
        previousEarnings,
        avgRating: Number(avgRating),
        pendingHomework: pendingHomework || 0,
        pendingReports: pendingReports || 0
      },
      schedule: scheduleRows.map(mapSessionRow),
      students: studentRows
    });
  } catch (error) {
    console.error("Teacher dashboard error", error);
    res.status(500).json({ message: error.message, stack: error.stack });
  }
});

app.get("/api/teachers/:teacherId/earnings", async (req, res) => {
  const { teacherId } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT 
          s.id, 
          s.session_date as date, 
          s.student_name as student, 
          ROUND(IF(s.actual_start_time IS NOT NULL AND s.actual_end_time IS NOT NULL, TIMESTAMPDIFF(MINUTE, s.actual_start_time, s.actual_end_time) / 60, 2), 1) as hours, 
          IFNULL(t.hourly_rate, 7500) as rate, 
          ROUND(IF(s.actual_start_time IS NOT NULL AND s.actual_end_time IS NOT NULL, TIMESTAMPDIFF(MINUTE, s.actual_start_time, s.actual_end_time) / 60, 2) * IFNULL(t.hourly_rate, 7500), 0) as amount, 
          IF(s.is_paid = 1, 'payé', 'en attente') as status 
       FROM sessions s
       JOIN teachers t ON t.id = s.teacher_id
       WHERE s.teacher_id = ? AND s.status = 'effectué' 
       ORDER BY s.session_date DESC`,
      [teacherId]
    );
    res.json(rows);
  } catch (error) {
    console.error("Earnings error", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

app.get("/api/teachers/:teacherId/students", async (req, res) => {
  const { teacherId } = req.params;
  try {
    await ensureStudentEvaluationsTable();
    const [students] = await pool.query(
      `SELECT DISTINCT 
          s.student_id as id, 
          s.student_name as name, 
          u.email,
          s.subject, 
          u.bio as level
       FROM sessions s
       LEFT JOIN users u ON u.id = s.student_id
       WHERE s.teacher_id = ?`,
      [teacherId]
    );

    const fullStudents = await Promise.all(students.map(async (st) => {
      // 1. Assiduité réelle
      const [[sessionStats]] = await pool.query(
        `SELECT 
           COUNT(id) as total,
           SUM(CASE WHEN status = 'effectué' THEN 1 ELSE 0 END) as done,
           MAX(session_date) as lastSessionDate
         FROM sessions 
         WHERE student_id = ? AND teacher_id = ?`,
        [st.id, teacherId]
      );

      const totalSessions = sessionStats?.total || 1;
      const assiduite = Math.round(((sessionStats?.done || 0) / totalSessions) * 100);
      const lastSessionStr = sessionStats?.lastSessionDate ? formatDate(sessionStats.lastSessionDate) : "À venir";

      // 2. Moyenne réelle depuis quiz_attempts ou student_progress_points
      const [quizAttempts] = await pool.query(
        `SELECT a.score, q.total_points, c.subject, a.created_at
         FROM quiz_attempts a
         JOIN quizzes q ON q.id = a.quiz_id
         LEFT JOIN courses c ON c.id = q.course_id
         WHERE a.student_id = ?
         ORDER BY a.created_at DESC`,
        [st.id]
      );

      let avgGrade = "0.0";
      let trendText = "+0.0";

      if (quizAttempts.length > 0) {
        const scores20 = quizAttempts.map(a => (Number(a.score) / Number(a.total_points || 20)) * 20);
        avgGrade = (scores20.reduce((a, b) => a + b, 0) / scores20.length).toFixed(1);

        if (scores20.length >= 2) {
          const diff = scores20[0] - scores20[1];
          trendText = (diff >= 0 ? "+" : "") + diff.toFixed(1);
        }
      } else {
        avgGrade = "0.0";
      }

      let lastScoreText = "À venir";
      let lastScoreSubject = st.subject || "Général";

      if (quizAttempts.length > 0) {
        const lastQ = quizAttempts[0];
        lastScoreText = `${lastQ.score}/${lastQ.total_points || 20}`;
        lastScoreSubject = lastQ.subject || st.subject;
      }

      // 3. Parcours réels (cours enrollés)
      const [courses] = await pool.query(
        `SELECT c.id, c.title, c.status
         FROM course_enrollments ce
         JOIN courses c ON c.id = ce.course_id
         WHERE ce.student_id = ?`,
        [st.id]
      );
      const courseList = courses.map(c => ({
        id: c.id,
        title: c.title,
        progress: 100,
        status: c.status === 'published' ? 'actif' : 'en attente',
        nextLesson: "À suivre"
      }));

      // 4. Quiz assignés
      const quizList = quizAttempts.slice(0, 5).map(a => ({
        id: a.id,
        title: "Quiz " + (a.subject || "Contrôle"),
        status: 'done',
        score: `${a.score}/${a.total_points || 20}`,
        lastAttempt: formatDate(a.created_at)
      }));

      // 5. Évaluations réelles
      const [evaluations] = await pool.query(
        `SELECT id, teacher_name as author, 'Enseignant' as role, rating, DATE_FORMAT(created_at, '%d/%m/%Y') as date, comment
         FROM student_evaluations
         WHERE student_id = ?
         ORDER BY created_at DESC`,
        [st.id]
      );

      return {
        ...st,
        avgGrade,
        trend: trendText,
        sessions: totalSessions,
        lastSession: lastSessionStr,
        profile: {
          highlights: [
            { label: 'Assiduité', value: `${assiduite}%`, sublabel: `Sur ${totalSessions} séances` },
            { label: 'Dernière note', value: lastScoreText, sublabel: lastScoreSubject }
          ],
          courses: courseList,
          quizzes: quizList,
          evaluations: evaluations
        }
      };
    }));

    res.json(fullStudents);
  } catch (error) {
    console.error("Teacher students error", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

app.post("/api/students/:studentId/evaluations", authenticateRequest, async (req, res) => {
  const { studentId } = req.params;
  const { teacherId, teacherName, rating, comment } = req.body;
  try {
    await ensureStudentEvaluationsTable();
    await pool.query(
      "INSERT INTO student_evaluations (student_id, teacher_id, teacher_name, rating, comment) VALUES (?, ?, ?, ?, ?)",
      [studentId, teacherId, teacherName, rating, comment]
    );
    res.status(201).json({ message: "Évaluation enregistrée avec succès." });
  } catch (error) {
    console.error("Student evaluation error:", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

app.get("/api/parents/:parentId/progress", async (req, res) => {
  const { parentId } = req.params;
  try {
    const [[student]] = await pool.query("SELECT id FROM users WHERE parent_id = ? AND role = 'student' LIMIT 1", [parentId]);
    if (!student) return res.json(studentProgressData);
    
    const [rows] = await pool.query(
      "SELECT month_label as month, maths, francais, anglais FROM student_progress_points WHERE student_id = ? ORDER BY month_order ASC",
      [student.id]
    );
    res.json(rows.length > 0 ? rows : studentProgressData);
  } catch (error) {
    console.error("Parent progress error", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

app.get("/api/students/:studentId/grades", async (req, res) => {
  const { studentId } = req.params;
  try {
    const [attempts] = await pool.query(
      `SELECT q.subject, a.score, q.total_points, a.created_at, u.name as teacher_name
       FROM quiz_attempts a
       JOIN quizzes q ON q.id = a.quiz_id
       JOIN sessions s ON s.student_id = a.student_id AND s.subject = q.subject
       JOIN users u ON u.id = s.teacher_id
       WHERE a.student_id = ?
       GROUP BY a.id`, [studentId]
    );

    if (attempts.length === 0) return res.json(studentGrades);

    const subjects = [...new Set(attempts.map(a => a.subject))];
    const dynamicGrades = subjects.map(sub => {
      const subAttempts = attempts.filter(a => a.subject === sub);
      const avg = subAttempts.reduce((acc, curr) => acc + (Number(curr.score) / Number(curr.total_points || 20)) * 20, 0) / subAttempts.length;
      return {
        subject: sub,
        teacher: subAttempts[0].teacher_name,
        coefficient: 4,
        avg: Number(avg.toFixed(1)),
        history: subAttempts.map(a => ({ date: new Date(a.created_at).toLocaleDateString('fr-FR', { month: 'short' }), note: (Number(a.score) / Number(a.total_points || 20)) * 20 })),
        exams: subAttempts.map(a => ({ label: "Quiz", date: new Date(a.created_at).toLocaleDateString('fr-FR'), note: a.score, max: a.total_points })),
        trend: "+0.5",
        color: sub === "Mathématiques" ? "#1A6CC8" : sub === "Français" ? "#F5A623" : "#22c55e"
      };
    });
    res.json(dynamicGrades);
  } catch (error) {
    res.json(studentGrades);
  }
});

app.get("/api/students/:studentId/progress", async (req, res) => {
  const { studentId } = req.params;
  try {
    await ensureStudentProgressPointsTable();
    const [rows] = await pool.query(
      "SELECT month_label as month, maths, francais, anglais FROM student_progress_points WHERE student_id = ? ORDER BY month_order ASC",
      [studentId]
    );
    if (rows.length > 0) return res.json(rows);
    
    // Fallback if no specific data for this student
    res.json(studentProgressData);
  } catch (error) {
    res.json(studentProgressData);
  }
});

app.get("/api/students/:studentId/sessions", async (req, res) => {
  const { studentId } = req.params;
  try {
    await ensureSessionsTable();
    const [rows] = await pool.query(
      "SELECT * FROM sessions WHERE student_id = ? ORDER BY session_date DESC",
      [studentId]
    );
    res.json(rows.map(mapSessionRow));
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

app.post("/api/grade-disputes", async (req, res) => {
  const { studentId, sessionId, reason } = req.body;
  if (!studentId || !sessionId || !reason) {
    return res.status(400).json({ message: " studentId, sessionId et reason sont requis." });
  }
  try {
    await ensureGradeDisputesTable();
    const id = crypto.randomUUID();
    await pool.query(
      "INSERT INTO grade_disputes (id, student_id, session_id, reason) VALUES (?, ?, ?, ?)",
      [id, studentId, sessionId, reason]
    );
    res.status(201).json({ id, status: "pending" });
  } catch (error) {
    console.error("Grade dispute error", error);
    res.status(500).json({ message: "Erreur serveur lors de la contestation." });
  }
});

app.get("/api/students/:studentId/homework", async (req, res) => {
  const { studentId } = req.params;
  try {
    const [rows] = await pool.query(
      "SELECT h.*, t.name as teacher_name FROM homework h LEFT JOIN teachers t ON h.teacher_id = t.id WHERE h.student_id = ? ORDER BY h.due_date ASC",
      [studentId]
    );
    res.json(rows.map(mapHomeworkRow));
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

app.get("/api/advisors/:advisorId/dashboard", async (req, res) => {
  const { advisorId } = req.params;
  try {
    const [[{ assignedFamilies }]] = await pool.query(
      "SELECT COUNT(DISTINCT student_id) as assignedFamilies FROM sessions"
    );
    const [[{ pendingRequests }]] = await pool.query(
      "SELECT COUNT(*) as pendingRequests FROM requests WHERE status = 'reçu'"
    );
    const [[{ matchingInProgress }]] = await pool.query(
      "SELECT COUNT(*) as matchingInProgress FROM assignments WHERE status = 'pending'"
    );
    const [[{ sessionsDone }]] = await pool.query(
      "SELECT COUNT(*) as count FROM sessions WHERE status = 'effectué�' AND MONTH(session_date) = MONTH(CURDATE())"
    );

    const [recentFamilies] = await pool.query(
      `SELECT DISTINCT 
          s.student_id as id, 
          s.student_name as child, 
          '3e' as level, 
          s.teacher_name as teacher, 
          'suivi actif' as status 
       FROM sessions s LIMIT 5`
    );

    const [recentRequests] = await pool.query(
      "SELECT id, parent_name as parent, child_name as child, level, subject, status, DATE_FORMAT(request_date, '%d/%m') as date FROM requests ORDER BY request_date DESC LIMIT 5"
    );

    res.json({
      stats: {
        assignedFamilies,
        pendingRequests,
        matchingInProgress,
        reportsThisMonth: sessionsDone || 0,
        avgResponseTime: "14h"
      },
      families: recentFamilies,
      requests: recentRequests
    });
  } catch (error) {
    console.error("Advisor dashboard error", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

app.get("/api/advisors/:advisorId/appointments", async (req, res) => {
  const { advisorId } = req.params;
  try {
    await ensureAdvisorAppointmentsTable();
    const [rows] = await pool.query(
      "SELECT id, contact_name as family, appointment_type as type, DATE_FORMAT(appointment_date, '%Y-%m-%d') as date, appointment_time as time, status FROM advisor_appointments WHERE advisor_id = ? ORDER BY appointment_date ASC, appointment_time ASC",
      [advisorId]
    );
    res.json(rows);
  } catch (error) {
    console.error("Failed to fetch advisor appointments", error);
    res.status(500).json({ message: "Erreur serveur lors de la récupération des rendez-vous." });
  }
});

app.post("/api/advisors/:advisorId/appointments", async (req, res) => {
  const { advisorId } = req.params;
  const { family, type, date, time } = req.body;
  if (!family || !type || !date || !time) {
    return res.status(400).json({ message: "Champs obligatoires manquants." });
  }
  try {
    await ensureAdvisorAppointmentsTable();
    const id = crypto.randomUUID();
    await pool.query(
      "INSERT INTO advisor_appointments (id, advisor_id, contact_name, appointment_type, appointment_date, appointment_time, status) VALUES (?, ?, ?, ?, ?, ?, 'planifié')",
      [id, advisorId, family, type, date, time]
    );
    const [rows] = await pool.query(
      "SELECT id, contact_name as family, appointment_type as type, DATE_FORMAT(appointment_date, '%Y-%m-%d') as date, appointment_time as time, status FROM advisor_appointments WHERE id = ?",
      [id]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error("Failed to create advisor appointment", error);
    res.status(500).json({ message: "Erreur serveur lors de la planification du rendez-vous." });
  }
});


// --- DEVOIRS & FICHES ---

app.get("/api/homework/:role/:userId", async (req, res) => {
  const { role, userId } = req.params;
  try {
    await ensureHomeworkTable();
    await ensureTeachersTable();
    await ensureSessionsTable();

    let query = `
      SELECT h.*, t.name as teacher_name, u.name as student_name 
      FROM homework h
      LEFT JOIN teachers t ON h.teacher_id = t.id
      LEFT JOIN users u ON h.student_id = u.id
    `;
    let params = [];

    if (role === "student") {
      query += " WHERE h.student_id = ?";
      params.push(userId);
    } else if (role === "teacher") {
      query += " WHERE h.teacher_id = ?";
      params.push(userId);
    } else if (role === "parent") {
      query = `
        SELECT h.*, t.name as teacher_name, u.name as student_name 
        FROM homework h
        LEFT JOIN teachers t ON h.teacher_id = t.id
        LEFT JOIN users u ON h.student_id = u.id
        JOIN sessions s ON h.student_id = s.student_id
        WHERE s.parent_id = ?
      `;
      params.push(userId);
    }

    query += " GROUP BY h.id ORDER BY h.due_date ASC";

    const [rows] = await pool.query(query, params);
    res.json(rows.map(mapHomeworkRow));
  } catch (error) {
    console.error("Failed to fetch homework", error);
    res.status(500).json({ message: error.message, detail: error.sqlMessage || "" });
  }
});

app.post("/api/homework", async (req, res) => {
  const { teacherId, studentId, sessionId, title, description, dueDate, subject, fileUrl } = req.body;
  if (!teacherId || !studentId || !title || !dueDate || !subject) {
    return res.status(400).json({ message: "Champs obligatoires manquants." });
  }
  try {
    await ensureHomeworkTable();
    const id = crypto.randomUUID();
    await pool.query(
      `INSERT INTO homework (id, teacher_id, student_id, session_id, title, description, due_date, subject, file_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, teacherId, studentId, sessionId || null, title, description || "", dueDate, subject, fileUrl || null]
    );
    const [rows] = await pool.query("SELECT h.*, t.name as teacher_name FROM homework h JOIN teachers t ON h.teacher_id = t.id WHERE h.id = ?", [id]);
    const hw = mapHomeworkRow(rows[0]);

    // Notification élève
    await createNotification(
      studentId,
      "Nouveau devoir assign�",
      `Votre professeur a ajouté : ${title}`,
      'homework',
      '/student/homework'
    );

    res.status(201).json(hw);
  } catch (error) {
    console.error("Failed to create homework", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

app.patch("/api/homework/:id", async (req, res) => {
  const { id } = req.params;
  const { status, submissionUrl, feedback } = req.body;
  try {
    await ensureHomeworkTable();
    const updates = [];
    const params = [];
    if (status) { updates.push("status = ?"); params.push(status); }
    if (submissionUrl !== undefined) { updates.push("submission_url = ?"); params.push(submissionUrl); }
    if (feedback !== undefined) { updates.push("feedback = ?"); params.push(feedback); }

    if (updates.length === 0) return res.status(400).json({ message: "Rien à modifier." });

    params.push(id);
    await pool.query(`UPDATE homework SET ${updates.join(", ")} WHERE id = ?`, params);
    const [rows] = await pool.query("SELECT h.*, t.name as teacher_name FROM homework h LEFT JOIN teachers t ON h.teacher_id = t.id WHERE h.id = ?", [id]);
    const hw = mapHomeworkRow(rows[0]);

    // Notification si rendu
    if (status === 'rendu') {
      await createNotification(
        hw.teacherId,
        "Devoir rendu",
        `${hw.studentName} a déposé son travail pour "${hw.title}"`,
        'homework',
        '/teacher/homework'
      );
    }
    // Notification si corrigé
    if (status === 'corrigé') {
      await createNotification(
        hw.studentId,
        "Devoir corrigé",
        `Votre professeur a corrigé : ${hw.title}`,
        'success',
        '/student/homework'
      );
    }

    res.json(hw);
  } catch (error) {
    console.error("Failed to update homework", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

app.post("/api/homework/:id/upload", upload.single("file"), async (req, res) => {
  const { id } = req.params;
  
  if (!req.file) {
    return res.status(400).json({ message: "Aucun fichier fourni." });
  }

  try {
    await ensureHomeworkTable();
    
    const protocol = req.protocol;
    const host = req.get('host');
    const fileUrl = `${protocol}://${host}/uploads/${req.file.filename}`;

    await pool.query(
      "UPDATE homework SET status = 'rendu', submission_url = ? WHERE id = ?",
      [fileUrl, id]
    );

    const [rows] = await pool.query(
      "SELECT h.*, u.name as student_name FROM homework h JOIN users u ON h.student_id = u.id WHERE h.id = ?", 
      [id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ message: "Devoir introuvable." });
    }

    const hw = mapHomeworkRow(rows[0]);

    // Notification au professeur
    await createNotification(
      hw.teacherId,
      "Nouveau devoir rendu",
      `${rows[0].student_name} a rendu son devoir : ${hw.title}`,
      'homework',
      '/teacher/homework'
    );

    res.json({ success: true, submissionUrl: fileUrl, homework: hw });
  } catch (error) {
    console.error("Failed to upload homework file", error);
    res.status(500).json({ message: "Erreur serveur lors du téléchargement." });
  }
});

app.get("/api/lesson-resources/:role/:userId", async (req, res) => {
  const { role, userId } = req.params;
  try {
    await ensureLessonResourcesTable();
    await ensureTeachersTable();

    let query = `
      SELECT r.*, t.name as teacher_name 
      FROM lesson_resources r
      LEFT JOIN teachers t ON r.teacher_id = t.id
    `;
    let params = [];

    if (role === "student") {
      query += " WHERE (r.student_id = ? OR r.student_id IS NULL)";
      params.push(userId);
    } else if (role === "teacher") {
      query += " WHERE r.teacher_id = ?";
      params.push(userId);
    } else if (role === "parent") {
      // Parent see all resources for their children
      query = `
            SELECT r.*, t.name as teacher_name 
            FROM lesson_resources r
            LEFT JOIN teachers t ON r.teacher_id = t.id
            JOIN sessions s ON (r.student_id = s.student_id OR r.student_id IS NULL)
            WHERE s.parent_id = ?
        `;
      params.push(userId);
    }

    query += " GROUP BY r.id ORDER BY r.created_at DESC";

    const [rows] = await pool.query(query, params);
    res.json(rows.map(mapLessonResourceRow));
  } catch (error) {
    console.error("Failed to fetch lesson resources", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

app.post("/api/lesson-resources", async (req, res) => {
  const { teacherId, studentId, title, fileUrl, fileType, subject } = req.body;
  if (!teacherId || !title || !fileUrl || !subject) {
    return res.status(400).json({ message: "Champs obligatoires manquants." });
  }
  try {
    await ensureLessonResourcesTable();
    const id = crypto.randomUUID();
    await pool.query(
      `INSERT INTO lesson_resources (id, teacher_id, student_id, title, file_url, file_type, subject)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, teacherId, studentId || null, title, fileUrl, fileType || 'link', subject]
    );
    const [rows] = await pool.query("SELECT r.*, t.name as teacher_name FROM lesson_resources r JOIN teachers t ON r.teacher_id = t.id WHERE r.id = ?", [id]);
    res.status(201).json(mapLessonResourceRow(rows[0]));
  } catch (error) {
    console.error("Failed to create lesson resource", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

app.delete("/api/lesson-resources/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await ensureLessonResourcesTable();
    await pool.query("DELETE FROM lesson_resources WHERE id = ?", [id]);
    res.json({ success: true });
  } catch (error) {
    console.error("Failed to delete lesson resource", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});


// --- NOTIFICATIONS & TEMPS RÉEL ---

const ensureNotificationsTable = async () => {
  await pool.query(
    `CREATE TABLE IF NOT EXISTS notifications (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
  );
};

const mapNotificationRow = (row) => ({
  id: row.id,
  userId: row.user_id,
  title: row.title,
  content: row.content,
  type: row.type,
  isRead: Boolean(row.is_read),
  link: row.link,
  createdAt: row.created_at,
});

const createNotification = async (userId, title, content, type = 'info', link = null) => {
  try {
    await ensureNotificationsTable();
    const id = crypto.randomUUID();
    await pool.query(
      `INSERT INTO notifications (id, user_id, title, content, type, link)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, userId, title, content, type, link]
    );
    return id;
  } catch (error) {
    console.error("Failed to create notification", error);
  }
};

app.get("/api/notifications/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    await ensureNotificationsTable();
    const [rows] = await pool.query(
      "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50",
      [userId]
    );
    res.json(rows.map(mapNotificationRow));
  } catch (error) {
    console.error("Failed to fetch notifications", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

app.patch("/api/notifications/:id/read", async (req, res) => {
  const { id } = req.params;
  try {
    await ensureNotificationsTable();
    await pool.query("UPDATE notifications SET is_read = TRUE WHERE id = ?", [id]);
    res.json({ success: true });
  } catch (error) {
    console.error("Failed to mark notification as read", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

app.get("/api/students/:studentId/progress", async (req, res) => {
  const { studentId } = req.params;
  try {
    await ensureStudentProgressPointsTable();
    const [rows] = await pool.query(
      "SELECT month_label as month, maths, francais, anglais FROM student_progress_points WHERE student_id = ? ORDER BY month_order ASC",
      [studentId]
    );
    res.json(rows);
  } catch (error) {
    console.error("Progress fetch error", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

// ------ XP / Grade helpers ------
const XP_LEVELS = [
  { minXP: 0,    grade: "Novice",           color: "#9ca3af" },
  { minXP: 200,  grade: "Apprenti",         color: "#22c55e" },
  { minXP: 600,  grade: "Explorateur",      color: "#3b82f6" },
  { minXP: 1200, grade: "Compagnon",        color: "#8b5cf6" },
  { minXP: 2000, grade: "Expert",           color: "#f59e0b" },
  { minXP: 3500, grade: "Maître des Quiz",  color: "#ef4444" },
  { minXP: 5000, grade: "Légende",          color: "#ec4899" },
];

const getGradeInfo = (xp) => {
  let current = XP_LEVELS[0];
  for (const lvl of XP_LEVELS) {
    if (xp >= lvl.minXP) current = lvl;
  }
  const idx = XP_LEVELS.indexOf(current);
  const next = XP_LEVELS[idx + 1] || null;
  const progressToNext = next
    ? Math.min(100, Math.floor(((xp - current.minXP) / (next.minXP - current.minXP)) * 100))
    : 100;
  return { grade: current.grade, gradeColor: current.color, nextGrade: next?.grade || null, progressToNext, nextXP: next?.minXP || null };
};

app.get("/api/students/:studentId/overview", async (req, res) => {
  const { studentId } = req.params;
  try {
    // Base overview (avg, level, teacher)
    const [overviewRows] = await pool.query(
      `SELECT po.current_avg, po.previous_avg, po.sessions_this_month,
              u.name AS teacher_name
       FROM parent_overviews po
       LEFT JOIN users u ON u.role = 'teacher'
       WHERE po.student_id = ?
       LIMIT 1`,
      [studentId]
    );

    // Student level from users table (stored in level or bio field)
    const [[studentRow]] = await pool.query(
      "SELECT name FROM users WHERE id = ?", [studentId]
    );

    // XP from completed sessions (+100 each)
    const [[sessionsRow]] = await pool.query(
      `SELECT COUNT(*) as cnt FROM sessions WHERE student_id = ? AND status = 'effectué�'`,
      [studentId]
    ).catch(() => [[{ cnt: 0 }]]);

    // XP from quiz attempts: 50 base + score bonus
    const [quizRows] = await pool.query(
      `SELECT score FROM quiz_attempts WHERE student_id = ?`,
      [studentId]
    ).catch(() => [[]]);

    // XP from completed lessons
    const [[lessonRow]] = await pool.query(
      `SELECT JSON_LENGTH(completed_lessons) as cnt
       FROM user_course_progress WHERE user_id = ?
       ORDER BY last_accessed_at DESC LIMIT 1`,
      [studentId]
    ).catch(() => [[{ cnt: 0 }]]);

    // XP from bookmarks (engagement)
    const [[bookmarkRow]] = await pool.query(
      `SELECT COUNT(*) as cnt FROM course_bookmarks WHERE user_id = ?`,
      [studentId]
    ).catch(() => [[{ cnt: 0 }]]);

    const sessionXP = (sessionsRow?.cnt || 0) * 100;
    const quizXP = quizRows.reduce((sum, r) => sum + 50 + (r.score || 0), 0);
    const lessonXP = (lessonRow?.cnt || 0) * 30;
    const bookmarkXP = (bookmarkRow?.cnt || 0) * 10;
    const totalXP = sessionXP + quizXP + lessonXP + bookmarkXP;

    const gradeInfo = getGradeInfo(totalXP);

    // Login streak: consecutive days with activity (sessions OR quiz_attempts)
    const [activityRows] = await pool.query(
      `SELECT DATE(created_at) as day FROM quiz_attempts WHERE student_id = ?
       UNION
       SELECT DATE(session_date) as day FROM sessions WHERE student_id = ? AND status = 'effectué�'
       ORDER BY day DESC`,
      [studentId, studentId]
    ).catch(() => [[]]);

    let streak = 0;
    if (activityRows.length > 0) {
      let prevDay = null;
      let today = new Date();
      today.setHours(0,0,0,0);
      for (const row of activityRows) {
        const d = new Date(row.day);
        d.setHours(0,0,0,0);
        if (!prevDay) {
          // Allow today or yesterday to start streak
          const diff = Math.round((today - d) / 86400000);
          if (diff <= 1) { streak = 1; prevDay = d; }
          else break;
        } else {
          const diff = Math.round((prevDay - d) / 86400000);
          if (diff === 1) { streak++; prevDay = d; }
          else break;
        }
      }
    }

    // XP leaderboard among all students
    const [allStudents] = await pool.query(
      "SELECT id, name FROM users WHERE role = 'student' ORDER BY created_at ASC LIMIT 20"
    ).catch(() => [[]]);

    // For leaderboard we do a simplified XP: session count * 100 + quiz score sum
    const leaderboard = await Promise.all(
      allStudents.map(async (s) => {
        const [[sr]] = await pool.query(
          "SELECT COUNT(*) as cnt FROM sessions WHERE student_id = ? AND status = 'effectué�'", [s.id]
        ).catch(() => [[{ cnt: 0 }]]);
        const [qr] = await pool.query(
          "SELECT COALESCE(SUM(score),0) as total FROM quiz_attempts WHERE student_id = ?", [s.id]
        ).catch(() => [[{ total: 0 }]]);
        const xp = (sr?.cnt || 0) * 100 + Number(qr[0]?.total || 0) + 50;
        return { id: s.id, name: s.name, xp };
      })
    );
    leaderboard.sort((a, b) => b.xp - a.xp);
    const myRank = leaderboard.findIndex(l => l.id === studentId) + 1;
    const top5 = leaderboard.slice(0, 5);

    const base = overviewRows[0] || {};
    res.json({
      currentAvg: base.current_avg || 14.5,
      previousAvg: base.previous_avg || 11.8,
      sessionsThisMonth: base.sessions_this_month || 0,
      streak,
      level: "3e",
      subject: "Mathématiques",
      teacher: base.teacher_name || "Dr. Clémentine Abanda",
      xp: totalXP,
      xpBreakdown: { sessionXP, quizXP, lessonXP, bookmarkXP },
      ...gradeInfo,
      myRank,
      leaderboard: top5,
    });
  } catch (error) {
    console.error("Student overview error", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

app.use((req, res) => {
  res.status(404).json({ message: "Route introuvable." });
});

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Backend server running at http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  });
});
