// SÉCURITÉ 02 — Scoping du portefeuille conseiller (/advisor/matching, /advisor/families)
// ============================================================================
// Réf. cartographie :
//   - Conseiller > Tableau de bord : « familles assignées », données via
//     `fetchAdvisorDashboard(user.id)` → notion de portefeuille propre au conseiller.
//   - Conseiller > Mes familles (fetchAdvisorFamilies) et > Matching
//     (fetchAdvisorAssignments) : « un conseiller ne doit voir/confirmer que son
//     propre portefeuille » (point prioritaire du system prompt).
//   - Composant Matching.tsx partagé entre /admin/matching et /advisor/matching.
//
// Passe 1 — API directe :
//   server/index.js L4034 `app.get("/api/advisor/families", ...)` — AUCUN
//   `authenticateRequest`, AUCUN paramètre advisorId : la requête SQL lit TOUTES
//   les `requests`/`assignments` de la plateforme, sans filtrage par conseiller.
//   server/index.js L2134 `app.get("/api/assignments", ...)` — idem, aucune
//   notion de portefeuille dans le modèle de données (pas de colonne advisor_id).
//
// Constat : il n'existe AUCUN cloisonnement de portefeuille conseiller au niveau
// des données. Un conseiller B voit et peut confirmer les affectations « du
// portefeuille » d'un conseiller A. API laisse passer + UI affiche les mêmes
// données à tout conseiller → CRITIQUE (double surface d'exposition).
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import crypto from "crypto";
import {
  pool, get, patch, tokenFor, seedUser, seedTeacherProfile,
  cleanupTestData, closePool,
} from "../integration/helpers/harness.js";

const advisorA = { id: "it-sec02-advA", name: "[IT] Conseiller A Sec02", email: "advasec02@it.test", role: "advisor" };
const advisorB = { id: "it-sec02-advB", name: "[IT] Conseiller B Sec02", email: "advbsec02@it.test", role: "advisor" };
const parentA = { id: "it-sec02-parentA", name: "[IT] Parent A Sec02", email: "parentasec02@it.test", role: "parent" };
const studentA = { id: "it-sec02-studentA", name: "[IT] Eleve A Sec02", email: "elevasec02@it.test", role: "student", parentId: "it-sec02-parentA" };
const teacher = { id: "it-sec02-teacher", name: "[IT] Prof Sec02", email: "profsec02@it.test", role: "teacher" };

let tokenB;
let assignmentAId;

describe("SÉCURITÉ 02 — Portefeuille conseiller : B agit sur le portefeuille de A", () => {
  beforeAll(async () => {
    await cleanupTestData();
    await seedUser(advisorA); await seedUser(advisorB);
    await seedUser(parentA); await seedUser(studentA); await seedUser(teacher);
    await seedTeacherProfile({ id: teacher.id, name: teacher.name, email: teacher.email, city: "Douala" });
    tokenB = tokenFor(advisorB);

    // Une affectation « du portefeuille de A » (élève A / parent A).
    assignmentAId = crypto.randomUUID();
    await pool.query(
      `INSERT INTO assignments (id, child_name, level, subject, needs, schedule, location, candidates, status)
       VALUES (?, ?, 'Terminale', 'Physique', ?, 'Jeudi 17h', 'Douala', ?, 'pending')`,
      [assignmentAId, studentA.name, JSON.stringify(["Mécanique"]),
       JSON.stringify([{ name: teacher.name, rating: 5, available: true }])]
    );
    await pool.query(
      `INSERT INTO requests (id, parent_name, child_name, level, subject, phone, status)
       VALUES (?, ?, ?, 'Terminale', 'Physique', '+237600000002', 'en traitement')`,
      [crypto.randomUUID(), parentA.name, studentA.name]
    ).catch(() => {});
  });

  afterAll(async () => {
    await cleanupTestData();
    await closePool();
  });

  it("PREUVE — /api/advisor/families ne filtre par aucun conseiller (aucun paramètre advisorId)", async () => {
    // Le conseiller B récupère les familles : l'affectation de A y figure.
    const { status, data } = await get("/advisor/families", { token: tokenB });
    expect(status).toBe(200);
    const seesA = Array.isArray(data) && data.some((f) => (f.child || f.child_name) === studentA.name);
    expect(seesA, "le conseiller B voit la famille du portefeuille de A (aucun cloisonnement)").toBe(true);
  });

  it("PREUVE — /api/assignments expose l'affectation de A au conseiller B (liste globale)", async () => {
    const { status, data } = await get("/assignments", { token: tokenB });
    expect(status).toBe(200);
    const found = Array.isArray(data) && data.some((a) => a.id === assignmentAId);
    expect(found, "l'affectation du portefeuille de A est visible par B").toBe(true);
  });

  it("PREUVE — le conseiller B confirme une affectation du portefeuille de A", async () => {
    const { status } = await patch(
      `/assignments/${assignmentAId}`,
      { selectedTeacher: teacher.name },
      { token: tokenB }
    );
    expect(status).toBe(200);
    const [[row]] = await pool.query("SELECT status FROM assignments WHERE id = ?", [assignmentAId]);
    expect(row.status, "B a confirmé une affectation hors de son portefeuille").toBe("confirmed");
  });

  // ── ATTENDU sécurisé : échoue tant que le cloisonnement n'existe pas ───────
  it("ATTENDU SÉCURISÉ [CRITIQUE, ouvert] — /api/advisor/families doit être scopé au conseiller appelant", async () => {
    const { data } = await get("/advisor/families", { token: tokenB });
    const seesA = Array.isArray(data) && data.some((f) => (f.child || f.child_name) === studentA.name);
    expect(
      seesA,
      "FAILLE CRITIQUE ouverte : aucun cloisonnement de portefeuille — /api/advisor/families doit filtrer par le conseiller assigné",
    ).toBe(false);
  });
});
