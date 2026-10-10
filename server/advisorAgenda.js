// Agenda du conseiller : rendez-vous, tâches et échéances (table advisor_appointments).
// Validation des saisies et mise en forme des lignes, sans accès base.

export const AGENDA_KINDS = ["rdv", "tache", "echeance"];
export const AGENDA_STATUSES = ["planifié", "confirmé", "à faire", "en cours", "réalisé", "terminé", "annulé"];
export const AGENDA_PRIORITIES = ["haute", "normale", "basse"];
export const DONE_STATUSES = ["réalisé", "terminé", "annulé"];

const KIND_LABEL = { rdv: "Rendez-vous", tache: "Tâche", echeance: "Échéance" };
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const text = (v, max) => {
  const s = typeof v === "string" ? v.trim() : "";
  return s ? s.slice(0, max) : null;
};

export const defaultStatus = (kind) => (kind === "rdv" ? "planifié" : "à faire");

// partial = true pour une mise à jour : seuls les champs présents sont validés et renvoyés.
export const sanitizeAgendaPayload = (body = {}, { partial = false } = {}) => {
  const out = {};
  const has = (k) => Object.prototype.hasOwnProperty.call(body, k);

  if (!partial || has("kind")) {
    const kind = body.kind ?? "rdv";
    if (!AGENDA_KINDS.includes(kind)) return { error: "Type d'événement invalide." };
    out.kind = kind;
  }
  if (!partial || has("title") || has("type")) {
    const title = text(body.title, 191) || text(body.type, 191);
    if (!title) return { error: "Le titre est obligatoire." };
    out.title = title;
  }
  if (!partial || has("date")) {
    if (!DATE_RE.test(String(body.date ?? ""))) return { error: "Date invalide (AAAA-MM-JJ)." };
    out.date = body.date;
  }
  for (const k of ["time", "endTime"]) {
    if (!partial || has(k)) {
      const v = body[k];
      if (v === null || v === undefined || v === "") out[k] = null;
      else if (TIME_RE.test(String(v))) out[k] = String(v);
      else return { error: "Heure invalide (HH:MM)." };
    }
  }
  if (out.time && out.endTime && out.endTime <= out.time) return { error: "L'heure de fin doit suivre l'heure de début." };
  if (!partial || has("priority")) {
    const p = body.priority || "normale";
    if (!AGENDA_PRIORITIES.includes(p)) return { error: "Priorité invalide." };
    out.priority = p;
  }
  if (has("status") && body.status !== undefined) {
    if (!AGENDA_STATUSES.includes(body.status)) return { error: "Statut invalide." };
    out.status = body.status;
  } else if (!partial) {
    out.status = defaultStatus(out.kind);
  }
  const texts = { location: 191, studentId: 36, studentName: 191, parentName: 191, teacherName: 191, notes: 2000 };
  for (const [k, max] of Object.entries(texts)) {
    if (!partial || has(k)) out[k] = text(body[k], max);
  }
  return { values: out };
};

const COLUMNS = {
  kind: "kind", title: "title", date: "appointment_date", time: "appointment_time", endTime: "end_time",
  priority: "priority", status: "status", location: "location", studentId: "student_id",
  studentName: "student_name", parentName: "parent_name", teacherName: "teacher_name", notes: "notes",
};

// Valeurs validées -> paires colonne/valeur pour INSERT ou UPDATE
export const toColumns = (values) =>
  Object.entries(values).filter(([k]) => COLUMNS[k]).map(([k, v]) => [COLUMNS[k], v]);

// contact_name (ancienne colonne obligatoire) : la personne concernée la plus précise
export const contactName = (v) => v.studentName || v.parentName || v.teacherName || v.title || "";

export const mapAgendaRow = (r) => {
  const kind = AGENDA_KINDS.includes(r.kind) ? r.kind : "rdv";
  return {
    id: r.id,
    kind,
    title: r.title || r.appointment_type || KIND_LABEL[kind],
    date: r.date,
    time: r.time || null,
    endTime: r.end_time || null,
    priority: r.priority || "normale",
    status: r.status || defaultStatus(kind),
    location: r.location || null,
    studentId: r.student_id || null,
    studentName: r.student_name || null,
    parentName: r.parent_name || null,
    teacherName: r.teacher_name || null,
    notes: r.notes || null,
    // Compatibilité avec l'ancien affichage
    family: r.contact_name || r.student_name || null,
    type: r.appointment_type || KIND_LABEL[kind],
  };
};
