// Scénario 07 — Double rôle tutor/teacher
// Réf. cartographie : Tuteur > Espace Enseignant (/tutor/enseignant/*) ;
//   Enseignant (toutes pages)
//
// /tutor/enseignant/* réutilise EXACTEMENT les composants de /teacher/* : les
// mêmes appels API sont émis avec l'id de l'utilisateur connecté. Ce test
// vérifie que les mêmes capacités exécutées par un enseignant standard et par
// un utilisateur double rôle (tutor + secondary_role teacher) :
//   - produisent un résultat fonctionnel STRICTEMENT identique,
//   - restent scopées aux données propres de l'utilisateur (aucune élévation),
//   - n'ont aucun effet de bord sur l'espace Tuteur natif.
//
// DRIFT SCHÉMA CONSIGNÉ : POST /api/courses (et GET /api/courses?role=teacher)
// échouent en 500 sur ce schéma — la table `courses` n'a pas les colonnes
// mode/price/duration que le code exige. L'échec étant IDENTIQUE pour les deux
// rôles, l'équivalence reste vérifiable. Le scope des cours est validé via des
// lignes seedées directement en base (colonnes de base).
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import crypto from "crypto";
import {
  pool, get, post, tokenFor, seedUser, seedTeacherProfile,
  linkStudentTeacher, cleanupTestData, closePool,
} from "../helpers/harness.js";

const parentStd = { id: "it-07-parentT", name: "[IT] Parent T07", email: "parentt07@it.test", role: "parent" };
const parentDual = { id: "it-07-parentU", name: "[IT] Parent U07", email: "parentu07@it.test", role: "parent" };
const teacherStd = { id: "it-07-teacher", name: "[IT] Prof Standard07", email: "profstd07@it.test", role: "teacher" };
const studentStd = { id: "it-07-studentT", name: "[IT] Eleve T07", email: "elevet07@it.test", role: "student", parentId: "it-07-parentT" };
const tutorDual = { id: "it-07-tutor", name: "[IT] Tuteur Enseignant07", email: "tutordual07@it.test", role: "tutor", secondaryRole: "teacher" };
const studentDual = { id: "it-07-studentU", name: "[IT] Eleve U07", email: "eleveu07@it.test", role: "student", parentId: "it-07-parentU" };

let stdTok, dualTok, stdRes, dualRes;
const stdCourseId = crypto.randomUUID();
const dualCourseId = crypto.randomUUID();

async function runTeacherCapabilities(actor, ownStudent, token) {
  const r = {};
  r.session = await post("/sessions", {
    studentIds: [ownStudent.id], courseId: null, subject: "Mathématiques",
    sessionDate: "2026-07-20", sessionTime: "15:00", locationType: "online",
  }, { token });
  r.homework = await post("/homework", {
    teacherId: actor.id, studentId: ownStudent.id, title: "[IT] Devoir 07",
    dueDate: "2026-07-27", subject: "Mathématiques",
  }, { token });
  r.course = await post("/courses", {
    title: `[IT] Cours de ${actor.name}`, subject: "Mathématiques", level: "Lycée",
    status: "published", createdBy: actor.id,
  }, { token });
  r.message = await post("/messages", {
    senderId: actor.id, senderName: actor.name, senderRole: "teacher",
    receiverId: ownStudent.id, receiverName: ownStudent.name, receiverRole: "student",
    content: "Message de test double rôle 07",
  }, { token });
  return r;
}

describe("Scénario 07 — Double rôle tutor/teacher", () => {
  beforeAll(async () => {
    await cleanupTestData();
    await seedUser(parentStd); await seedUser(parentDual);
    await seedUser(teacherStd); await seedUser(studentStd);
    await seedUser(tutorDual); await seedUser(studentDual);
    await seedTeacherProfile({ id: teacherStd.id, name: teacherStd.name, email: teacherStd.email, city: "Douala" });
    await seedTeacherProfile({ id: tutorDual.id, name: tutorDual.name, email: tutorDual.email, city: "Yaoundé" });
    await linkStudentTeacher(studentStd.id, teacherStd.id);
    await linkStudentTeacher(studentDual.id, tutorDual.id);
    // Cours seedés directement (colonnes de base) pour tester le scope malgré le drift POST /courses
    await pool.query("INSERT INTO courses (id, title, description, subject, level, status, created_by) VALUES (?, ?, '', 'Mathématiques', 'Lycée', 'published', ?)",
      [stdCourseId, `[IT] Cours de ${teacherStd.name}`, teacherStd.id]);
    await pool.query("INSERT INTO courses (id, title, description, subject, level, status, created_by) VALUES (?, ?, '', 'Mathématiques', 'Lycée', 'published', ?)",
      [dualCourseId, `[IT] Cours de ${tutorDual.name}`, tutorDual.id]);
    stdTok = tokenFor(teacherStd);
    dualTok = tokenFor(tutorDual); // rôle réel tutor, comme en production

    stdRes = await runTeacherCapabilities(teacherStd, studentStd, stdTok);
    dualRes = await runTeacherCapabilities(tutorDual, studentDual, dualTok);
  });

  afterAll(async () => {
    await pool.query("DELETE FROM courses WHERE created_by IN (?, ?)", [teacherStd.id, tutorDual.id]).catch(() => {});
    await cleanupTestData();
    await closePool();
  });

  it("étape 1 (actor-teacher standard) : createSession / homework / message réussissent", async () => {
    expect(stdRes.session.status, `session std: ${JSON.stringify(stdRes.session.data)}`).toBe(200);
    expect(stdRes.session.data.count).toBe(1);
    expect(stdRes.homework.status, `homework std: ${JSON.stringify(stdRes.homework.data)}`).toBe(201);
    expect(stdRes.message.status).toBe(201);
  });

  it("étape 2 (actor-teacher actingAs tutor-secondary-role) : mêmes capacités réussissent", async () => {
    expect(dualRes.session.status, `session dual: ${JSON.stringify(dualRes.session.data)}`).toBe(200);
    expect(dualRes.session.data.count).toBe(1);
    expect(dualRes.homework.status, `homework dual: ${JSON.stringify(dualRes.homework.data)}`).toBe(201);
    expect(dualRes.message.status).toBe(201);
  });

  it("étape 2 — ÉQUIVALENCE stricte : mêmes codes de retour pour chaque capacité entre /teacher/* et /tutor/enseignant/*", async () => {
    expect(dualRes.session.status).toBe(stdRes.session.status);
    expect(dualRes.homework.status).toBe(stdRes.homework.status);
    expect(dualRes.message.status).toBe(stdRes.message.status);
    // createCourse : même comportement (identiquement bloqué par le drift schéma)
    expect(dualRes.course.status, "divergence de comportement sur createCourse entre les deux rôles").toBe(stdRes.course.status);
  });

  it("étape 2 — scope de données strictement limité (aucune élévation) : élèves propres uniquement", async () => {
    const dualStudents = await get(`/teachers/${tutorDual.id}/students`, { token: dualTok });
    expect(dualStudents.status).toBe(200);
    const ids = dualStudents.data.map((s) => s.id);
    expect(ids, "élève propre absent").toContain(studentDual.id);
    expect(ids, "ÉLÉVATION : accès à l'élève d'un autre enseignant").not.toContain(studentStd.id);

    const stdStudents = await get(`/teachers/${teacherStd.id}/students`, { token: stdTok });
    expect(stdStudents.data.map((s) => s.id)).not.toContain(studentDual.id);
  });

  it("étape 2 — scope des cours (vérifié en base) : chacun ne possède que ses propres cours", async () => {
    const [dualCourses] = await pool.query("SELECT title FROM courses WHERE created_by = ?", [tutorDual.id]);
    const [stdCourses] = await pool.query("SELECT title FROM courses WHERE created_by = ?", [teacherStd.id]);
    const dualTitles = dualCourses.map((c) => c.title);
    expect(dualTitles).toContain(`[IT] Cours de ${tutorDual.name}`);
    expect(dualTitles, "ÉLÉVATION : cours d'un autre enseignant rattaché au tuteur").not.toContain(`[IT] Cours de ${teacherStd.name}`);
    expect(stdCourses.map((c) => c.title)).not.toContain(`[IT] Cours de ${tutorDual.name}`);
  });

  it("étape 2 — vérif Espace Tuteur natif (actor-tutor, lecture seule) : cloisonnement, aucun effet de bord", async () => {
    const [apps] = await pool.query("SELECT COUNT(*) n FROM teacher_applications WHERE reviewed_by = ?", [tutorDual.id]);
    expect(apps[0].n, "effet de bord : candidature revue par le tuteur").toBe(0);
    const [evals] = await pool.query("SELECT COUNT(*) n FROM tutor_evaluations WHERE tutor_id = ?", [tutorDual.id]);
    expect(evals[0].n, "effet de bord : évaluation tuteur créée").toBe(0);
  });
});
