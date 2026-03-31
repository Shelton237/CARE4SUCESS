
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: "127.0.0.1",
  user: "root",
  password: "",
  database: "care4success",
  port: 3306,
});

async function check() {
  try {
    const [rows] = await pool.query("SELECT * FROM parent_child");
    console.log("Parent-Child links:");
    console.table(rows);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
