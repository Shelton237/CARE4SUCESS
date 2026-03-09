import mysql from "mysql2/promise";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

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

try {
    const [rows] = await pool.query("SHOW TABLES");
    console.log("Tables:", rows.map(r => Object.values(r)[0]));
    await pool.end();
} catch (err) {
    console.error("DB connection error:", err.message);
    process.exit(1);
}
