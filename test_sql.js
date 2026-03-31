
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: "127.0.0.1",
  user: "root",
  password: "",
  database: "care4success",
  port: 3306,
});

async function test() {
  try {
    const parentId = "p1";
    const [rows] = await pool.query(
        `SELECT u.id, u.name, u.email, u.role, u.avatar, u.phone, u.location, u.timezone, u.language, u.bio,
                u.notify_email, u.notify_sms, u.notify_whatsapp, u.parent_id, u.last_login_at, u.created_at, u.updated_at
         FROM parent_child pc
         JOIN users u ON u.id = pc.child_id
         WHERE pc.parent_id = ?`,
        [parentId]
    );
    console.log("Rows:", rows);
    process.exit(0);
  } catch (err) {
    console.error("SQL Error:", err.message);
    process.exit(1);
  }
}

test();
