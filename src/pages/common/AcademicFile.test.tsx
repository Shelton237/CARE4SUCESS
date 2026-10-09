import { describe, it, expect } from "vitest";
import { getDiagnosticScoreView } from "./AcademicFile";

describe("getDiagnosticScoreView (diagnostic sur 5)", () => {
    it("5 -> 5/5, barre 100 %, couleur bon", () => {
        const v = getDiagnosticScoreView(5);
        expect(v.label).toBe("5/5");
        expect(v.percent).toBe(100);
        expect(v.level).toBe("good");
        expect(v.barClass).toBe("bg-emerald-500");
    });

    it("1 -> alerte, barre 20 %", () => {
        const v = getDiagnosticScoreView(1);
        expect(v.label).toBe("1/5");
        expect(v.percent).toBe(20);
        expect(v.level).toBe("alert");
    });

    it("3 -> moyen, 4 -> bon, 2 -> alerte", () => {
        expect(getDiagnosticScoreView(3).level).toBe("medium");
        expect(getDiagnosticScoreView(4).level).toBe("good");
        expect(getDiagnosticScoreView(2).level).toBe("alert");
    });

    it("7 (ancienne échelle) est borné à 5/5 et 100 %", () => {
        const v = getDiagnosticScoreView(7);
        expect(v.label).toBe("5/5");
        expect(v.percent).toBe(100);
    });

    it("valeurs invalides ou négatives bornées à 0", () => {
        expect(getDiagnosticScoreView(undefined).percent).toBe(0);
        expect(getDiagnosticScoreView(-2).label).toBe("0/5");
    });
});
