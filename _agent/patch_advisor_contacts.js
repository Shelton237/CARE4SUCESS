const fs = require('fs');
const path = '/var/www/CARE4SUCESS/server/index.js';
let content = fs.readFileSync(path, 'utf8');

// Find the line just before app.get("/api/advisor/families"
const target = 'app.get("/api/advisor/families", async (_req, res) => {';

const newRoute = `app.get("/api/advisors/:advisorId/contacts", authenticateRequest, async (req, res) => {
  try {
    const [teachers] = await pool.query(
      \`SELECT id, name, role, avatar FROM users WHERE role = 'teacher'\`
    );
    const [parents] = await pool.query(
      \`SELECT id, name, role, avatar FROM users WHERE role = 'parent'\`
    );
    const contacts = [...teachers, ...parents].map(c => ({
      id: c.id,
      name: c.name,
      role: c.role,
      avatar: c.avatar || (c.name ? c.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '?')
    }));
    res.json(contacts);
  } catch (error) {
    console.error('Failed to fetch advisor contacts', error);
    res.status(500).json({ message: 'Erreur lors de la recuperation des contacts.' });
  }
});

` + target;

if (content.includes(target)) {
  content = content.replace(target, newRoute);
  fs.writeFileSync(path, content, 'utf8');
  console.log('OK: endpoint advisor contacts ajoute');
} else {
  console.log('ERREUR: target non trouve: ' + target);
}
