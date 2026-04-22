import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'localhost',
  user: 'care4success',
  password: 'Pluton@2015',
  database: 'care4success',
});

async function run() {
  const [users] = await pool.query('SELECT id, name, email, role FROM users WHERE role IN ("student", "parent")');
  console.log('Users found:', JSON.stringify(users, null, 2));
  await pool.end();
}

run().catch(console.error);
