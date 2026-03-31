import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function migrate() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        user: process.env.DB_USERNAME || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_DATABASE || 'care4success'
    });

    try {
        const [columns] = await connection.query("SHOW COLUMNS FROM teachers");
        const columnNames = columns.map(c => c.Field);

        if (!columnNames.includes('bank_name')) {
            await connection.query("ALTER TABLE teachers ADD COLUMN bank_name VARCHAR(191)");
        }
        if (!columnNames.includes('bank_iban')) {
            await connection.query("ALTER TABLE teachers ADD COLUMN bank_iban VARCHAR(191)");
        }
        if (!columnNames.includes('bank_account_holder')) {
            await connection.query("ALTER TABLE teachers ADD COLUMN bank_account_holder VARCHAR(191)");
        }
        if (!columnNames.includes('availability_json')) {
            await connection.query("ALTER TABLE teachers ADD COLUMN availability_json JSON");
        }

        console.log("Migration successful");
    } catch (err) {
        console.error("Migration failed", err);
    } finally {
        await connection.end();
    }
}

migrate();
