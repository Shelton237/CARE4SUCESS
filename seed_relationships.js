
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: "127.0.0.1",
  user: "root",
  password: "",
  database: "care4success",
  port: 3306,
});

async function seed() {
  try {
    // Create tables if not exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS parent_child (
        parent_id VARCHAR(255) NOT NULL,
        child_id VARCHAR(255) NOT NULL,
        PRIMARY KEY (parent_id, child_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS student_teacher (
        student_id VARCHAR(255) NOT NULL,
        teacher_id VARCHAR(255) NOT NULL,
        PRIMARY KEY (student_id, teacher_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Parent-Child: Aminata (p1) -> Koffi (s1)
    await pool.query("INSERT IGNORE INTO parent_child (parent_id, child_id) VALUES (?, ?)", ["p1", "s1"]);
    
    // Student-Teacher: Koffi (s1) -> Abanda (t1)
    await pool.query("INSERT IGNORE INTO student_teacher (student_id, teacher_id) VALUES (?, ?)", ["s1", "t1"]);

    // Seed sessions
    const sessions = [
      { id: "sess1", day: "Lundi", date: "2026-03-02", time: "16:00 - 18:00", subject: "Mathématiques", status: "effectué", teacher_id: "t1", teacher_name: "Dr. Clémentine Abanda", student_id: "s1", student_name: "Koffi Diallo", parent_id: "p1", parent_name: "Aminata Diallo", location: "En ligne" },
      { id: "sess2", day: "Mardi", date: "2026-03-03", time: "17:00 - 19:00", subject: "Physique", status: "planifié", teacher_id: "t1", teacher_name: "Dr. Clémentine Abanda", student_id: "s1", student_name: "Koffi Diallo", parent_id: "p1", parent_name: "Aminata Diallo", location: "En ligne" },
      { id: "sess3", day: "Jeudi", date: "2026-03-05", time: "16:00 - 18:00", subject: "Mathématiques", status: "à venir", teacher_id: "t1", teacher_name: "Dr. Clémentine Abanda", student_id: "s1", student_name: "Koffi Diallo", parent_id: "p1", parent_name: "Aminata Diallo", location: "En ligne" }
    ];

    for (const s of sessions) {
      await pool.query(
        `INSERT IGNORE INTO sessions 
        (id, session_day, session_date, session_time, subject, location, status, teacher_id, teacher_name, student_id, student_name, parent_id, parent_name) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [s.id, s.day, s.date, s.time, s.subject, s.location, s.status, s.teacher_id, s.teacher_name, s.student_id, s.student_name, s.parent_id, s.parent_name]
      );
    }

    console.log("Seeded relationships and sessions.");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
