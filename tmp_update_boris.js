import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

async function run() {
  const pool = mysql.createPool('mysql://root:@localhost:3306/care4success');
  try {
    const hashed = bcrypt.hashSync('test1234', 10);
    await pool.query('UPDATE users SET password = ? WHERE email = "boris@gmail.com"', [hashed]);
    console.log('SUCCESS: Updated boris@gmail.com password to test1234');
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}
run();
