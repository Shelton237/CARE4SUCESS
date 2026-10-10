import { describe, it, expect } from "vitest";
import { cleanAvailability, readTutorProfile, profileCompleteness, buildProfileUpdate } from "./tutorProfile.js";

describe("tutorProfile", () => {
  it("cleanAvailability : jours et créneaux connus uniquement", () => {
    expect(cleanAvailability({ lun: ["matin", "nuit"], xyz: ["matin"], mar: [] })).toEqual({ lun: ["matin"] });
    expect(cleanAvailability(["lun"])).toBeUndefined();
  });

  it("readTutorProfile : niveaux hérités de level, ville du compte en repli", () => {
    const p = readTutorProfile({ subjects: '["Anglais"]', levels: null, level: "Tous niveaux", city: "", zones: null, availability_json: null, hourly_rate: "7500.00", currency: "XOF" }, "Douala");
    expect(p).toMatchObject({ subjects: ["Anglais"], levels: ["Tous niveaux"], city: "Douala", rate: 7500, currency: "XOF" });
  });

  it("profileCompleteness : pourcentage et éléments manquants", () => {
    const p = readTutorProfile({ subjects: '["Anglais"]', level: "Terminale", city: "", hourly_rate: 1 });
    expect(profileCompleteness(p)).toEqual({ percent: 40, missing: ["ville", "disponibilités", "tarif"] });
  });

  it("buildProfileUpdate : le tuteur ne peut pas modifier son tarif", () => {
    const self = buildProfileUpdate({ subjects: ["Anglais", "Anglais"], rate: 9000, currency: "XAF" });
    expect(self.sets).toEqual(["subjects = ?"]);
    expect(self.params).toEqual(['["Anglais"]']);
    const advisor = buildProfileUpdate({ rate: "8000", currency: "XAF", levels: ["Terminale", "1ère"] }, { allowRate: true });
    expect(advisor.sets).toEqual(["levels = ?", "level = ?", "hourly_rate = ?", "currency = ?"]);
    expect(advisor.params).toEqual(['["Terminale","1ère"]', "Terminale, 1ère", 8000, "XAF"]);
  });

  it("buildProfileUpdate : tarif ou devise invalides refusés", () => {
    expect(buildProfileUpdate({ rate: -5 }, { allowRate: true }).error).toBe("Tarif invalide.");
    expect(buildProfileUpdate({ currency: "fcfa" }, { allowRate: true }).error).toBe("Devise invalide.");
  });
});
