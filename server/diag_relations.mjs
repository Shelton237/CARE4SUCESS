
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
  host: process.env.DB_HOST || "127.0.0.1",
  user: process.env.DB_USERNAME || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_DATABASE || "care4success",
  port: Number(process.env.DB_PORT || 3306),
});

async function diag() {
  try {
    console.log("--- Parent-Child Relations ---");
    const [relations] = await pool.query("SELECT * FROM parent_child");
    console.table(relations);

    console.log("--- Students List ---");
    const [students] = await pool.query("SELECT id, name, parent_id FROM users WHERE role = 'student'");
    console.table(students);

    console.log("--- Parents List ---");
    const [parents] = await pool.query("SELECT id, name FROM users WHERE role = 'parent'");
    console.table(parents);

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

diag();
