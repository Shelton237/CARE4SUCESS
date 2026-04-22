import http from 'node:http';

function doRequest(opts, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(opts, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

const BASE = { host: 'localhost', port: 4002 };

async function run() {
  // 1. Login as teacher
  const loginRes = await doRequest({
    ...BASE, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, JSON.stringify({ email: 'prof@care4success.cm', password: 'prof123' }));

  console.log('1. Login:', loginRes.status, loginRes.body?.user?.name);
  if (loginRes.status !== 200) { console.error('ABORT: login failed'); return; }

  const token = loginRes.body.token;
  const userId = loginRes.body.user?.id;
  const authHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

  // 2. Create ONLINE course
  const online = await doRequest({
    ...BASE, path: '/api/courses', method: 'POST', headers: authHeaders
  }, JSON.stringify({
    title: 'Maths BAC Terminale (En ligne)',
    subject: 'Mathématiques', level: 'Terminale',
    mode: 'online', status: 'published', createdBy: userId,
    description: 'Révisions intensives pour le baccalauréat.'
  }));
  console.log('2. Course Online:', online.status, online.body?.title || online.body?.message);

  // 3. Create PRESENTIEL course
  const presentiel = await doRequest({
    ...BASE, path: '/api/courses', method: 'POST', headers: authHeaders
  }, JSON.stringify({
    title: 'Français 3ème Brevet (Présentiel)',
    subject: 'Français', level: '3ème',
    mode: 'presentiel', status: 'published', createdBy: userId,
    description: 'Préparation intensive au brevet des collèges.'
  }));
  console.log('3. Course Présentiel:', presentiel.status, presentiel.body?.title || presentiel.body?.message);

  // 4. List all teacher courses
  const listRes = await doRequest({
    ...BASE, path: `/api/courses?role=teacher&userId=${userId}`, method: 'GET', headers: authHeaders
  });
  console.log('\n📚 All Teacher Courses:');
  if (Array.isArray(listRes.body)) {
    listRes.body.forEach(c => console.log(`  [${c.mode}] "${c.title}" — ${c.status}`));
    console.log(`\n✅ Total: ${listRes.body.length} course(s)`);
  } else {
    console.log(listRes.body);
  }
}

run().catch(console.error);
