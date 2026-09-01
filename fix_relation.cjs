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

  // Check users table columns
  const [cols] = await pool.query("SHOW COLUMNS FROM users");
  console.log("USERS COLUMNS:", cols.map(c => c.Field).join(', '));
  
  // Check teacher user specifically
  const [teachers] = await pool.query("SELECT id, name, role FROM users WHERE role = 'teacher'");
  console.log("\nTEACHERS:", JSON.stringify(teachers));
  
  // Check what secondary_role looks like  
  const hasSecRole = cols.some(c => c.Field === 'secondary_role');
  console.log("\nHas secondary_role column:", hasSecRole);
  
  // Try the exact query that the matching uses
  const [found] = await pool.query(
    "SELECT id FROM users WHERE name = ? AND (role = 'teacher' OR secondary_role = 'teacher') LIMIT 1",
    ['PENLAP KAMDEM ']
  );
  console.log("\nTeacher lookup result:", JSON.stringify(found));
  
  // Try with TRIM
  const [foundTrim] = await pool.query(
    "SELECT id FROM users WHERE TRIM(name) = TRIM(?) AND role = 'teacher' LIMIT 1",
    ['PENLAP KAMDEM ']
  );
  console.log("Teacher lookup (TRIM):", JSON.stringify(foundTrim));

  // FIX: Manually insert the missing relation now
  const [[student]] = await pool.query("SELECT id FROM users WHERE role='student' LIMIT 1");
  const [[teacher]] = await pool.query("SELECT id FROM users WHERE role='teacher' LIMIT 1");
  console.log("\nStudent:", student, "Teacher:", teacher);
  
  if (student && teacher) {
    await pool.query(
      "INSERT IGNORE INTO student_teacher (student_id, teacher_id) VALUES (?, ?)",
      [student.id, teacher.id]
    );
    console.log("Relation inserted successfully!");
    const [rel] = await pool.query("SELECT * FROM student_teacher");
    console.log("student_teacher now:", JSON.stringify(rel));
  }
  
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
