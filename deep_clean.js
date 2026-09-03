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

    console.log("--- DEEP CLEAN ---");

    // 1. List of mock emails to delete
    const mockEmails = [
        'admin@care4success.cm',
        'prof@care4success.cm',
        'parent@care4success.cm',
        'conseiller@care4success.cm',
        'eleve@care4success.cm',
        'test@care4success.com',
        'tuteur@care4success.cm'
    ];

    // Delete matching teachers
    const [delTeachers] = await pool.query(
        "DELETE FROM teachers WHERE email IN (?) OR email != 'techsatur719@gmail.com'", 
        [mockEmails]
    );
    console.log(`Deleted ${delTeachers.affectedRows} teachers.`);

    // Delete matching users
    const [delUsers] = await pool.query(
        "DELETE FROM users WHERE email IN (?) OR (role = 'teacher' AND email != 'techsatur719@gmail.com')", 
        [mockEmails]
    );
    console.log(`Deleted ${delUsers.affectedRows} users.`);

    // Check what is left in users
    const [users] = await pool.query("SELECT id, name, email, role FROM users");
    console.log("\nRemaining users in database:");
    console.log(users);

    process.exit(0);
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
