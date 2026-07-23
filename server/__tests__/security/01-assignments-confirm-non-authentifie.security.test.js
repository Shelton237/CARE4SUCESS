// SÉCURITÉ 01 — PATCH /api/assignments/:id (confirmAssignment) NON authentifié
// ============================================================================
// Réf. cartographie :
//   - Admin > Matching (/admin/matching) : « Confirmer l'assignation → confirmAssignment »
//   - Conseiller > Matching (/advisor/matching) : « Confirmer le matching → confirmAssignment »
//   Ces deux surfaces sont les SEULES habilitées à confirmer une affectation
//   (Élève/Parent/Enseignant/Tuteur n'ont AUCUNE capacité de matching dans la
//   cartographie). La confirmation crée une liaison student_teacher officielle
//   et fait passer la demande à « assigné » — action à fort impact métier.
//
// Passe 1 — API directe (priorité absolue, signalée par scenario-director) :
//   server/index.js L2241 `app.patch("/api/assignments/:id", async ...)` — AUCUN
//   middleware `authenticateRequest`, AUCUN contrôle de rôle. N'importe quel
//   appelant (sans jeton, ou avec un jeton élève/parent) peut confirmer.
//
// Corrélation : l'UI (Matching.tsx) n'expose le bouton qu'aux rôles admin/advisor,
// mais l'API laisse passer tout le monde → CRITIQUE (protection UI contournable
// par tout client HTTP).
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import crypto from "crypto";
import {
  pool, api, patch, tokenFor, seedUser, seedTeacherProfile,
  cleanupTestData, closePool,
} from "../integration/helpers/harness.js";

const parent = { id: "it-sec01-parent", name: "[IT] Parent Sec01", email: "parentsec01@it.test", role: "parent" };
const student = { id: "it-sec01-student", name: "[IT] Eleve Sec01", email: "elevesec01@it.test", role: "student", parentId: "it-sec01-parent" };
const teacher = { id: "it-sec01-teacher", name: "[IT] Prof Sec01", email: "profsec01@it.test", role: "teacher" };
const hostileStudent = { id: "it-sec01-hostile", name: "[IT] Eleve Hostile Sec01", email: "hostilesec01@it.test", role: "student" };

let studentToken, hostileToken;

async function seedPendingAssignment() {
  const id = crypto.randomUUID();
  await pool.query(
    `INSERT INTO assignments (id, child_name, level, subject, needs, schedule, location, candidates, status)
     VALUES (?, ?, 'Lycée', 'Mathématiques', ?, 'Mercredi 16h', 'Yaoundé', ?, 'pending')`,
    [id, student.name, JSON.stringify(["Algèbre"]),
     JSON.stringify([{ name: teacher.name, rating: 5, available: true }])]
  );
  // La demande correspondante (pour observer le passage à « assigné »)
  await pool.query(
    `INSERT INTO requests (id, parent_name, child_name, level, subject, phone, status)
     VALUES (?, ?, ?, 'Lycée', 'Mathématiques', '+237600000001', 'en traitement')`,
    [crypto.randomUUID(), parent.name, student.name]
  ).catch(() => {});
  return id;
}

describe("SÉCURITÉ 01 — confirmAssignment (PATCH /api/assignments/:id) sans authentification", () => {
  beforeAll(async () => {
    await cleanupTestData();
    await seedUser(parent); await seedUser(student); await seedUser(teacher);
    await seedUser(hostileStudent);
    await seedTeacherProfile({ id: teacher.id, name: teacher.name, email: teacher.email, city: "Yaoundé" });
    studentToken = tokenFor(student);
    hostileToken = tokenFor(hostileStudent);
  });

  afterAll(async () => {
    await cleanupTestData();
    await closePool();
  });

  // ── RÉGRESSION post-correctif (faille F-01 fermée) ──────────────────────────
  // Ces deux tests documentaient l'état vulnérable (200 + liaison créée) avant
  // l'ajout de authenticateRequest + contrôle de rôle. Ils vérifient désormais
  // que la faille reste fermée : aucun effet de bord métier sans autorisation.
  it("RÉGRESSION — un appel SANS aucun jeton est rejeté (401) et ne crée AUCUNE liaison", async () => {
    const assignmentId = await seedPendingAssignment();

    // Requête exacte reproductible :
    //   PATCH /api/assignments/<id>
    //   (aucun header Authorization)
    //   body: { "selectedTeacher": "<nom enseignant>" }
    const { status, data } = await patch(
      `/assignments/${assignmentId}`,
      { selectedTeacher: teacher.name }
      // <-- volontairement AUCUN token
    );

    expect(status, `réponse: ${JSON.stringify(data)}`).toBe(401);

    // Aucune liaison student_teacher ne doit être créée par un appelant anonyme.
    const [link] = await pool.query(
      "SELECT * FROM student_teacher WHERE student_id = ? AND teacher_id = ?",
      [student.id, teacher.id]
    );
    expect(link.length, "aucune liaison student_teacher ne doit être créée sans authentification").toBe(0);
  });

  it("RÉGRESSION — un jeton d'ÉLÈVE (hors périmètre matching) ne peut plus confirmer", async () => {
    const assignmentId = await seedPendingAssignment();
    const { status } = await patch(
      `/assignments/${assignmentId}`,
      { selectedTeacher: teacher.name },
      { token: hostileToken } // rôle student : aucune capacité matching en cartographie
    );
    expect(status).toBe(403);
    const [[row]] = await pool.query("SELECT status, selected_teacher FROM assignments WHERE id = ?", [assignmentId]);
    expect(row.status, "l'assignation ne doit pas être confirmée par un élève").toBe("pending");
    expect(row.selected_teacher).toBeNull();
  });

  // ── ATTENDU sécurisé : échoue TANT QUE la faille n'est pas corrigée (test ROUGE) ──
  it("ATTENDU SÉCURISÉ [CRITIQUE, ouvert] — sans jeton doit renvoyer 401", async () => {
    const assignmentId = await seedPendingAssignment();
    const { status } = await api("PATCH", `/assignments/${assignmentId}`, {
      body: { selectedTeacher: teacher.name },
    });
    expect(
      status,
      "FAILLE CRITIQUE ouverte : PATCH /api/assignments/:id doit exiger un jeton (401) — ajouter authenticateRequest",
    ).toBe(401);
  });

  it("ATTENDU SÉCURISÉ [CRITIQUE, ouvert] — un rôle élève doit être refusé (403)", async () => {
    const assignmentId = await seedPendingAssignment();
    const { status } = await patch(
      `/assignments/${assignmentId}`,
      { selectedTeacher: teacher.name },
      { token: studentToken }
    );
    expect(
      status,
      "FAILLE CRITIQUE ouverte : seuls admin/advisor doivent confirmer une assignation (403 attendu pour un élève)",
    ).toBe(403);
  });
});
