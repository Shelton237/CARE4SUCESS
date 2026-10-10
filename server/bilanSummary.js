// Résumé du bilan pédagogique d'un élève : diagnostic (évaluation par matière) + plan.
// Sources : academic_diagnostics / academic_plans pour un élève prouvé (student_id),
// sinon les colonnes JSON requests.diagnostic / requests.academic_plan d'un prospect.
import { parseJsonObject } from "./parseJson.js";

export const toIso = (v) => {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

// Lignes academic_diagnostics triées par date croissante -> Map(student_id -> résumé du dernier)
export const indexDiagnostics = (rows = []) => {
  const by = new Map();
  for (const d of rows) {
    const cur = by.get(d.student_id);
    by.set(d.student_id, {
      at: toIso(d.created_at),
      firstAt: cur?.firstAt ?? toIso(d.created_at),
      evaluator: d.evaluator_name || null,
      count: (cur?.count || 0) + 1,
      subjects: Object.keys(parseJsonObject(d.scores)),
    });
  }
  return by;
};

// Lignes academic_plans triées par date croissante -> Map(student_id -> plan le plus récent)
export const indexPlans = (rows = []) => {
  const by = new Map();
  for (const p of rows) {
    by.set(p.student_id, { at: toIso(p.created_at), title: p.title || null, status: p.status || "active" });
  }
  return by;
};

export const diagnosticFromRequest = (raw) => {
  const x = parseJsonObject(raw);
  const scores = parseJsonObject(x.scores);
  if (!Object.keys(scores).length) return null;
  const at = toIso(x.created_at);
  return { at, firstAt: at, evaluator: x.evaluatorName || null, count: 1, subjects: Object.keys(scores) };
};

export const planFromRequest = (raw) => {
  const p = parseJsonObject(raw);
  if (!p.title && !p.weeks) return null;
  return { at: toIso(p.created_at), title: p.title || null, status: "active" };
};

// à traiter : aucun diagnostic ; en cours : diagnostic sans plan ; terminé : diagnostic + plan
export const bilanStatus = (diagnostic, plan) =>
  !diagnostic ? "a_traiter" : plan ? "termine" : "en_cours";

export const buildBilan = ({ studentId, requestRow, diagBy, planBy }) => {
  const diagnostic = (studentId && diagBy.get(studentId)) || (requestRow ? diagnosticFromRequest(requestRow.diagnostic) : null);
  const plan = (studentId && planBy.get(studentId)) || (requestRow ? planFromRequest(requestRow.academic_plan) : null);
  return { status: bilanStatus(diagnostic, plan), diagnostic, plan };
};
