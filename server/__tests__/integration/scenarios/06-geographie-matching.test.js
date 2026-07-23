// Scénario 06 — Géographie → matching
// Réf. cartographie : Admin > Géographie & Zones ; Admin/Conseiller > Matching
//
// Une suggestion de zone (quartier) validée par l'admin devient disponible
// dans les listes déroulantes ET impacte le score de proximité + l'indicateur
// « Zone ✓ » dans un matching ultérieur.
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import crypto from "crypto";
import {
  pool, get, post, patch, tokenFor, seedUser, seedTeacherProfile, cleanupTestData, closePool,
} from "../helpers/harness.js";

const PARENT_ARR_ID = 121; // Douala 1er (arrondissement actif pré-seedé)
const admin = { id: "it-06-admin", name: "[IT] Admin06", email: "admin06@it.test", role: "admin" };
const advisor = { id: "it-06-advisor", name: "[IT] Advisor06", email: "advisor06@it.test", role: "advisor" };
const teacherZone = { id: "it-06-teacherZ", name: "[IT] Prof Zone06", email: "profz06@it.test", role: "teacher" };
const teacherFar = { id: "it-06-teacherF", name: "[IT] Prof Loin06", email: "proff06@it.test", role: "teacher" };

let adminToken, advisorToken, newZoneId, assignmentId;

describe("Scénario 06 — Géographie → matching", () => {
  beforeAll(async () => {
    await cleanupTestData();
    await seedUser(admin); await seedUser(advisor);
    adminToken = tokenFor(admin); advisorToken = tokenFor(advisor);
  });

  afterAll(async () => {
    await pool.query("DELETE FROM assignments WHERE id = ?", [assignmentId]).catch(() => {});
    await cleanupTestData();
    await closePool();
  });

  it("étape 1 (actor-admin) : la suggestion de zone en attente apparaît dans la liste", async () => {
    const sug = await post("/geo/suggest", {
      name: "[IT] Quartier Test", type: "quartier", parent_id: PARENT_ARR_ID, suggested_by: admin.id,
    });
    expect(sug.status === 200 || sug.status === 201, `suggest: ${JSON.stringify(sug.data)}`).toBe(true);
    newZoneId = sug.data.id;
    expect(sug.data.status).toBe("pending");

    const pending = await get("/geo/pending", { token: adminToken });
    expect(pending.status).toBe(200);
    expect(pending.data.find((z) => z.id === newZoneId), "suggestion absente de la liste en attente").toBeTruthy();

    // Preuve : avant validation, la zone n'est PAS dans les listes déroulantes actives
    const activeBefore = await get(`/geo?type=quartier&parent_id=${PARENT_ARR_ID}`);
    expect(activeBefore.data.find((z) => z.id === newZoneId), "zone pending ne doit pas être proposée").toBeFalsy();
  });

  it("étape 2 (actor-admin) : validateGeoLocation → zone active et disponible dans les listes", async () => {
    const { status, data } = await patch(`/geo/${newZoneId}`, { action: "validate", validated_by: admin.id }, { token: adminToken });
    expect(status, `validate: ${JSON.stringify(data)}`).toBe(200);
    expect(data.success).toBe(true);
    expect(data.location.status).toBe("active");

    const activeAfter = await get(`/geo?type=quartier&parent_id=${PARENT_ARR_ID}`);
    expect(activeAfter.data.find((z) => z.id === newZoneId), "zone validée absente des listes déroulantes").toBeTruthy();
  });

  it("étape 3 (actor-admin/advisor) : matching → enseignant de la zone avec « Zone ✓ » et tri par proximité", async () => {
    // Enseignant DANS la nouvelle zone validée + enseignant SANS zone, mêmes matière/niveau
    await seedUser(teacherZone); await seedUser(teacherFar);
    await seedTeacherProfile({ id: teacherZone.id, name: teacherZone.name, email: teacherZone.email,
      subjects: ["Mathématiques"], level: "Lycée", city: "Douala", geoLocationId: newZoneId, rating: 4 });
    await seedTeacherProfile({ id: teacherFar.id, name: teacherFar.name, email: teacherFar.email,
      subjects: ["Mathématiques"], level: "Lycée", city: "Yaoundé", geoLocationId: null, rating: 5 });

    // Assignation localisée sur la nouvelle zone
    assignmentId = crypto.randomUUID();
    await pool.query(
      `INSERT INTO assignments (id, child_name, level, subject, needs, schedule, location, geo_location_id, candidates, status)
       VALUES (?, '[IT] Eleve Geo06', 'Lycée', 'Mathématiques', ?, 'Samedi 10h', 'Douala', ?, ?, 'pending')`,
      [assignmentId, JSON.stringify(["Géométrie"]), newZoneId, JSON.stringify([])]
    );

    // Matching via les deux surfaces (composant partagé) — on lit /assignments
    const { status, data } = await get("/assignments", { token: advisorToken });
    expect(status).toBe(200);
    const assign = data.find((a) => a.id === assignmentId);
    expect(assign, "assignation introuvable").toBeTruthy();

    const candZone = assign.candidates.find((c) => (c.name || "").trim() === teacherZone.name);
    const candFar = assign.candidates.find((c) => (c.name || "").trim() === teacherFar.name);
    expect(candZone, "enseignant de la zone absent des candidats").toBeTruthy();
    expect(candFar, "enseignant hors zone absent des candidats").toBeTruthy();

    // Indicateur « Zone ✓ » = locationMatch (locScore > 0)
    expect(candZone.locationMatch, "indicateur « Zone ✓ » absent malgré correspondance géographique").toBe(true);
    expect(candFar.locationMatch).toBe(false);

    // Score de proximité : l'enseignant de la zone score plus haut malgré une
    // note inférieure (4 < 5) → tri par proximité en tête
    expect(candZone.score, "score de proximité non prépondérant").toBeGreaterThan(candFar.score);
    const idxZone = assign.candidates.findIndex((c) => (c.name || "").trim() === teacherZone.name);
    const idxFar = assign.candidates.findIndex((c) => (c.name || "").trim() === teacherFar.name);
    expect(idxZone, "tri par proximité non appliqué (zone pas en tête)").toBeLessThan(idxFar);
  });
});
