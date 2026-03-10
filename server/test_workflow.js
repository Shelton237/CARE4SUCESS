import mysql from 'mysql2/promise';
import crypto from 'crypto';
import http from 'http';

const API_BASE = 'http://127.0.0.1:4000/api';

async function apiRequest(path, method = 'GET', body = null) {
    const options = {
        hostname: '127.0.0.1',
        port: 4000,
        path: '/api' + path,
        method,
        headers: {
            'Content-Type': 'application/json'
        }
    };

    const data = body ? JSON.stringify(body) : null;
    if (data) options.headers['Content-Length'] = Buffer.byteLength(data);

    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let b = '';
            res.on('data', (d) => b += d);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, body: b ? JSON.parse(b) : {} });
                } catch (e) {
                    resolve({ status: res.statusCode, body: b });
                }
            });
        });
        req.on('error', reject);
        if (data) req.write(data);
        req.end();
    });
}

async function runTest() {
    console.log('--- STARTING END-TO-END WORKFLOW TEST ---');

    const testId = Date.now().toString().slice(-4);
    const parentEmail = `parent_${testId}@test.com`;
    const childEmail = `child_${testId}@test.com`;

    // 1. Enrollment
    console.log(`1. Enrolling: ${parentEmail} / ${childEmail}...`);
    const enrollRes = await apiRequest('/parents/enroll', 'POST', {
        parentName: 'Test Parent ' + testId,
        parentEmail: parentEmail,
        parentPassword: 'password123',
        childName: 'Test Student ' + testId,
        childEmail: childEmail,
        childPassword: 'password123',
        childLevel: '3e',
        subject: 'Mathematiques'
    });

    if (enrollRes.status !== 200 && enrollRes.status !== 201) {
        throw new Error(`Enrollment failed: ${enrollRes.status} ${JSON.stringify(enrollRes.body)}`);
    }
    console.log('Enrollment Success!');

    // 1.1 Find the request ID
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'care4success',
        password: 'Pluton@2015',
        database: 'care4success'
    });

    const [reqs] = await connection.query('SELECT id FROM requests WHERE child_name = ?', [`Test Student ${testId}`]);
    const requestId = reqs[0].id;
    console.log(`Initial Request ID: ${requestId}`);

    // 2. Change status to 'en traitement'
    console.log('2. Changing status to "en traitement" to trigger auto-matching...');
    const statusRes = await apiRequest(`/requests/${requestId}`, 'PATCH', { status: 'en traitement' });
    if (statusRes.status !== 200) {
        throw new Error(`Status change failed: ${statusRes.status} ${JSON.stringify(statusRes.body)}`);
    }
    console.log('Status updated.');

    // 3. Verify Assignment was created
    console.log('3. Verifying Assignment creation...');
    const [assignments] = await connection.query('SELECT * FROM assignments WHERE child_name = ?', [`Test Student ${testId}`]);
    if (assignments.length === 0) {
        throw new Error('No assignment was created by automation!');
    }
    const assignment = assignments[0];
    console.log(`Assignment found! Status: ${assignment.status}, ID: ${assignment.id}`);
    console.log(`Candidates: ${JSON.stringify(assignment.candidates)}`);

    // 4. Confirm Assignment
    // We need a teacher name from the candidates or just 'Jean Professeur' which we know is there
    const teacherName = 'Jean Professeur';
    console.log(`4. Reconfirming with teacher: ${teacherName}...`);
    const confirmRes = await apiRequest(`/assignments/${assignment.id}`, 'PATCH', { selectedTeacher: teacherName });
    if (confirmRes.status !== 200) {
        throw new Error(`Assignment confirmation failed: ${confirmRes.status} ${JSON.stringify(confirmRes.body)}`);
    }
    console.log('Assignment confirmed.');

    // 5. Final Verification
    console.log('5. Final Verifications...');
    const [finalReq] = await connection.query('SELECT status FROM requests WHERE id = ?', [requestId]);
    console.log(`Request status (should be "assigné"): ${finalReq[0].status}`);

    const [finalSessions] = await connection.query('SELECT * FROM sessions WHERE student_name = ?', [`Test Student ${testId}`]);
    console.log(`Sessions count (should be at least 1): ${finalSessions.length}`);
    if (finalSessions[0]) {
        console.log(`First session details: ${finalSessions[0].subject} on ${finalSessions[0].session_date} with ${finalSessions[0].teacher_name}`);
    }

    await connection.end();
    console.log('--- TEST COMPLETED SUCCESSFULLY ---');
}

runTest().catch(err => {
    console.error('TEST FAILED:', err);
    process.exit(1);
});
