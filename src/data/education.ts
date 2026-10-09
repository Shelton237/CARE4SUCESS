export interface SchoolSystem {
  value: string;
  label: string;
  badge?: string;
  description?: string;
}

export interface EducationCycle {
  id: "primaire" | "college" | "lycee" | "superieur";
  label: string;
  levels: string[];
}

export interface SubjectCategory {
  id: string;
  label: string;
  subjects: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Normalisation du pays (accepte code ISO 'CM' ou nom 'Cameroun')
// ─────────────────────────────────────────────────────────────────────────────
export function normalizeCountryCode(country?: string): string {
  if (!country) return "CM";
  const c = country.trim().toUpperCase();
  if (c === "CM" || c.includes("CAMEROUN") || c.includes("CAMEROON")) return "CM";
  if (c === "CI" || c.includes("IVOIRE") || c.includes("IVORY")) return "CI";
  if (c === "MG" || c.includes("MADAGASCAR")) return "MG";
  if (c === "SN" || c.includes("SENEGAL") || c.includes("SÉNÉGAL")) return "SN";
  if (c === "FR" || c.includes("FRANCE")) return "FR";
  if (c === "GA" || c.includes("GABON")) return "GA";
  if (c === "CG" || c === "CD" || c.includes("CONGO")) return "CG";
  if (c === "BJ" || c.includes("BENIN") || c.includes("BÉNIN")) return "BJ";
  if (c === "TG" || c.includes("TOGO")) return "TG";
  if (c === "GN" || c.includes("GUINEE") || c.includes("GUINÉE")) return "GN";
  if (c === "ML" || c.includes("MALI")) return "ML";
  if (c === "BF" || c.includes("BURKINA")) return "BF";
  if (c === "MA" || c.includes("MAROC") || c.includes("MOROCCO")) return "MA";
  if (c === "TN" || c.includes("TUNISIE") || c.includes("TUNISIA")) return "TN";
  if (c === "TD" || c.includes("TCHAD") || c.includes("CHAD")) return "TD";
  if (c === "BE" || c.includes("BELGIQUE") || c.includes("BELGIUM")) return "BE";
  if (c === "CA" || c.includes("CANADA")) return "CA";
  return c;
}

// ─────────────────────────────────────────────────────────────────────────────
// Systèmes scolaires adaptés par pays
// ─────────────────────────────────────────────────────────────────────────────
const COUNTRY_SPECIFIC_SYSTEMS: Record<string, SchoolSystem[]> = {
  CM: [
    {
      value: "camerounais-francophone",
      label: "Système Camerounais Francophone (BEPC / Probatoire / BAC)",
      badge: "National",
      description: "Programmes officiels MINESEC francophone (SIL au Terminale)",
    },
    {
      value: "camerounais-anglophone",
      label: "Système Camerounais Anglophone (GCE O-Level / A-Level)",
      badge: "National / Anglophone",
      description: "Sous-système anglophone officiel (Class 1-6, Forms 1-5, Lower/Upper Sixth)",
    },
    {
      value: "francais",
      label: "Système Français (AEFE / Brevet / BAC)",
      badge: "International",
      description: "Écoles françaises, lycées conventionnés AEFE (Fustel, Dominique Savio...) et CNED",
    },
    {
      value: "britannique",
      label: "Système Britannique (Cambridge / IGCSE / IB)",
      badge: "Bilingue / IB",
      description: "International Baccalaureate, Cambridge Checkpoint, O-Level et A-Level",
    },
    {
      value: "americain",
      label: "Système Américain (High School / AP / SAT)",
      badge: "US",
      description: "American curriculum (Rain Forest, etc.) et préparation aux tests SAT / AP",
    },
    {
      value: "autre",
      label: "Autre système scolaire",
      description: "Curriculum personnalisé ou transition internationale",
    },
  ],
  CI: [
    {
      value: "ivoirien",
      label: "Système Ivoirien (CEPE / BEPC / BAC)",
      badge: "National",
      description: "Programmes officiels du Ministère de l'Éducation Nationale de Côte d'Ivoire",
    },
    {
      value: "francais",
      label: "Système Français (AEFE / Brevet / BAC)",
      badge: "International",
      description: "Lycée Blaise Pascal, Jean Mermoz, lycées conventionnés AEFE et CNED",
    },
    {
      value: "britannique",
      label: "Système Britannique / IB (Cambridge / IGCSE)",
      badge: "International / IB",
      description: "International Community School of Abidjan (ICSA) et programmes bilingues",
    },
    {
      value: "americain",
      label: "Système Américain (High School / AP / SAT)",
      badge: "US",
      description: "American curriculum et préparation internationale",
    },
    {
      value: "autre",
      label: "Autre système scolaire",
      description: "Curriculum personnalisé ou transition internationale",
    },
  ],
  MG: [
    {
      value: "malgache",
      label: "Système Malgache (CEPE / BEPC / BACC)",
      badge: "National",
      description: "Programmes officiels nationaux (11ème à la Terminale, BACC séries A, C, D, L, S)",
    },
    {
      value: "francais",
      label: "Système Français (AEFE / Brevet / BAC)",
      badge: "International",
      description: "Lycée Français de Tananarive (LFT), lycées conventionnés AEFE et CNED",
    },
    {
      value: "britannique",
      label: "Système International / Britannique (Cambridge / IGCSE / IB)",
      badge: "International",
      description: "Écoles internationales et programmes Cambridge d'Antananarivo",
    },
    {
      value: "autre",
      label: "Autre système scolaire",
      description: "Curriculum personnalisé ou transition internationale",
    },
  ],
  SN: [
    {
      value: "senegalais",
      label: "Système Sénégalais (CFEE / BFEM / BAC)",
      badge: "National",
      description: "Programmes officiels du Ministère de l'Éducation Nationale du Sénégal",
    },
    {
      value: "francais",
      label: "Système Français (AEFE / Brevet / BAC)",
      badge: "International",
      description: "Lycée Jean Mermoz de Dakar, établissements conventionnés AEFE et CNED",
    },
    {
      value: "britannique",
      label: "Système Britannique / Bilingue (Cambridge / IB)",
      badge: "International",
      description: "International School of Dakar (ISD), programmes anglophones et bilingues",
    },
    {
      value: "autre",
      label: "Autre système scolaire",
      description: "Curriculum personnalisé ou transition internationale",
    },
  ],
  FR: [
    {
      value: "francais",
      label: "Système Français (Éducation Nationale / Brevet / BAC)",
      badge: "National",
      description: "Programmes officiels de l'Éducation Nationale (CP à Terminale, BAC général et technologique)",
    },
    {
      value: "international",
      label: "Système International / BFI (Baccalauréat Français International / OIB / IB)",
      badge: "International",
      description: "Sections internationales, BFI, baccalauréat international (IB) et bilingue",
    },
    {
      value: "britannique",
      label: "Système Britannique (Cambridge / IGCSE / A-Levels)",
      badge: "UK",
      description: "Écoles britanniques et cursus Cambridge en France",
    },
    {
      value: "autre",
      label: "Autre système scolaire",
      description: "Curriculum personnalisé ou enseignement à distance",
    },
  ],
  GA: [
    {
      value: "gabonais",
      label: "Système Gabonais (CEPE / BEPC / BAC)",
      badge: "National",
      description: "Programmes officiels du Ministère de l'Éducation Nationale du Gabon",
    },
    {
      value: "francais",
      label: "Système Français (AEFE / Brevet / BAC)",
      badge: "International",
      description: "Lycée Blaise Pascal de Libreville, réseau AEFE et CNED",
    },
    {
      value: "autre",
      label: "Autre système scolaire",
      description: "Curriculum personnalisé ou transition internationale",
    },
  ],
  CG: [
    {
      value: "congolais",
      label: "Système Congolais (TENAFEP / EXETAT)",
      badge: "National",
      description: "Programmes officiels nationaux (primaire, secondaire, Examen d'État)",
    },
    {
      value: "francais",
      label: "Système Français (AEFE / Brevet / BAC)",
      badge: "International",
      description: "Lycée Français Saint-Exupéry de Brazzaville, Lycée Prince de Liège de Kinshasa",
    },
    {
      value: "autre",
      label: "Autre système scolaire",
      description: "Curriculum personnalisé ou transition internationale",
    },
  ],
  BJ: [
    {
      value: "beninois",
      label: "Système Béninois (CEP / BEPC / BAC)",
      badge: "National",
      description: "Programmes officiels du Ministère des Enseignements Maternel et Primaire / Secondaire",
    },
    {
      value: "francais",
      label: "Système Français (AEFE / Brevet / BAC)",
      badge: "International",
      description: "Établissement Montaigne de Cotonou, réseau AEFE et CNED",
    },
    {
      value: "autre",
      label: "Autre système scolaire",
      description: "Curriculum personnalisé ou transition internationale",
    },
  ],
  TG: [
    {
      value: "togolais",
      label: "Système Togolais (CEPD / BEPC / BAC)",
      badge: "National",
      description: "Programmes officiels de l'Éducation Nationale du Togo",
    },
    {
      value: "francais",
      label: "Système Français (AEFE / Brevet / BAC)",
      badge: "International",
      description: "Lycée Français de Lomé, réseau AEFE et CNED",
    },
    {
      value: "autre",
      label: "Autre système scolaire",
      description: "Curriculum personnalisé ou transition internationale",
    },
  ],
  GN: [
    {
      value: "guineen",
      label: "Système Guinéen (CEE / BEPC / BAC)",
      badge: "National",
      description: "Programmes officiels du Ministère de l'Enseignement Pré-Universitaire de Guinée",
    },
    {
      value: "francais",
      label: "Système Français (AEFE / Brevet / BAC)",
      badge: "International",
      description: "Lycée Français Albert Camus de Conakry, réseau AEFE et CNED",
    },
    {
      value: "autre",
      label: "Autre système scolaire",
      description: "Curriculum personnalisé ou transition internationale",
    },
  ],
  ML: [
    {
      value: "malien",
      label: "Système Malien (DEF / BAC)",
      badge: "National",
      description: "Programmes officiels du Ministère de l'Éducation Nationale du Mali",
    },
    {
      value: "francais",
      label: "Système Français (AEFE / Brevet / BAC)",
      badge: "International",
      description: "Établissement Liberté de Bamako, réseau AEFE et CNED",
    },
    {
      value: "autre",
      label: "Autre système scolaire",
      description: "Curriculum personnalisé ou transition internationale",
    },
  ],
  BF: [
    {
      value: "burkinabe",
      label: "Système Burkinabè (CEP / BEPC / BAC)",
      badge: "National",
      description: "Programmes officiels du Ministère de l'Éducation Nationale du Burkina Faso",
    },
    {
      value: "francais",
      label: "Système Français (AEFE / Brevet / BAC)",
      badge: "International",
      description: "Lycée Saint-Exupéry de Ouagadougou, réseau AEFE et CNED",
    },
    {
      value: "autre",
      label: "Autre système scolaire",
      description: "Curriculum personnalisé ou transition internationale",
    },
  ],
  MA: [
    {
      value: "marocain",
      label: "Système Marocain (Brevet / Baccalauréat National & BIOF)",
      badge: "National",
      description: "Programmes officiels du Ministère de l'Éducation Nationale du Maroc (arabe et section internationale)",
    },
    {
      value: "francais",
      label: "Système Français (Mission / AEFE / Brevet / BAC)",
      badge: "Mission / AEFE",
      description: "Lycées Lyautey, Descartes, régie AEFE / OSUI",
    },
    {
      value: "britannique",
      label: "Système International / Américain (Cambridge / IB / High School)",
      badge: "International",
      description: "Casablanca American School, George Washington Academy, etc.",
    },
    {
      value: "autre",
      label: "Autre système scolaire",
      description: "Curriculum personnalisé ou transition internationale",
    },
  ],
};

/**
 * Retourne la liste des systèmes scolaires adaptés au pays sélectionné.
 */
export function getSchoolSystemsForCountry(countryNameOrCode?: string): SchoolSystem[] {
  const code = normalizeCountryCode(countryNameOrCode);
  if (COUNTRY_SPECIFIC_SYSTEMS[code]) {
    return COUNTRY_SPECIFIC_SYSTEMS[code];
  }

  // Fallback universel pour tout autre pays
  const countryLabel = countryNameOrCode?.trim() || "National";
  return [
    {
      value: "national",
      label: `Système National (${countryLabel})`,
      badge: "National",
      description: `Programme officiel du pays d'accueil (${countryLabel})`,
    },
    {
      value: "francais",
      label: "Système Français (AEFE / Brevet / BAC)",
      badge: "International",
      description: "Écoles françaises, lycées conventionnés AEFE et CNED",
    },
    {
      value: "britannique",
      label: "Système Britannique (Cambridge / IGCSE / IB)",
      badge: "Bilingue / IB",
      description: "International Baccalaureate, Cambridge Checkpoint, O-Level et A-Level",
    },
    {
      value: "americain",
      label: "Système Américain (High School / AP / SAT)",
      badge: "US",
      description: "American curriculum et préparation aux tests SAT / AP",
    },
    {
      value: "autre",
      label: "Autre système scolaire",
      description: "Curriculum personnalisé ou transition internationale",
    },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// Cycles et Niveaux adaptés au système et au pays
// ─────────────────────────────────────────────────────────────────────────────
export const ANGLOPHONE_CYCLES: EducationCycle[] = [
  {
    id: "primaire",
    label: "Primary Education (Class 1 - 6)",
    levels: ["Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6"],
  },
  {
    id: "college",
    label: "Secondary (GCE O-Level / Cambridge Checkpoint)",
    levels: ["Form 1", "Form 2", "Form 3", "Form 4", "Form 5 (GCE O-Level)"],
  },
  {
    id: "lycee",
    label: "High School (GCE A-Level / Sixth Form)",
    levels: ["Lower Sixth", "Upper Sixth (GCE A-Level)"],
  },
  {
    id: "superieur",
    label: "Higher Education / University",
    levels: ["Undergraduate / University", "Higher Ed"],
  },
];

export const AMERICAN_CYCLES: EducationCycle[] = [
  {
    id: "primaire",
    label: "Elementary School (Grades 1 - 5)",
    levels: ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5"],
  },
  {
    id: "college",
    label: "Middle School (Grades 6 - 8)",
    levels: ["Grade 6", "Grade 7", "Grade 8"],
  },
  {
    id: "lycee",
    label: "High School (Grades 9 - 12 / AP)",
    levels: [
      "Grade 9 (Freshman)",
      "Grade 10 (Sophomore)",
      "Grade 11 (Junior)",
      "Grade 12 (Senior / AP)",
    ],
  },
  {
    id: "superieur",
    label: "Higher Education / College",
    levels: ["College / University"],
  },
];

export const MADAGASCAR_CYCLES: EducationCycle[] = [
  {
    id: "primaire",
    label: "Primaire (11ème à 7ème - CEPE)",
    levels: ["11ème (CP)", "10ème (CE1)", "9ème (CE2)", "8ème (CM1)", "7ème (CM2)"],
  },
  {
    id: "college",
    label: "Collège (6ème à 3ème - BEPC)",
    levels: ["6ème", "5ème", "4ème", "3ème"],
  },
  {
    id: "lycee",
    label: "Lycée (Seconde à Terminale - BACC)",
    levels: ["Seconde", "Première", "Terminale"],
  },
  {
    id: "superieur",
    label: "Enseignement Supérieur",
    levels: ["Prépa", "Licence / Université", "Supérieur"],
  },
];

export const STANDARD_FRANCOPHONE_CYCLES: EducationCycle[] = [
  {
    id: "primaire",
    label: "Primaire & Éveil",
    levels: ["SIL", "CP", "CE1", "CE2", "CM1", "CM2"],
  },
  {
    id: "college",
    label: "Collège (Fondations & BEPC)",
    levels: ["6ème", "5ème", "4ème", "3ème"],
  },
  {
    id: "lycee",
    label: "Lycée (Second cycle & BAC)",
    levels: ["Seconde", "Première", "Terminale"],
  },
  {
    id: "superieur",
    label: "Enseignement Supérieur",
    levels: ["Prépa", "Licence / Université", "Concours grandes écoles", "Supérieur"],
  },
];

export function getEducationCyclesForSystem(
  systemValue?: string,
  countryNameOrCode?: string
): EducationCycle[] {
  const code = normalizeCountryCode(countryNameOrCode);
  const sys = (systemValue || "").toLowerCase();

  if (sys.includes("anglophone") || sys.includes("britannique") || sys === "cambridge") {
    return ANGLOPHONE_CYCLES;
  }
  if (sys.includes("americain") || sys.includes("american")) {
    return AMERICAN_CYCLES;
  }
  if (code === "MG" && (sys.includes("malgache") || !sys)) {
    return MADAGASCAR_CYCLES;
  }

  // Si pays France ou autre sans SIL au primaire, retirer SIL
  if (code === "FR" || sys === "francais" || sys === "international") {
    return [
      {
        id: "primaire",
        label: "Primaire",
        levels: ["CP", "CE1", "CE2", "CM1", "CM2"],
      },
      {
        id: "college",
        label: "Collège (Brevet)",
        levels: ["6ème", "5ème", "4ème", "3ème"],
      },
      {
        id: "lycee",
        label: "Lycée (BAC)",
        levels: ["Seconde", "Première", "Terminale"],
      },
      {
        id: "superieur",
        label: "Enseignement Supérieur",
        levels: ["Prépa", "Licence / Université", "Concours grandes écoles", "Supérieur"],
      },
    ];
  }

  return STANDARD_FRANCOPHONE_CYCLES;
}

export function getAllLevelsForSystem(
  systemValue?: string,
  countryNameOrCode?: string
): string[] {
  const cycles = getEducationCyclesForSystem(systemValue, countryNameOrCode);
  return cycles.flatMap((c) => c.levels);
}

// ─────────────────────────────────────────────────────────────────────────────
// Rétrocompatibilité — constantes globales par défaut
// ─────────────────────────────────────────────────────────────────────────────
export const SCHOOL_SYSTEMS: SchoolSystem[] = COUNTRY_SPECIFIC_SYSTEMS.CM;
export const EDUCATION_CYCLES: EducationCycle[] = STANDARD_FRANCOPHONE_CYCLES;
export const ALL_LEVELS: string[] = [
  "SIL",
  "CP",
  "CE1",
  "CE2",
  "CM1",
  "CM2",
  "6ème",
  "5ème",
  "4ème",
  "3ème",
  "Seconde",
  "Première",
  "Terminale",
  "Supérieur",
];

// ─────────────────────────────────────────────────────────────────────────────
// Matières
// ─────────────────────────────────────────────────────────────────────────────
export const SUBJECT_CATEGORIES: SubjectCategory[] = [
  {
    id: "sciences",
    label: "Sciences & Mathématiques",
    subjects: ["Mathématiques", "Physique-Chimie", "SVT", "Informatique"],
  },
  {
    id: "humanites",
    label: "Lettres & Sciences Humaines",
    subjects: ["Français", "Philosophie", "Histoire-Géo", "Littérature"],
  },
  {
    id: "langues",
    label: "Langues Vivantes",
    subjects: ["Anglais", "Espagnol", "Allemand", "Chinois", "Arabe"],
  },
  {
    id: "gestion",
    label: "Économie & Gestion",
    subjects: ["Économie", "Comptabilité", "SES (Sciences Éco & Sociales)"],
  },
  {
    id: "autre",
    label: "Autres disciplines",
    subjects: ["Méthodologie & Aide aux devoirs", "Autre"],
  },
];

export const ALL_SUBJECTS: string[] = [
  "Mathématiques",
  "Français",
  "Anglais",
  "Physique-Chimie",
  "SVT",
  "Histoire-Géo",
  "Philosophie",
  "Informatique",
  "Économie",
  "Espagnol",
  "Allemand",
  "Autre",
];
