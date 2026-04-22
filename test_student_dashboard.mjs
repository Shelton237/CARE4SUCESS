import http from 'node:http';

function doReq(opts, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(opts, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve({ s: res.statusCode, b: JSON.parse(data) }); }
        catch { resolve({ s: res.statusCode, b: data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

const B = { host: 'localhost', port: 4002 };

async function run() {
  const credentials = [
    { email: 'eleve@care4success.cm', pass: 'student123', role: 'student' },
    { email: 'parent@care4success.cm', pass: 'parent123', role: 'parent' }
  ];

  for (const cred of credentials) {
    console.log(`\n--- Testing ${cred.role}: ${cred.email} ---`);
    const loginRes = await doReq({
      ...B, path: '/api/auth/login', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, JSON.stringify({ email: cred.email, password: cred.pass }));

    if (loginRes.s !== 200) {
      console.log(`❌ Login failed (${loginRes.s}): ${JSON.stringify(loginRes.b)}`);
      continue;
    }

    const { user, token } = loginRes.b;
    console.log(`✅ Login success! User: ${user.name} (ID: ${user.id})`);

    const headers = { 'Authorization': `Bearer ${token}` };

    if (cred.role === 'student') {
      // 1. Overview
      console.log('Fetching overview...');
      const overRes = await doReq({ ...B, path: `/api/students/${user.id}/overview`, headers });
      console.log('Overview:', JSON.stringify(overRes.b));

      // 2. Courses
      console.log('Fetching courses...');
      const coursesRes = await doReq({ ...B, path: `/api/courses?role=student&userId=${user.id}`, headers });
      console.log(`Found ${coursesRes.b.length || 0} courses`);

      // 3. Homework
      console.log('Fetching homework...');
      const hwRes = await doReq({ ...B, path: `/api/students/${user.id}/homework`, headers });
      console.log(`Found ${hwRes.b.length || 0} homework items`);
    } else {
        // Parent: they usually see their children's data
        console.log('Fetching parent overview...');
        const overRes = await doReq({ ...B, path: `/api/parents/${user.id}/overview`, headers });
        console.log('Parent Overview:', JSON.stringify(overRes.b));
    }
  }
}

run().catch(console.error);
