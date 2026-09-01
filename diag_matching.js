const mysql = require('mysql2/promise');

async function run() {
    const pool = mysql.createPool({
        host: '127.0.0.1',
        user: 'care4success',
        password: 'Pluton@2015',
        database: 'care4success'
    });

    console.log("--- DIAGNOSTIC MATCHING ---");

    // 1. Find Student
    const [students] = await pool.query("SELECT * FROM assignments WHERE child_name LIKE '%ENZA AURELLE%'");
    if (students.length === 0) {
        console.log("Student ENZA AURELLE not found in assignments table.");
    } else {
        console.log("Student found:", students[0].child_name, "| Level:", students[0].level, "| Subject:", students[0].subject);
    }

    // 2. Find Teacher
    const [teachers] = await pool.query("SELECT * FROM teachers WHERE email = 'techsatur719@gmail.com'");
    if (teachers.length === 0) {
        console.log("Teacher techsatur719@gmail.com not found in teachers table.");
    } else {
        console.log("Teacher found:", teachers[0].name, "| Level:", teachers[0].level, "| Subjects:", teachers[0].subjects);
    }

    if (students[0] && teachers[0]) {
        const r = students[0];
        const t = teachers[0];
        const rSubject = (r.subject || "").toLowerCase();
        const rLevel = (r.level || "").toLowerCase();
        
        let tSubjects = [];
        try {
            tSubjects = typeof t.subjects === 'string' ? JSON.parse(t.subjects) : t.subjects;
        } catch(e) {
            tSubjects = (t.subjects || "").split(',').map(s => s.trim());
        }
        
        const tLevel = (t.level || "").toLowerCase();
        
        const subjectMatch = tSubjects.some(s => s.toLowerCase().includes(rSubject));
        const levelMatch = tLevel.includes(rLevel) || rLevel.includes(tLevel) || !rLevel;
        
        console.log("\n--- MATCHING TEST ---");
        console.log("Subject Match:", subjectMatch, `(Student: "${rSubject}", Teacher Subjects: ${JSON.stringify(tSubjects)})`);
        console.log("Level Match:", levelMatch, `(Student Level: "${rLevel}", Teacher Level: "${tLevel}")`);
    }

    process.exit(0);
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
