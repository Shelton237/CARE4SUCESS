import { describe, it, expect } from "vitest";
import { sameSubject, subjectsToReinforce, geoProximity, scoreTutor } from "./matchScoring.js";

const teacher = (over = {}) => ({
  subjects: [], levels: [], city: "", geoProximity: 0, hasAvailability: false,
  reviewCount: 0, reviewAvg: 0, sessionCount: 0, rate: 7500, ...over,
});

describe("matchScoring", () => {
  it("sameSubject : accents, alias et variantes", () => {
    expect(sameSubject("Mathématiques", "Maths")).toBe(true);
    expect(sameSubject("Physique", "Physique-Chimie")).toBe(true);
    expect(sameSubject("Histoire-Géo", "Histoire-Géographie")).toBe(true);
    expect(sameSubject("Anglais", "Français")).toBe(false);
  });

  it("subjectsToReinforce : 1-2 prioritaires, 3 à consolider, 4-5 exclues", () => {
    expect(subjectsToReinforce({ Anglais: 1, Physique: 3, Maths: 3, "Histoire-Géo": 4, Français: 5 })).toEqual({
      priority: ["Anglais"], consolidate: ["Physique", "Maths"],
    });
  });

  it("geoProximity : du même lieu (5) au même pays (1)", () => {
    const geo = new Map([
      [1, { id: 1, type: "locality", arrondissement_id: 10, department_id: 20, region_id: 30, country_id: 40 }],
      [2, { id: 2, type: "locality", arrondissement_id: 11, department_id: 20, region_id: 30, country_id: 40 }],
    ]);
    expect(geoProximity(1, [1], geo)).toBe(5);
    expect(geoProximity(1, [2], geo)).toBe(3);
    expect(geoProximity(null, [1], geo)).toBe(0);
  });

  it("scoreTutor : couvrir la priorité pèse plus que la consolidation", () => {
    const reinforce = { priority: ["Anglais"], consolidate: ["Physique"] };
    const s = { level: "Terminale", subject: "Anglais", city: "Douala", geoId: null };
    const a = scoreTutor(s, reinforce, teacher({ subjects: ["Anglais"] }));
    const b = scoreTutor(s, reinforce, teacher({ subjects: ["Physique"] }));
    expect(a.score).toBe(40);
    expect(b.score).toBe(20);
  });

  it("scoreTutor : profil complet = 100, sans note par défaut", () => {
    const res = scoreTutor(
      { level: "Terminale", subject: "Anglais", city: "Douala", geoId: 1 },
      { priority: ["Anglais"], consolidate: [] },
      teacher({ subjects: ["Anglais"], levels: ["Terminale"], geoProximity: 5, hasAvailability: true, reviewCount: 3, reviewAvg: 5 }),
    );
    expect(res.score).toBe(100);
    const none = scoreTutor({ level: "", subject: "", city: "", geoId: null }, { priority: [], consolidate: [] }, teacher());
    expect(none.score).toBe(0);
    expect(none.reasons.find((r) => r.key === "reviews").label).toBe("Pas encore d'avis");
  });

  it("scoreTutor : un tuteur « Tous niveaux » couvre le niveau de l'élève", () => {
    const res = scoreTutor({ level: "10ème (CE1)", subject: "", city: "", geoId: null }, { priority: [], consolidate: [] }, teacher({ levels: ["Tous niveaux"] }));
    expect(res.reasons.find((r) => r.key === "level").ok).toBe(true);
    expect(res.score).toBe(15);
  });

  it("scoreTutor : proximité par ville ou zone d'intervention", () => {
    const s = { level: "", subject: "", city: "Douala, Akwa", geoId: null };
    const r = { priority: [], consolidate: [] };
    expect(scoreTutor(s, r, teacher({ city: "Douala" })).reasons.find((x) => x.key === "geo").label).toBe("Même ville");
    expect(scoreTutor(s, r, teacher({ city: "Yaoundé", zones: ["Akwa"] })).reasons.find((x) => x.key === "geo").label).toBe("Dans sa zone d'intervention");
    expect(scoreTutor(s, r, teacher({ city: "Yaoundé" })).reasons.find((x) => x.key === "geo").ok).toBe(false);
  });

  it("scoreTutor : tarif nul ou à 1 FCFA signalé", () => {
    const s = { level: "", subject: "", city: "", geoId: null };
    expect(scoreTutor(s, { priority: [], consolidate: [] }, teacher({ rate: 1 })).rateToCheck).toBe(true);
    expect(scoreTutor(s, { priority: [], consolidate: [] }, teacher({ rate: 7500 })).rateToCheck).toBe(false);
  });
});
