// ─────────────────────────────────────────────
//  CARE4SUCCESS — Données mockées backoffice
// ─────────────────────────────────────────────

export type Role = "admin" | "teacher" | "parent" | "advisor" | "student";

export interface User {
    id: string;
    name: string;
    email: string;
    password: string;
    role: Role;
    avatar: string;
    phone: string;
}

export const MOCK_USERS: User[] = [
    {
        id: "a1",
        name: "Directeur Ngono",
        email: "admin@care4success.cm",
        password: "admin123",
        role: "admin",
        avatar: "DN",
        phone: "+237 675 252 048",
    },
    {
        id: "t1",
        name: "Dr. Clémentine Abanda",
        email: "prof@care4success.cm",
        password: "prof123",
        role: "teacher",
        avatar: "CA",
        phone: "+237 699 001 122",
    },
    {
        id: "p1",
        name: "Aminata Diallo",
        email: "parent@care4success.cm",
        password: "parent123",
        role: "parent",
        avatar: "AD",
        phone: "+237 677 334 455",
    },
    {
        id: "c1",
        name: "Brice Owona",
        email: "conseiller@care4success.cm",
        password: "conseil123",
        role: "advisor",
        avatar: "BO",
        phone: "+237 691 556 677",
    },
    {
        id: "s1",
        name: "Koffi Diallo",
        email: "eleve@care4success.cm",
        password: "eleve123",
        role: "student",
        avatar: "KD",
        phone: "+237 677 334 455",
    },
];

// ── ADMIN ──────────────────────────────────────
export const adminStats = {
    totalTeachers: 48,
    activeStudents: 312,
    pendingRequests: 14,
    monthlyRevenue: 18_640_000,
    previousRevenue: 15_200_000,
    satisfactionRate: 4.4,
    newFamiliesThisMonth: 23,
};

export const adminTeachers = [
    { id: "t1", name: "Dr. Clémentine Abanda", subjects: ["Maths", "Physique"], level: "Lycée/Sup", rating: 4.9, students: 7, status: "actif", city: "Douala" },
    { id: "t2", name: "Brice Owona", subjects: ["Français", "Philo"], level: "Collège/Lycée", rating: 4.8, students: 5, status: "actif", city: "Douala" },
    { id: "t3", name: "Rebecca Ateba", subjects: ["Anglais"], level: "Tous niveaux", rating: 5.0, students: 9, status: "actif", city: "Yaoundé" },
    { id: "t4", name: "Thierry Nkoulou", subjects: ["Physique-Chimie"], level: "Collège/Lycée", rating: 4.7, students: 6, status: "actif", city: "Douala" },
    { id: "t5", name: "Aline Bikié", subjects: ["Histoire-Géo"], level: "Collège/Lycée", rating: 4.9, students: 4, status: "suspendu", city: "Yaoundé" },
    { id: "t6", name: "Serge Mbarga", subjects: ["Maths", "Info"], level: "Lycée/Sup", rating: 4.8, students: 8, status: "actif", city: "Douala" },
];

export const adminFamilies = [
    { id: "f1", parent: "Aminata Diallo", child: "Koffi Diallo", level: "3e", subject: "Mathématiques", teacher: "Dr. Abanda", nextSession: "Mer 05/03 à 16h", status: "actif" },
    { id: "f2", parent: "Kouassi Ébène", child: "Awa Ébène", level: "Terminale C", subject: "Physique-Chimie", teacher: "Thierry Nkoulou", nextSession: "Jeu 06/03 à 15h", status: "actif" },
    { id: "f3", parent: "Narcisse Essomba", child: "Léa Essomba", level: "CM2", subject: "Français", teacher: "Sandrine Fouda", nextSession: "Lun 03/03 à 17h", status: "actif" },
    { id: "f4", parent: "Fatou Konaté", child: "Ibrahima Konaté", level: "5e", subject: "Anglais", teacher: "Rebecca Ateba", nextSession: "Mar 04/03 à 14h", status: "actif" },
    { id: "f5", parent: "Jean-Baptiste Manga", child: "Paul Manga", level: "1re A", subject: "Philosophie", teacher: "Brice Owona", nextSession: "Ven 07/03 à 10h", status: "en pause" },
];

export const adminRequests = [
    { id: "r1", parent: "Mariama Bah", child: "Salif Bah", level: "6e", subject: "Maths", phone: "+237 682 111 222", date: "2026-03-03", status: "reçu" },
    { id: "r2", parent: "Patrick Etundi", child: "Grace Etundi", level: "2de", subject: "SVT", phone: "+237 677 333 444", date: "2026-03-02", status: "en traitement" },
    { id: "r3", parent: "Cécile Mbassi", child: "Junior Mbassi", level: "CM1", subject: "Lecture", phone: "+237 695 222 333", date: "2026-03-01", status: "assigné" },
    { id: "r4", parent: "Roger Tabi", child: "Nadège Tabi", level: "Terminale D", subject: "Physique", phone: "+237 678 444 555", date: "2026-02-28", status: "clôturé" },
    { id: "r5", parent: "Hélène Noa", child: "Christelle Noa", level: "3e", subject: "Français", phone: "+237 691 555 666", date: "2026-03-04", status: "reçu" },
];

export const monthlyRevenueData = [
    { month: "Oct", amount: 11_200_000 },
    { month: "Nov", amount: 13_500_000 },
    { month: "Déc", amount: 12_800_000 },
    { month: "Jan", amount: 15_200_000 },
    { month: "Fév", amount: 16_900_000 },
    { month: "Mar", amount: 18_640_000 },
];

// ── ENSEIGNANT ──────────────────────────────────
export const teacherStats = {
    upcomingSessions: 6,
    activeStudents: 7,
    monthlyEarnings: 643_000,
    previousEarnings: 520_000,
    avgRating: 4.9,
    hoursThisMonth: 28,
};

export const teacherSchedule = [
    { id: "s1", student: "Koffi Diallo", subject: "Mathématiques", day: "Lundi", time: "16h00–17h30", level: "3e", location: "Domicile" },
    { id: "s2", student: "Rose Mbella", subject: "Physique", day: "Lundi", time: "18h00–19h30", level: "Tle C", location: "En ligne" },
    { id: "s3", student: "Koffi Diallo", subject: "Mathématiques", day: "Mercredi", time: "16h00–17h30", level: "3e", location: "Domicile" },
    { id: "s4", student: "Joël Atangana", subject: "Maths sup", day: "Mercredi", time: "18h30–20h00", level: "Prépa", location: "En ligne" },
    { id: "s5", student: "Sandra Belinga", subject: "Statistiques", day: "Jeudi", time: "15h00–16h30", level: "L3", location: "En ligne" },
    { id: "s6", student: "Rose Mbella", subject: "Physique", day: "Vendredi", time: "17h00–18h30", level: "Tle C", location: "En ligne" },
];

export const teacherStudents = [
    { id: "e1", name: "Koffi Diallo", level: "3e", subject: "Mathématiques", sessions: 18, avgGrade: 14.5, trend: "+3pts", lastSession: "03/03" },
    { id: "e2", name: "Rose Mbella", level: "Tle C", subject: "Physique", sessions: 12, avgGrade: 13.0, trend: "+2pts", lastSession: "02/03" },
    { id: "e3", name: "Joël Atangana", level: "Prépa", subject: "Maths sup", sessions: 8, avgGrade: 11.5, trend: "+1pt", lastSession: "01/03" },
    { id: "e4", name: "Sandra Belinga", level: "L3", subject: "Statistiques", sessions: 6, avgGrade: 15.0, trend: "+4pts", lastSession: "28/02" },
    { id: "e5", name: "Marc Nzinga", level: "1re C", subject: "Physique", sessions: 10, avgGrade: 12.0, trend: "+2pts", lastSession: "27/02" },
];

export const teacherEarnings = [
    { id: "i1", date: "28/02/2026", student: "Koffi Diallo", hours: 1.5, rate: 12_000, amount: 18_000, status: "payé" },
    { id: "i2", date: "26/02/2026", student: "Rose Mbella", hours: 1.5, rate: 12_000, amount: 18_000, status: "payé" },
    { id: "i3", date: "25/02/2026", student: "Joël Atangana", hours: 1.5, rate: 15_000, amount: 22_500, status: "payé" },
    { id: "i4", date: "24/02/2026", student: "Sandra Belinga", hours: 1.5, rate: 12_000, amount: 18_000, status: "en attente" },
    { id: "i5", date: "22/02/2026", student: "Koffi Diallo", hours: 1.5, rate: 12_000, amount: 18_000, status: "payé" },
    { id: "i6", date: "21/02/2026", student: "Marc Nzinga", hours: 1.5, rate: 10_000, amount: 15_000, status: "payé" },
];

// ── PARENT ──────────────────────────────────────
export const parentStats = {
    nextSession: "Mercredi 05/03 à 16h00",
    teacher: "Dr. Clémentine Abanda",
    subject: "Mathématiques",
    sessionsThisMonth: 8,
    currentAvg: 14.5,
    previousAvg: 11.0,
    totalPaidThisMonth: 144_000,
    child: "Koffi Diallo",
    level: "3e",
};

export const parentSchedule = [
    { id: "c1", day: "Lundi", date: "02/03", time: "16h00–17h30", subject: "Mathématiques", teacher: "Dr. Clémentine Abanda", location: "Domicile", status: "effectué" },
    { id: "c2", day: "Mercredi", date: "05/03", time: "16h00–17h30", subject: "Mathématiques", teacher: "Dr. Clémentine Abanda", location: "Domicile", status: "à venir" },
    { id: "c3", day: "Lundi", date: "09/03", time: "16h00–17h30", subject: "Mathématiques", teacher: "Dr. Clémentine Abanda", location: "Domicile", status: "planifié" },
    { id: "c4", day: "Mercredi", date: "12/03", time: "16h00–17h30", subject: "Mathématiques", teacher: "Dr. Clémentine Abanda", location: "En ligne", status: "planifié" },
];

export const parentProgressData = [
    { month: "Oct", maths: 8, francais: 11, anglais: 12 },
    { month: "Nov", maths: 9, francais: 11, anglais: 13 },
    { month: "Déc", maths: 10, francais: 12, anglais: 13 },
    { month: "Jan", maths: 12, francais: 13, anglais: 14 },
    { month: "Fév", maths: 13, francais: 13, anglais: 14 },
    { month: "Mar", maths: 14.5, francais: 14, anglais: 15 },
];

export const parentInvoices = [
    { id: "inv1", date: "28/02/2026", description: "4 séances Mathématiques (fév. S4)", amount: 72_000, status: "payé" },
    { id: "inv2", date: "14/02/2026", description: "4 séances Mathématiques (fév. S2)", amount: 72_000, status: "payé" },
    { id: "inv3", date: "31/01/2026", description: "8 séances Mathématiques (janvier)", amount: 144_000, status: "payé" },
    { id: "inv4", date: "05/03/2026", description: "4 séances Mathématiques (mars S1)", amount: 72_000, status: "en attente" },
];

// ── CONSEILLER ──────────────────────────────────
export const advisorStats = {
    assignedFamilies: 18,
    pendingRequests: 5,
    matchingInProgress: 3,
    reportsThisMonth: 12,
    avgResponseTime: "22h",
};

export const advisorFamilies = [
    { id: "af1", parent: "Aminata Diallo", child: "Koffi Diallo", level: "3e", teacher: "Dr. Abanda", nextRdv: "12/03", status: "suivi actif" },
    { id: "af2", parent: "Kouassi Ébène", child: "Awa Ébène", level: "Tle C", teacher: "Th. Nkoulou", nextRdv: "14/03", status: "suivi actif" },
    { id: "af3", parent: "Narcisse Essomba", child: "Léa Essomba", level: "CM2", teacher: "S. Fouda", nextRdv: "10/03", status: "suivi actif" },
    { id: "af4", parent: "Fatou Konaté", child: "Ibrahima Konaté", level: "5e", teacher: "Rebecca Ateba", nextRdv: "—", status: "matching" },
    { id: "af5", parent: "Mariama Bah", child: "Salif Bah", level: "6e", teacher: "—", nextRdv: "—", status: "bilan planifié" },
    { id: "af6", parent: "Hélène Noa", child: "Christelle Noa", level: "3e", teacher: "—", nextRdv: "—", status: "nouveau" },
];

export const advisorMatchingQueue = [
    {
        id: "m1",
        child: "Ibrahima Konaté", level: "5e", subject: "Anglais",
        needs: ["Oral", "Compréhension écrite"], schedule: "Mar/Jeu 14h–16h",
        candidates: [
            { name: "Rebecca Ateba", rating: 5.0, available: true },
            { name: "Patrick Etundi", rating: 4.7, available: true },
        ],
    },
    {
        id: "m2",
        child: "Salif Bah", level: "6e", subject: "Mathématiques",
        needs: ["Calcul", "Géométrie"], schedule: "Lun/Mer 16h–18h",
        candidates: [
            { name: "Dr. Abanda", rating: 4.9, available: false },
            { name: "Serge Mbarga", rating: 4.8, available: true },
        ],
    },
];

export const advisorRequests = adminRequests;

// ── HELPERS ──────────────────────────────────────
export const formatFCFA = (amount: number) =>
    new Intl.NumberFormat("fr-CM", {
        style: "decimal",
        maximumFractionDigits: 0,
    }).format(amount) + " FCFA";

// ── ÉTUDIANT ─────────────────────────────────────
export const studentStats = {
    name: "Koffi Diallo",
    level: "3e",
    teacher: "Dr. Clémentine Abanda",
    subject: "Mathématiques",
    nextSession: "Mercredi 05/03",
    nextSessionTime: "16h00–17h30",
    nextSessionLocation: "Domicile",
    sessionsTotal: 18,
    sessionsThisMonth: 4,
    generalAvg: 14.2,
    previousAvg: 11.8,
    streak: 6, // séances consécutives sans absence
};

export const studentSchedule = [
    { id: "ss1", day: "Lundi", date: "02/03", time: "16h00–17h30", subject: "Mathématiques", teacher: "Dr. Clémentine Abanda", location: "Domicile", status: "effectué" },
    { id: "ss2", day: "Mercredi", date: "05/03", time: "16h00–17h30", subject: "Mathématiques", teacher: "Dr. Clémentine Abanda", location: "Domicile", status: "à venir" },
    { id: "ss3", day: "Lundi", date: "09/03", time: "16h00–17h30", subject: "Mathématiques", teacher: "Dr. Clémentine Abanda", location: "Domicile", status: "planifié" },
    { id: "ss4", day: "Mercredi", date: "12/03", time: "16h00–17h30", subject: "Mathématiques", teacher: "Dr. Clémentine Abanda", location: "En ligne", status: "planifié" },
    { id: "ss5", day: "Lundi", date: "16/03", time: "16h00–17h30", subject: "Mathématiques", teacher: "Dr. Clémentine Abanda", location: "Domicile", status: "planifié" },
];

export const studentGrades = [
    {
        subject: "Mathématiques",
        teacher: "Dr. Clémentine Abanda",
        coefficient: 5,
        avg: 14.5,
        history: [
            { date: "Oct", note: 8 },
            { date: "Nov", note: 9 },
            { date: "Déc", note: 10 },
            { date: "Jan", note: 12 },
            { date: "Fév", note: 13 },
            { date: "Mar", note: 14.5 },
        ],
        exams: [
            { label: "DS n°1", date: "15/10", note: 8, max: 20 },
            { label: "Interrogation", date: "12/11", note: 10, max: 20 },
            { label: "DS n°2", date: "10/12", note: 11, max: 20 },
            { label: "Devoir maison", date: "20/01", note: 15, max: 20 },
            { label: "DS n°3", date: "18/02", note: 14, max: 20 },
        ],
        trend: "+6.5 pts",
        color: "#1A6CC8",
    },
    {
        subject: "Français",
        teacher: "M. Essomba Paul",
        coefficient: 4,
        avg: 14.0,
        history: [
            { date: "Oct", note: 11 },
            { date: "Nov", note: 11 },
            { date: "Déc", note: 12 },
            { date: "Jan", note: 13 },
            { date: "Fév", note: 13 },
            { date: "Mar", note: 14 },
        ],
        exams: [
            { label: "Rédaction n°1", date: "20/10", note: 11, max: 20 },
            { label: "Dict. / Gram.", date: "14/11", note: 12, max: 20 },
            { label: "Commentaire", date: "15/12", note: 13, max: 20 },
        ],
        trend: "+3 pts",
        color: "#F5A623",
    },
    {
        subject: "Anglais",
        teacher: "Rebecca Ateba",
        coefficient: 3,
        avg: 15.0,
        history: [
            { date: "Oct", note: 12 },
            { date: "Nov", note: 13 },
            { date: "Déc", note: 13 },
            { date: "Jan", note: 14 },
            { date: "Fév", note: 14 },
            { date: "Mar", note: 15 },
        ],
        exams: [
            { label: "Oral n°1", date: "10/11", note: 13, max: 20 },
            { label: "Compréhension", date: "12/12", note: 14, max: 20 },
            { label: "Oral n°2", date: "15/02", note: 15, max: 20 },
        ],
        trend: "+3 pts",
        color: "#22c55e",
    },
    {
        subject: "Histoire-Géo",
        teacher: "Mme. Nkengne Claire",
        coefficient: 3,
        avg: 12.5,
        history: [
            { date: "Oct", note: 10 },
            { date: "Nov", note: 11 },
            { date: "Déc", note: 12 },
            { date: "Jan", note: 12 },
            { date: "Fév", note: 12 },
            { date: "Mar", note: 12.5 },
        ],
        exams: [
            { label: "DS n°1", date: "08/11", note: 11, max: 20 },
            { label: "DS n°2", date: "16/01", note: 12, max: 20 },
        ],
        trend: "+2.5 pts",
        color: "#a855f7",
    },
    {
        subject: "SVT",
        teacher: "M. Tchamba René",
        coefficient: 3,
        avg: 11.0,
        history: [
            { date: "Oct", note: 9 },
            { date: "Nov", note: 10 },
            { date: "Déc", note: 10 },
            { date: "Jan", note: 11 },
            { date: "Fév", note: 11 },
            { date: "Mar", note: 11 },
        ],
        exams: [
            { label: "TP n°1", date: "05/11", note: 10, max: 20 },
            { label: "DS n°1", date: "18/12", note: 11, max: 20 },
        ],
        trend: "+2 pts",
        color: "#ef4444",
    },
];

export const studentProgressData = [
    { month: "Oct", maths: 8, francais: 11, anglais: 12, histgeo: 10, svt: 9 },
    { month: "Nov", maths: 9, francais: 11, anglais: 13, histgeo: 11, svt: 10 },
    { month: "Déc", maths: 10, francais: 12, anglais: 13, histgeo: 12, svt: 10 },
    { month: "Jan", maths: 12, francais: 13, anglais: 14, histgeo: 12, svt: 11 },
    { month: "Fév", maths: 13, francais: 13, anglais: 14, histgeo: 12, svt: 11 },
    { month: "Mar", maths: 14.5, francais: 14, anglais: 15, histgeo: 12.5, svt: 11 },
];

export const studentHomework = [
    {
        id: "hw1",
        subject: "Mathématiques",
        title: "Exercices sur les identités remarquables",
        description: "Faire les exercices 3, 5 et 7 de la page 42 du manuel. Développer et réduire les expressions.",
        dueDate: "05/03/2026",
        dueDateLabel: "Mercredi 05/03",
        priority: "haute",
        status: "à faire",
        teacher: "Dr. Clémentine Abanda",
        color: "#1A6CC8",
    },
    {
        id: "hw2",
        subject: "Français",
        title: "Rédaction : Mon quartier idéal",
        description: "Rédiger un texte de 400 à 500 mots décrivant votre quartier idéal. Attention à l'expression et à l'orthographe.",
        dueDate: "07/03/2026",
        dueDateLabel: "Vendredi 07/03",
        priority: "normale",
        status: "à faire",
        teacher: "M. Essomba Paul",
        color: "#F5A623",
    },
    {
        id: "hw3",
        subject: "Anglais",
        title: "Vocabulary list – Unit 5",
        description: "Learn vocabulary list from Unit 5 (page 68). Be ready for an oral test next session.",
        dueDate: "10/03/2026",
        dueDateLabel: "Lundi 10/03",
        priority: "normale",
        status: "à faire",
        teacher: "Rebecca Ateba",
        color: "#22c55e",
    },
    {
        id: "hw4",
        subject: "Mathématiques",
        title: "Révisions DS n°3 — Factorisation",
        description: "Revoir les chapitres 3 et 4 sur la factorisation. Refaire les DS précédents.",
        dueDate: "02/03/2026",
        dueDateLabel: "Lundi 02/03",
        priority: "haute",
        status: "rendu",
        teacher: "Dr. Clémentine Abanda",
        color: "#1A6CC8",
    },
    {
        id: "hw5",
        subject: "Histoire-Géo",
        title: "Fiche de synthèse — La colonisation",
        description: "Réaliser une fiche de synthèse d'une page sur la colonisation de l'Afrique centrale.",
        dueDate: "28/02/2026",
        dueDateLabel: "Samedi 28/02",
        priority: "normale",
        status: "rendu",
        teacher: "Mme. Nkengne Claire",
        color: "#a855f7",
    },
];

export const studentMessages = [
    {
        id: "m1",
        from: "Dr. Clémentine Abanda",
        fromRole: "teacher",
        avatar: "CA",
        date: "03/03/2026",
        time: "18h45",
        text: "Bonjour Koffi ! Très bien au DS n°3. Continue sur cette lancée pour le prochain devoir. Travaille les identités remarquables avant mercredi.",
        read: true,
    },
    {
        id: "m2",
        from: "Koffi Diallo",
        fromRole: "student",
        avatar: "KD",
        date: "03/03/2026",
        time: "19h12",
        text: "Merci beaucoup Dr. Abanda ! J'ai bien revu les exercices du manuel. Est-ce que je dois aussi faire les exercices supplémentaires ?",
        read: true,
    },
    {
        id: "m3",
        from: "Dr. Clémentine Abanda",
        fromRole: "teacher",
        avatar: "CA",
        date: "03/03/2026",
        time: "19h30",
        text: "Oui, les exercices 5 et 6 page 42 si tu as le temps. Ce n'est pas obligatoire mais ça t'aidera beaucoup pour le contrôle de fin de trimestre.",
        read: true,
    },
    {
        id: "m4",
        from: "Brice Owona",
        fromRole: "advisor",
        avatar: "BO",
        date: "02/03/2026",
        time: "10h20",
        text: "Bonjour Koffi. Je voulais faire un point avec toi sur ta progression ce mois. Tu as fait de très bons progrès ! On se voit le 12/03 pour ton bilan du trimestre.",
        read: false,
    },
];

