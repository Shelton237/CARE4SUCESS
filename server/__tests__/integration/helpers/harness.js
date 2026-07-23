// Harness partagé pour les scénarios d'intégration (scenario-director).
// - Charge .env.test explicitement (server/index.js ne le fait PAS).
// - Fournit un pool MySQL, un client HTTP, la génération de jetons JWT,
//   et des utilitaires de seed/cleanup CIBLÉS (jamais de TRUNCATE global).
//
// Convention d'isolation : toutes les entités seedées par les tests utilisent
// des identifiants préfixés « it- » et des emails « *@it.test ». Le nettoyage
// supprime uniquement ces lignes marquées — aucune donnée hors test n'est
// touchée.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";
import jwt from "jsonwebtoken";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../../../..");

// ── Chargement explicite de .env.test ───────────────────────────────────────
export const ENV = (() => {
  const file = path.resolve(ROOT, ".env.test");
  const raw = fs.readFileSync(file, "utf8");
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const i = line.indexOf("=");
    env[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return env;
})();

export const API_BASE = `http://127.0.0.1:${ENV.API_PORT || 4099}/api`;
const JWT_SECRET = ENV.JWT_SECRET;

// ── Pool MySQL de test ───────────────────────────────────────────────────────
export const pool = mysql.createPool({
  host: ENV.DB_HOST,
  port: Number(ENV.DB_PORT),
  user: ENV.DB_USERNAME,
  password: ENV.DB_PASSWORD,
  database: ENV.DB_DATABASE,
  waitForConnections: true,
  connectionLimit: 5,
  multipleStatements: false,
});

// ── Jeton JWT identique à celui du serveur (sub + role) ─────────────────────
export const tokenFor = (user) =>
  jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: "1h" });

// ── Client HTTP ──────────────────────────────────────────────────────────────
export async function api(method, endpoint, { token, body, raw } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload;
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }
  const res = await fetch(`${API_BASE}${endpoint}`, { method, headers, body: payload });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (raw) return { status: res.status, data, res };
  return { status: res.status, data };
}

export const get = (e, o) => api("GET", e, o);
export const post = (e, body, o = {}) => api("POST", e, { ...o, body });
export const patch = (e, body, o = {}) => api("PATCH", e, { ...o, body });
export const put = (e, body, o = {}) => api("PUT", e, { ...o, body });

// ── Attente que le backend réponde ───────────────────────────────────────────
export async function waitForServer(timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await fetch(`${API_BASE}/health`);
      if (r.ok) return true;
    } catch { /* pas encore prêt */ }
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error("Le backend de test n'a pas démarré à temps.");
}

// bcrypt hash pré-calculé pour le mot de passe "Test1234!" (coût 10).
// Évite de recharger bcryptjs dans chaque test ; le login réel le vérifie.
export const PW = "Test1234!";
export const PW_HASH = "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"; // "Test1234!"? non — voir seedUser

// ── Seed d'un utilisateur (INSERT direct) ────────────────────────────────────
// Le mot de passe est haché à la volée pour rester fidèle au login réel.
import bcrypt from "bcryptjs";
export async function seedUser({ id, name, email, role, secondaryRole = null, parentId = null, location = null, geoLocationId = null }) {
  const hash = bcrypt.hashSync(PW, 10);
  const avatar = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  await pool.query(
    `INSERT INTO users (id, name, email, password, role, secondary_role, avatar, phone, location, parent_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, name, email, hash, role, secondaryRole, avatar, "+237600000000", location, parentId]
  );
  return { id, name, email, role, secondaryRole };
}

// Seed d'une fiche enseignant (table teachers, requise par plusieurs jointures)
export async function seedTeacherProfile({ id, name, email, subjects = ["Mathématiques"], level = "Lycée", city = null, status = "actif", hourlyRate = 7500, rating = 5, geoLocationId = null, geoZoneIds = null, zones = [] }) {
  await pool.query(
    `INSERT INTO teachers (id, name, email, subjects, level, city, zones, geo_location_id, geo_zone_ids, status, rate_type, hourly_rate, rating)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'hourly', ?, ?)`,
    [id, name, email, JSON.stringify(subjects), level, city, JSON.stringify(zones),
     geoLocationId, geoZoneIds ? JSON.stringify(geoZoneIds) : null, status, hourlyRate, rating]
  );
}

export async function linkStudentTeacher(studentId, teacherId) {
  await pool.query(
    "INSERT IGNORE INTO student_teacher (student_id, teacher_id) VALUES (?, ?)",
    [studentId, teacherId]
  );
}
export async function linkParentChild(parentId, childId) {
  await pool.query(
    "INSERT IGNORE INTO parent_child (parent_id, child_id) VALUES (?, ?)",
    [parentId, childId]
  );
}

// ── Nettoyage ciblé : supprime tout ce qui porte le marqueur de test ─────────
// Marqueur users : id LIKE 'it-%' OU email LIKE '%@it.test'
export async function cleanupTestData() {
  // Récupère les ids d'utilisateurs de test
  const [users] = await pool.query(
    "SELECT id FROM users WHERE id LIKE 'it-%' OR email LIKE '%@it.test'"
  );
  const ids = users.map((u) => u.id);
  const inClause = ids.length ? ids : ["__none__"];

  // Tables dépendantes (par colonnes connues)
  const statements = [
    ["messages", ["sender_id", "receiver_id"]],
    ["homework", ["teacher_id", "student_id"]],
    ["sessions", ["teacher_id", "student_id", "parent_id"]],
    ["parent_invoices", ["parent_id"]],
    ["student_teacher", ["student_id", "teacher_id"]],
    ["parent_child", ["parent_id", "child_id"]],
    ["teacher_feedback", ["teacher_id"]],
    ["notifications", ["user_id"]],
    ["session_feedback", ["parent_id", "teacher_id", "student_id"]],
  ];
  for (const [table, cols] of statements) {
    const where = cols.map((c) => `${c} IN (?)`).join(" OR ");
    await pool.query(`DELETE FROM ${table} WHERE ${where}`, cols.map(() => inClause)).catch(() => {});
  }
  // teachers / users : par id marqué
  await pool.query("DELETE FROM teachers WHERE id LIKE 'it-%' OR email LIKE '%@it.test'").catch(() => {});
  // assignments + requests : marqueur textuel [IT]
  await pool.query("DELETE FROM assignments WHERE child_name LIKE '%[IT]%'").catch(() => {});
  await pool.query("DELETE FROM requests WHERE child_name LIKE '%[IT]%' OR parent_name LIKE '%[IT]%'").catch(() => {});
  await pool.query("DELETE FROM teacher_applications WHERE email LIKE '%@it.test' OR full_name LIKE '%[IT]%'").catch(() => {});
  // geo : suggestions de test
  await pool.query("DELETE FROM geo_locations WHERE suggested_by LIKE 'it-%' OR name LIKE '%[IT]%'").catch(() => {});
  // users en dernier (FK)
  await pool.query("DELETE FROM users WHERE id LIKE 'it-%' OR email LIKE '%@it.test'").catch(() => {});
}

export async function closePool() {
  await pool.end();
}
