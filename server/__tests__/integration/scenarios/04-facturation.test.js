// Scénario 04 — Facturation
// Réf. cartographie : Admin > Finance & Paie ; Parent > Factures
//
// generateManualInvoices (admin) génère les factures du mois à partir des
// séances 'effectué'. Vérification de l'apparition et du statut côté parent.
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import crypto from "crypto";
import {
  pool, get, post, tokenFor, seedUser, seedTeacherProfile, cleanupTestData, closePool,
} from "../helpers/harness.js";

const MONTH = "2026-06";
const admin = { id: "it-04-admin", name: "[IT] Admin04", email: "admin04@it.test", role: "admin" };
const teacher = { id: "it-04-teacher", name: "[IT] Prof04", email: "prof04@it.test", role: "teacher" };
const families = [
  { parent: { id: "it-04-parentA", name: "[IT] ParentA04", email: "parentA04@it.test", role: "parent" },
    student: { id: "it-04-studentA", name: "[IT] EleveA04", email: "eleveA04@it.test", role: "student", parentId: "it-04-parentA" } },
  { parent: { id: "it-04-parentB", name: "[IT] ParentB04", email: "parentB04@it.test", role: "parent" },
    student: { id: "it-04-studentB", name: "[IT] EleveB04", email: "eleveB04@it.test", role: "student", parentId: "it-04-parentB" } },
];

let adminToken;

async function seedEffectueSession(f) {
  const id = crypto.randomUUID();
  await pool.query(
    `INSERT INTO sessions (id, teacher_id, teacher_name, student_id, student_name, parent_id, parent_name, subject, session_day, session_date, session_time, location, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'Mathématiques', 'Lundi', ?, '16:00', 'En ligne', 'effectué')`,
    [id, teacher.id, teacher.name, f.student.id, f.student.name, f.parent.id, f.parent.name, `${MONTH}-15`]
  );
}

describe("Scénario 04 — Facturation", () => {
  beforeAll(async () => {
    await cleanupTestData();
    await seedUser(admin);
    await seedUser(teacher);
    await seedTeacherProfile({ id: teacher.id, name: teacher.name, email: teacher.email, city: "Douala", hourlyRate: 8000 });
    for (const f of families) {
      await seedUser(f.parent);
      await seedUser(f.student);
      await seedEffectueSession(f);
    }
    adminToken = tokenFor(admin);
  });

  afterAll(async () => {
    await cleanupTestData();
    await closePool();
  });

  it("étape 1 (actor-admin) : generateManualInvoices génère une facture par famille éligible", async () => {
    const { status, data } = await post("/admin/finance/generate-invoices", { month: MONTH }, { token: adminToken });
    expect(status, `generate-invoices: ${JSON.stringify(data)}`).toBe(200);
    // 2 familles éligibles → 2 factures générées
    expect(data.generated).toBe(2);
  });

  it("étape 1 — vérif Parent A / Factures (lecture seule) : facture présente, statut 'pending', montant correct", async () => {
    const parentToken = tokenFor(families[0].parent);
    const { status, data } = await get(`/parents/${families[0].parent.id}/invoices`, { token: parentToken });
    expect(status).toBe(200);
    expect(data.length, "aucune facture côté parent A").toBeGreaterThanOrEqual(1);
    const inv = data[0];
    expect(inv.status).toBe("pending");
    expect(inv.amount, "montant de facture nul/incohérent").toBeGreaterThan(0);
    expect(String(inv.description)).toContain("Cours de soutien");
  });

  it("étape 1 — vérif Parent B / Factures (lecture seule) : indicateurs cohérents (solde en attente)", async () => {
    const parentToken = tokenFor(families[1].parent);
    const { status, data } = await get(`/parents/${families[1].parent.id}/invoices`, { token: parentToken });
    expect(status).toBe(200);
    const pendingTotal = data.filter((i) => i.status === "pending").reduce((s, i) => s + Number(i.amount), 0);
    expect(pendingTotal, "solde en attente incohérent").toBeGreaterThan(0);
    // 1 séance de 2h (défaut) × 8000 FCFA = 16000
    expect(Number(data[0].amount)).toBe(16000);
  });

  it("idempotence : une 2e génération sur le même mois ne duplique pas les factures", async () => {
    const { data } = await post("/admin/finance/generate-invoices", { month: MONTH }, { token: adminToken });
    expect(data.generated, "des factures ont été dupliquées sur le même mois").toBe(0);
  });

  it("périmètre : un non-admin ne peut pas générer les factures", async () => {
    const parentToken = tokenFor(families[0].parent);
    const { status } = await post("/admin/finance/generate-invoices", { month: MONTH }, { token: parentToken });
    expect(status).toBe(403);
  });
});
