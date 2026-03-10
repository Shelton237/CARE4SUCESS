import mysql from 'mysql2/promise';
import crypto from 'crypto';

async function run() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'care4success',
        password: 'Pluton@2015',
        database: 'care4success'
    });

    console.log('--- Testing JSON_CONTAINS ---');
    const subject = 'Physique';
    const [teachers] = await connection.query(
        "SELECT name, subjects FROM teachers WHERE JSON_CONTAINS(subjects, JSON_QUOTE(?)) AND status = 'actif'",
        [subject]
    );
    console.log('Teachers found for', subject, ':', teachers);

    console.log('--- Testing Request ---');
    const [reqs] = await connection.query('SELECT * FROM requests WHERE child_name = ?', ['Pierre Dupont']);
    console.log('Request for Pierre:', reqs[0]);

    if (reqs[0]) {
        console.log('--- Creating Assignment Manually ---');
        const assignmentId = crypto.randomUUID();
        const candidates = teachers.map(t => ({ name: t.name, rating: t.rating || 5, available: true }));
        await connection.query(
            `INSERT IGNORE INTO assignments (id, child_name, level, subject, status, candidates)
         VALUES (?, ?, ?, ?, 'pending', ?)`,
            [assignmentId, reqs[0].child_name, reqs[0].level, reqs[0].subject, JSON.stringify(candidates)]
        );
        console.log('Assignment created with ID:', assignmentId);
    }

    const [allAss] = await connection.query('SELECT * FROM assignments');
    console.log('All assignments:', allAss);

    await connection.end();
}

run().catch(console.error);
