// Scénario 01 — Candidature → validation → disponibilité matching
// Réf. cartographie : Admin/Conseiller > Candidatures profs ; Admin/Conseiller > Matching
//
// Flux : une candidature enseignant pré-seedée (statut "pending") est validée
// par le staff (reviewTeacherApplication). L'enseignant doit alors devenir
// disponible comme candidat compatible dans /admin/matching ET /advisor/matching
// (composant partagé src/pages/advisor/Matching.tsx → GET /api/assignments).
//
// Acteurs : actor-teacher (constat pending), actor-admin (validation),
//           actor-admin + actor-advisor (vérification lecture seule du matching).
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import crypto from "crypto";
import {
  pool, get, patch, tokenFor, seedUser, cleanupTestData, closePool,
} from "../helpers/harness.js";

const APP_ID = crypto.randomUUID();
const ASSIGN_ID = crypto.randomUUID();
const admin = { id: "it-01-admin", name: "[IT] Admin01", email: "admin01@it.test", role: "admin" };
const advisor = { id: "it-01-advisor", name: "[IT] Advisor01", email: "advisor01@it.test", role: "advisor" };

let adminToken, advisorToken;

describe("Scénario 01 — Candidature → validation → matching", () => {
  beforeAll(async () => {
    await cleanupTestData();
    await seedUser(admin);
    await seedUser(advisor);
    adminToken = tokenFor(admin);
    advisorToken = tokenFor(advisor);

    // Candidature pré-seedée "en attente"
    await pool.query(
      `INSERT INTO teacher_applications (id, full_name, email, phone, subjects, experience_years, availability, motivation, city, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [APP_ID, "[IT] Prof Candidat", "prof.candidat@it.test", "+237600000001",
       JSON.stringify(["Mathématiques"]), 5, "Soirs et week-ends", "Motivé", "Yaoundé"]
    );

    // Un élève en attente d'affectation (matching) compatible Maths/Lycée
    await pool.query(
      `INSERT INTO assignments (id, child_name, level, subject, needs, schedule, location, candidates, status)
       VALUES (?, ?, 'Lycée', 'Mathématiques', ?, 'Mercredi 16h', 'Yaoundé', ?, 'pending')`,
      [ASSIGN_ID, "[IT] Eleve EnAttente", JSON.stringify(["Algèbre"]), JSON.stringify([])]
    );
  });

  afterAll(async () => {
    await cleanupTestData();
    await closePool();
  });

  it("étape 1 (actor-teacher, lecture) : la candidature apparaît en statut 'pending'", async () => {
    const { status, data } = await get("/teacher-applications");
    expect(status).toBe(200);
    const app = data.find((a) => a.id === APP_ID);
    expect(app, "candidature seedée introuvable dans la liste staff").toBeTruthy();
    expect(app.status).toBe("pending");
  });

  it("étape 2 (actor-admin) : reviewTeacherApplication valide la candidature (approved) et génère un compte", async () => {
    const { status, data } = await patch(
      `/teacher-applications/${APP_ID}`,
      { status: "approved", reviewerName: admin.name, reviewerRole: "admin", rateType: "hourly", negotiatedRate: 8000 },
      { token: adminToken }
    );
    // Résultat attendu selon cartographie : 200, statut approved, credentials renvoyés
    expect(status, `réponse review inattendue: ${JSON.stringify(data)}`).toBe(200);
    expect(data.status).toBe("approved");
    expect(data.credentials, "identifiants générés attendus après validation").toBeTruthy();

    // Effet DB : le compte utilisateur enseignant + la fiche teachers 'actif' existent
    const [users] = await pool.query("SELECT id, role FROM users WHERE email = ?", ["prof.candidat@it.test"]);
    expect(users.length, "compte utilisateur enseignant non créé après validation").toBe(1);
    const [teachers] = await pool.query("SELECT id, status FROM teachers WHERE email = ?", ["prof.candidat@it.test"]);
    expect(teachers.length, "fiche teachers non créée après validation").toBe(1);
    expect(teachers[0].status).toBe("actif");
  });

  it("étape 2 — vérif /admin/matching (actor-admin, lecture seule) : l'enseignant validé est candidat compatible", async () => {
    const { status, data } = await get("/assignments", { token: adminToken });
    expect(status).toBe(200);
    const assign = data.find((a) => a.id === ASSIGN_ID);
    expect(assign).toBeTruthy();
    const names = (assign.candidates || []).map((c) => (c.name || "").trim());
    expect(names, `candidats: ${JSON.stringify(names)}`).toContain("[IT] Prof Candidat");
  });

  it("étape 2 — vérif /advisor/matching (actor-advisor, lecture seule) : même enseignant visible (composant partagé)", async () => {
    // /admin/matching et /advisor/matching pointent vers le même GET /api/assignments
    const { status, data } = await get("/assignments", { token: advisorToken });
    expect(status).toBe(200);
    const assign = data.find((a) => a.id === ASSIGN_ID);
    expect(assign).toBeTruthy();
    const cand = (assign.candidates || []).find((c) => (c.name || "").trim() === "[IT] Prof Candidat");
    expect(cand, "enseignant validé absent du matching conseiller").toBeTruthy();
    expect(cand.available).toBe(true);
    expect(typeof cand.rating).toBe("number");
  });
});
