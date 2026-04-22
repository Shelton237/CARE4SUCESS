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
  // 1. Create a dummy application
  const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
  const appData = [
    `--${boundary}`,
    'Content-Disposition: form-data; name="fullName"',
    '',
    'Test Pricing Prof',
    `--${boundary}`,
    'Content-Disposition: form-data; name="email"',
    '',
    'pricing_prof@test.com',
    `--${boundary}`,
    'Content-Disposition: form-data; name="phone"',
    '',
    '123456789',
    `--${boundary}`,
    'Content-Disposition: form-data; name="subjects"',
    '',
    '["Maths"]',
    `--${boundary}`,
    'Content-Disposition: form-data; name="experienceYears"',
    '',
    '5',
    `--${boundary}`,
    'Content-Disposition: form-data; name="availability"',
    '',
    'Lundi matin',
    `--${boundary}`,
    'Content-Disposition: form-data; name="motivation"',
    '',
    'Test pricing',
    `--${boundary}--`,
  ].join('\r\n');

  console.log('--- 1. Creating application ---');
  const createRes = await doReq({
    ...B, path: '/api/teacher-applications', method: 'POST',
    headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` }
  }, appData);

  const appId = createRes.b.id;
  console.log('Application created:', appId);

  // 2. Approve with negotiated rate (monthly)
  console.log('\n--- 2. Approving with monthly rate 85000 ---');
  const approveRes = await doReq({
    ...B, path: `/api/teacher-applications/${appId}`, method: 'PATCH',
    headers: { 'Content-Type': 'application/json' }
  }, JSON.stringify({
    status: 'approved',
    reviewerName: 'Admin Test',
    reviewerRole: 'admin',
    rateType: 'monthly',
    negotiatedRate: 85000
  }));

  console.log('Approve Status:', approveRes.s);
  
  // 3. Check the teacher record in DB
  // Since I can't easily run SQL, I'll use the API if there's a getter, or just check logs
  console.log('\n--- 3. Verifying teacher profile creation ---');
  // I'll check /api/teachers (if it exists)
  const teachersRes = await doReq({ ...B, path: '/api/teachers', method: 'GET' });
  const prof = (teachersRes.b || []).find(t => t.email === 'pricing_prof@test.com');
  
  if (prof) {
    console.log('✅ Prof record found!');
    console.log('   Email:', prof.email);
    console.log('   Rate Type:', prof.rate_type);
    console.log('   Hourly Rate:', prof.hourly_rate);
    console.log('   Monthly Rate:', prof.monthly_rate);
    
    if (prof.rate_type === 'monthly' && prof.monthly_rate == 85000) {
      console.log('\n🎉 PERSISTENCE DE LA TARIFICATION VALIDÉE !');
    } else {
      console.log('\n❌ Pricing mismatch!');
    }
  } else {
    console.log('❌ Prof record not found in /api/teachers');
  }
}

run().catch(console.error);
