// Scénario 09 : FAM-10 (scores de diagnostic restitués) et FAM-11
// (GET /api/advisor/match/:studentId ne renvoie plus 500).
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  pool, get, tokenFor, seedUser, seedTeacherProfile, cleanupTestData, closePool,
} from "../helpers/harness.js";

const advisor = { id: "it-09-advisor", name: "[IT] Advisor09", email: "advisor09@it.test", role: "advisor" };
const parent = { id: "it-09-parent", name: "[IT] Parent09", email: "parent09@it.test", role: "parent" };
const student = { id: "it-09-student", name: "[IT] Eleve09", email: "eleve09@it.test", role: "student" };
const teacher = { id: "it-09-teacher", name: "[IT] Prof09", email: "prof09@it.test", role: "teacher" };
let token;

describe("Scénario 09 : diagnostic + matching conseiller", () => {
  beforeAll(async () => {
    await cleanupTestData();
    await seedUser(advisor); await seedUser(parent);
    await seedUser({ ...student, parentId: parent.id });
    await seedUser(teacher);
    await seedTeacherProfile({ ...teacher, subjects: ["Mathématiques"] });
    token = tokenFor(advisor);
    await pool.query(
      `INSERT INTO academic_diagnostics (student_id, student_name, evaluator_id, evaluator_name, scores)
       VALUES (?, ?, ?, ?, ?)`,
      [student.id, student.name, advisor.id, advisor.name, JSON.stringify({ Mathématiques: 2, Français: 5 })]
    );
  });

  afterAll(async () => {
    await pool.query("DELETE FROM academic_diagnostics WHERE student_id = ?", [student.id]).catch(() => {});
    await cleanupTestData();
    await closePool();
  });

  it("FAM-10 : GET diagnostic restitue les scores", async () => {
    const r = await get(`/students/${student.id}/diagnostic`, { token });
    expect(r.status).toBe(200);
    expect(r.data.scores).toEqual({ Mathématiques: 2, Français: 5 });
  });

  it("FAM-11 : GET advisor/match répond 200 avec weakSubjects cohérents", async () => {
    const r = await get(`/advisor/match/${student.id}`, { token });
    expect(r.status).toBe(200);
    expect(r.data.student.id).toBe(student.id);
    expect(r.data.student.weakSubjects).toEqual(["Mathématiques"]);
    expect(Array.isArray(r.data.matches)).toBe(true);
    const m = r.data.matches.find((x) => x.id === teacher.id);
    expect(m).toBeTruthy();
    expect(m).toHaveProperty("score");
  });

  it("FAM-11 : élève inconnu -> 404", async () => {
    const r = await get(`/advisor/match/it-09-inconnu`, { token });
    expect(r.status).toBe(404);
  });
});
