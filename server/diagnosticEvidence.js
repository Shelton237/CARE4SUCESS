// Source de chaque note du diagnostic + derniere note scolaire /20, par matiere.
export const DIAG_EVIDENCE_SOURCES = ["test", "bulletin", "entretien", "declaration"];

// Ne garde que des entrées { source, grade } valides : source connue, note scolaire entre 0 et 20.
export const sanitizeEvidence = (evidence) => {
  if (!evidence || typeof evidence !== "object" || Array.isArray(evidence)) return null;
  const out = {};
  for (const [subject, value] of Object.entries(evidence)) {
    if (!value || typeof value !== "object") continue;
    const entry = {};
    if (DIAG_EVIDENCE_SOURCES.includes(value.source)) entry.source = value.source;
    const grade = Number(value.grade);
    if (value.grade !== "" && value.grade != null && Number.isFinite(grade) && grade >= 0 && grade <= 20) {
      entry.grade = Math.round(grade * 10) / 10;
    }
    if (Object.keys(entry).length) out[String(subject).slice(0, 80)] = entry;
  }
  return Object.keys(out).length ? out : null;
};
