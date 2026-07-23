// SÉCURITÉ 04 — Finance & Paie / Mes Revenus : cloisonnement des revenus
// ============================================================================
// Réf. cartographie :
//   - Enseignant > Mes Revenus (/teacher/earnings) : « Total perçu, historique
//     mensuel des gains, tableau des transactions » via
//     fetchTeacherEarnings(teacherId) → /teachers/:id/earnings et
//     /teachers/:id/earnings-history. Chaque enseignant ne doit voir QUE ses gains.
//   - Admin > Finance & Paie (/admin/finance) : « Tableau de paie enseignants »
//     via /admin/finance/teacher-payroll — réservé au rôle admin.
//
// Passe 1 — API directe :
//   server/index.js L5507 `/api/teachers/:teacherId/earnings` et L5316
//   `/api/teachers/:teacherId/earnings-history` : AUCUN `authenticateRequest`,
//   AUCUN contrôle que le teacherId du path == l'appelant. Un enseignant B lit
//   les revenus de l'enseignant A en changeant l'id dans l'URL.
//   L4310 `/admin/finance/teacher-payroll` : `authenticateRequest` + contrôle
//   `req.user.role !== "admin" → 403` (à vérifier : correctement cloisonné).
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import crypto from "crypto";
import {
  pool, get, tokenFor, seedUser, seedTeacherProfile,
  cleanupTestData, closePool,
} from "../integration/helpers/harness.js";

const teacherA = { id: "it-sec04-teacherA", name: "[IT] Prof A Sec04", email: "profasec04@it.test", role: "teacher" };
const teacherB = { id: "it-sec04-teacherB", name: "[IT] Prof B Sec04", email: "profbsec04@it.test", role: "teacher" };
const student = { id: "it-sec04-student", name: "[IT] Eleve Sec04", email: "elevesec04@it.test", role: "student" };

let tokenA, tokenB;

async function seedCompletedSession(teacher) {
  const id = crypto.randomUUID();
  await pool.query(
    `INSERT INTO sessions (id, teacher_id, teacher_name, student_id, student_name, subject, session_day, session_date, session_time, location, status, actual_start_time, actual_end_time)
     VALUES (?, ?, ?, ?, ?, 'Mathématiques', 'Lundi', '2026-07-06', '15:00', 'En ligne', 'effectué',
             '2026-07-06 15:00:00', '2026-07-06 17:00:00')`,
    [id, teacher.id, teacher.name, student.id, student.name]
  );
  return id;
}

describe("SÉCURITÉ 04 — Mes Revenus : un enseignant lit les revenus d'un autre", () => {
  beforeAll(async () => {
    await cleanupTestData();
    await seedUser(teacherA); await seedUser(teacherB); await seedUser(student);
    await seedTeacherProfile({ id: teacherA.id, name: teacherA.name, email: teacherA.email, city: "Yaoundé", hourlyRate: 9000 });
    await seedTeacherProfile({ id: teacherB.id, name: teacherB.name, email: teacherB.email, city: "Douala", hourlyRate: 6000 });
    await seedCompletedSession(teacherA); // A a des gains (2h * 9000)
    tokenA = tokenFor(teacherA);
    tokenB = tokenFor(teacherB);
  });

  afterAll(async () => {
    await cleanupTestData();
    await closePool();
  });

  // ── RÉGRESSION post-correctif (faille F-04 fermée) ──────────────────────────
  it("RÉGRESSION — l'enseignant B ne peut plus lire les revenus de l'enseignant A (403)", async () => {
    // Requête exacte : GET /api/teachers/<idA>/earnings  (jeton de B)
    const { status } = await get(`/teachers/${teacherA.id}/earnings`, { token: tokenB });
    expect(status, "les revenus de A ne doivent plus être exposés à B").toBe(403);
  });

  it("RÉGRESSION — l'historique mensuel de A n'est plus lisible SANS jeton (401)", async () => {
    const { status } = await get(`/teachers/${teacherA.id}/earnings-history`);
    expect(status).toBe(401);
  });

  it("ATTENDU SÉCURISÉ [CRITIQUE, ouvert] — B doit être refusé sur les revenus de A (403)", async () => {
    const { status } = await get(`/teachers/${teacherA.id}/earnings`, { token: tokenB });
    expect(
      status,
      "FAILLE CRITIQUE ouverte : /teachers/:id/earnings doit exiger que l'appelant soit le teacher visé (403 pour un tiers)",
    ).toBe(403);
  });

  // ── SAIN attendu : la paie admin est correctement cloisonnée ──────────────
  it("SAIN — /admin/finance/teacher-payroll refuse un enseignant (403) et un anonyme (401)", async () => {
    const asTeacher = await get("/admin/finance/teacher-payroll", { token: tokenA });
    expect(asTeacher.status, "la paie ne doit pas être accessible à un enseignant").toBe(403);
    const anon = await get("/admin/finance/teacher-payroll");
    expect(anon.status, "la paie ne doit pas être accessible sans jeton").toBe(401);
  });
});
