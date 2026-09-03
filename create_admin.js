const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const rootDir = process.cwd();
['.env.local', '.env'].forEach((file) => {
  const full = path.resolve(rootDir, file);
  if (fs.existsSync(full)) {
    dotenv.config({ path: full, override: false });
  }
});

async function run() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST ?? '127.0.0.1',
        user: process.env.DB_USERNAME ?? 'root',
        password: process.env.DB_PASSWORD ?? '',
        database: process.env.DB_DATABASE ?? 'care4success',
        port: Number(process.env.DB_PORT ?? 3306),
    });

    console.log("--- CREATE REAL ADMIN ---");

    const email = 'admin@care4success.cm';
    const password = 'admin'; // Same as the fallback password they used
    const hash = bcrypt.hashSync(password, 10);

    const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length > 0) {
        console.log("Admin already exists in DB.");
    } else {
        await pool.query(
            `INSERT INTO users (id, name, email, password, role, avatar, phone, location) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                'admin-real-id',
                'Admin Care4Success',
                email,
                hash,
                'admin',
                'AD',
                '+237 600 000 000',
                'Douala, Cameroun'
            ]
        );
        console.log("Real Admin created successfully in DB.");
    }

    process.exit(0);
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
