// SEC-04 : GET /api/advisor/families ne doit jamais relier une demande à un
// élève par le NOM seul (fuite de données entre familles homonymes).
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import crypto from "crypto";
import { pool, get, tokenFor, seedUser, linkParentChild, cleanupTestData, closePool } from "../helpers/harness.js";

const advisor = { id: "it-hom-advisor", name: "[IT] AdvisorHom", email: "advisor-hom@it.test", role: "advisor" };
const parentA = { id: "it-hom-parentA", name: "[IT] ParentA", email: "parent-a-hom@it.test", role: "parent" };
const parentB = { id: "it-hom-parentB", name: "[IT] ParentB", email: "parent-b-hom@it.test", role: "parent" };
const parentC = { id: "it-hom-parentC", name: "[IT] ParentC", email: "parent-c-hom@it.test", role: "parent" };
const CHILD = "[IT] Fabrice";
let token;
const reqIds = {};

const insertRequest = async (key, parent, child, email) => {
  const id = crypto.randomUUID();
  reqIds[key] = id;
  await pool.query(
    `INSERT INTO requests (id, parent_name, child_name, level, subject, email, status, request_date)
     VALUES (?, ?, ?, 'Lycée', 'Mathématiques', ?, 'reçu', CURDATE())`,
    [id, parent.name, child, email]
  );
};
const families = async () => (await get("/advisor/families", { token })).data;
const byReq = (list, key) => list.find((f) => f.id === reqIds[key]);

describe("SEC-04 — /advisor/families : homonymes entre familles", () => {
  beforeAll(async () => {
    await cleanupTestData();
    for (const u of [advisor, parentA, parentB, parentC]) await seedUser(u);
    token = tokenFor(advisor);
  });
  afterAll(async () => {
    await cleanupTestData();
    await closePool();
  });

  it("un seul élève lié au parent A : la demande du parent B (même nom d'enfant) n'est PAS rattachée", async () => {
    await seedUser({ id: "it-hom-stuA", name: CHILD, email: "stu-a-hom@it.test", role: "student", parentId: parentA.id });
    await insertRequest("A", parentA, CHILD, parentA.email);
    await insertRequest("B", parentB, CHILD, parentB.email);
    const list = await families();
    expect(byReq(list, "A").studentId).toBe("it-hom-stuA");
    expect(byReq(list, "B").studentId).toBeNull();
    // l'élève n'apparaît qu'une seule fois
    expect(list.filter((f) => f.studentId === "it-hom-stuA")).toHaveLength(1);
  });

  it("demande sans email : aucun rattachement par nom seul", async () => {
    await insertRequest("N", parentC, CHILD, null);
    const list = await families();
    expect(byReq(list, "N").studentId).toBeNull();
    expect(byReq(list, "N").childEmail).toBeNull();
  });

  it("deux élèves homonymes chacun lié à son parent : chaque demande pointe le bon id, aucun doublon ni manquant", async () => {
    await seedUser({ id: "it-hom-stuB", name: CHILD, email: "stu-b-hom@it.test", role: "student" });
    await linkParentChild(parentB.id, "it-hom-stuB"); // lien via parent_child
    const list = await families();
    expect(byReq(list, "A").studentId).toBe("it-hom-stuA");
    expect(byReq(list, "B").studentId).toBe("it-hom-stuB");
    const ids = list.map((f) => f.studentId).filter(Boolean);
    expect(new Set(ids).size).toBe(ids.length);
    for (const sid of ["it-hom-stuA", "it-hom-stuB"]) {
      expect(list.filter((f) => f.studentId === sid)).toHaveLength(1);
    }
  });

  it("élève homonyme non lié à une demande prouvée : visible une fois (branche élèves sans demande)", async () => {
    await seedUser({ id: "it-hom-stuX", name: CHILD, email: "stu-x-hom@it.test", role: "student" });
    const list = await families();
    expect(list.filter((f) => f.studentId === "it-hom-stuX")).toHaveLength(1);
    expect(byReq(list, "A").studentId).toBe("it-hom-stuA");
  });

  it("plusieurs élèves homonymes liés au MÊME parent : ambigu => null", async () => {
    await seedUser({ id: "it-hom-stuA2", name: CHILD, email: "stu-a2-hom@it.test", role: "student", parentId: parentA.id });
    const list = await families();
    expect(byReq(list, "A").studentId).toBeNull();
    expect(list.filter((f) => f.studentId === "it-hom-stuA2")).toHaveLength(1);
  });

  it("affectation d'une autre famille homonyme (même niveau) non rattachée", async () => {
    await pool.query(
      `INSERT INTO assignments (id, child_name, level, subject, selected_teacher, status)
       VALUES (?, ?, 'Lycée', 'Mathématiques', '[IT] Prof', 'confirmed')`,
      [crypto.randomUUID(), CHILD]
    );
    const list = await families();
    expect(byReq(list, "A").teacher).toBe("—");
    expect(byReq(list, "B").teacher).toBe("—");
  });
});
