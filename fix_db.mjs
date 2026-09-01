import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '/var/www/CARE4SUCESS/.env' });

async function fixDB() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST ?? "127.0.0.1",
    user: process.env.DB_USERNAME ?? "root",
    password: process.env.DB_PASSWORD ?? "",
    database: process.env.DB_DATABASE ?? "care4success",
    port: Number(process.env.DB_PORT ?? 3306),
  });

  try {
    console.log("Updating sessions status...");
    
    // Convert 'planifi??' or similar corrupt strings to 'planifié'
    await pool.query("UPDATE sessions SET status = 'planifié' WHERE status LIKE 'planifi%'");
    await pool.query("UPDATE sessions SET status = 'effectué' WHERE status LIKE 'effectu%'");
    await pool.query("UPDATE sessions SET status = 'à venir' WHERE status LIKE '%venir'");
    
    // Also do requests if needed
    await pool.query("UPDATE requests SET status = 'reçu' WHERE status LIKE 're%'");
    await pool.query("UPDATE requests SET status = 'assigné' WHERE status LIKE 'assign%'");
    await pool.query("UPDATE requests SET status = 'clôturé' WHERE status LIKE 'cl_tur%'");

    console.log("Data cleaned up.");

    // Now try to alter the tables
    await pool.query("ALTER TABLE sessions MODIFY COLUMN status ENUM('planifié','à venir','en cours','effectué','annulé','scheduled','in_progress','completed') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'planifié'");
    console.log("Altered sessions table successfully.");

    await pool.query("ALTER TABLE requests MODIFY COLUMN status ENUM('reçu', 'en traitement', 'assigné', 'clôturé') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'reçu'");
    console.log("Altered requests table successfully.");

    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

fixDB();
