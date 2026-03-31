
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
    const [tables] = await pool.query("SHOW TABLES");
    console.log("Tables:", tables.map(t => Object.values(t)[0]));

    const [disputes] = await pool.query("DESCRIBE grade_disputes");
    console.log("grade_disputes schema:", disputes);

    const [points] = await pool.query("DESCRIBE student_progress_points");
    console.log("student_progress_points schema:", points);

    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

check();
