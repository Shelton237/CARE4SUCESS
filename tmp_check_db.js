import mysql from 'mysql2/promise';

async function run() {
  const pool = mysql.createPool('mysql://root:@localhost:3306/care4success');
  try {
    const studentId = 'a96573b6-2748-4a35-9090-305ff04b7a3b';
    const [rows] = await pool.query('SELECT id, name, role, parent_id FROM users WHERE id = ?', [studentId]);
    console.log('CHILD:', rows[0]);
    
    const [rows2] = await pool.query('SELECT parent_id, child_id FROM parent_child WHERE child_id = ?', [studentId]);
    console.log('LINKS:', rows2);

    const parentId = '895b6d75-11a2-40fc-985c-f1e708d9d914';
    const [rows3] = await pool.query('SELECT id, name, role FROM users WHERE id = ?', [parentId]);
    console.log('PARENT:', rows3[0]);

  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}
run();
