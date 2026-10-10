// Annuaire de messagerie du conseiller : enseignants/tuteurs, parents, élèves et équipe,
// avec le contexte utile à l'en-tête de conversation (matières, élèves suivis, enfants).
// Tous les liens passent par identifiants (student_teacher, users.parent_id, parent_child).
import { parseJson } from "./parseJson.js";

export const contactCategory = (u) => {
  const roles = [u.role, u.secondary_role];
  if (roles.includes("teacher") || roles.includes("tutor")) return "teacher";
  if (roles.includes("parent")) return "parent";
  if (u.role === "student") return "student";
  if (u.role === "advisor" || u.role === "admin") return "staff";
  return null;
};

export const buildAdvisorContacts = ({ users = [], teacherRows = [], studentTeacher = [], parentChild = [] }) => {
  const byId = new Map(users.map((u) => [u.id, u]));
  const nameOf = (id) => byId.get(id)?.name || null;
  const subjects = new Map(teacherRows.map((t) => [t.id, parseJson(t.subjects, []).map(String)]));

  const studentsOfTeacher = new Map();
  const teachersOfStudent = new Map();
  for (const l of studentTeacher) {
    if (!studentsOfTeacher.has(l.teacher_id)) studentsOfTeacher.set(l.teacher_id, new Set());
    studentsOfTeacher.get(l.teacher_id).add(l.student_id);
    if (!teachersOfStudent.has(l.student_id)) teachersOfStudent.set(l.student_id, new Set());
    teachersOfStudent.get(l.student_id).add(l.teacher_id);
  }
  const childrenOf = new Map();
  const parentOf = new Map();
  const link = (parentId, childId) => {
    if (!parentId || !childId) return;
    if (!childrenOf.has(parentId)) childrenOf.set(parentId, new Set());
    childrenOf.get(parentId).add(childId);
    if (!parentOf.has(childId)) parentOf.set(childId, parentId);
  };
  for (const u of users) if (u.role === "student") link(u.parent_id, u.id);
  for (const l of parentChild) link(l.parent_id, l.child_id);

  const names = (set) => [...(set || [])].map(nameOf).filter(Boolean);
  return users
    .map((u) => {
      const category = contactCategory(u);
      if (!category) return null;
      return {
        id: u.id,
        name: u.name,
        role: category === "staff" ? u.role : category,
        category,
        email: u.email || null,
        phone: u.phone && String(u.phone).replace(/\D/g, "").length > 6 ? u.phone : null,
        avatarUrl: u.avatar_url || null,
        subjects: category === "teacher" ? subjects.get(u.id) || [] : [],
        students: category === "teacher" ? names(studentsOfTeacher.get(u.id)) : [],
        children: category === "parent" ? names(childrenOf.get(u.id)) : [],
        parentName: category === "student" ? nameOf(parentOf.get(u.id)) : null,
        teachers: category === "student" ? names(teachersOfStudent.get(u.id)) : [],
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name, "fr"));
};
