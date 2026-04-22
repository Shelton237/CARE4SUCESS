import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'localhost',
  user: 'care4success',
  password: 'Pluton@2015',
  database: 'care4success',
});

async function run() {
  const courseId = '3ea07f93-8044-40fe-840e-029ca82356cc';
  const studentId = 's1';
  const studentName = 'Koffi Diallo';
  
  await pool.query('INSERT IGNORE INTO course_enrollments (id, course_id, student_id, student_name) VALUES (UUID(), ?, ?, ?)', [courseId, studentId, studentName]);
  console.log(`Student ${studentId} enrolled in course ${courseId}`);
  
  await pool.end();
}

run().catch(console.error);
