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

try {
    const id = crypto.randomUUID();
    await pool.query(
        `INSERT INTO teacher_applications 
     (id, full_name, email, phone, subjects, experience_years, availability, motivation, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [
            id,
            "Martin Dupont",
            "martin.dupont.test@example.com",
            "0601020304",
            JSON.stringify(["Physique", "Chimie"]),
            5,
            "Soirées et weekends",
            "Je suis passionné par l'enseignement scientifique."
        ]
    );
    console.log("Candidature ajoutée avec succès ! ID:", id);
    process.exit(0);
} catch (e) {
    console.error(e.message);
    process.exit(1);
}
