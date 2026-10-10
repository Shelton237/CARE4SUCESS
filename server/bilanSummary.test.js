import { describe, it, expect } from "vitest";
import { indexDiagnostics, indexPlans, buildBilan, bilanStatus } from "./bilanSummary.js";

describe("bilanSummary", () => {
  it("statut : à traiter, en cours, terminé", () => {
    expect(bilanStatus(null, null)).toBe("a_traiter");
    expect(bilanStatus({}, null)).toBe("en_cours");
    expect(bilanStatus({}, {})).toBe("termine");
  });

  it("élève prouvé : dernier diagnostic, nombre d'évaluations et plan le plus récent", () => {
    const diagBy = indexDiagnostics([
      { student_id: "s1", evaluator_name: "Awa", scores: '{"Maths":2}', created_at: "2026-01-01T10:00:00Z" },
      { student_id: "s1", evaluator_name: "Brice", scores: { Maths: 3, Physique: 4 }, created_at: "2026-03-01T10:00:00Z" },
    ]);
    const planBy = indexPlans([{ student_id: "s1", title: "Plan", status: "active", created_at: "2026-03-02T10:00:00Z" }]);
    const b = buildBilan({ studentId: "s1", requestRow: null, diagBy, planBy });
    expect(b.status).toBe("termine");
    expect(b.diagnostic).toMatchObject({ evaluator: "Brice", count: 2, subjects: ["Maths", "Physique"], firstAt: "2026-01-01T10:00:00.000Z" });
    expect(b.plan.title).toBe("Plan");
  });

  it("prospect : diagnostic et plan lus sur la demande ; diagnostic sans notes ignoré", () => {
    const empty = new Map();
    const req = { diagnostic: { scores: { SVT: 2 }, evaluatorName: "Awa", created_at: "2026-02-01T00:00:00Z" }, academic_plan: null };
    expect(buildBilan({ studentId: null, requestRow: req, diagBy: empty, planBy: empty })).toMatchObject({
      status: "en_cours", diagnostic: { evaluator: "Awa", subjects: ["SVT"] }, plan: null,
    });
    const noScores = { diagnostic: '{"scores":{}}', academic_plan: null };
    expect(buildBilan({ studentId: null, requestRow: noScores, diagBy: empty, planBy: empty }).status).toBe("a_traiter");
  });
});
