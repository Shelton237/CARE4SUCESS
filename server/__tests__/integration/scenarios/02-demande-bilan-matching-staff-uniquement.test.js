// Scénario 02 — Demande de bilan → matching (staff, jamais élève) → visibilité croisée
// Réf. cartographie : Admin > Demandes de bilan ; Admin/Conseiller > Matching ;
//   Parent > Équipe Pédagogique (Team.tsx) ; Élève > Mes Professeurs (Teachers.tsx) ;
//   Enseignant > Mes Apprenants (Students.tsx)
//
// Flux : createRequest (parent) → passage "en traitement" (automation censée
// créer une assignation avec candidats) → confirmAssignment (staff) → liaison
// student_teacher officielle → propagation dans les 3 espaces.
// Étape 3 : l'élève n'a AUCUNE capacité de matching (absente de la cartographie).
//
// NB : l'automation "en traitement" est actuellement bloquée (voir test dédié).
// Pour valider INDÉPENDAMMENT la propagation de confirmAssignment, une
// assignation est ensuite seedée directement.
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import crypto from "crypto";
import {
  pool, get, post, patch, tokenFor, seedUser, seedTeacherProfile,
  linkParentChild, cleanupTestData, closePool,
} from "../helpers/harness.js";

const admin = { id: "it-02-admin", name: "[IT] Admin02", email: "admin02@it.test", role: "admin" };
const advisor = { id: "it-02-advisor", name: "[IT] Advisor02", email: "advisor02@it.test", role: "advisor" };
const parent = { id: "it-02-parent", name: "[IT] Parent02", email: "parent02@it.test", role: "parent" };
const student = { id: "it-02-student", name: "[IT] Eleve02", email: "eleve02@it.test", role: "student", parentId: "it-02-parent" };
const teacher = { id: "it-02-teacher", name: "[IT] Prof02", email: "prof02@it.test", role: "teacher" };

let adminToken, advisorToken, parentToken, studentToken, teacherToken;
let requestId, seededAssignmentId;

describe("Scénario 02 — Demande de bilan → matching staff → visibilité croisée", () => {
  beforeAll(async () => {
    await cleanupTestData();
    await seedUser(admin); await seedUser(advisor); await seedUser(parent);
    await seedUser(student); await seedUser(teacher);
    await seedTeacherProfile({ id: teacher.id, name: teacher.name, email: teacher.email, subjects: ["Mathématiques"], level: "Lycée", city: "Yaoundé" });
    await linkParentChild(parent.id, student.id);
    adminToken = tokenFor(admin); advisorToken = tokenFor(advisor);
    parentToken = tokenFor(parent); studentToken = tokenFor(student); teacherToken = tokenFor(teacher);
  });

  afterAll(async () => {
    await cleanupTestData();
    await closePool();
  });

  it("étape 1 (actor-parent) : createRequest → demande visible statut 'reçu' dans le Kanban admin", async () => {
    const { status, data } = await post("/requests", {
      parentName: parent.name, childName: student.name, level: "Lycée", subject: "Mathématiques", phone: "+237600000002",
    });
    expect(status).toBe(201);
    requestId = data.id;
    expect(data.status).toBe("reçu");
    const list = await get("/requests", { token: adminToken });
    expect(list.data.find((r) => r.id === requestId)).toBeTruthy();
  });

  it("automation 'en traitement' : doit créer une assignation avec candidats [DOCUMENTE UN BLOCAGE]", async () => {
    const { status } = await patch(`/requests/${requestId}`, { status: "en traitement" });
    expect(status).toBe(200);
    const { data } = await get("/assignments", { token: adminToken });
    const assign = data.find((a) => (a.childName || a.child_name) === student.name);
    // Résultat ATTENDU : une assignation est créée. Actuellement l'automation
    // échoue (SELECT users.geo_location_id — colonne inexistante) → aucune
    // assignation. Ce test documente le blocage de bout en bout.
    expect(assign, "automation 'en traitement' n'a pas créé d'assignation (voir rapport : users.geo_location_id manquant)").toBeTruthy();
  });

  it("étape 2 (actor-advisor) : confirmAssignment lie l'enseignant à l'élève et clôt la demande", async () => {
    // Assignation seedée directement pour valider la propagation indépendamment
    // du blocage de l'automation.
    seededAssignmentId = crypto.randomUUID();
    await pool.query(
      `INSERT INTO assignments (id, child_name, level, subject, needs, schedule, location, candidates, status)
       VALUES (?, ?, 'Lycée', 'Mathématiques', ?, 'Mercredi 16h', 'Yaoundé', ?, 'pending')`,
      [seededAssignmentId, student.name, JSON.stringify(["Algèbre"]),
       JSON.stringify([{ name: teacher.name, rating: 5, available: true }])]
    );

    const { status, data } = await patch(`/assignments/${seededAssignmentId}`, { selectedTeacher: teacher.name }, { token: advisorToken });
    expect(status, `confirmAssignment: ${JSON.stringify(data)}`).toBe(200);

    const reqs = await get("/requests", { token: adminToken });
    expect(reqs.data.find((x) => x.id === requestId).status).toBe("assigné");

    const [link] = await pool.query(
      "SELECT * FROM student_teacher WHERE student_id = ? AND teacher_id = ?", [student.id, teacher.id]
    );
    expect(link.length, "liaison student_teacher non créée par confirmAssignment").toBe(1);
  });

  it("étape 2 — vérif Élève / Mes Professeurs (actor-student, lecture seule)", async () => {
    const { status, data } = await get(`/relationships/student-teacher?studentId=${student.id}`, { token: studentToken });
    expect(status).toBe(200);
    expect(data.find((u) => u.id === teacher.id), "enseignant assigné absent de Mes Professeurs").toBeTruthy();
  });

  it("étape 2 — vérif Enseignant / Mes Apprenants (actor-teacher, lecture seule)", async () => {
    const { status, data } = await get(`/teachers/${teacher.id}/students`, { token: teacherToken });
    expect(status).toBe(200);
    expect(data.find((s) => s.id === student.id), "élève assigné absent de Mes Apprenants").toBeTruthy();
  });

  it("étape 2 — vérif Parent / Équipe Pédagogique (Team.tsx basé séances)", async () => {
    // Team.tsx reconstruit la liste depuis les séances (fetchScheduleByRole('parent')).
    // Après un matching pur (sans séance), l'enseignant n'apparaît pas encore
    // dans Team — écart de propagation consigné (Team ne lit pas student_teacher).
    const { status, data } = await get(`/sessions?role=parent&userId=${parent.id}`, { token: parentToken });
    expect(status).toBe(200);
    const hasTeacherSession = data.some((s) => (s.teacherId || s.teacher_id) === teacher.id);
    expect(hasTeacherSession, "Team.tsx n'affiche l'enseignant qu'après création d'une séance").toBe(false);
  });

  it("étape 3 (actor-student, REFUS) : aucune capacité de matching côté élève", async () => {
    // La section Élève de la cartographie ne comporte AUCUN moyen de confirmer
    // une assignation. Depuis le hotfix sécurité F-01, GET /api/assignments
    // exige authenticateRequest + rôle admin/advisor — un élève est refusé
    // (403), conformément à la cartographie.
    const check = await get("/assignments", { token: studentToken });
    expect(check.status).toBe(403); // endpoint désormais restreint au staff
  });
});
