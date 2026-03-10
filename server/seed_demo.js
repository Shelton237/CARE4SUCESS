import mysql from 'mysql2/promise';
import crypto from 'crypto';

async function seedDemoData() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'care4success',
        password: 'Pluton@2015',
        database: 'care4success'
    });

    console.log('--- SEEDING DEMO DATA FOR DASHBOARD TESTING ---');

    // Teacher: Dr. Clémentine Abanda (t1), Student: Koffi Diallo (s1), Parent: Aminata Diallo (p1)
    // Create 3 sessions for the mock teacher
    const sessions = [
        {
            id: crypto.randomUUID(),
            day: 'Lundi',
            date: '2026-03-11',
            time: '16:00',
            subject: 'Mathématiques',
            location: 'À domicile',
            status: 'planifié',
            teacher_id: 't1',
            teacher_name: 'Dr. Clémentine Abanda',
            student_id: 's1',
            student_name: 'Koffi Diallo',
            parent_id: 'p1',
            parent_name: 'Aminata Diallo',
        },
        {
            id: crypto.randomUUID(),
            day: 'Mercredi',
            date: '2026-03-13',
            time: '14:00',
            subject: 'Physique',
            location: 'En ligne',
            status: 'planifié',
            teacher_id: 't1',
            teacher_name: 'Dr. Clémentine Abanda',
            student_id: 's1',
            student_name: 'Koffi Diallo',
            parent_id: 'p1',
            parent_name: 'Aminata Diallo',
        },
        {
            id: crypto.randomUUID(),
            day: 'Samedi',
            date: '2026-03-08',
            time: '10:00',
            subject: 'Mathématiques',
            location: 'À domicile',
            status: 'effectué',
            teacher_id: 't1',
            teacher_name: 'Dr. Clémentine Abanda',
            student_id: 's1',
            student_name: 'Koffi Diallo',
            parent_id: 'p1',
            parent_name: 'Aminata Diallo',
        }
    ];

    for (const s of sessions) {
        await connection.query(
            `INSERT IGNORE INTO sessions (id, session_day, session_date, session_time, subject, location, status, teacher_id, teacher_name, student_id, student_name, parent_id, parent_name)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [s.id, s.day, s.date, s.time, s.subject, s.location, s.status, s.teacher_id, s.teacher_name, s.student_id, s.student_name, s.parent_id, s.parent_name]
        );
        console.log(`Session created: ${s.subject} on ${s.date} (${s.status})`);
    }

    // Also ensure admin user exists in users table
    const [adminCheck] = await connection.query("SELECT id FROM users WHERE id='a1'");
    if (adminCheck.length === 0) {
        const bcrypt = await import('bcryptjs');
        const hashedPw = bcrypt.default.hashSync('admin123', 10);
        await connection.query(
            "INSERT IGNORE INTO users (id, name, email, password, role, avatar, phone) VALUES ('a1', 'Directeur Ngono', 'admin@care4success.cm', ?, 'admin', 'DN', '+237 675 252 048')",
            [hashedPw]
        );
        console.log('Admin user created.');
    } else {
        console.log('Admin user already exists.');
    }

    // Ensure advisor user exists
    const [advCheck] = await connection.query("SELECT id FROM users WHERE email='conseiller@care4success.cm'");
    if (advCheck.length === 0) {
        const bcrypt = await import('bcryptjs');
        const hashedPw = bcrypt.default.hashSync('conseil123', 10);
        await connection.query(
            "INSERT IGNORE INTO users (id, name, email, password, role, avatar, phone) VALUES ('c1', 'Brice Owona', 'conseiller@care4success.cm', ?, 'advisor', 'BO', '+237 691 556 677')",
            [hashedPw]
        );
        console.log('Advisor user created.');
    } else {
        console.log('Advisor user already exists.');
    }

    // Verify
    const [allSessions] = await connection.query("SELECT id, teacher_name, student_name, session_date, status FROM sessions ORDER BY session_date ASC");
    console.log('All sessions:', allSessions);

    const [allUsers] = await connection.query("SELECT id, name, email, role FROM users WHERE id IN ('a1', 't1', 'p1', 'c1', 's1')");
    console.log('Mock users check:', allUsers);

    await connection.end();
    console.log('--- DONE ---');
}

seedDemoData().catch(console.error);
