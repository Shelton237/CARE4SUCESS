import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local", override: true });

const pool = await mysql.createPool({
  host: process.env.DB_HOST ?? "127.0.0.1",
  user: process.env.DB_USERNAME ?? "root",
  password: process.env.DB_PASSWORD ?? "",
  database: process.env.DB_DATABASE ?? "care4success",
  port: Number(process.env.DB_PORT ?? 3306),
});

// 1. Patch la table homework et toutes ses fk
const allTables = ["homework", "student_evaluations", "sessions", "users"];
for (const t of allTables) {
  try {
    // Supprimer les FK d'abord si nécessaire
    const [fkRows] = await pool.query(`
      SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = '${process.env.DB_DATABASE}' AND TABLE_NAME = '${t}'
      AND REFERENCED_TABLE_NAME IS NOT NULL
    `);
    for (const fk of fkRows) {
      try { await pool.query(`ALTER TABLE \`${t}\` DROP FOREIGN KEY \`${fk.CONSTRAINT_NAME}\``); } catch {}
    }
    await pool.query(`ALTER TABLE \`${t}\` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci`);
    console.log(`✅ Patched: ${t}`);
  } catch (e) {
    console.warn(`⏭ ${t}: ${e.message}`);
  }
}

// 2. Tester les requêtes clés
try {
  const [r] = await pool.query(`
    SELECT DISTINCT s.student_id as id, s.student_name as name, u.email, s.subject, u.bio as level
    FROM sessions s LEFT JOIN users u ON u.id = s.student_id
    WHERE s.teacher_id = 't1'
  `);
  console.log(`✅ Teacher students query OK: ${r.length} results`);
} catch (e) {
  console.error(`❌ Teacher students query failed: ${e.message}`);
}

try {
  const [r] = await pool.query(`SELECT * FROM homework WHERE teacher_id = 't1'`);
  console.log(`✅ Homework query OK: ${r.length} results`);
} catch (e) {
  console.error(`❌ Homework query failed: ${e.message}`);
}

process.exit(0);
