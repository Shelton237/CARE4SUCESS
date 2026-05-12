import mysql from 'mysql2/promise';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const config = {
  host: '127.0.0.1',
  user: 'root',
  password: '',
  database: 'care4success'
};

async function createSalif() {
  const connection = await mysql.createConnection(config);
  
  // 1. Vérifier si Salif existe
  const [rows] = await connection.query("SELECT id FROM users WHERE name = 'Salif Bah' AND role = 'student'");
  if (rows.length === 0) {
    const id = crypto.randomUUID();
    const hash = await bcrypt.hash('eleve123', 10);
    // Créer aussi un parent bidon pour Salif si nécessaire, ou utiliser Aminata Diallo (p1)
    await connection.query(
      "INSERT INTO users (id, name, email, password, role, parent_id, avatar) VALUES (?, 'Salif Bah', 'salif@care4success.cm', ?, 'student', 'p1', 'SB')",
      [id, hash]
    );
    console.log('Utilisateur Salif Bah créé avec succès.');
  } else {
    console.log('Salif Bah existe déjà.');
  }
  
  await connection.end();
}

createSalif();
