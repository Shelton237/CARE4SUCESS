import mysql from 'mysql2/promise';

async function run() {
  const pool = mysql.createPool('mysql://root:@localhost:3306/care4success');
  try {
    const [rows] = await pool.query('SELECT name, email, role FROM users WHERE id = "895b6d75-11a2-40fc-985c-f1e708d9d914"');
    console.log('PARENT:', rows[0]);
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}
run();
