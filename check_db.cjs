
const mysql = require('mysql2/promise');
require('dotenv').config({ path: 'c:/Users/TOUTENUN/Desktop/dev/eureka/care4success/.env.local' });

async function check() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT
  });
  const [rows] = await pool.query('DESCRIBE teachers');
  console.log(JSON.stringify(rows, null, 2));
  const [sessionRows] = await pool.query('DESCRIBE sessions');
  console.log("SESSIONS:", JSON.stringify(sessionRows, null, 2));
  process.exit(0);
}
check();
