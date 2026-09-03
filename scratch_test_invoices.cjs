const mysql = require('mysql2/promise');

async function main() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'care4success'
  });

  try {
    const [users] = await connection.execute("SELECT id, name, role FROM users WHERE name LIKE '%LESATUR TECH%'");
    console.log("Users:", users);

    for (const user of users) {
      console.log(`\nInvoices for ${user.id}:`);
      const [invoices] = await connection.execute("SELECT * FROM parent_invoices WHERE parent_id = ?", [user.id]);
      console.log(invoices);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

main();
