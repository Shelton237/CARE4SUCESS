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
  // Login
  const lr = await doReq({
    ...B, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, JSON.stringify({ email: 'prof@care4success.cm', password: 'prof123' }));
  
  const tk = lr.b.token;
  const authH = { Authorization: 'Bearer ' + tk, 'Content-Type': 'application/json' };
  
  // Get sessions
  const sessR = await doReq({ ...B, path: '/api/sessions?role=teacher&userId=t1', method: 'GET', headers: authH });
  const sessions = sessR.b;
  console.log('Sessions count:', Array.isArray(sessions) ? sessions.length : JSON.stringify(sessions).slice(0, 100));
  
  if (Array.isArray(sessions) && sessions.length > 0) {
    const planified = sessions.find(s => s.status === 'planifié' || s.status === 'scheduled') || sessions[0];
    console.log('Testing check-in on session:', planified.id, '(status:', planified.status + ')');
    
    const ci = await doReq({
      ...B, path: '/api/sessions/' + planified.id + '/check-in',
      method: 'PATCH', headers: authH
    });
    console.log('Check-in status:', ci.s, ci.b);
    
    if (ci.s === 200) {
      console.log('\n✅ CHECK-IN FONCTIONNE !');
    } else {
      console.log('\n❌ Check-in failed');
    }
  } else {
    console.log('No sessions to test check-in with');
  }
}

run().catch(console.error);
