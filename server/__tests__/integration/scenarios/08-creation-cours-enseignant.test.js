// Scénario 08 — Création et listing de cours par un enseignant (ticket E1)
// Réf. cartographie : Enseignant > Mes Cours (/teacher/courses)
//
// Régression : POST /api/courses et GET /api/courses?role=teacher renvoyaient
// une 500 car la table `courses` n'avait pas les colonnes mode/price/duration
// (ni teacher_id/teacher_name) attendues par server/index.js. Ce scénario
// couvre le flux complet côté enseignant : création d'un cours avec ces
// champs, relecture individuelle, et listing scopé par teacher.
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  pool, get, post, put, tokenFor, seedUser, cleanupTestData, closePool,
} from "../helpers/harness.js";

const teacher = { id: "it-08-teacher", name: "[IT] Prof Cours08", email: "profcours08@it.test", role: "teacher" };
const otherTeacher = { id: "it-08-teacherOther", name: "[IT] Prof Autre08", email: "profautre08@it.test", role: "teacher" };

let token, otherToken;
let createdCourseId;

describe("Scénario 08 — Création et listing de cours par un enseignant", () => {
  beforeAll(async () => {
    await cleanupTestData();
    await seedUser(teacher);
    await seedUser(otherTeacher);
    token = tokenFor(teacher);
    otherToken = tokenFor(otherTeacher);
  });

  afterAll(async () => {
    await pool.query("DELETE FROM courses WHERE created_by IN (?, ?)", [teacher.id, otherTeacher.id]).catch(() => {});
    await cleanupTestData();
    await closePool();
  });

  it("étape 1 (actor-teacher) : POST /api/courses réussit avec mode/price/duration", async () => {
    const res = await post("/courses", {
      title: "[IT] Cours d'algèbre 08",
      description: "Introduction à l'algèbre",
      subject: "Mathématiques",
      level: "Lycée",
      mode: "online",
      price: 5000,
      duration: "1h30",
      status: "draft",
      createdBy: teacher.id,
    }, { token });

    expect(res.status, `create course: ${JSON.stringify(res.data)}`).toBe(201);
    expect(res.data.id).toBeTruthy();
    expect(res.data.mode).toBe("online");
    expect(Number(res.data.price)).toBe(5000);
    expect(res.data.duration).toBe("1h30");
    createdCourseId = res.data.id;
  });

  it("étape 2 (actor-teacher) : GET /api/courses/:id relit le cours avec ses champs", async () => {
    const res = await get(`/courses/${createdCourseId}`, { token });
    expect(res.status, `get course: ${JSON.stringify(res.data)}`).toBe(200);
    expect(res.data.mode).toBe("online");
    expect(Number(res.data.price)).toBe(5000);
    expect(res.data.duration).toBe("1h30");
  });

  it("étape 3 (actor-teacher) : GET /api/courses?role=teacher liste uniquement ses propres cours", async () => {
    const res = await get(`/courses?role=teacher&userId=${teacher.id}`, { token });
    expect(res.status, `list courses: ${JSON.stringify(res.data)}`).toBe(200);
    const ids = res.data.map((c) => c.id);
    expect(ids, "cours créé absent du listing enseignant").toContain(createdCourseId);

    const otherRes = await get(`/courses?role=teacher&userId=${otherTeacher.id}`, { token: otherToken });
    expect(otherRes.status).toBe(200);
    expect(otherRes.data.map((c) => c.id), "ÉLÉVATION : cours d'un autre enseignant visible").not.toContain(createdCourseId);
  });

  it("étape 4 (actor-teacher) : PUT /api/courses/:id met à jour mode/price/duration sans 500", async () => {
    const res = await put(`/courses/${createdCourseId}`, {
      title: "[IT] Cours d'algèbre 08 (modifié)",
      description: "Introduction à l'algèbre — v2",
      subject: "Mathématiques",
      level: "Lycée",
      mode: "hybride",
      price: 6000,
      duration: "2h",
      status: "draft",
    }, { token });

    expect(res.status, `update course: ${JSON.stringify(res.data)}`).toBe(200);
    expect(res.data.mode).toBe("hybride");
    expect(Number(res.data.price)).toBe(6000);
    expect(res.data.duration).toBe("2h");
  });
});
