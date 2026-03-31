
import axios from 'axios';

async function check() {
  try {
    const res = await axios.get('http://localhost:8080');
    console.log('Frontend status:', res.status);
    const apiRes = await axios.get('http://localhost:4000/api/admin/dashboard').catch(e => e.response);
    console.log('API status (no auth):', apiRes ? apiRes.status : 'No response');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

check();
