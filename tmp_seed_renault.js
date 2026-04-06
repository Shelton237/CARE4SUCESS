import mysql from 'mysql2/promise';
import crypto from 'crypto';

async function run() {
  const pool = mysql.createPool('mysql://root:@localhost:3306/care4success');
  try {
    const studentId = 'a96573b6-2748-4a35-9090-305ff04b7a3b';
    const parentId = '895b6d75-11a2-40fc-985c-f1e708d9d914';

    // 1. Seed quizzes if they don't exist
    const [[mathCourse]] = await pool.query('SELECT id FROM courses WHERE subject = "Mathématiques" LIMIT 1');
    const courseId = mathCourse?.id || crypto.randomUUID();
    if (!mathCourse) {
        await pool.query('INSERT INTO courses (id, title, subject, level) VALUES (?, ?, ?, ?)', [courseId, 'Mathématiques 3ème', 'Mathématiques', '3ème']);
    }

    const quizId = crypto.randomUUID();
    await pool.query('INSERT INTO quizzes (id, course_id, title, total_points) VALUES (?, ?, ?, ?)', [quizId, courseId, 'Évaluation n°1 - Algèbre', 20]);

    // 2. Seed attempts
    await pool.query('INSERT INTO quiz_attempts (id, student_id, quiz_id, score) VALUES (?, ?, ?, ?)', [crypto.randomUUID(), studentId, quizId, 16.5]);
    await pool.query('INSERT INTO quiz_attempts (id, student_id, quiz_id, score) VALUES (?, ?, ?, ?)', [crypto.randomUUID(), studentId, quizId, 14]);

    // 3. Seed progress points
    await pool.query('DELETE FROM student_progress_points WHERE student_id = ?', [studentId]);
    await pool.query('INSERT INTO student_progress_points (id, student_id, month_label, month_order, maths, francais, anglais) VALUES (?, ?, ?, ?, ?, ?, ?)', [crypto.randomUUID(), studentId, 'Jan', 1, 12, 13, 14]);
    await pool.query('INSERT INTO student_progress_points (id, student_id, month_label, month_order, maths, francais, anglais) VALUES (?, ?, ?, ?, ?, ?, ?)', [crypto.randomUUID(), studentId, 'Fév', 2, 14, 13, 14]);
    await pool.query('INSERT INTO student_progress_points (id, student_id, month_label, month_order, maths, francais, anglais) VALUES (?, ?, ?, ?, ?, ?, ?)', [crypto.randomUUID(), studentId, 'Mar', 3, 16.5, 14, 15]);

    // 4. Seed homework
    await pool.query('INSERT INTO homework (id, student_id, title, subject, due_date, status) VALUES (?, ?, ?, ?, ?, ?)', [crypto.randomUUID(), studentId, 'Exercice de trigonométrie', 'Mathématiques', '2026-04-05', 'pending']);
    await pool.query('INSERT INTO homework (id, student_id, title, subject, due_date, status) VALUES (?, ?, ?, ?, ?, ?)', [crypto.randomUUID(), studentId, 'Dissertation: Le réalisme', 'Français', '2026-04-08', 'pending']);

    console.log('SUCCESS: Seeded mock data for Renault Deffo');
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}
run();
