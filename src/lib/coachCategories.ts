import { GraduationCap, Globe, Briefcase, type LucideIcon } from "lucide-react";

export interface CoachCategory {
  key: string;
  label: string;
  icon: LucideIcon;
  color: string;
}

export const COACH_CATEGORIES: CoachCategory[] = [
  { key: "soutien-scolaire", label: "Soutien scolaire", icon: GraduationCap, color: "#0F9B8E" },
  { key: "langues", label: "Langues", icon: Globe, color: "#F5A623" },
  { key: "competences", label: "Compétences et carrière", icon: Briefcase, color: "#E2574C" },
];

// Regroupement d'affichage par-dessus ALL_SUBJECTS (src/lib/education.ts),
// qui reste la source de vérité. Français reste en Soutien scolaire (langue
// d'enseignement en Afrique francophone) ; Anglais seul en Langues.
export const SUBJECT_TO_CATEGORY: Record<string, string> = {
  "Mathématiques": "soutien-scolaire",
  "Français": "soutien-scolaire",
  "Physique-Chimie": "soutien-scolaire",
  "SVT": "soutien-scolaire",
  "Histoire-Géo": "soutien-scolaire",
  "Philosophie": "soutien-scolaire",
  "Anglais": "langues",
  "Informatique": "competences",
  "Économie": "competences",
  "Autre": "soutien-scolaire",
};
