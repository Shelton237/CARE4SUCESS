import mysql from 'mysql2/promise';

async function run() {
  const pool = mysql.createPool('mysql://root:@localhost:3306/care4success');
  try {
    const parentId = '895b6d75-11a2-40fc-985c-f1e708d9d914';
    const [rows] = await pool.query('SELECT name, id FROM users WHERE parent_id = ?', [parentId]);
    console.log('CHILDREN:', rows);
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}
run();
