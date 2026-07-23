// SÉCURITÉ 05 — Espace Enseignant du tuteur : accès aux données d'un enseignant tiers
// ============================================================================
// Réf. cartographie :
//   - Tuteur > Espace Enseignant (/tutor/enseignant/*) : « réutilise EXACTEMENT
//     les composants de /teacher/* ; les mêmes appels API sont émis avec l'id de
//     l'utilisateur connecté ». Le scénario 07 (vert en fonctionnel) valide que
//     le double rôle reste scopé à SES propres données.
//   - Point prioritaire : « actor-tutor A (ou un teacher via ce chemin) ne doit
//     jamais accéder aux élèves, cours ou messages d'un actor-teacher B ».
//
// Passe 1 — variante HOSTILE du scénario 07 :
//   server/index.js L5540 `/api/teachers/:teacherId/students` : AUCUN
//   `authenticateRequest`, teacherId lu du path → un tuteur/enseignant hostile
//   lit les élèves de N'IMPORTE quel enseignant en changeant l'id.
//   Le scénario 07 le validait avec le token de CHAQUE acteur sur SON PROPRE id ;
//   ici on prouve qu'un acteur hostile substitue l'id de la victime.
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  pool, get, tokenFor, seedUser, seedTeacherProfile,
  linkStudentTeacher, cleanupTestData, closePool,
} from "../integration/helpers/harness.js";

const tutorHostile = { id: "it-sec05-tutor", name: "[IT] Tuteur Hostile Sec05", email: "tutorsec05@it.test", role: "tutor", secondaryRole: "teacher" };
const teacherVictim = { id: "it-sec05-teacherV", name: "[IT] Prof Victime Sec05", email: "profvsec05@it.test", role: "teacher" };
const studentVictim = { id: "it-sec05-studentV", name: "[IT] Eleve Victime Sec05", email: "elevevsec05@it.test", role: "student", parentId: null };
const studentTutor = { id: "it-sec05-studentT", name: "[IT] Eleve Tuteur Sec05", email: "elevetsec05@it.test", role: "student", parentId: null };

let hostileToken;

describe("SÉCURITÉ 05 — Espace Enseignant tuteur : cross-tenant sur un enseignant B", () => {
  beforeAll(async () => {
    await cleanupTestData();
    await seedUser(tutorHostile); await seedUser(teacherVictim);
    await seedUser(studentVictim); await seedUser(studentTutor);
    await seedTeacherProfile({ id: tutorHostile.id, name: tutorHostile.name, email: tutorHostile.email, city: "Yaoundé" });
    await seedTeacherProfile({ id: teacherVictim.id, name: teacherVictim.name, email: teacherVictim.email, city: "Douala" });
    // Chaque enseignant a SON élève.
    await linkStudentTeacher(studentTutor.id, tutorHostile.id);
    await linkStudentTeacher(studentVictim.id, teacherVictim.id);
    hostileToken = tokenFor(tutorHostile); // rôle réel tutor + secondary teacher
  });

  afterAll(async () => {
    await cleanupTestData();
    await closePool();
  });

  // ── RÉGRESSION post-correctif (faille F-05 fermée) ──────────────────────────
  it("RÉGRESSION — le tuteur hostile ne peut plus lire les élèves de l'enseignant B (403)", async () => {
    // Requête exacte : GET /api/teachers/<idVictime>/students  (jeton du tuteur)
    const { status } = await get(`/teachers/${teacherVictim.id}/students`, { token: hostileToken });
    expect(status, "l'élève de l'enseignant B ne doit plus être exposé au tuteur hostile").toBe(403);
  });

  it("RÉGRESSION — l'historique de cours d'un élève de B n'est plus lisible via l'espace enseignant (403)", async () => {
    // /api/students/:studentId/course-history exige désormais un lien
    // enseignant↔élève (student_teacher) ou l'identité de l'élève lui-même.
    const { status } = await get(`/students/${studentVictim.id}/course-history`, { token: hostileToken });
    expect(status).toBe(403);
  });

  it("ATTENDU SÉCURISÉ [CRITIQUE, ouvert] — B's students ne doivent PAS être accessibles au tuteur hostile", async () => {
    const { data } = await get(`/teachers/${teacherVictim.id}/students`, { token: hostileToken });
    const ids = Array.isArray(data) ? data.map((s) => s.id) : [];
    expect(
      ids.includes(studentVictim.id),
      "FAILLE CRITIQUE ouverte : /teachers/:id/students doit vérifier que teacherId == appelant (aucun accès cross-tenant)",
    ).toBe(false);
  });

  it("SAIN (rappel scénario 07) — sur SON PROPRE id, le tuteur ne voit que son élève", async () => {
    const { data } = await get(`/teachers/${tutorHostile.id}/students`, { token: hostileToken });
    const ids = Array.isArray(data) ? data.map((s) => s.id) : [];
    expect(ids).toContain(studentTutor.id);
    expect(ids, "aucune fuite quand l'id du path est le sien").not.toContain(studentVictim.id);
  });
});
