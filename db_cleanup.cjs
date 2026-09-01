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

    console.log("--- DATABASE CLEANUP ---");

    // 1. Delete all teachers except the one validated
    // Validated email: techsatur719@gmail.com
    const [delTeachers] = await pool.query("DELETE FROM teachers WHERE email != 'techsatur719@gmail.com'");
    console.log(`Deleted ${delTeachers.affectedRows} teachers from 'teachers' table.`);

    // 2. Also delete from 'users' table if they are teachers and not the validated one
    const [delUsers] = await pool.query("DELETE FROM users WHERE role = 'teacher' AND email != 'techsatur719@gmail.com'");
    console.log(`Deleted ${delUsers.affectedRows} teachers from 'users' table.`);

    // 3. Clear assignments that are demo
    // We'll keep assignments for real students if any, but demo ones often have 's1', 's2' ids
    // For safety, let's just delete assignments that don't match our real student if we know them.
    // User mentioned ENZA AURELLE and lesaturtech@yahoo.com
    const [delAssignments] = await pool.query("DELETE FROM assignments WHERE child_name NOT LIKE '%ENZA AURELLE%' AND child_name NOT LIKE '%lesaturtech%'");
    console.log(`Deleted ${delAssignments.affectedRows} demo assignments.`);

    process.exit(0);
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
