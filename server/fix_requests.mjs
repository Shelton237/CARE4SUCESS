
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

async function fix() {
  console.log("Starting correction of requests with parent_child resolution...");
  
  try {
    // 1. Fetch all students
    const [students] = await pool.query("SELECT * FROM users WHERE role = 'student'");
    
    for (const student of students) {
      // 2. Find parent name via parent_child table
      let parentName = "À préciser";
      const [links] = await pool.query(
        "SELECT u.name FROM users u JOIN parent_child pc ON u.id = pc.parent_id WHERE pc.child_id = ?",
        [student.id]
      );
      
      if (links.length > 0) {
        parentName = links[0].name;
      } else if (student.parent_id) {
        // Fallback to parent_id column
        const [p] = await pool.query("SELECT name FROM users WHERE id = ?", [student.parent_id]);
        if (p.length > 0) parentName = p[0].name;
      }

      // 3. Update or Insert request
      const [existing] = await pool.query("SELECT id FROM requests WHERE child_name = ?", [student.name]);
      
      if (existing.length > 0) {
        console.log(`Updating existing request for: ${student.name} -> Parent: ${parentName}`);
        await pool.query(
          "UPDATE requests SET parent_name = ?, phone = ? WHERE child_name = ?",
          [parentName, student.phone || "", student.name]
        );
      } else {
        console.log(`Creating new request for: ${student.name} -> Parent: ${parentName}`);
        const requestId = crypto.randomUUID();
        await pool.query(
          `INSERT INTO requests (id, parent_name, child_name, level, subject, phone, status, request_date)
           VALUES (?, ?, ?, ?, ?, ?, 'reçu', CURRENT_DATE)`,
          [requestId, parentName, student.name, "", "", student.phone || ""]
        );
      }
    }

    console.log("Correction completed successfully.");
  } catch (err) {
    console.error("Correction failed:", err);
  } finally {
    await pool.end();
  }
}

fix();
