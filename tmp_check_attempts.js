import mysql from 'mysql2/promise';

async function run() {
  const pool = mysql.createPool('mysql://root:@localhost:3306/care4success');
  try {
    const studentId = 'a96573b6-2748-4a35-9090-305ff04b7a3b';
    const [rows] = await pool.query('SELECT * FROM quiz_attempts WHERE student_id = ?', [studentId]);
    console.log('ATTEMPTS:', rows);
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}
run();
