// SÉCURITÉ 06 — Endpoint de matching appelé hors périmètre (élève)
// ============================================================================
// Réf. cartographie :
//   - Seuls Admin et Conseiller disposent du matching (recommandation de tuteurs).
//     Conseiller > Mes familles > onglet Matching : `GET /advisor/match/:studentId`.
//     La section Élève ne comporte AUCUNE capacité de matching.
//
// Passe 1 — API directe (exemple du system prompt : « un actor-student qui appelle
//   directement un endpoint de matching ») :
//   server/index.js L6977 `/api/advisor/match/:studentId` — `authenticateRequest`
//   présent MAIS aucun contrôle de rôle : un élève authentifié obtient la liste
//   de recommandation d'enseignants (données réservées au staff).
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

  it("PREUVE — un ÉLÈVE appelle l'endpoint de matching réservé au staff (pas 403)", async () => {
    // Requête exacte : GET /api/advisor/match/<studentId>  (jeton élève)
    const { status } = await get(`/advisor/match/${student.id}`, { token: studentToken });
    // 200 (recommandations) ou 404 (aucune donnée) mais surtout PAS 403 :
    // l'accès n'est jamais refusé au motif du rôle.
    expect(status, "l'endpoint de matching n'oppose aucun refus de rôle à un élève").not.toBe(403);
  });

  it("ATTENDU SÉCURISÉ [MOYEN, ouvert] — un rôle élève doit être refusé (403)", async () => {
    const { status } = await get(`/advisor/match/${student.id}`, { token: studentToken });
    expect(
      status,
      "FAILLE ouverte : /api/advisor/match/:studentId doit restreindre au staff (admin/advisor)",
    ).toBe(403);
  });
});
