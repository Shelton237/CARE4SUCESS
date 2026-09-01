const mysql = require('mysql2/promise');
async function run() {
  try {
    const pool = mysql.createPool({host:'127.0.0.1', user:'care4success', password:'Pluton@2015', database:'care4success'});
    await pool.query('SET FOREIGN_KEY_CHECKS=0');
    const [tables] = await pool.query('SHOW TABLES');
    for(let t of tables) {
      const name = Object.values(t)[0];
      if(name !== 'users' && name !== 'platform_settings') {
        console.log('Truncating ' + name);
        await pool.query('TRUNCATE TABLE ' + name);
      }
    }
    console.log('Cleaning users except admin...');
    await pool.query("DELETE FROM users WHERE role != 'admin'");
    await pool.query('SET FOREIGN_KEY_CHECKS=1');
    console.log('Database reset successfully!');
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
run();
