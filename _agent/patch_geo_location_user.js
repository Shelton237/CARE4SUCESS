const fs = require('fs');
const path = '/var/www/CARE4SUCESS/server/index.js';
let content = fs.readFileSync(path, 'utf8');

// 1. Ajouter geoLocationId dans la déstructuration du body
const OLD_DESTRUCTURE = `  } = req.body ?? {};

  const allowedLanguages`;
const NEW_DESTRUCTURE = `  geoLocationId,
  } = req.body ?? {};

  const allowedLanguages`;
if (content.includes(OLD_DESTRUCTURE)) {
  content = content.replace(OLD_DESTRUCTURE, NEW_DESTRUCTURE);
  console.log('OK: geoLocationId ajouté dans la destructuration');
} else {
  console.log('WARN: destructuration non trouvée, tentative alternative');
}

// 2. Ajouter le pushUpdate pour geo_location_id après le pushUpdate de location
const OLD_LOCATION_UPDATE = `  if (typeof location === "string") pushUpdate("location", location.trim());`;
const NEW_LOCATION_UPDATE = `  if (typeof location === "string") pushUpdate("location", location.trim());
  if (geoLocationId !== undefined) pushUpdate("geo_location_id", geoLocationId === null ? null : Number(geoLocationId));`;
if (content.includes(OLD_LOCATION_UPDATE)) {
  content = content.replace(OLD_LOCATION_UPDATE, NEW_LOCATION_UPDATE);
  console.log('OK: pushUpdate geo_location_id ajouté');
} else {
  console.log('ERREUR: pushUpdate location non trouvé');
  process.exit(1);
}

// 3. Inclure geo_location_id dans le SELECT final retourné
const OLD_SELECT = `SELECT u.*, u.avatar_url,
              t.bank_name, t.bank_iban, t.bank_account_holder, t.availability_json
       FROM users u
       LEFT JOIN teachers t ON t.id = u.id
       WHERE u.id = ?`;
const NEW_SELECT = `SELECT u.*, u.avatar_url, u.geo_location_id,
              t.bank_name, t.bank_iban, t.bank_account_holder, t.availability_json,
              g.name as geo_location_name, g.type as geo_location_type
       FROM users u
       LEFT JOIN teachers t ON t.id = u.id
       LEFT JOIN geo_locations g ON g.id = u.geo_location_id
       WHERE u.id = ?`;
if (content.includes(OLD_SELECT)) {
  content = content.replace(OLD_SELECT, NEW_SELECT);
  console.log('OK: SELECT profil enrichi avec geo_location');
} else {
  console.log('WARN: SELECT final non trouvé exactement, continuation sans modification du SELECT');
}

fs.writeFileSync(path, content, 'utf8');
console.log('DONE: patch_geo_location_user appliqué');
