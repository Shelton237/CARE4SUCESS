
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

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

async function sync() {
  console.log("Starting sync of existing students to requests table...");
  
  try {
    // 1. Fetch all students
    const [students] = await pool.query("SELECT * FROM users WHERE role = 'student'");
    console.log(`Found ${students.length} students.`);

    for (const student of students) {
      // 2. Check if request already exists (simple name check)
      const [existing] = await pool.query("SELECT id FROM requests WHERE child_name = ?", [student.name]);
      
      if (existing.length === 0) {
        console.log(`Creating request for student: ${student.name}`);
        
        // 3. Try to find parent name
        let parentName = "À préciser";
        if (student.parent_id) {
          const [parents] = await pool.query("SELECT name FROM users WHERE id = ?", [student.parent_id]);
          if (parents.length > 0) {
            parentName = parents[0].name;
          }
        }

        const requestId = crypto.randomUUID();
        await pool.query(
          `INSERT INTO requests (id, parent_name, child_name, level, subject, phone, status, request_date)
           VALUES (?, ?, ?, ?, ?, ?, 'reçu', CURRENT_DATE)`,
          [requestId, parentName, student.name, "", "", student.phone || ""]
        );
        console.log(`  -> Created request ${requestId}`);
      } else {
        console.log(`Request already exists for: ${student.name} (Skipping)`);
      }
    }

    console.log("Sync completed successfully.");
  } catch (err) {
    console.error("Sync failed:", err);
  } finally {
    await pool.end();
  }
}

sync();
