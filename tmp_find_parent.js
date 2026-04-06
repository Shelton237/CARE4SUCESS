import mysql from 'mysql2/promise';

async function run() {
  const pool = mysql.createPool('mysql://root:@localhost:3306/care4success');
  try {
    const [rows] = await pool.query('SELECT name, email, role FROM users WHERE role = "parent" LIMIT 1');
    console.log('PARENT:', rows[0]);
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}
run();
