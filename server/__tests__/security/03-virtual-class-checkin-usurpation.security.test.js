// SÉCURITÉ 03 — Classe virtuelle : usurpation du check-in / check-out
// ============================================================================
// Réf. cartographie :
//   - Classe Virtuelle — /virtual-class/:sessionId (VirtualClassroom.tsx) :
//     « route non restreinte par rôle ». « Check-in / check-out automatique à la
//     connexion/déconnexion (ENSEIGNANT) → sessionCheckIn / sessionCheckOut ».
//   - Le check-in/out matérialise la présence de l'enseignant et sert de base au
//     calcul des revenus (Mes Revenus : durée réelle actual_start/end_time).
//
// Passe 1 — API directe :
//   server/index.js L2546/L2571 `check-in` / `check-out` : protégés par
//   `authenticateRequest` MAIS aucune vérification que `req.user.sub` est bien
//   l'enseignant de la session, ni contrôle de rôle. La requête est
//   `UPDATE sessions SET ... WHERE id = ?` sur l'id fourni.
//
// Corrélation : côté UI, VirtualClassroom.tsx ne déclenche le check-in que si
//   `user.role === 'teacher'` (L146/L267). L'API accepte n'importe quel
//   utilisateur authentifié (élève, parent, autre enseignant) → API laisse
//   passer + UI cache le contrôle = CRITIQUE.
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import crypto from "crypto";
import {
  pool, patch, tokenFor, seedUser, seedTeacherProfile,
  cleanupTestData, closePool,
} from "../integration/helpers/harness.js";

const teacherOwner = { id: "it-sec03-teacher", name: "[IT] Prof Titulaire Sec03", email: "profsec03@it.test", role: "teacher" };
const teacherOther = { id: "it-sec03-teacher2", name: "[IT] Prof Tiers Sec03", email: "prof2sec03@it.test", role: "teacher" };
const student = { id: "it-sec03-student", name: "[IT] Eleve Sec03", email: "elevesec03@it.test", role: "student" };
const parent = { id: "it-sec03-parent", name: "[IT] Parent Sec03", email: "parentsec03@it.test", role: "parent" };

let ownerToken, otherToken, studentToken;

async function seedPlannedSession() {
  const id = crypto.randomUUID();
  await pool.query(
    `INSERT INTO sessions (id, teacher_id, teacher_name, student_id, student_name, subject, session_day, session_date, session_time, location, status)
     VALUES (?, ?, ?, ?, ?, 'Mathématiques', 'Lundi', '2026-07-27', '15:00', 'En ligne', 'planifié')`,
    [id, teacherOwner.id, teacherOwner.name, student.id, student.name]
  );
  return id;
}

describe("SÉCURITÉ 03 — check-in/check-out de session usurpables (/virtual-class/:sessionId)", () => {
  beforeAll(async () => {
    await cleanupTestData();
    await seedUser(teacherOwner); await seedUser(teacherOther);
    await seedUser(student); await seedUser(parent);
    await seedTeacherProfile({ id: teacherOwner.id, name: teacherOwner.name, email: teacherOwner.email, city: "Yaoundé" });
    await seedTeacherProfile({ id: teacherOther.id, name: teacherOther.name, email: teacherOther.email, city: "Douala" });
    ownerToken = tokenFor(teacherOwner);
    otherToken = tokenFor(teacherOther);
    studentToken = tokenFor(student);
  });

  afterAll(async () => {
    await cleanupTestData();
    await closePool();
  });

  // ── RÉGRESSION post-correctif (faille F-03 fermée) ──────────────────────────
  // Ces trois tests documentaient l'état vulnérable (200 + présence falsifiée)
  // avant l'ajout de la vérification de propriété (session.teacher_id ==
  // req.user.sub). Ils vérifient désormais que l'usurpation reste bloquée.
  it("RÉGRESSION — un ÉLÈVE (rôle sans capacité check-in) est refusé (403), aucune présence falsifiée", async () => {
    const sessionId = await seedPlannedSession();
    // Requête exacte : PATCH /api/sessions/<id>/check-in  (jeton élève)
    const { status } = await patch(`/sessions/${sessionId}/check-in`, {}, { token: studentToken });
    expect(status).toBe(403);
    const [[row]] = await pool.query("SELECT actual_start_time FROM sessions WHERE id = ?", [sessionId]);
    expect(row.actual_start_time, "aucune présence enseignant ne doit être falsifiée par un élève").toBeNull();
  });

  it("RÉGRESSION — un ENSEIGNANT TIERS est refusé (403) sur check-out d'une session qui n'est pas la sienne", async () => {
    const sessionId = await seedPlannedSession();
    const { status } = await patch(`/sessions/${sessionId}/check-out`, {}, { token: otherToken });
    expect(status).toBe(403);
    const [[row]] = await pool.query("SELECT actual_end_time FROM sessions WHERE id = ?", [sessionId]);
    expect(row.actual_end_time, "aucune clôture par un enseignant tiers").toBeNull();
  });

  it("RÉGRESSION — la falsification de durée par des tiers n'impacte plus les revenus (base earnings)", async () => {
    // check-in par un élève puis check-out par un tiers → les deux tentatives
    // doivent être bloquées, donc la session ne comptabilise aucune durée réelle
    // dans /api/teachers/:id/earnings de la victime.
    const sessionId = await seedPlannedSession();
    await patch(`/sessions/${sessionId}/check-in`, {}, { token: studentToken });
    await patch(`/sessions/${sessionId}/check-out`, {}, { token: otherToken });
    const [[row]] = await pool.query(
      "SELECT status, actual_start_time, actual_end_time FROM sessions WHERE id = ?", [sessionId]
    );
    expect(row.actual_start_time).toBeNull();
    expect(row.actual_end_time).toBeNull();
  });

  // ── ATTENDU sécurisé : échoue tant que la propriété de session n'est pas vérifiée ──
  it("ATTENDU SÉCURISÉ [CRITIQUE, ouvert] — un tiers doit être refusé (403) sur check-in", async () => {
    const sessionId = await seedPlannedSession();
    const { status } = await patch(`/sessions/${sessionId}/check-in`, {}, { token: otherToken });
    expect(
      status,
      "FAILLE CRITIQUE ouverte : check-in doit vérifier que le demandeur est l'enseignant de la session (403 attendu)",
    ).toBe(403);
  });
});
