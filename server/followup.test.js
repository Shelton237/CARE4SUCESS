import { describe, it, expect } from "vitest";
import { computeFollowup, diagScores, median } from "./followup.js";

const NOW = new Date("2026-10-10T12:00:00");
const d = (s) => new Date(`${s}T10:00:00`);
const base = { from: "2026-09-11", to: "2026-10-10", now: NOW };

describe("followup", () => {
  it("notes : 0 ignoré, plafond de l'échelle ; médiane", () => {
    expect(diagScores('{"Maths":3,"SVT":0,"Anglais":8}')).toEqual({ Maths: 3, Anglais: 5 });
    expect(median([5, 1, 3])).toBe(3);
    expect(median([1, 2, 3, 4])).toBe(2.5);
    expect(median([])).toBe(null);
  });

  it("progression par rapport au diagnostic initial, recul et écart entre évaluateurs", () => {
    const r = computeFollowup({
      ...base,
      families: [{ id: "r1", studentId: "s1", child: "Jean", level: "3e", teacher: "M. Diop", createdAt: d("2026-08-01"),
        bilan: { status: "termine", diagnostic: { firstAt: d("2026-08-04"), at: d("2026-10-01"), count: 3 }, plan: { at: d("2026-08-08") } } }],
      diagnostics: [
        { student_id: "s1", evaluator_id: "a", scores: { Maths: 2, Physique: 3 }, evidence: { Maths: { source: "test" } }, created_at: d("2026-08-04") },
        { student_id: "s1", evaluator_id: "b", scores: { Maths: 2.5, Physique: 3 }, evidence: { Maths: { source: "declaration" } }, created_at: d("2026-08-10") },
        { student_id: "s1", evaluator_id: "a", scores: { Maths: 4, Physique: 2 }, evidence: { Maths: { source: "bulletin" } }, created_at: d("2026-10-01") },
      ],
      sessions: [{ student_id: "s1", session_date: d("2026-09-01"), status: "effectué" }, { student_id: "s1", session_date: d("2026-10-05"), status: "planifié" }],
      tutorLinks: [{ student_id: "s1", created_at: d("2026-08-20") }],
    });
    const row = r.students[0];
    expect(row).toMatchObject({ initialAvg: 2.5, latestAvg: 3, delta: 0.5, evaluations: 3, step: "reevaluation", sessions30: { done: 0, planned: 1 } });
    expect(r.alerts.find((a) => a.key === "regression").items[0].detail).toBe("Physique : 3 → 2");
    expect(r.kpis.progression).toMatchObject({ avg: 0.5, n: 1 });
    const maths = r.subjects.find((s) => s.subject === "Maths");
    expect(maths).toMatchObject({ initial: 2, latest: 4, delta: 2, reliability: 67, measures: 3 });
    expect(r.evaluatorGap).toEqual({ avg: 0.3, n: 1 });
    const f = Object.fromEntries(r.funnel.map((x) => [x.key, x]));
    expect(f.diagnostic).toMatchObject({ count: 1, medianDays: 3 });
    expect(f.tuteur.medianDays).toBe(12);
    expect(f.seance.medianDays).toBe(12);
  });

  it("alertes : diagnostic en attente, plan sans séance, devoirs, insatisfaction, note, agenda", () => {
    const r = computeFollowup({
      ...base,
      families: [
        { id: "r2", studentId: null, child: "Tina", createdAt: d("2026-09-20"), bilan: {} },
        { id: "r3", studentId: "s3", child: "Léo", createdAt: d("2026-07-01"), bilan: { diagnostic: { firstAt: d("2026-07-05"), at: d("2026-09-25"), count: 1 }, plan: { at: d("2026-09-01") } } },
      ],
      homework: ["2026-10-01", "2026-10-02", "2026-10-03"].map((due) => ({ student_id: "s3", due_date: d(due), status: "à faire" })),
      feedback: [{ student_id: "s3", rating: 2, created_at: d("2026-10-01") }],
      notes: [{ student_id: "s3", note_type: "alerte", created_at: d("2026-09-01") }],
      agenda: [{ title: "Appeler", date: "2026-10-01", status: "à faire", kind: "tache" }, { title: "Fait", date: "2026-10-01", status: "terminé" }],
    });
    const by = Object.fromEntries(r.alerts.map((a) => [a.key, a.count]));
    expect(by).toMatchObject({ diagPending: 1, planNoSession: 1, homeworkLate: 1, dissatisfaction: 1, alertNote: 1, agenda: 1, reevalDue: 0 });
    expect(r.students.find((s) => s.name === "Léo").alerts).toContain("Devoirs en retard");
    expect(r.kpis.homework).toMatchObject({ rate: 0, n: 3, correctionDays: null });
    expect(r.kpis.students).toMatchObject({ total: 2, withDiagnostic: 1, withPlan: 1 });
  });

  it("indicateurs de période et variation par rapport à la période précédente", () => {
    const r = computeFollowup({
      ...base,
      families: [{ id: "x", studentId: "s", child: "A", createdAt: d("2026-01-01"), bilan: {} }],
      sessions: [
        { student_id: "s", session_date: d("2026-09-20"), status: "effectué" }, { student_id: "s", session_date: d("2026-09-21"), status: "planifié" },
        { student_id: "s", session_date: d("2026-08-20"), status: "effectué" },
      ],
      feedback: [{ student_id: "s", rating: 4, created_at: d("2026-09-30") }, { student_id: "s", rating: 5, created_at: d("2026-08-30") }],
    });
    expect(r.period).toMatchObject({ previousFrom: "2026-08-12", previousTo: "2026-09-10" });
    expect(r.kpis.attendance).toMatchObject({ rate: 50, n: 2, variation: -50 });
    expect(r.kpis.satisfaction).toMatchObject({ avg: 4, n: 1, variation: -1 });
  });
});
