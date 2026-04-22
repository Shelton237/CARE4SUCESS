import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

const pool = mysql.createPool({
  host: 'localhost',
  user: 'care4success',
  password: 'Pluton@2015',
  database: 'care4success',
});

async function run() {
  const password = 'student123';
  const hashed = await bcrypt.hash(password, 10);
  
  const [res] = await pool.query('UPDATE users SET password = ? WHERE email = ?', [hashed, 'eleve@care4success.cm']);
  console.log('Update result:', res.affectedRows > 0 ? 'SUCCESS' : 'FAILED (Email not found?)');
  
  await pool.end();
}

run().catch(console.error);
