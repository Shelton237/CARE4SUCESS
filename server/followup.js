// Tableau de bord de suivi pédagogique du conseiller : calculs purs (aucun accès base).
// Règle d'objectivité : chaque indicateur renvoie son effectif (n) ; un élève est comparé
// à son propre diagnostic initial ; une valeur non mesurable vaut null (jamais inventée).
import { parseJsonObject } from "./parseJson.js";

const DAY = 86_400_000;
const DIAG_MAX = 5;
const OBJECTIVE_SOURCES = ["test", "bulletin"];
const AGENDA_DONE = ["réalisé", "terminé", "annulé"];

export const toDate = (v) => {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};
const pad = (n) => String(n).padStart(2, "0");
export const dayKey = (v) => {
  const d = toDate(v);
  return d ? `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` : null;
};
const daysBetween = (a, b) => {
  const x = toDate(a), y = toDate(b);
  return x && y ? (y.getTime() - x.getTime()) / DAY : null;
};
const round1 = (n) => (n === null || n === undefined || Number.isNaN(n) ? null : Math.round(n * 10) / 10);
const mean = (l) => (l.length ? l.reduce((a, b) => a + b, 0) / l.length : null);
export const median = (l) => {
  if (!l.length) return null;
  const s = [...l].sort((a, b) => a - b), m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const pct = (num, den) => (den ? Math.round((num / den) * 100) : null);

// Notes 0-5 (0 = non évalué, ignoré ; anciennes notes sur 10 ramenées au maximum de l'échelle)
export const diagScores = (raw) => {
  const out = {};
  for (const [subject, v] of Object.entries(parseJsonObject(raw))) {
    const n = Number(typeof v === "object" && v !== null ? v.score ?? v.value : v);
    if (Number.isFinite(n) && n > 0) out[subject] = Math.min(DIAG_MAX, n);
  }
  return out;
};
const avgLevel = (scores) => mean(Object.values(scores));
// Écart moyen sur les matières notées aux deux dates
const progression = (a, b) => {
  const common = Object.keys(a).filter((k) => k in b);
  return common.length ? mean(common.map((k) => b[k] - a[k])) : null;
};

export const STEPS = [
  { key: "demande", label: "Demandes" },
  { key: "diagnostic", label: "Diagnostics" },
  { key: "plan", label: "Plans" },
  { key: "tuteur", label: "Tuteurs" },
  { key: "seance", label: "1re séance" },
  { key: "reevaluation", label: "Réévaluation" },
];
const STEP_LABEL = { demande: "Demande", diagnostic: "Diagnostic", plan: "Plan actif", tuteur: "Tuteur", seance: "1re séance", reevaluation: "Réévaluation" };

export const ALERTS = [
  { key: "diagPending", label: "Diagnostics en attente", rule: "> 7 jours sans diagnostic", short: "Diagnostic en attente" },
  { key: "reevalDue", label: "Réévaluations dues", rule: "> 30 jours avec plan actif", short: "Réévaluation due" },
  { key: "planNoSession", label: "Plan sans séance", rule: "> 14 jours sans séance", short: "Plan sans séance" },
  { key: "regression", label: "Recul mesuré", rule: "-1 point sur une matière", short: "Recul mesuré" },
  { key: "homeworkLate", label: "Devoirs en retard", rule: "3 ou + à faire (date passée)", short: "Devoirs en retard" },
  { key: "dissatisfaction", label: "Insatisfaction parent", rule: "≤ 2/5 sur 30 jours", short: "Insatisfaction parent" },
  { key: "alertNote", label: "Alerte non suivie", rule: "Note conseiller > 7 jours", short: "Alerte non suivie" },
  { key: "agenda", label: "Tâches en retard", rule: "RDV ou tâches à clôturer", short: "Tâche en retard" },
];

const groupBy = (rows, key) => {
  const m = new Map();
  for (const r of rows) {
    const k = r[key];
    if (!k) continue;
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(r);
  }
  return m;
};
const clean = (v) => {
  const s = String(v ?? "").trim();
  return s && s !== String.fromCharCode(0x2014) ? s : "";
};

export const computeFollowup = ({
  families = [], diagnostics = [], sessions = [], homework = [], feedback = [], notes = [], tutorLinks = [], agenda = [],
  from, to, now = new Date(),
}) => {
  const nowD = toDate(now);
  const today = dayKey(nowD);
  const fromK = dayKey(from), toK = dayKey(to);
  const spanDays = Math.max(1, Math.round(daysBetween(fromK, toK)) + 1);
  const prevTo = new Date(toDate(fromK).getTime() - DAY), prevFrom = new Date(prevTo.getTime() - (spanDays - 1) * DAY);
  const prevFromK = dayKey(prevFrom), prevToK = dayKey(prevTo);
  const inRange = (k, a, b) => !!k && k >= a && k <= b;
  const olderThan = (v, days) => { const d = daysBetween(v, nowD); return d !== null && d > days; };

  const diagBy = groupBy([...diagnostics].sort((a, b) => toDate(a.created_at) - toDate(b.created_at)), "student_id");
  const sessBy = groupBy(sessions, "student_id");
  const hwBy = groupBy(homework, "student_id");
  const fbBy = groupBy(feedback, "student_id");
  const notesBy = groupBy([...notes].sort((a, b) => toDate(a.created_at) - toDate(b.created_at)), "student_id");
  const tutorAt = new Map();
  for (const l of tutorLinks) {
    const d = toDate(l.created_at);
    if (d && (!tutorAt.has(l.student_id) || d < tutorAt.get(l.student_id))) tutorAt.set(l.student_id, d);
  }

  const alerts = Object.fromEntries(ALERTS.map((a) => [a.key, []]));
  const delays = { diagnostic: [], plan: [], tuteur: [], seance: [], reevaluation: [] };
  const funnel = Object.fromEntries(STEPS.map((s) => [s.key, 0]));
  const rows = [];
  const progressNow = [], progressStart = [];
  const subjectStats = new Map();
  const evaluatorGaps = [];

  for (const f of families) {
    const sid = f.studentId || null;
    const name = clean(f.childName || f.child) || "Élève non renseigné";
    const ref = { familyId: f.id, studentId: sid, name };
    const bilan = f.bilan || {};
    const diags = (sid && diagBy.get(sid)) || [];
    const scored = diags.map((d) => ({ ...d, scores: diagScores(d.scores), evidence: parseJsonObject(d.evidence), at: toDate(d.created_at) }))
      .filter((d) => Object.keys(d.scores).length);
    const sess = (sid && sessBy.get(sid)) || [];
    const done = sess.filter((s) => s.status === "effectué").sort((a, b) => toDate(a.session_date) - toDate(b.session_date));
    const hasTutor = !!clean(f.teacher || f.teacherName) || (sid && tutorAt.has(sid));
    const diagAt = bilan.diagnostic?.firstAt || bilan.diagnostic?.at || null;
    const lastDiagAt = bilan.diagnostic?.at || diagAt;
    const planAt = bilan.plan?.at || null;

    // Étapes du parcours (une étape peut être atteinte sans la précédente : on compte chaque étape)
    const reached = {
      demande: true, diagnostic: !!bilan.diagnostic, plan: !!bilan.plan, tuteur: hasTutor,
      seance: done.length > 0, reevaluation: (bilan.diagnostic?.count || 0) >= 2,
    };
    STEPS.forEach((s) => { if (reached[s.key]) funnel[s.key] += 1; });
    const step = [...STEPS].reverse().find((s) => reached[s.key]).key;

    const push = (arr, v) => { if (v !== null && v >= 0) arr.push(v); };
    push(delays.diagnostic, daysBetween(f.createdAt, diagAt));
    push(delays.plan, daysBetween(diagAt, planAt));
    const tAt = sid ? tutorAt.get(sid) : null;
    push(delays.tuteur, daysBetween(planAt, tAt));
    push(delays.seance, daysBetween(tAt, done[0]?.session_date));
    if (scored.length >= 2) push(delays.reevaluation, daysBetween(done[0]?.session_date, scored[1].at));

    // Alertes
    const mine = [];
    const flag = (key, detail) => { alerts[key].push({ ...ref, detail }); mine.push(key); };
    if (!bilan.diagnostic && olderThan(f.createdAt, 7)) flag("diagPending", `Demande du ${dayKey(f.createdAt).split("-").reverse().join("/")}`);
    if (bilan.plan && olderThan(lastDiagAt, 30)) flag("reevalDue", `Dernière évaluation il y a ${Math.floor(daysBetween(lastDiagAt, nowD))} jours`);
    if (bilan.plan && olderThan(planAt, 14) && !done.some((s) => daysBetween(s.session_date, nowD) <= 14)) {
      flag("planNoSession", done.length ? `Dernière séance le ${dayKey(done[done.length - 1].session_date).split("-").reverse().join("/")}` : "Aucune séance effectuée");
    }
    if (scored.length >= 2) {
      const prev = scored[scored.length - 2].scores, last = scored[scored.length - 1].scores;
      const drops = Object.keys(last).filter((k) => k in prev && last[k] - prev[k] <= -1);
      if (drops.length) flag("regression", drops.map((k) => `${k} : ${prev[k]} → ${last[k]}`).join(", "));
    }
    const hw = (sid && hwBy.get(sid)) || [];
    const late = hw.filter((h) => h.status === "à faire" && dayKey(h.due_date) < today).length;
    if (late >= 3) flag("homeworkLate", `${late} devoirs en retard`);
    const fb = (sid && fbBy.get(sid)) || [];
    const bad = fb.filter((x) => Number(x.rating) <= 2 && daysBetween(x.created_at, nowD) <= 30);
    if (bad.length) flag("dissatisfaction", `Avis ${bad[bad.length - 1].rating}/5`);
    const nts = (sid && notesBy.get(sid)) || [];
    const lastNote = nts[nts.length - 1];
    if (lastNote?.note_type === "alerte" && olderThan(lastNote.created_at, 7)) flag("alertNote", "Alerte sans note de suivi");

    // Progression de l'élève par rapport à son diagnostic initial
    const initial = scored[0]?.scores || null, latest = scored[scored.length - 1]?.scores || null;
    const delta = scored.length >= 2 ? progression(initial, latest) : null;
    if (delta !== null) progressNow.push(delta);
    const atStart = scored.filter((d) => dayKey(d.at) < fromK);
    if (atStart.length >= 2) {
      const d0 = progression(atStart[0].scores, atStart[atStart.length - 1].scores);
      if (d0 !== null) progressStart.push(d0);
    }
    if (scored.length >= 2) {
      for (const k of Object.keys(latest)) {
        if (!(k in initial)) continue;
        if (!subjectStats.has(k)) subjectStats.set(k, { initial: [], latest: [], measures: 0, objective: 0 });
        subjectStats.get(k).initial.push(initial[k]);
        subjectStats.get(k).latest.push(latest[k]);
      }
    }
    for (const d of scored) {
      for (const k of Object.keys(d.scores)) {
        if (!subjectStats.has(k)) subjectStats.set(k, { initial: [], latest: [], measures: 0, objective: 0 });
        const st = subjectStats.get(k);
        st.measures += 1;
        if (OBJECTIVE_SOURCES.includes(d.evidence?.[k]?.source)) st.objective += 1;
      }
    }
    // Écart entre évaluateurs : deux évaluations rapprochées (≤ 14 j) par des personnes différentes
    for (let i = 1; i < scored.length; i += 1) {
      const a = scored[i - 1], b = scored[i];
      if (a.evaluator_id && b.evaluator_id && a.evaluator_id !== b.evaluator_id && daysBetween(a.at, b.at) <= 14) {
        const common = Object.keys(a.scores).filter((k) => k in b.scores);
        if (common.length) evaluatorGaps.push(mean(common.map((k) => Math.abs(b.scores[k] - a.scores[k]))));
      }
    }

    // Ligne du tableau de suivi
    const last30 = sess.filter((s) => { const k = dayKey(s.session_date); return k && k <= today && daysBetween(s.session_date, nowD) <= 30; });
    const hwDue = hw.filter((h) => dayKey(h.due_date) <= today);
    rows.push({
      ...ref,
      level: clean(f.level) || null,
      initialAvg: round1(initial ? avgLevel(initial) : null),
      latestAvg: round1(latest ? avgLevel(latest) : null),
      delta: round1(delta),
      evaluations: scored.length,
      lastEvalAt: scored.length ? scored[scored.length - 1].at.toISOString() : lastDiagAt,
      sessions30: { done: last30.filter((s) => s.status === "effectué").length, planned: last30.length },
      homeworkRate: hwDue.length ? pct(hwDue.filter((h) => h.status !== "à faire").length, hwDue.length) : null,
      homeworkCount: hwDue.length,
      feedback: { avg: round1(mean(fb.map((x) => Number(x.rating)))), n: fb.length },
      alerts: mine.map((k) => ALERTS.find((a) => a.key === k).short),
      step,
      stepLabel: STEP_LABEL[step],
    });
  }

  // Agenda du conseiller
  for (const e of agenda) {
    if (AGENDA_DONE.includes(e.status)) continue;
    const k = dayKey(e.date);
    if (k && k < today) alerts.agenda.push({ familyId: null, studentId: e.studentId || null, name: e.title, detail: `${e.kind === "rdv" ? "Rendez-vous à clôturer" : "En retard"} depuis le ${k.split("-").reverse().join("/")}` });
  }

  // Indicateurs de la période et de la période précédente (même durée)
  const total = families.length;
  const before = families.filter((f) => { const k = dayKey(f.createdAt); return !k || k < fromK; }).length;
  const attendance = (a, b) => {
    const end = b < today ? b : today;
    const l = sessions.filter((s) => inRange(dayKey(s.session_date), a, end));
    return { rate: pct(l.filter((s) => s.status === "effectué").length, l.length), n: l.length };
  };
  const homeworkRate = (a, b) => {
    const end = b < today ? b : today;
    const l = homework.filter((h) => inRange(dayKey(h.due_date), a, end));
    return { rate: pct(l.filter((h) => h.status !== "à faire").length, l.length), n: l.length };
  };
  const satisfaction = (a, b) => {
    const l = feedback.filter((x) => inRange(dayKey(x.created_at), a, b));
    return { avg: round1(mean(l.map((x) => Number(x.rating)))), n: l.length };
  };
  const diffOrNull = (x, y) => (x === null || y === null ? null : round1(x - y));
  const att = attendance(fromK, toK), attPrev = attendance(prevFromK, prevToK);
  const hwk = homeworkRate(fromK, toK), hwkPrev = homeworkRate(prevFromK, prevToK);
  const sat = satisfaction(fromK, toK), satPrev = satisfaction(prevFromK, prevToK);
  const corrections = homework
    .filter((h) => h.corrected_at && inRange(dayKey(h.corrected_at), fromK, toK))
    .map((h) => daysBetween(h.submitted_at || h.due_date, h.corrected_at))
    .filter((d) => d !== null && d >= 0);
  const progressAvg = round1(mean(progressNow));

  const count = (k) => families.filter((f) => (k === "diag" ? f.bilan?.diagnostic : k === "plan" ? f.bilan?.plan : clean(f.teacher || f.teacherName) || (f.studentId && tutorAt.has(f.studentId)))).length;

  return {
    period: { from: fromK, to: toK, previousFrom: prevFromK, previousTo: prevToK },
    alerts: ALERTS.map((a) => ({ ...a, items: alerts[a.key], count: alerts[a.key].length })),
    kpis: {
      students: { total, variation: before ? Math.round(((total - before) / before) * 100) : null, withDiagnostic: count("diag"), withPlan: count("plan"), withTutor: count("tutor") },
      progression: { avg: progressAvg, n: progressNow.length, variation: diffOrNull(progressAvg, round1(mean(progressStart))) },
      attendance: { rate: att.rate, n: att.n, variation: diffOrNull(att.rate, attPrev.rate) },
      homework: { rate: hwk.rate, n: hwk.n, variation: diffOrNull(hwk.rate, hwkPrev.rate), correctionDays: round1(mean(corrections)), correctionN: corrections.length },
      satisfaction: { avg: sat.avg, n: sat.n, variation: diffOrNull(sat.avg, satPrev.avg) },
    },
    funnel: STEPS.map((s) => ({ ...s, count: funnel[s.key], medianDays: s.key === "demande" ? null : round1(median(delays[s.key])), n: s.key === "demande" ? null : delays[s.key].length })),
    subjects: [...subjectStats.entries()]
      .filter(([, v]) => v.initial.length)
      .map(([subject, v]) => ({
        subject, n: v.initial.length,
        initial: round1(mean(v.initial)), latest: round1(mean(v.latest)), delta: round1(mean(v.latest) - mean(v.initial)),
        reliability: pct(v.objective, v.measures), measures: v.measures,
      }))
      .sort((a, b) => b.n - a.n || a.subject.localeCompare(b.subject, "fr")),
    evaluatedStudents: progressNow.length,
    evaluatorGap: { avg: round1(mean(evaluatorGaps)), n: evaluatorGaps.length },
    students: rows,
  };
};
