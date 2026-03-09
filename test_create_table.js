import mysql from "mysql2/promise";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import crypto from "crypto";

const rootDir = process.cwd();
const envFiles = [".env.local", ".env"];
envFiles.forEach((file) => {
    const full = path.resolve(rootDir, file);
    if (fs.existsSync(full)) {
        dotenv.config({ path: full, override: true });
    }
});

const pool = mysql.createPool({
    host: process.env.DB_HOST ?? "127.0.0.1",
    user: process.env.DB_USERNAME ?? "root",
    password: process.env.DB_PASSWORD ?? "",
    database: process.env.DB_DATABASE ?? "care4success",
    port: Number(process.env.DB_PORT ?? 3306),
});

const ensureNotificationsTable = async () => {
    await pool.query(
        `CREATE TABLE IF NOT EXISTS notifications (
      id CHAR(36) NOT NULL DEFAULT (UUID()),
      user_id VARCHAR(191) NOT NULL,
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      type VARCHAR(50) NOT NULL DEFAULT 'info',
      is_read BOOLEAN NOT NULL DEFAULT FALSE,
      link VARCHAR(255) DEFAULT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_notif_user (user_id),
      KEY idx_notif_read (is_read)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
    );
};

try {
    console.log("Creating table...");
    await ensureNotificationsTable();
    console.log("Table created successfully!");
    await pool.end();
} catch (err) {
    console.error("Error creating table:", err.message);
    process.exit(1);
}
