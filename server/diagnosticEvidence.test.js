import { describe, it, expect } from "vitest";
import { sanitizeEvidence } from "./diagnosticEvidence.js";

describe("sanitizeEvidence", () => {
  it("garde les sources connues et les notes scolaires entre 0 et 20", () => {
    expect(sanitizeEvidence({
      "Mathématiques": { source: "test", grade: "12.5" },
      "Anglais": { source: "bulletin", grade: 9 },
    })).toEqual({
      "Mathématiques": { source: "test", grade: 12.5 },
      "Anglais": { source: "bulletin", grade: 9 },
    });
  });

  it("écarte les sources inconnues, les notes hors bornes et les entrées vides", () => {
    expect(sanitizeEvidence({
      "Mathématiques": { source: "rumeur", grade: 25 },
      "SVT": { source: "entretien", grade: "" },
      "Français": null,
    })).toEqual({ "SVT": { source: "entretien" } });
  });

  it("renvoie null pour une valeur absente ou mal formée", () => {
    expect(sanitizeEvidence(undefined)).toBeNull();
    expect(sanitizeEvidence([])).toBeNull();
    expect(sanitizeEvidence({ "Maths": {} })).toBeNull();
  });
});
