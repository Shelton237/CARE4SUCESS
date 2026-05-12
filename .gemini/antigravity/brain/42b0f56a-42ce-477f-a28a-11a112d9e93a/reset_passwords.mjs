import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

const config = {
  host: '127.0.0.1',
  user: 'root',
  password: '',
  database: 'care4success'
};

async function reset() {
  const connection = await mysql.createConnection(config);
  const hash = await bcrypt.hash('admin', 10);
  await connection.query('UPDATE users SET password = ? WHERE role IN ("admin", "advisor")', [hash]);
  console.log('Passwords reset to "admin" for admin and advisor.');
  await connection.end();
}

reset();
