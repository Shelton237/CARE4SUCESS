import mysql from 'mysql2/promise';
import crypto from 'crypto';

async function run() {
  const pool = mysql.createPool('mysql://root:@localhost:3306/care4success');
  try {
    const studentId = 'a96573b6-2748-4a35-9090-305ff04b7a3b';
    const parentId = '895b6d75-11a2-40fc-985c-f1e708d9d914';
    const teacherId = 'a7b8c9d0-1234-4321-8888-1234567890ab';

    // 1. Check if sessions table exists (it should)
    // 2. Insert mock sessions for this week
    const now = new Date();
    const dayNames = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
    const todayIndex = now.getDay();

    // Add session for tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(now.getDate() + 1);
    const tomorrowDay = dayNames[tomorrow.getDay()];
    const tomorrowDateStr = tomorrow.toISOString().split('T')[0];

    await pool.query(
      `INSERT INTO sessions (id, student_id, parent_id, teacher_id, student_name, teacher_name, subject, session_date, session_time, day, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [crypto.randomUUID(), studentId, parentId, teacherId, 'Renault Deffo', 'Dr. Clémentine Abanda', 'Mathématiques', tomorrowDateStr, '16:00', tomorrowDay, 'à venir']
    );

    console.log('SUCCESS: Seeded mock sessions for Renault Deffo');
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}
run();
