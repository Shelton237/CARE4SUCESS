import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const rootDir = process.cwd();
const envFiles = [".env.local", ".env"];
envFiles.forEach((file) => {
  const full = path.resolve(rootDir, file);
  if (fs.existsSync(full)) {
    dotenv.config({ path: full, override: false });
  }
});

const pool = mysql.createPool({
  host: process.env.DB_HOST ?? "127.0.0.1",
  user: process.env.DB_USERNAME ?? "root",
  password: process.env.DB_PASSWORD ?? "",
  database: process.env.DB_DATABASE ?? "care4success",
  port: Number(process.env.DB_PORT ?? 3306),
});

async function run() {
  const [users] = await pool.query('SELECT id, name, email, role FROM users');
  console.log('--- ALL USERS ---');
  console.log(JSON.stringify(users, null, 2));

  const [studentTeacher] = await pool.query('SELECT * FROM student_teacher');
  console.log('--- STUDENT TEACHER RELATIONS ---');
  console.log(JSON.stringify(studentTeacher, null, 2));

  const [messages] = await pool.query('SELECT * FROM messages ORDER BY created_at DESC LIMIT 10');
  console.log('--- LATEST MESSAGES ---');
  console.log(JSON.stringify(messages, null, 2));

  await pool.end();
}

run().catch(console.error);
