// Scénario 03 — Séance → devoir → correction → suivi parent
// Réf. cartographie : Enseignant > Emploi du Temps / Gestion Devoirs ;
//   Élève > Mes Devoirs ; Parent > Devoirs / Progression
//
// Chaîne complète : createSession → check-in/out + rapport → devoir lié →
// dépôt élève (upload) → correction enseignant → visibilité parent.
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import crypto from "crypto";
import {
  pool, get, post, patch, API_BASE, tokenFor, seedUser, seedTeacherProfile,
  linkParentChild, linkStudentTeacher, cleanupTestData, closePool,
} from "../helpers/harness.js";

const parent = { id: "it-03-parent", name: "[IT] Parent03", email: "parent03@it.test", role: "parent" };
const student = { id: "it-03-student", name: "[IT] Eleve03", email: "eleve03@it.test", role: "student", parentId: "it-03-parent" };
const teacher = { id: "it-03-teacher", name: "[IT] Prof03", email: "prof03@it.test", role: "teacher" };

let teacherToken, studentToken, parentToken;
let courseId, sessionId, homeworkId;

describe("Scénario 03 — Séance → devoir → correction → suivi parent", () => {
  beforeAll(async () => {
    await cleanupTestData();
    await seedUser(parent); await seedUser(student); await seedUser(teacher);
    await seedTeacherProfile({ id: teacher.id, name: teacher.name, email: teacher.email, subjects: ["Mathématiques"], level: "Lycée", city: "Douala" });
    await linkParentChild(parent.id, student.id);
    await linkStudentTeacher(student.id, teacher.id);
    courseId = crypto.randomUUID();
    await pool.query(
      "INSERT INTO courses (id, title, description, subject, level, status, created_by) VALUES (?, '[IT] Cours Maths', 'desc', 'Mathématiques', 'Lycée', 'published', ?)",
      [courseId, teacher.id]
    );
    teacherToken = tokenFor(teacher); studentToken = tokenFor(student); parentToken = tokenFor(parent);
  });

  afterAll(async () => {
    await pool.query("DELETE FROM courses WHERE id = ?", [courseId]).catch(() => {});
    await cleanupTestData();
    await closePool();
  });

  it("étape 1 (actor-teacher) : createSession → séance planifiée visible dans le planning", async () => {
    const { status, data } = await post("/sessions", {
      studentIds: [student.id], courseId, subject: "Mathématiques",
      sessionDate: "2026-07-15", sessionTime: "16:00", locationType: "online",
    }, { token: teacherToken });
    expect(status, `createSession: ${JSON.stringify(data)}`).toBe(200);
    expect(data.count).toBe(1);
    sessionId = data.sessions[0].id;

    const sched = await get(`/sessions?role=teacher&userId=${teacher.id}`, { token: teacherToken });
    const s = sched.data.find((x) => x.id === sessionId);
    expect(s, "séance absente du planning enseignant").toBeTruthy();
    expect(s.status).toBe("planifié");
    const [row] = await pool.query("SELECT parent_id FROM sessions WHERE id = ?", [sessionId]);
    expect(row[0].parent_id).toBe(parent.id);
  });

  it("étape 2 (actor-teacher) : check-in/out + rapport + devoir lié", async () => {
    expect((await patch(`/sessions/${sessionId}/check-in`, {}, { token: teacherToken })).status).toBe(200);
    expect((await patch(`/sessions/${sessionId}/check-out`, {}, { token: teacherToken })).status).toBe(200);
    const rep = await post(`/sessions/${sessionId}/report`,
      { reportText: "Séance sur les équations du 2nd degré", understandingScore: 4 },
      { token: teacherToken });
    expect(rep.status).toBe(200);

    const hw = await post("/homework", {
      teacherId: teacher.id, studentId: student.id, sessionId,
      title: "[IT] Exercices équations", description: "Ex. 12 à 18", dueDate: "2026-07-22", subject: "Mathématiques",
    }, { token: teacherToken });
    expect(hw.status, `POST /homework: ${JSON.stringify(hw.data)}`).toBe(201);
    homeworkId = hw.data.id;
    expect(hw.data.sessionId, "devoir non lié à la séance d'origine").toBe(sessionId);
  });

  it("étape 3 (actor-student) : uploadHomeworkFile → statut 'rendu', fichier visible", async () => {
    const form = new FormData();
    form.append("file", new Blob(["%PDF-1.4 devoir rendu [IT]"], { type: "application/pdf" }), "devoir.pdf");
    const res = await fetch(`${API_BASE}/homework/${homeworkId}/upload`, {
      method: "POST", headers: { Authorization: `Bearer ${studentToken}` }, body: form,
    });
    expect(res.status, "upload devoir échoué").toBe(200);
    const data = await res.json();
    // Réponse : { success, submissionUrl, homework }
    expect(data.submissionUrl, "URL de soumission manquante").toBeTruthy();
    expect(data.homework?.status).toBe("rendu");
  });

  it("étape 4 (actor-teacher) : PATCH /homework/:id → 'corrigé' avec feedback", async () => {
    const { status, data } = await patch(`/homework/${homeworkId}`, {
      status: "corrigé", feedback: "Bon travail, attention au discriminant.",
    }, { token: teacherToken });
    expect(status).toBe(200);
    expect(data.status).toBe("corrigé");
    expect(data.feedback).toContain("discriminant");
  });

  it("étape 4 — vérif Parent / Devoirs (actor-parent, lecture seule) : corrigé + feedback + fichier + lié séance", async () => {
    const { status, data } = await get(`/homework/parent/${parent.id}`, { token: parentToken });
    expect(status, `homework parent: ${JSON.stringify(data)}`).toBe(200);
    const hw = data.find((h) => h.id === homeworkId);
    expect(hw, "devoir corrigé absent de la vue parent").toBeTruthy();
    expect(hw.status).toBe("corrigé");
    expect(hw.feedback).toContain("discriminant");
    expect(hw.submissionUrl, "fichier rendu par l'élève non consultable côté parent").toBeTruthy();
    expect(hw.sessionId, "indicateur 'lié à une séance' manquant côté parent").toBe(sessionId);
  });

  it("étape 4 — vérif Parent / Progression (actor-parent, lecture seule) : ÉCART documenté", async () => {
    // Le bilan/progression parent (progress-report) N'intègre PAS les devoirs :
    // assiduité codée en dur (95), commentaires statiques, notes issues des seuls
    // quiz_attempts. La correction d'un devoir ne se reflète pas dans la
    // progression. Consigné comme écart dans le rapport.
    const { status, data } = await get(`/parents/${parent.id}/progress-report`, { token: parentToken });
    expect(status).toBe(200);
    expect(data.childName).toBe(student.name);
    expect(data.attendance).toBe(95); // preuve : valeur figée, non recalculée
  });
});
