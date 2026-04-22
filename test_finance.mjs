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
  const loginRes = await doReq({
    ...B, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, JSON.stringify({ email: 'admin@care4success.cm', password: 'admin' }));

  if (loginRes.s !== 200) {
    console.log('Admin login failed');
    return;
  }

  const { token } = loginRes.b;
  const headers = { 'Authorization': `Bearer ${token}` };

  console.log('\n--- Testing Finance Summary ---');
  const sumRes = await doReq({ ...B, path: '/api/admin/finance/summary', headers });
  console.log('Summary:', JSON.stringify(sumRes.b, null, 2));

  console.log('\n--- Testing Teacher Payroll ---');
  const payRes = await doReq({ ...B, path: '/api/admin/finance/teacher-payroll', headers });
  console.log('Payroll (first 2):', JSON.stringify(payRes.b?.slice(0, 2), null, 2));

  console.log('\n--- Testing Manual Invoicing ---');
  const genRes = await doReq({ ...B, path: '/api/admin/finance/generate-invoices', method: 'POST', headers });
  console.log('Generation Result:', JSON.stringify(genRes.b, null, 2));
}

run().catch(console.error);
