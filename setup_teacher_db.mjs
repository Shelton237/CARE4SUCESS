import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: '127.0.0.1',
  user: 'care4success',
  password: 'Pluton@2015',
  database: 'care4success'
});

async function setup() {
  try {
    // Vérification des colonnes existantes dans la table teachers
    const [cols] = await pool.query('DESCRIBE teachers');
    const colNames = cols.map(c => c.Field);
    
    console.log("Colonnes actuelles dans 'teachers':", colNames);
    
    if (!colNames.includes('subjects')) {
      console.log("Ajout de la colonne 'subjects'...");
      await pool.query('ALTER TABLE teachers ADD COLUMN subjects TEXT');
    }
    
    if (!colNames.includes('levels')) {
      console.log("Ajout de la colonne 'levels'...");
      await pool.query('ALTER TABLE teachers ADD COLUMN levels TEXT');
    }

    console.log("Base de données prête pour les spécialités enseignants.");
    process.exit(0);
  } catch (err) {
    console.error("Erreur setup DB:", err);
    process.exit(1);
  }
}

setup();
