import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'localhost',
  user: 'care4success',
  password: 'Pluton@2015',
  database: 'care4success',
});

async function run() {
  // 1. Check enrollments
  const [enrolls] = await pool.query('SELECT * FROM course_enrollments WHERE student_id = ?', ['s1']);
  console.log('Enrollments for Koffi (s1):', enrolls.length);

  // 2. Check homework details
  const [hw] = await pool.query('SELECT * FROM homework WHERE student_id = ?', ['s1']);
  console.log('Homework for Koffi (s1):', JSON.stringify(hw, null, 2));

  // 3. Check sessions (schedule)
  const [sessions] = await pool.query('SELECT * FROM sessions WHERE student_id = ?', ['s1']);
  console.log('Sessions for Koffi (s1):', sessions.length);

  await pool.end();
}

run().catch(console.error);
