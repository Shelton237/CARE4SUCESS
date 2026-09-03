const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');

const rootDir = process.cwd();
['.env.local', '.env'].forEach((file) => {
  const full = path.resolve(rootDir, file);
  if (fs.existsSync(full)) {
    dotenv.config({ path: full, override: false });
  }
});

async function run() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST ?? '127.0.0.1',
        user: process.env.DB_USERNAME ?? 'root',
        password: process.env.DB_PASSWORD ?? '',
        database: process.env.DB_DATABASE ?? 'care4success',
        port: Number(process.env.DB_PORT ?? 3306),
    });

    const [result] = await pool.query("DELETE FROM sessions WHERE student_name LIKE '%ENZA%'");
    console.log("Deleted sessions:", result.affectedRows);

    process.exit(0);
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
