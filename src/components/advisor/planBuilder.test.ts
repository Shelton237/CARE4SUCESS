import { describe, it, expect } from "vitest";
import {
    nextMonday, weekLabel, planEndLabel, planSubjects, buildPlanFromDiagnostic, subjectCoverage, missingPlanItems,
} from "./planBuilder";

describe("planBuilder", () => {
    it("nextMonday : lundi suivant, ou le jour même si c'est un lundi", () => {
        expect(nextMonday(new Date(2026, 9, 9))).toBe("2026-10-12");  // vendredi
        expect(nextMonday(new Date(2026, 9, 12))).toBe("2026-10-12"); // lundi
    });

    it("weekLabel : semaine dans un même mois ou à cheval sur deux mois", () => {
        expect(weekLabel("2026-10-12", 0)).toBe("12-18 oct.");
        expect(weekLabel("2026-10-12", 3)).toBe("2-8 nov.");
        expect(weekLabel("2026-10-26", 0)).toBe("26 oct.-1 nov.");
        expect(weekLabel("", 0)).toBe("");
    });

    it("planEndLabel : dernier jour du plan", () => {
        expect(planEndLabel("2026-10-12", 6)).toBe("22/11/2026");
    });

    it("planSubjects : matières du diagnostic les plus faibles d'abord, puis celles de l'inscription", () => {
        expect(planSubjects({ Français: 5, Anglais: 1, Maths: 3 }, ["Anglais", "SVT"])).toEqual(["Anglais", "Maths", "Français", "SVT"]);
    });

    it("buildPlanFromDiagnostic : priorités doublées, consolidation, bilan final", () => {
        const plan = buildPlanFromDiagnostic({ Anglais: 1, Physique: 3, Mathématiques: 3, Français: 5 }, "Jean Nore", 6);
        expect(plan.title).toBe("Plan d'accompagnement de Jean Nore");
        expect(plan.weeks).toHaveLength(6);
        expect(plan.weeks.map(w => w.subjects)).toEqual([
            ["Anglais"], ["Anglais"], ["Physique"], ["Mathématiques"], ["Anglais"],
            ["Anglais", "Physique", "Mathématiques"],
        ]);
        expect(plan.weeks[0].objective).toBe("Reprendre les bases en Anglais");
        expect(plan.weeks[2].objective).toBe("Consolider les acquis en Physique");
        expect(plan.weeks[5].objective).toMatch(/^Bilan de fin de plan/);
    });

    it("buildPlanFromDiagnostic : sans faiblesse, approfondissement des matières évaluées", () => {
        const plan = buildPlanFromDiagnostic({ Français: 5, SVT: 4 }, "", 4);
        expect(plan.title).toBe("Plan d'accompagnement");
        expect(plan.weeks[0]).toMatchObject({ objective: "Approfondir Français", subjects: ["Français"] });
    });

    it("subjectCoverage et missingPlanItems", () => {
        const weeks = [
            { objective: "A", subjects: ["Anglais"], done: false },
            { objective: "", subjects: [], done: false },
        ];
        expect(subjectCoverage(weeks)).toEqual({ Anglais: 1 });
        expect(missingPlanItems("", "2026-10-12", weeks)).toEqual(["titre", "objectif S2", "matière S2"]);
    });
});
