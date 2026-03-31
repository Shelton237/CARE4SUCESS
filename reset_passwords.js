
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

const pool = mysql.createPool({
  host: "127.0.0.1",
  user: "root",
  password: "",
  database: "care4success",
  port: 3306,
});

const MOCK_USERS = [
  { email: "admin@care4success.cm", password: "admin123" },
  { email: "parent@care4success.cm", password: "parent123" },
  { email: "prof@care4success.cm", password: "prof123" },
  { email: "conseiller@care4success.cm", password: "conseil123" },
  { email: "eleve@care4success.cm", password: "eleve123" },
];

async function reset() {
  try {
    for (const u of MOCK_USERS) {
      const hashedPassword = await bcrypt.hash(u.password, 10);
      await pool.query("UPDATE users SET password = ? WHERE email = ?", [hashedPassword, u.email]);
      console.log(`Reset password for ${u.email}`);
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

reset();
