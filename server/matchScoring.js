// Score de correspondance élève / tuteur sur 100, avec le détail de chaque critère.
// Les matières à renforcer suivent la grille du diagnostic : 1-2 prioritaires, 3 à consolider.

const norm = (v) =>
  String(v ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

const ALIASES = { maths: "mathematiques", math: "mathematiques", hg: "histoire", "histoire-geo": "histoire" };

const subjectKey = (v) => {
  const n = norm(v);
  if (ALIASES[n]) return ALIASES[n];
  const first = n.split(/[^a-z]+/).find((t) => t.length >= 3) || n;
  return ALIASES[first] || first;
};

export const sameSubject = (a, b) => {
  if (!a || !b) return false;
  const na = norm(a);
  const nb = norm(b);
  return na === nb || na.includes(nb) || nb.includes(na) || subjectKey(a) === subjectKey(b);
};

const toLevel = (v) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(5, Math.max(0, n)) : 0;
};

export const subjectsToReinforce = (scores) => {
  const entries = Object.entries(scores || {}).map(([s, v]) => ({ s, v: toLevel(v) })).filter((e) => e.v > 0);
  return {
    priority: entries.filter((e) => e.v <= 2).sort((a, b) => a.v - b.v).map((e) => e.s),
    consolidate: entries.filter((e) => e.v === 3).map((e) => e.s),
  };
};

const GEO_LABELS = ["", "Même pays", "Même région", "Même département", "Même arrondissement", "Même localité"];

// Proximité 0-5 via la hiérarchie geo_locations (même logique que /api/assignments).
export const geoProximity = (studentGeoId, teacherGeoIds, geoMap) => {
  if (!studentGeoId || !geoMap.has(studentGeoId)) return 0;
  const s = geoMap.get(studentGeoId);
  const pick = (g, key, type) => g[key] || (g.type === type ? g.id : null);
  const one = (id) => {
    if (!id || !geoMap.has(id)) return 0;
    const t = geoMap.get(id);
    if (t.id === s.id) return 5;
    for (const [lvl, key, type] of [[4, "arrondissement_id", "arrondissement"], [3, "department_id", "department"], [2, "region_id", "region"], [1, "country_id", "country"]]) {
      const a = pick(t, key, type);
      const b = pick(s, key, type);
      if (a && b && a === b) return lvl;
    }
    return 0;
  };
  return Math.max(0, ...teacherGeoIds.map(one));
};

const SUSPICIOUS_RATE = 500;

/**
 * @param student { level, subject, city, geoId }
 * @param reinforce { priority: string[], consolidate: string[] }
 * @param teacher { subjects: string[], levels: string[], city, geoProximity (0-5), hasAvailability, reviewCount, reviewAvg, sessionCount, rate }
 */
export const scoreTutor = (student, reinforce, teacher) => {
  const reasons = [];
  const covers = (list) => list.filter((s) => teacher.subjects.some((t) => sameSubject(s, t)));
  let score = 0;

  // Matières (60 pts) : priorités 40, consolidation 20. Sans diagnostic, la matière de la demande vaut 60.
  const target = [...reinforce.priority, ...reinforce.consolidate];
  if (target.length) {
    const pW = reinforce.priority.length ? (reinforce.consolidate.length ? 40 : 60) : 0;
    const cW = 60 - pW;
    const pCov = covers(reinforce.priority);
    const cCov = covers(reinforce.consolidate);
    if (reinforce.priority.length) {
      score += pW * (pCov.length / reinforce.priority.length);
      reasons.push({ key: "priority", ok: pCov.length === reinforce.priority.length, partial: pCov.length > 0,
        label: pCov.length ? `Prioritaires couvertes : ${pCov.join(", ")}` : `Ne couvre aucune matière prioritaire (${reinforce.priority.join(", ")})` });
    }
    if (reinforce.consolidate.length) {
      score += cW * (cCov.length / reinforce.consolidate.length);
      reasons.push({ key: "consolidate", ok: cCov.length === reinforce.consolidate.length, partial: cCov.length > 0,
        label: cCov.length ? `À consolider : ${cCov.join(", ")}` : "Ne couvre pas les matières à consolider" });
    }
  } else if (student.subject) {
    const ok = teacher.subjects.some((t) => sameSubject(student.subject, t));
    if (ok) score += 60;
    reasons.push({ key: "subject", ok, label: ok ? `Enseigne ${student.subject}` : `N'enseigne pas ${student.subject}` });
  } else {
    reasons.push({ key: "subject", ok: false, label: "Aucun diagnostic ni matière demandée" });
  }

  // Niveau (15 pts)
  if (student.level) {
    const ok = teacher.levels.some((l) => {
      const n = norm(l);
      // "Tous niveaux" couvre n'importe quel niveau
      return n && (n.startsWith("tous") || n.includes(norm(student.level)) || norm(student.level).includes(n));
    });
    if (ok) score += 15;
    reasons.push({ key: "level", ok, label: ok ? `Niveau ${student.level}` : `Niveau ${student.level} non déclaré` });
  }

  // Proximité (15 pts)
  let geo = teacher.geoProximity || 0;
  let geoLabel = geo ? GEO_LABELS[geo] : "";
  const sc = norm(student.city);
  const near = (place) => { const n = norm(place); return !!n && !!sc && (sc.includes(n) || n.includes(sc)); };
  if (geo < 4 && (teacher.zones || []).some(near)) { geo = 4; geoLabel = "Dans sa zone d'intervention"; }
  else if (geo < 3 && near(teacher.city)) { geo = 3; geoLabel = "Même ville"; }
  if (student.geoId || student.city) {
    score += 15 * (geo / 5);
    reasons.push({ key: "geo", ok: geo >= 3, partial: geo > 0, label: geo ? geoLabel : "Zone éloignée ou non renseignée" });
  } else {
    reasons.push({ key: "geo", ok: false, label: "Localisation de l'élève inconnue" });
  }

  // Disponibilités (5 pts)
  if (teacher.hasAvailability) score += 5;
  reasons.push({ key: "availability", ok: !!teacher.hasAvailability, label: teacher.hasAvailability ? "Disponibilités renseignées" : "Pas de disponibilités" });

  // Avis et expérience (5 pts) : seulement des avis réels, jamais une note par défaut.
  if (teacher.reviewCount > 0) {
    score += 5 * (teacher.reviewAvg / 5);
    reasons.push({ key: "reviews", ok: teacher.reviewAvg >= 4, label: `${teacher.reviewAvg.toFixed(1)}/5 sur ${teacher.reviewCount} avis` });
  } else if (teacher.sessionCount > 10) {
    score += 3;
    reasons.push({ key: "reviews", ok: true, label: `${teacher.sessionCount} séances données` });
  } else {
    reasons.push({ key: "reviews", ok: false, label: "Pas encore d'avis" });
  }

  return {
    score: Math.round(score),
    reasons,
    rateToCheck: !(Number(teacher.rate) >= SUSPICIOUS_RATE),
  };
};
