import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

const rootDir = process.cwd();
['.env.local', '.env'].forEach((file) => {
  const full = path.resolve(rootDir, file);
  if (fs.existsSync(full)) {
    dotenv.config({ path: full, override: false });
  }
});

const pool = mysql.createPool({
  host: process.env.DB_HOST ?? '127.0.0.1',
  user: process.env.DB_USERNAME ?? 'root',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_DATABASE ?? 'care4success',
  port: Number(process.env.DB_PORT ?? 3306),
});

async function fixColumnTypes() {
  try {
    console.log("Conversion des colonnes en JSON...");
    
    // On s'assure que les données actuelles sont au moins des tableaux vides [] pour éviter les erreurs de conversion
    await pool.query("UPDATE teachers SET subjects = '[]' WHERE subjects IS NULL OR subjects = ''");
    await pool.query("UPDATE teachers SET levels = '[]' WHERE levels IS NULL OR levels = ''");

    // Conversion en JSON
    await pool.query("ALTER TABLE teachers MODIFY COLUMN subjects JSON");
    await pool.query("ALTER TABLE teachers MODIFY COLUMN levels JSON");

    console.log("Colonnes converties en JSON avec succès.");
    process.exit(0);
  } catch (err) {
    console.error("Erreur lors de la conversion:", err);
    process.exit(1);
  }
}

fixColumnTypes();
