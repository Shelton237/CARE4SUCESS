import path from "path";
import fs from "fs";
import crypto from "crypto";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";
import multer from "multer";
import bcrypt from "bcryptjs";

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
  ["reÃ§u", "reçu"],
  ["re├ºu", "reçu"],
  ["en traitement", "en traitement"],
  ["assigné", "assigné"],
  ["assignÃ©", "assigné"],
  ["assign├®", "assigné"],
  ["clôturé", "clôturé"],
  ["clÃ´turÃ©", "clôturé"],
  ["cl├┤tur├®", "clôturé"],
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
      status ENUM('effectué', 'à venir', 'planifié') NOT NULL DEFAULT 'planifié',
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
      teacher_id VARCHAR(36) NOT NULL,
      teacher_name VARCHAR(191) NOT NULL,
      subject VARCHAR(120) NOT NULL,
      level VARCHAR(50) NOT NULL,
      price DECIMAL(10,2) NOT NULL DEFAULT 0,
      duration VARCHAR(50),
      image_url VARCHAR(255),
      active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
  );
};

const ensureQuizzesTable = async () => {
  await pool.query(
    `CREATE TABLE IF NOT EXISTS quizzes (
      id CHAR(36) NOT NULL PRIMARY KEY,
      course_id VARCHAR(36) NOT NULL,
      title VARCHAR(255) NOT NULL,
      subject VARCHAR(120) NOT NULL,
      description TEXT,
      total_points INT DEFAULT 20,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
      student_id VARCHAR(36) NOT NULL,
      student_name VARCHAR(191) NOT NULL,
      rating INT NOT NULL DEFAULT 5,
      comment TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

const ensureUsersTable = async () => {
  await pool.query(
    `CREATE TABLE IF NOT EXISTS users (
      id CHAR(36) NOT NULL DEFAULT (UUID()),
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      role ENUM('admin', 'teacher', 'parent', 'advisor', 'student') NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
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
    await ensureQuizzesTable();
    await ensureQuizAttemptsTable();
    await ensureTeacherFeedbackTable();
    await ensureTeacherRatingsTable();
    console.log("Database initialized successfully.");
  } catch (error) {
    console.error("Database initialization failed:", error);
    process.exit(1);
  }
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

// Corrige les caractères UTF-8 mal décodés (mojibake fréquent avec MySQL latin1→utf8)
const fixEncoding = (str) => {
  if (!str || typeof str !== "string") return str;
  try {
    // Tentative de correction via latin1 → utf8
    return decodeURIComponent(escape(str));
  } catch {
    return str;
  }
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
  title: row.title,
  description: row.description,
  subject: row.subject,
  level: row.level,
  status: row.status,
  coverUrl: row.cover_url,
  createdBy: row.created_by,
  createdAt: row.created_at,
  lessons: [],
});

const mapLessonRow = (row) => ({
  id: row.id,
  courseId: row.course_id,
  title: row.title,
  content: row.content,
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

const buildCoursesPayload = async (courseRows) => {
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

  const courseMap = new Map(courseRows.map((row) => [row.id, mapCourseRow(row)]));
  lessonRows.forEach((lesson) => {
    const parent = courseMap.get(lesson.course_id);
    if (!parent) return;
    parent.lessons.push(mapLessonRow(lesson));
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

app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "Veuillez remplir tous les champs obligatoires." });
    }

    const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: "Cette adresse email est déjà utilisée." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const id = crypto.randomUUID();

    await pool.query(
      "INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)",
      [id, name, email, hashedPassword, role]
    );

    res.status(201).json({ user: { id, name, email, role }, message: "Inscription réussie." });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ message: "Erreur lors de l'inscription." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check against real users DB first
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);

    if (rows.length === 0) {
      return res.status(401).json({ message: "Identifiants incorrects (utilisateur introuvable)." });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Identifiants incorrects (mot de passe invalide)." });
    }

    // Omit password from response
    delete user.password;

    res.json(user);
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Erreur lors de la connexion." });
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

app.get("/api/requests", async (_req, res) => {
  try {
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
  const validStatuses = new Set(["reçu", "en traitement", "assigné", "clôturé"]);

  if (!status || !validStatuses.has(status)) {
    return res.status(400).json({ message: "Statut invalide." });
  }

  try {
    const [result] = await pool.query(
      "UPDATE requests SET status = ? WHERE id = ?",
      [status, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Demande introuvable." });
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
      "UPDATE requests SET status = 'assigné' WHERE child_name = ? AND level = ? AND subject = ?",
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
      `SELECT id, session_day, session_date, session_time, subject, location, status, teacher_id, teacher_name, student_id, student_name, parent_id, parent_name, virtual_link, notes, whiteboard_data, code_data
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
    res.json({ success: true });
  } catch (error) {
    console.error("Failed to update session status", error);
    res.status(500).json({ message: "Impossible de modifier le statut." });
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

    const payload = await buildCoursesPayload(rows);
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
      } else if (row.request_status === "assigné") {
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
// AUTH & USERS
// ==========================================

const ensureUsersTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL,
      avatar VARCHAR(10),
      phone VARCHAR(50),
      parent_id VARCHAR(255) DEFAULT NULL,
      CONSTRAINT fk_parent FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Migration for parent_id if table already exists without it
  try {
    const [cols] = await pool.query("SHOW COLUMNS FROM users LIKE 'parent_id'");
    if (cols.length === 0) {
      await pool.query("ALTER TABLE users ADD COLUMN parent_id VARCHAR(255) DEFAULT NULL, ADD CONSTRAINT fk_parent FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE SET NULL");
      console.log("Migration: Added parent_id to users table");
    }
  } catch (err) {
    console.warn("Migration skip for users table", err.message);
  }

  const [rows] = await pool.query("SELECT COUNT(*) as count FROM users");
  if (rows[0].count === 0) {
    const MOCK_USERS = [
      { id: "a1", name: "Directeur Ngono", email: "admin@care4success.cm", password: "admin123", role: "admin", avatar: "DN", phone: "+237 675 252 048", parentId: null },
      { id: "t1", name: "Dr. Clémentine Abanda", email: "prof@care4success.cm", password: "prof123", role: "teacher", avatar: "CA", phone: "+237 699 001 122", parentId: null },
      { id: "p1", name: "Aminata Diallo", email: "parent@care4success.cm", password: "parent123", role: "parent", avatar: "AD", phone: "+237 677 334 455", parentId: null },
      { id: "c1", name: "Brice Owona", email: "conseiller@care4success.cm", password: "conseil123", role: "advisor", avatar: "BO", phone: "+237 691 556 677", parentId: null },
      { id: "s1", name: "Koffi Diallo", email: "eleve@care4success.cm", password: "eleve123", role: "student", avatar: "KD", phone: "+237 697 889 900", parentId: "p1" }
    ];
    for (const u of MOCK_USERS) {
      const hashedPassword = bcrypt.hashSync(u.password, 10);
      await pool.query(
        "INSERT INTO users (id, name, email, password, role, avatar, phone, parent_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [u.id, u.name, u.email, hashedPassword, u.role, u.avatar, u.phone, u.parentId]
      );
    }
  }
};

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email et mot de passe requis." });
  }

  try {
    const [rows] = await pool.query("SELECT id, name, email, password, role, avatar, phone FROM users WHERE email = ?", [email]);
    if (rows.length === 0) {
      return res.status(401).json({ message: "Email ou mot de passe incorrect." });
    }
    const user = rows[0];
    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Email ou mot de passe incorrect." });
    }
    res.json({
      id: user.id,
      name: fixEncoding(user.name),
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      phone: user.phone
    });
  } catch (error) {
    console.error("Failed to login", error);
    res.status(500).json({ message: "Erreur serveur lors de la connexion." });
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
      "SELECT COUNT(*) as count FROM sessions WHERE parent_id = ? AND status = 'effectué'", [parentId]
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
         DATE_FORMAT(session_date, '%Y-%m') as month,
         SUM(15000) as amount,
         COUNT(*) as sessions
       FROM sessions 
       WHERE teacher_id = ? AND status = 'effectué'
       GROUP BY month
       ORDER BY month ASC`, [teacherId]
    );
    res.json(rows.length > 0 ? rows : [
      { month: "2025-10", amount: 120000, sessions: 8 },
      { month: "2025-11", amount: 150000, sessions: 10 },
      { month: "2025-12", amount: 135000, sessions: 9 },
      { month: "2026-01", amount: 180000, sessions: 12 },
      { month: "2026-02", amount: 165000, sessions: 11 },
      { month: "2026-03", amount: 195000, sessions: 13 }
    ]);
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

    // Simulation revenus basés sur sessions effectuées
    const [[{ sessionsDone }]] = await pool.query(
      "SELECT COUNT(*) as sessionsDone FROM sessions WHERE teacher_id = ? AND status = 'effectué'", [teacherId]
    );
    // Base de calcul arbitraire pour la démo
    const monthlyEarnings = sessionsDone * 15000;
    const previousEarnings = 120000;

    const [[ratingRow]] = await pool.query(
      "SELECT AVG(rating) as avgRating FROM teacher_feedback WHERE teacher_id = ?", [teacherId]
    );
    const avgRating = ratingRow?.avgRating ? Number(avgRating).toFixed(1) : "5.0";

    const [scheduleRows] = await pool.query(
      "SELECT * FROM sessions WHERE teacher_id = ? AND status IN ('à venir', 'planifié') AND session_date >= CURDATE() ORDER BY session_date ASC, session_time ASC LIMIT 5", [teacherId]
    );

    const [studentRows] = await pool.query(
      `SELECT DISTINCT 
         s.student_id as id, 
         s.student_name as name, 
         s.subject, 
         '3e' as level, 
         IFNULL((SELECT AVG(score) FROM quiz_attempts qa WHERE qa.student_id = s.student_id), 14.5) as avgGrade, 
         '+1.2' as trend 
       FROM sessions s 
       WHERE s.teacher_id = ?`, [teacherId]
    );

    res.json({
      stats: {
        activeStudents,
        upcomingSessions: upcomingCount,
        monthlyEarnings,
        previousEarnings,
        avgRating: Number(avgRating)
      },
      schedule: scheduleRows.map(mapSessionRow),
      students: studentRows
    });
  } catch (error) {
    console.error("Teacher dashboard error", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

app.get("/api/teachers/:teacherId/earnings", async (req, res) => {
  const { teacherId } = req.params;
  try {
    const [rows] = await pool.query(
      "SELECT id, session_date as date, student_name as student, 2 as hours, 7500 as rate, 15000 as amount, 'payé' as status FROM sessions WHERE teacher_id = ? LIMIT 20",
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
    const [rows] = await pool.query(
      `SELECT DISTINCT 
          s.student_id as id, 
          s.student_name as name, 
          u.email,
          s.subject, 
          '3e' as level, 
          14.5 as avgGrade, 
          '+0.8' as trend,
          JSON_OBJECT(
            'highlights', JSON_ARRAY(
              JSON_OBJECT('label', 'Assiduité', 'value', '95%', 'sublabel', 'Excellent'),
              JSON_OBJECT('label', 'Dernière note', 'value', '16/20', 'sublabel', 'Maths')
            ),
            'courses', JSON_ARRAY(),
            'quizzes', JSON_ARRAY(),
            'evaluations', JSON_ARRAY()
          ) as profile
       FROM sessions s
       LEFT JOIN users u ON u.id = s.student_id
       WHERE s.teacher_id = ?`,
      [teacherId]
    );
    res.json(rows.map(r => ({
      ...r,
      profile: typeof r.profile === 'string' ? JSON.parse(r.profile) : r.profile
    })));
  } catch (error) {
    console.error("Teacher students error", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

app.get("/api/parents/:parentId/progress", (req, res) => {
  res.json(studentProgressData);
});

app.get("/api/students/:studentId/progress", (req, res) => {
  res.json(studentProgressData);
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
      const avg = subAttempts.reduce((acc, curr) => acc + (curr.score / curr.total_points) * 20, 0) / subAttempts.length;
      return {
        subject: sub,
        teacher: subAttempts[0].teacher_name,
        coefficient: 4,
        avg: Number(avg.toFixed(1)),
        history: subAttempts.map(a => ({ date: new Date(a.created_at).toLocaleDateString('fr-FR', { month: 'short' }), note: (a.score / a.total_points) * 20 })),
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
      "SELECT COUNT(*) as count FROM sessions WHERE status = 'effectué' AND MONTH(session_date) = MONTH(CURDATE())"
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

app.get("/api/messages/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    await ensureMessagesTable();
    const [rows] = await pool.query(
      "SELECT * FROM messages WHERE sender_id = ? OR receiver_id = ? ORDER BY created_at ASC",
      [userId, userId]
    );
    res.json(rows.map(mapMessageRow));
  } catch (error) {
    console.error("Failed to fetch messages", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

app.post("/api/messages", async (req, res) => {
  const { senderId, senderName, senderRole, receiverId, receiverName, receiverRole, content } = req.body;
  if (!senderId || !receiverId || !content) {
    return res.status(400).json({ message: "Champs obligatoires manquants." });
  }
  try {
    await ensureMessagesTable();
    const id = crypto.randomUUID();
    await pool.query(
      `INSERT INTO messages (id, sender_id, sender_name, sender_role, receiver_id, receiver_name, receiver_role, content)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, senderId, senderName, senderRole, receiverId, receiverName, receiverRole, content]
    );
    const [rows] = await pool.query("SELECT * FROM messages WHERE id = ?", [id]);
    const message = mapMessageRow(rows[0]);

    // Notification automatique
    await createNotification(
      receiverId,
      `Nouveau message de ${senderName}`,
      content.length > 50 ? content.substring(0, 50) + "..." : content,
      'message',
      '/messages'
    );

    res.status(201).json(message);
  } catch (error) {
    console.error("Failed to send message", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

app.patch("/api/messages/:id/read", async (req, res) => {
  const { id } = req.params;
  try {
    await ensureMessagesTable();
    await pool.query("UPDATE messages SET is_read = TRUE WHERE id = ?", [id]);
    res.json({ success: true });
  } catch (error) {
    console.error("Failed to mark message as read", error);
    res.status(500).json({ message: "Erreur serveur." });
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
      SELECT h.*, t.name as teacher_name 
      FROM homework h
      LEFT JOIN teachers t ON h.teacher_id = t.id
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
        SELECT h.*, t.name as teacher_name 
        FROM homework h
        LEFT JOIN teachers t ON h.teacher_id = t.id
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
    res.status(500).json({ message: "Erreur serveur." });
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
      "Nouveau devoir assigné",
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

app.get("/api/teachers/:teacherId/students", async (req, res) => {
  const { teacherId } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT DISTINCT s.student_id as id, s.student_name as name 
       FROM sessions s 
       WHERE s.teacher_id = ?`,
      [teacherId]
    );
    res.json(rows);
  } catch (error) {
    console.error("Failed to fetch teacher students", error);
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

app.use((req, res) => {
  res.status(404).json({ message: "Route introuvable." });
});

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Backend server running at http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  });
});
