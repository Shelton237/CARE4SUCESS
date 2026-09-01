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
  try {
    const pool = mysql.createPool({
      host: process.env.DB_HOST ?? '127.0.0.1',
      user: process.env.DB_USERNAME ?? 'root',
      password: process.env.DB_PASSWORD ?? '',
      database: process.env.DB_DATABASE ?? 'care4success',
      port: Number(process.env.DB_PORT ?? 3306),
    });

    console.log("--- USERS ---");
    const [users] = await pool.query("SELECT id, name, role FROM users WHERE role != 'admin'");
    console.table(users);

    console.log("\n--- ASSIGNMENTS ---");
    const [assignments] = await pool.query("SELECT id, child_name, selected_teacher, status FROM assignments");
    console.table(assignments);

    console.log("\n--- STUDENT_TEACHER RELATIONS ---");
    const [relations] = await pool.query("SELECT * FROM student_teacher");
    console.table(relations);

    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
run();
