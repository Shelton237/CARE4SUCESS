import { Service, Level, Subject, Testimonial, Teacher } from "@/lib/index";
import { IMAGES } from "@/assets/images";

export const services: Service[] = [
  {
    id: "cours-particuliers",
    title: "Cours particuliers à domicile",
    description: "Un enseignant qualifié se déplace chez vous pour des cours sur mesure adaptés aux besoins de votre enfant.",
    icon: "home",
    features: [
      "Préparation aux examens nationaux (CEP, BEPC, BAC)",
      "Enseignant trouvé en 4 jours",
      "Suivi personnalisé avec conseiller pédagogique",
      "Sans engagement, arrêt/reprise libre",
      "Garantie +4 points de moyenne"
    ],
    price: "À partir de 9 000 FCFA/heure",
    image: IMAGES.TEACHER_STUDENT_1,
    benefits: [
      "Progression rapide et ciblée",
      "Confiance et motivation renforcées",
      "Méthodologie personnalisée",
      "Flexibilité des horaires"
    ]
  },
  {
    id: "cours-en-ligne",
    title: "Cours en ligne",
    description: "Des cours particuliers en visioconférence avec les mêmes enseignants qualifiés, pour plus de flexibilité.",
    icon: "monitor",
    features: [
      "Plateforme interactive dédiée",
      "Tableau blanc partagé",
      "Enregistrement des sessions",
      "Même qualité qu'à domicile",
      "Économie de temps de déplacement"
    ],
    price: "À partir de 7 500 FCFA/heure",
    image: IMAGES.ONLINE_LEARNING_1,
    benefits: [
      "Accessible partout au Cameroun et en Afrique",
      "Horaires étendus",
      "Outils pédagogiques numériques",
      "Suivi en temps réel"
    ]
  },
  {
    id: "stages-vacances",
    title: "Stages intensifs vacances",
    description: "Des stages en petits groupes pendant les vacances scolaires pour réviser, approfondir ou préparer la rentrée.",
    icon: "calendar",
    features: [
      "Groupes de 8 élèves maximum",
      "Programme sur mesure",
      "Sessions matin et après-midi",
      "Préparation examens (BEPC, BAC)",
      "Remise à niveau express"
    ],
    price: "À partir de 150 000 FCFA la semaine",
    image: IMAGES.STUDENTS_STUDYING_4,
    benefits: [
      "Dynamique de groupe motivante",
      "Révisions intensives efficaces",
      "Méthodologie et organisation",
      "Préparation mentale aux examens"
    ]
  },
  {
    id: "accompagnement-scolaire",
    title: "Accompagnement scolaire",
    description: "Un suivi régulier pour aider votre enfant à s'organiser, gérer son travail et gagner en autonomie.",
    icon: "users",
    features: [
      "Aide aux devoirs quotidienne",
      "Méthodologie et organisation",
      "Gestion du stress",
      "Orientation post-BEPC et post-BAC",
      "Orientation scolaire et professionnelle"
    ],
    price: "À partir de 10 000 FCFA/heure",
    image: IMAGES.TEACHER_STUDENT_2,
    benefits: [
      "Autonomie progressive",
      "Confiance en soi renforcée",
      "Meilleure organisation",
      "Résultats durables"
    ]
  }
];

export const levels: Level[] = [
  {
    id: "primaire",
    name: "Primaire",
    description: "Du SIL au CM2, nous accompagnons les élèves dans l'apprentissage des fondamentaux : lecture, écriture, calcul. Préparation au CEP.",
    grades: ["SIL", "CP", "CE1", "CE2", "CM1", "CM2"],
    subjects: ["Français", "Mathématiques", "Anglais", "Méthodologie"],
    image: IMAGES.STUDENTS_STUDYING_5,
    keyPoints: [
      "Apprentissage ludique et motivant",
      "Consolidation des bases",
      "Développement de la confiance",
      "Préparation au CEP et à l'entrée en 6e"
    ]
  },
  {
    id: "college",
    name: "Collège",
    description: "De la 6e à la 3e, nous aidons les collégiens à réussir leur scolarité et préparer le BEPC avec sérénité.",
    grades: ["6e", "5e", "4e", "3e"],
    subjects: [
      "Mathématiques",
      "Français",
      "Anglais",
      "Physique-Chimie",
      "Histoire-Géographie",
      "SVT",
      "Espagnol",
      "Informatique"
    ],
    image: IMAGES.STUDENTS_STUDYING_3,
    keyPoints: [
      "Préparation au BEPC",
      "Méthodologie et organisation",
      "Renforcement des acquis",
      "Orientation post-3e"
    ]
  },
  {
    id: "lycee",
    name: "Lycée",
    description: "De la 2de à la Terminale, nous accompagnons les lycéens vers la réussite au BAC et l'entrée dans le supérieur.",
    grades: ["2de", "1re", "Terminale"],
    subjects: [
      "Mathématiques",
      "Physique-Chimie",
      "SVT",
      "Français",
      "Philosophie",
      "Histoire-Géographie",
      "Anglais",
      "Espagnol",
      "Économie",
      "Informatique",
      "Sciences de l'ingénieur"
    ],
    image: IMAGES.MATH_EDUCATION_1,
    keyPoints: [
      "Préparation au Baccalauréat",
      "Séries A, C, D, E, F, G",
      "Orientation post-BAC",
      "Méthodologie supérieur"
    ]
  },
  {
    id: "superieur",
    name: "Supérieur",
    description: "Classes préparatoires, universités, grandes écoles africaines : nous accompagnons les étudiants dans leur réussite.",
    grades: ["Prépa", "Licence", "Master", "Grandes Écoles"],
    subjects: [
      "Mathématiques sup/spé",
      "Physique-Chimie",
      "Informatique",
      "Économie",
      "Droit",
      "Langues",
      "Préparation concours"
    ],
    image: IMAGES.STUDENTS_STUDYING_8,
    keyPoints: [
      "Préparation aux concours des grandes écoles",
      "Soutien universitaire",
      "Méthodologie avancée",
      "Coaching personnalisé"
    ]
  },
  {
    id: "adulte",
    name: "Adultes",
    description: "Formations professionnelles, langues, reconversion : nous accompagnons les adultes dans leurs projets de carrière.",
    grades: ["Formation continue", "Reconversion", "Perfectionnement"],
    subjects: [
      "Anglais professionnel",
      "TOEIC/TOEFL",
      "Espagnol",
      "Bureautique",
      "Comptabilité",
      "Gestion",
      "Remise à niveau"
    ],
    image: IMAGES.ONLINE_LEARNING_2,
    keyPoints: [
      "Formations professionnalisantes",
      "Horaires flexibles",
      "Objectifs professionnels ciblés",
      "Certifications reconnues"
    ]
  }
];

export const subjects: Subject[] = [
  {
    id: "mathematiques",
    name: "Mathématiques",
    description: "Du calcul mental aux équations complexes, nous aidons les élèves à maîtriser les mathématiques.",
    levels: ["primaire", "college", "lycee", "superieur"],
    icon: "calculator",
    popular: true
  },
  {
    id: "francais",
    name: "Français",
    description: "Grammaire, orthographe, littérature : nous développons les compétences en français.",
    levels: ["primaire", "college", "lycee"],
    icon: "book-open",
    popular: true
  },
  {
    id: "anglais",
    name: "Anglais",
    description: "Expression orale, compréhension, grammaire : nous rendons l'anglais accessible et vivant.",
    levels: ["primaire", "college", "lycee", "superieur", "adulte"],
    icon: "globe",
    popular: true
  },
  {
    id: "physique-chimie",
    name: "Physique-Chimie",
    description: "Expériences, théories, applications : nous démystifions les sciences physiques.",
    levels: ["college", "lycee", "superieur"],
    icon: "flask",
    popular: true
  },
  {
    id: "histoire-geo",
    name: "Histoire-Géographie",
    description: "Chronologie, cartes, analyse : nous donnons du sens à l'histoire et la géographie.",
    levels: ["college", "lycee"],
    icon: "map",
    popular: false
  },
  {
    id: "svt",
    name: "SVT",
    description: "Biologie, géologie, environnement : nous explorons le vivant et la Terre.",
    levels: ["college", "lycee"],
    icon: "leaf",
    popular: false
  },
  {
    id: "espagnol",
    name: "Espagnol",
    description: "Conversation, grammaire, culture : nous enseignons l'espagnol de manière interactive.",
    levels: ["college", "lycee", "adulte"],
    icon: "message-circle",
    popular: false
  },
  {
    id: "philosophie",
    name: "Philosophie",
    description: "Dissertation, argumentation, auteurs : nous préparons efficacement à l'épreuve de philo.",
    levels: ["lycee"],
    icon: "brain",
    popular: false
  },
  {
    id: "ses",
    name: "SES",
    description: "Économie, sociologie, sciences politiques : nous clarifions les enjeux contemporains.",
    levels: ["lycee"],
    icon: "trending-up",
    popular: false
  },
  {
    id: "informatique",
    name: "Informatique/NSI",
    description: "Programmation, algorithmique, bases de données : nous formons aux sciences du numérique.",
    levels: ["lycee", "superieur"],
    icon: "code",
    popular: false
  }
];

export const testimonials: Testimonial[] = [];
export const teachers: Teacher[] = [];

export const stats = [
  {
    value: "500+",
    label: "Enseignants qualifiés",
    description: "Bac+3 minimum, sélection rigoureuse"
  },
  {
    value: "15",
    label: "Centres au Cameroun",
    description: "Proximité et accompagnement local"
  },
  {
    value: "4.4/5",
    label: "Note moyenne",
    description: "Satisfaction clients vérifiée"
  },
  {
    value: "100%",
    label: "Satisfaction garantie",
    description: "Résultats mesurables et suivis"
  },
  {
    value: "4 jours",
    label: "Délai moyen",
    description: "Pour trouver votre enseignant"
  },
  {
    value: "+4 pts",
    label: "Progression garantie",
    description: "Moyenne des élèves suivis"
  }
];
