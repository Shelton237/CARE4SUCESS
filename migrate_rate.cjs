
const mysql = require('mysql2/promise');
require('dotenv').config({ path: 'c:/Users/TOUTENUN/Desktop/dev/eureka/care4success/.env.local' });

async function main() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT
  });
  try {
    const [rows] = await pool.query("SHOW COLUMNS FROM teachers LIKE 'hourly_rate'");
    if (rows.length === 0) {
      await pool.query('ALTER TABLE teachers ADD COLUMN hourly_rate INT DEFAULT 7500');
      console.log('Added hourly_rate to teachers');
    } else {
      console.log('hourly_rate already exists');
    }
  } catch (error) {
    console.error("Migration failed", error);
  }
  process.exit(0);
}
main();
