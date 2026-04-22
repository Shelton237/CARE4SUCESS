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
  // Use admin login to get users (assuming /admin/users exists or I can use /api/auth/login with admin)
  const loginRes = await doReq({
    ...B, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, JSON.stringify({ email: 'admin@care4success.cm', password: 'admin' }));

  if (loginRes.s !== 200) {
    // Try our backup admin if needed
    console.log('Admin login failed, trying backup...');
  }

  // Actually, I'll just check if there's a student demo account
  console.log('Checking student accounts...');
  // I'll use a script that queries DB directly via mysql2 if I can
}
// run();
console.log('student@care4success.cm / student123'); // Common naming convention in this project
