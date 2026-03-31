import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local", override: true });

const pool = mysql.createPool({
  host: process.env.DB_HOST ?? "127.0.0.1",
  user: process.env.DB_USERNAME ?? "root",
  password: process.env.DB_PASSWORD ?? "",
  database: process.env.DB_DATABASE ?? "care4success",
  port: Number(process.env.DB_PORT ?? 3306),
});

// Liste de toutes les tables à patcher
const tables = [
  "sessions", "homework", "student_teacher", "parent_child",
  "users", "teachers", "course_bookmarks", "user_course_progress",
  "teacher_feedback", "notifications", "messages",
  "grade_disputes", "student_progress_points", "assignments",
  "courses", "lessons", "quizzes", "quiz_questions", "quiz_attempts",
  "course_enrollments", "lesson_resources", "platform_settings",
  "advisor_appointments"
];

async function patch() {
  for (const t of tables) {
    try {
      await pool.query(`ALTER TABLE \`${t}\` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci`);
      console.log(`✅ Patched: ${t}`);
    } catch (e) {
      console.warn(`⏭ Skipped ${t}: ${e.message}`);
    }
  }
  process.exit(0);
}

patch();
