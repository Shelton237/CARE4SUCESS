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
// NB : l'automation "en traitement" dépendait de la colonne users.geo_location_id
// (bug B2, corrigé). Pour valider INDÉPENDAMMENT la propagation de
// confirmAssignment, une assignation est ensuite seedée directement.
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

  it("automation 'en traitement' (actor-admin) : doit créer une assignation avec candidats", async () => {
    const { status } = await patch(`/requests/${requestId}`, { status: "en traitement" }, { token: adminToken });
    expect(status).toBe(200);
    const { data } = await get("/assignments", { token: adminToken });
    const assign = data.find((a) => (a.child || a.childName || a.child_name) === student.name);
    // Bug B2 corrigé : users.geo_location_id existe désormais, l'automation
    // peut relire la localisation du parent et créer l'assignation.
    expect(assign, "automation 'en traitement' n'a pas créé d'assignation").toBeTruthy();
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

  it("étape 2 — vérif Parent / Équipe Pédagogique (Team.tsx basé séances + matching confirmé)", async () => {
    // Bugfix E2 : Team.tsx fusionne désormais deux sources — les séances
    // (fetchScheduleByRole('parent')) ET le matching confirmé exposé par
    // GET /relationships/student-teacher (alimenté par confirmAssignment).
    // Un enseignant assigné doit donc apparaître dans l'Équipe Pédagogique
    // dès la confirmation du matching, même en l'absence de toute séance.
    const sessionsRes = await get(`/sessions?role=parent&userId=${parent.id}`, { token: parentToken });
    expect(sessionsRes.status).toBe(200);
    const hasTeacherSession = sessionsRes.data.some((s) => (s.teacherId || s.teacher_id) === teacher.id);
    expect(hasTeacherSession, "aucune séance créée à ce stade : normal, le matching est pur").toBe(false);

    // C'est la seconde source (matching confirmé) que Team.tsx interroge par
    // enfant (fetchTeachersByStudent) pour compenser l'absence de séance.
    const matchingRes = await get(`/relationships/student-teacher?studentId=${student.id}`, { token: parentToken });
    expect(matchingRes.status).toBe(200);
    expect(
      matchingRes.data.find((u) => u.id === teacher.id),
      "l'enseignant confirmé doit apparaître dans Team.tsx dès le matching, avant toute séance"
    ).toBeTruthy();
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
