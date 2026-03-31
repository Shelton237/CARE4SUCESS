const mysql = require('mysql2/promise');
const crypto = require('crypto');
require('dotenv').config({ path: '.env.local' });

async function seed() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'care4success'
  });

  console.log("Seeding student dashboard data...");

  const studentId = 's1'; // Koffi Diallo
  const teacherId = 't1'; // Dr. Clémentine Abanda

  // 1. Progress points
  await connection.execute("DELETE FROM student_progress_points WHERE student_id = ?", [studentId]);
  const progress = [
    { month: 'Oct', order: 1, m: 10, f: 12, a: 11 },
    { month: 'Nov', order: 2, m: 11, f: 12, a: 12 },
    { month: 'Déc', order: 3, m: 12, f: 13, a: 13 },
    { month: 'Jan', order: 4, m: 13, f: 14, a: 14 },
    { month: 'Fév', order: 5, m: 14, f: 14, a: 15 },
    { month: 'Mar', order: 6, m: 15, f: 15, a: 16 },
  ];

  for (const p of progress) {
    await connection.execute(
      "INSERT INTO student_progress_points (id, student_id, month_label, month_order, maths, francais, anglais) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [crypto.randomUUID(), studentId, p.month, p.order, p.m, p.f, p.a]
    );
  }

  // 2. Homework
  // Note: table might be named assignments or homework in the DB
  // Check which table is used. In server/index.js I saw homework table mentioned.
  // Let's check table name again.
  
  const ensureHomeworkTable = "CREATE TABLE IF NOT EXISTS homework (id CHAR(36) PRIMARY KEY, title VARCHAR(255), description TEXT, subject VARCHAR(100), due_date DATE, status ENUM('à faire', 'rendu', 'corrigé'), student_id VARCHAR(36), teacher_id VARCHAR(36))";
  await connection.execute(ensureHomeworkTable);

  await connection.execute("DELETE FROM homework WHERE student_id = ?", [studentId]);
  const homeworks = [
    { title: "Exercices sur les matrices", subject: "Mathématiques", due: "2026-03-20", status: "à faire" },
    { title: "Dissertation sur l'humanisme", subject: "Français", due: "2026-03-18", status: "à faire" },
    { title: "QCM de révision optique", subject: "Physique", due: "2026-03-10", status: "corrigé" },
    { title: "Vocabulaire Travel", subject: "Anglais", due: "2026-03-12", status: "rendu" },
  ];

  for (const hw of homeworks) {
    await connection.execute(
      "INSERT INTO homework (id, title, description, subject, due_date, status, student_id, teacher_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [crypto.randomUUID(), hw.title, "Travail à faire sérieusement pour préparer l'examen.", hw.subject, hw.due, hw.status, studentId, teacherId]
    );
  }

  // 3. Quizzes & Attempts
  // Quizzes are already in seed.sql linked to lessons.
  
  await connection.end();
  console.log("Seeding completed successfully.");
}

seed().catch(console.error);
