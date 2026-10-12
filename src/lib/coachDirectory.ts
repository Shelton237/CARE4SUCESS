import type { PublicTeacher } from "@/api/public";
export const DIRECTORY_LANGUAGES = ["Anglais", "Français", "Espagnol", "Allemand", "Italien", "Arabe", "Portugais", "Chinois"];
export const DIRECTORY_SKILLS = ["Développement web", "Bureautique", "Marketing digital", "Comptabilité", "Design", "Gestion de projet", "Informatique", "Économie"];
export type DirectoryCategory = "langues" | "competences";
export type DirectoryFilters = { subjects: string[]; formats: string[]; levels: string[]; min: number; max: number; currency: string };
export const blankDirectoryFilters = (): DirectoryFilters => ({ subjects: [], formats: [], levels: [], min: 0, max: 200000, currency: "XAF" });
export const normalizeDirectoryText = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
// Les langues parlées sur un profil ne sont pas nécessairement des langues enseignées.
export const coachTopics = (teacher: PublicTeacher) => [...new Set(teacher.subjects ?? [])];
export function coachCategoryMatches(teacher: PublicTeacher, category: DirectoryCategory) {
  const topics = coachTopics(teacher).map(normalizeDirectoryText);
  return topics.includes("langues et competences") || (category === "langues" ? DIRECTORY_LANGUAGES : DIRECTORY_SKILLS).some(topic => topics.includes(normalizeDirectoryText(topic)));
}
export function coachFormats(teacher: PublicTeacher) {
  const formats = (teacher.formats ?? []).map(normalizeDirectoryText);
  return { online: formats.some(f => /ligne|online|visio|hybride|hybrid/.test(f)), onsite: formats.some(f => /presentiel|in.person|hybride|hybrid/.test(f)) };
}
export function hourlyCoachRate(teacher: PublicTeacher) {
  return teacher.rateType === "hourly" ? teacher.rate * 60 / (teacher.rateUnitMinutes || 60) : null;
}
export function filterDirectoryCoaches(teachers: PublicTeacher[], category: DirectoryCategory, search: string, location: string, filters: DirectoryFilters) {
  const query = normalizeDirectoryText(search);
  return teachers.filter(teacher => {
    if (!coachCategoryMatches(teacher, category)) return false;
    const topics = coachTopics(teacher);
    if (query && !normalizeDirectoryText([teacher.name, ...topics, ...(teacher.specialties ?? []), teacher.headline ?? ""].join(" ")).includes(query)) return false;
    if (location && [teacher.city, teacher.country].filter(Boolean).join(", ") !== location) return false;
    if (filters.subjects.length && !filters.subjects.some(s => topics.some(topic => normalizeDirectoryText(topic) === normalizeDirectoryText(s)))) return false;
    const formats = coachFormats(teacher);
    if (filters.formats.length && !filters.formats.some(f => f === "online" ? formats.online : f === "onsite" ? formats.onsite : formats.online && formats.onsite)) return false;
    if (filters.levels.length && !filters.levels.includes(teacher.level)) return false;
    if (filters.min > 0 || filters.max < 200000) {
      const hourly = hourlyCoachRate(teacher);
      if (teacher.currency !== filters.currency || hourly === null || hourly < filters.min || hourly > filters.max) return false;
    }
    return true;
  });
}
