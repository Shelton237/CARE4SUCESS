import { describe, it, expect } from "vitest";
import { buildAdvisorContacts, contactCategory } from "./advisorContacts.js";

describe("advisorContacts", () => {
  it("catégories, y compris le double rôle tuteur/enseignant", () => {
    expect(contactCategory({ role: "tutor" })).toBe("teacher");
    expect(contactCategory({ role: "student", secondary_role: "teacher" })).toBe("teacher");
    expect(contactCategory({ role: "admin" })).toBe("staff");
    expect(contactCategory({ role: "unknown" })).toBe(null);
  });

  it("contexte par identifiant : matières, élèves suivis, enfants, parent", () => {
    const list = buildAdvisorContacts({
      users: [
        { id: "t1", name: "Jean Marie", role: "teacher", phone: "+237 6 99 00 11 22" },
        { id: "p1", name: "Claire Koffi", role: "parent", phone: "+237" },
        { id: "s1", name: "Saturin Penlap", role: "student", parent_id: "p1" },
        { id: "s2", name: "Tina", role: "student" },
        { id: "p2", name: "Roland", role: "parent" },
      ],
      teacherRows: [{ id: "t1", subjects: '["Mathématiques"]' }],
      studentTeacher: [{ teacher_id: "t1", student_id: "s1" }],
      parentChild: [{ parent_id: "p2", child_id: "s2" }],
    });
    const by = Object.fromEntries(list.map((c) => [c.id, c]));
    expect(by.t1).toMatchObject({ category: "teacher", subjects: ["Mathématiques"], students: ["Saturin Penlap"], phone: "+237 6 99 00 11 22" });
    expect(by.p1).toMatchObject({ children: ["Saturin Penlap"], phone: null });
    expect(by.s1).toMatchObject({ parentName: "Claire Koffi", teachers: ["Jean Marie"] });
    expect(by.s2.parentName).toBe("Roland");
    expect(list.map((c) => c.name)).toEqual(["Claire Koffi", "Jean Marie", "Roland", "Saturin Penlap", "Tina"]);
  });
});
