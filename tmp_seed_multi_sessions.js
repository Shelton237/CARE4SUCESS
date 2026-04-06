import mysql from 'mysql2/promise';
import crypto from 'crypto';

async function run() {
  const pool = mysql.createPool('mysql://root:@localhost:3306/care4success');
  try {
    const renId = 'a96573b6-2748-4a35-9090-305ff04b7a3b';
    const marieId = 'e85a704a-6418-448d-aae4-06e85e7a3e5b';
    const parentId = '895b6d75-11a2-40fc-985c-f1e708d9d914';
    const teacherId = 'a7b8c9d0-1234-4321-8888-1234567890ab';

    const now = new Date();
    const dayNames = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

    // 1. Session for Renault (Tomorrow)
    const tom = new Date(); tom.setDate(now.getDate() + 1);
    const tomDay = dayNames[tom.getDay()];
    const tomDateStr = tom.toISOString().split('T')[0];

    await pool.query('DELETE FROM sessions WHERE student_id IN (?, ?)', [renId, marieId]);

    await pool.query(
      `INSERT INTO sessions (id, session_day, session_date, session_time, subject, location, status, teacher_id, teacher_name, student_id, student_name, parent_id, parent_name) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [crypto.randomUUID(), tomDay, tomDateStr, '16:00', 'Mathématiques', 'Care4Success Yaoundé', 'à venir', teacherId, 'Dr. Clémentine Abanda', renId, 'Renault Deffo', parentId, 'BORIS SATURIN']
    );

    // 2. Session for Marie (Day after tomorrow)
    const dat = new Date(); dat.setDate(now.getDate() + 2);
    const datDay = dayNames[dat.getDay()];
    const datDateStr = dat.toISOString().split('T')[0];

    await pool.query(
      `INSERT INTO sessions (id, session_day, session_date, session_time, subject, location, status, teacher_id, teacher_name, student_id, student_name, parent_id, parent_name) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [crypto.randomUUID(), datDay, datDateStr, '10:00', 'Français', 'Care4Success Yaoundé', 'à venir', teacherId, 'M. Essomba Paul', marieId, 'Marie du Pont', parentId, 'BORIS SATURIN']
    );

    console.log('SUCCESS: Seeded mock sessions for Renault and Marie');
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}
run();
