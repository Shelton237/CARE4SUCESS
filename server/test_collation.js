import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

async function run() {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        user: process.env.DB_USERNAME || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_DATABASE || 'care4success'
    });

    try {
        const [students] = await conn.query("SELECT DISTINCT s.student_id as id, s.student_name as name, u.email, s.subject, '3e' as level FROM sessions s LEFT JOIN users u ON u.id = s.student_id COLLATE utf8mb4_unicode_ci WHERE s.teacher_id = ?", ['t1']);
        console.log('Students:', students.length);

        for (const st of students) {
            console.log('\n--- Student ID:', st.id);

            console.log('q1 start');
            const [[sessionStats]] = await conn.query("SELECT COUNT(id) as total, SUM(CASE WHEN status = 'effectué' THEN 1 ELSE 0 END) as done, MAX(session_date) as lastSessionDate FROM sessions WHERE student_id = ? AND teacher_id = ?", [st.id, 't1']);
            
            console.log('q2 start');
            const [quizAttempts] = await conn.query("SELECT a.score, q.total_points, c.subject FROM quiz_attempts a JOIN quizzes q ON q.id = a.quiz_id LEFT JOIN courses c ON c.id = q.course_id WHERE a.student_id = ? ORDER BY a.created_at DESC", [st.id]);
            
            console.log('q3 start (courses)');
            const [courses] = await conn.query("SELECT c.id, c.title, c.status FROM course_enrollments ce JOIN courses c ON c.id = ce.course_id WHERE ce.student_id = ?", [st.id]);
            
            console.log('q4 start');
            const [homeworkRows] = await conn.query("SELECT id, title, status, due_date as lastAttempt FROM homework WHERE student_id = ? ORDER BY created_at DESC LIMIT 5", [st.id]);
            
            console.log('q5 start (evals)');
            const [evaluations] = await conn.query("SELECT id, teacher_name as author, 'Enseignant' as role, rating, DATE_FORMAT(created_at, '%d/%m/%Y') as date, comment FROM student_evaluations WHERE student_id = ? ORDER BY created_at DESC", [st.id]);
        }
        console.log("All OK");
    } catch (e) {
        console.error("ERROR CAUGHT:");
        console.error(e.message);
    }
    process.exit(0);
}

run();
