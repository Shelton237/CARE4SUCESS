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
  // 1. Login comme professeur
  const loginRes = await doRequest({
    ...BASE, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, JSON.stringify({ email: 'prof@care4success.cm', password: 'prof123' }));

  const token = loginRes.body.token;
  const userId = loginRes.body.user?.id;
  const authHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

  console.log('👤 User ID du prof en falllback:', userId);
  console.log('');

  // 2. Lister les cours ACTUELS du professeur
  const listRes = await doRequest({
    ...BASE, path: `/api/courses?role=teacher&userId=${userId}`, method: 'GET', headers: authHeaders
  });

  if (Array.isArray(listRes.body)) {
    console.log(`📚 Cours trouvés en base de données: ${listRes.body.length}`);
    if (listRes.body.length === 0) {
      console.log('⚠️  AUCUN cours persisté — les données viennent du fallback mémoire (perdu au redémarrage)');
    } else {
      listRes.body.forEach(c => {
        console.log(`  ✅ [${c.mode}] "${c.title}" — créé le ${c.createdAt || c.created_at || '?'}`);
      });
    }
  } else {
    console.log('Réponse:', listRes.body);
  }

  // 3. Vérifier aussi via une requête sans userId pour voir ALL courses en DB
  const allRes = await doRequest({
    ...BASE, path: `/api/courses`, method: 'GET', headers: authHeaders
  });
  
  if (Array.isArray(allRes.body)) {
    console.log(`\n📊 Total cours en DB (tous utilisateurs): ${allRes.body.length}`);
  } else {
    console.log('\nErreur lecture globale:', allRes.body?.message);
  }
}

run().catch(console.error);
