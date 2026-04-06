import mysql from 'mysql2/promise';
import crypto from 'crypto';

async function run() {
  const pool = mysql.createPool('mysql://root:@localhost:3306/care4success');
  try {
    const studentId = 'a96573b6-2748-4a35-9090-305ff04b7a3b';
    const teacherId = 'a7b8c9d0-1234-4321-8888-1234567890ab';

    await pool.query('DELETE FROM student_evaluations WHERE student_id = ?', [studentId]);

    await pool.query(
      `INSERT INTO student_evaluations (id, student_id, teacher_id, teacher_name, rating, comment) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [crypto.randomUUID(), studentId, teacherId, 'Dr. Clémentine Abanda', 5, 'Renault fait preuve d\'une excellente rigueur en Mathématiques. Je recommande de continuer sur les exercices de trigonométrie pour consolider ses acquis.']
    );

    await pool.query(
      `INSERT INTO student_evaluations (id, student_id, teacher_id, teacher_name, rating, comment) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [crypto.randomUUID(), studentId, teacherId, 'M. Essomba Paul', 4, 'Bonne progression en Français. Attention à la structure de la dissertation, un peu plus de lecture serait bénéfique.']
    );

    console.log('SUCCESS: Seeded mock evaluations/recommendations for Renault Deffo');
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}
run();
