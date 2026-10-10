import { describe, it, expect } from "vitest";
import { sanitizeAgendaPayload, toColumns, contactName, mapAgendaRow } from "./advisorAgenda.js";

describe("advisorAgenda", () => {
  it("création : valeurs par défaut selon le type", () => {
    const { values } = sanitizeAgendaPayload({ kind: "tache", title: " Envoyer le bilan ", date: "2026-10-12" });
    expect(values).toMatchObject({ kind: "tache", title: "Envoyer le bilan", status: "à faire", priority: "normale", time: null });
    expect(sanitizeAgendaPayload({ title: "RDV", date: "2026-10-12", time: "10:00" }).values.status).toBe("planifié");
  });

  it("compatibilité : l'ancien champ type sert de titre", () => {
    expect(sanitizeAgendaPayload({ type: "Suivi régulier", date: "2026-10-12", time: "09:00" }).values.title).toBe("Suivi régulier");
  });

  it("refuse les saisies invalides", () => {
    expect(sanitizeAgendaPayload({ title: "x", date: "12/10/2026" }).error).toMatch(/Date/);
    expect(sanitizeAgendaPayload({ title: "x", date: "2026-10-12", time: "25:00" }).error).toMatch(/Heure/);
    expect(sanitizeAgendaPayload({ title: "x", date: "2026-10-12", time: "10:00", endTime: "09:00" }).error).toMatch(/fin/);
    expect(sanitizeAgendaPayload({ kind: "fête", title: "x", date: "2026-10-12" }).error).toMatch(/Type/);
    expect(sanitizeAgendaPayload({ date: "2026-10-12" }).error).toMatch(/titre/);
    expect(sanitizeAgendaPayload({ status: "fini" }, { partial: true }).error).toMatch(/Statut/);
  });

  it("mise à jour partielle : seuls les champs envoyés", () => {
    const { values } = sanitizeAgendaPayload({ status: "terminé" }, { partial: true });
    expect(values).toEqual({ status: "terminé" });
    expect(toColumns(values)).toEqual([["status", "terminé"]]);
  });

  it("contact et lecture d'une ancienne ligne", () => {
    expect(contactName({ title: "T", parentName: "P", studentName: "E" })).toBe("E");
    const row = mapAgendaRow({ id: "1", kind: null, title: null, appointment_type: "Bilan initial", contact_name: "Famille Ba", date: "2026-07-25", time: "10:00", status: "planifié" });
    expect(row).toMatchObject({ kind: "rdv", title: "Bilan initial", family: "Famille Ba", priority: "normale" });
  });
});
