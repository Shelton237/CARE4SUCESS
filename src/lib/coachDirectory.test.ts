import { describe, expect, it } from "vitest";
import type { PublicTeacher } from "@/api/public";
import { blankDirectoryFilters, coachCategoryMatches, coachTopics, filterDirectoryCoaches, hourlyCoachRate } from "./coachDirectory";

const teacher = (changes: Partial<PublicTeacher> = {}): PublicTeacher => ({ id: "coach", name: "Coach Français", subjects: ["Français"], level: "Débutant", city: "Douala", country: "Cameroun", formats: ["En ligne"], specialties: [], languages: [{ name: "Italien", level: "B1" }], rate: 7500, rateType: "hourly", rateUnitMinutes: 60, currency: "XAF", ...changes } as PublicTeacher);

describe("coach directory filters", () => {
  it("uses taught subjects rather than languages spoken", () => {
    expect(coachTopics(teacher())).toEqual(["Français"]);
    expect(filterDirectoryCoaches([teacher()], "langues", "", "", { ...blankDirectoryFilters(), subjects: ["Italien"] })).toEqual([]);
  });
  it("recognizes language and professional categories, including a general vertical", () => {
    expect(coachCategoryMatches(teacher({ subjects: ["Mathématiques"] }), "langues")).toBe(false);
    expect(coachCategoryMatches(teacher({ subjects: ["Développement web"] }), "competences")).toBe(true);
    expect(coachCategoryMatches(teacher({ subjects: ["Langues et compétences"] }), "competences")).toBe(true);
  });
  it("combines accent-insensitive search, location, subject and level", () => {
    const fixtures = [teacher(), teacher({ id: "other", city: "Yaoundé", level: "Avancé" })];
    expect(filterDirectoryCoaches(fixtures, "langues", "francais", "Douala, Cameroun", { ...blankDirectoryFilters(), subjects: ["Français"], levels: ["Débutant"] }).map(t => t.id)).toEqual(["coach"]);
  });
  it("treats hybrid as both formats and retains union semantics for selected formats", () => {
    const fixtures = [teacher(), teacher({ id: "hybrid", formats: ["Hybride"] }), teacher({ id: "onsite", formats: ["Présentiel"] })];
    expect(filterDirectoryCoaches(fixtures, "langues", "", "", { ...blankDirectoryFilters(), formats: ["both"] }).map(t => t.id)).toEqual(["hybrid"]);
    expect(filterDirectoryCoaches(fixtures, "langues", "", "", { ...blankDirectoryFilters(), formats: ["online", "onsite"] })).toHaveLength(3);
  });
  it("compares hourly rates in one currency and excludes monthly prices from an hourly range", () => {
    const halfHour = teacher({ rateUnitMinutes: 30 });
    expect(hourlyCoachRate(halfHour)).toBe(15000);
    const fixtures = [halfHour, teacher({ id: "cheap" }), teacher({ id: "monthly", rateType: "monthly" }), teacher({ id: "ariary", currency: "MGA" })];
    expect(filterDirectoryCoaches(fixtures, "langues", "", "", { ...blankDirectoryFilters(), max: 10000 }).map(t => t.id)).toEqual(["cheap"]);
    expect(filterDirectoryCoaches(fixtures, "langues", "", "", blankDirectoryFilters())).toHaveLength(4);
  });
});
