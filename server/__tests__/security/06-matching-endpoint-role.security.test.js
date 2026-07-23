// SÉCURITÉ 06 — Endpoint de matching restreint au staff (admin/advisor)
// ============================================================================
// Réf. cartographie :
//   - Seuls Admin et Conseiller disposent du matching (recommandation de tuteurs).
//     Conseiller > Mes familles > onglet Matching : `GET /advisor/match/:studentId`.
//     La section Élève ne comporte AUCUNE capacité de matching.
//
// `server/index.js` `/api/advisor/match/:studentId` exige désormais
// `authenticateRequest` + un rôle admin/advisor (403 sinon). Corrigé.
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  get, tokenFor, seedUser, seedTeacherProfile,
  cleanupTestData, closePool,
} from "../integration/helpers/harness.js";

const student = { id: "it-sec06-student", name: "[IT] Eleve Sec06", email: "elevesec06@it.test", role: "student" };
const teacher = { id: "it-sec06-teacher", name: "[IT] Prof Sec06", email: "profsec06@it.test", role: "teacher" };

let studentToken;

describe("SÉCURITÉ 06 — /api/advisor/match/:studentId sans contrôle de rôle", () => {
  beforeAll(async () => {
    await cleanupTestData();
    await seedUser(student); await seedUser(teacher);
    await seedTeacherProfile({ id: teacher.id, name: teacher.name, email: teacher.email, city: "Yaoundé" });
    studentToken = tokenFor(student);
  });

  afterAll(async () => {
    await cleanupTestData();
    await closePool();
  });

  it("RÉGRESSION — un jeton d'ÉLÈVE ne peut plus appeler l'endpoint de matching", async () => {
    const { status } = await get(`/advisor/match/${student.id}`, { token: studentToken });
    expect(status).toBe(403);
  });

  it("ATTENDU SÉCURISÉ — un rôle élève doit être refusé (403)", async () => {
    const { status } = await get(`/advisor/match/${student.id}`, { token: studentToken });
    expect(
      status,
      "FAILLE ouverte : /api/advisor/match/:studentId doit restreindre au staff (admin/advisor)",
    ).toBe(403);
  });
});
