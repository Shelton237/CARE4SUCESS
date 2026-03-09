const http = require('http');
http.get('http://localhost:5173', (res) => {
    console.log('Status Code:', res.statusCode);
    res.on('data', (d) => process.stdout.write(d.slice(0, 100).toString()));
}).on('error', (e) => {
    console.error('Error connecting to dev server:', e.message);
});
