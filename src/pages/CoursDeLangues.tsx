import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { NavLink } from "react-router-dom";
import { Search, Star, ArrowRight } from "lucide-react";
import { fetchPublicTeachers, type PublicTeacher } from "@/api/public";
import { formatMoney } from "@/lib/money";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Breadcrumb } from "@/components/Layout";
import { IMAGES } from "@/assets/images";

// Les langues réellement proposées aujourd'hui sur la plateforme — limité
// aux valeurs présentes dans la taxonomie des matières (src/lib/education.ts),
// donc uniquement celles qu'un coach peut effectivement sélectionner sur son profil.
const LANGUAGES = ["Anglais", "Français"];

const SORT_OPTIONS = [
  { value: "pertinence", label: "Trier par pertinence" },
  { value: "note", label: "Meilleure note" },
  { value: "prix-asc", label: "Prix croissant" },
  { value: "prix-desc", label: "Prix décroissant" },
];

export default function CoursDeLangues() {
  const [search, setSearch] = useState("");
  const [language, setLanguage] = useState("all");
  const [level, setLevel] = useState("all");
  const [sort, setSort] = useState("pertinence");

  const { data: teachers, isLoading, isError } = useQuery({
    queryKey: ["public-teachers"],
    queryFn: fetchPublicTeachers,
  });

  const languageCoaches = useMemo(
    () => (teachers ?? []).filter(t => t.subjects.some(s => LANGUAGES.includes(s))),
    [teachers]
  );

  const levels = useMemo(() => {
    const set = new Set(languageCoaches.map(t => t.level).filter(Boolean));
    return Array.from(set).sort();
  }, [languageCoaches]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const list = languageCoaches.filter(t => {
      const matchSearch = !q || t.name.toLowerCase().includes(q) || t.subjects.some(s => s.toLowerCase().includes(q));
      const matchLanguage = language === "all" || t.subjects.includes(language);
      const matchLevel = level === "all" || t.level === level;
      return matchSearch && matchLanguage && matchLevel;
    });
    const sorted = [...list];
    if (sort === "note") sorted.sort((a, b) => b.rating - a.rating);
    if (sort === "prix-asc") sorted.sort((a, b) => a.rate - b.rate);
    if (sort === "prix-desc") sorted.sort((a, b) => b.rate - a.rate);
    return sorted;
  }, [languageCoaches, search, language, level, sort]);

  return (
    <div className="min-h-screen bg-[#F4F2ED]" style={{ fontFamily: "Ubuntu, 'Noto Sans', sans-serif" }}>

      {/* ── HEADER ── */}
      <section className="relative overflow-hidden bg-[#0B2545] py-14">
        <div className="absolute inset-0">
          <img
            src={IMAGES.STUDENTS_STUDYING_5}
            alt="Cours de langues"
            className="w-full h-full object-cover opacity-40 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B2545]/90 to-[#0B2545]/60" />
        </div>
        <div className="container mx-auto px-6 max-w-5xl relative z-10">
          <h1 className="text-4xl font-bold text-white mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
            Cours de langues
          </h1>
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Quelle langue voulez-vous apprendre ?"
                className="w-full h-11 pl-11 pr-4 rounded-xl border-0 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
              />
            </div>
            <button className="h-11 px-6 rounded-xl bg-[#F5A623] text-[#0D2D5A] text-sm font-bold hover:bg-[#e09520] transition-colors">
              Rechercher
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setLanguage("all")}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
                language === "all" ? "bg-[#F5A623] text-[#0D2D5A]" : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              Toutes
            </button>
            {LANGUAGES.map(lang => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
                  language === lang ? "bg-[#F5A623] text-[#0D2D5A]" : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>
      </section>

      <Breadcrumb />

      {/* ── RÉSULTATS ── */}
      <section className="py-10">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <p className="text-sm text-gray-500">
              <span className="font-bold text-[#0D2D5A]">{filtered.length}</span> coach{filtered.length > 1 ? "s" : ""} disponible{filtered.length > 1 ? "s" : ""}
            </p>
            <div className="flex flex-wrap gap-3">
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger className="h-9 w-auto bg-white text-xs"><SelectValue placeholder="Tous les niveaux" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les niveaux</SelectItem>
                  {levels.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="h-9 w-auto bg-white text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <p className="text-sm text-gray-400 py-16 text-center">Chargement des coachs…</p>
          ) : isError ? (
            <p className="text-sm text-gray-400 py-16 text-center">Impossible de charger les coachs. Veuillez réessayer.</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-gray-400 py-16 text-center">Aucun coach ne correspond à votre recherche.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map(teacher => (
                <LanguageCoachCard key={teacher.id} teacher={teacher} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function LanguageCoachCard({ teacher }: { teacher: PublicTeacher }) {
  const initials = teacher.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <NavLink to={`/professeurs/${teacher.id}`} className="block bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-shadow duration-200 overflow-hidden">
      <div className="h-24 bg-[#F4F2ED] flex items-center justify-center">
        {teacher.avatarUrl ? (
          <img src={teacher.avatarUrl} alt={teacher.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-2xl font-bold text-[#0D2D5A]" style={{ fontFamily: "'Playfair Display', serif" }}>{initials}</span>
        )}
      </div>
      <div className="p-4">
        <p className="font-bold text-[#0D2D5A]">{teacher.name}</p>
        <p className="text-xs text-gray-500 mt-0.5">
          {[...teacher.subjects, teacher.country].filter(Boolean).join(" · ")}
        </p>
        <div className="flex items-center gap-1 mt-2">
          {[1, 2, 3, 4, 5].map(i => (
            <Star key={i} className={`w-3 h-3 ${i <= Math.round(teacher.rating) ? "fill-[#F5A623] text-[#F5A623]" : "text-gray-200"}`} />
          ))}
          <span className="text-xs font-bold text-[#0D2D5A] ml-1">{teacher.rating.toFixed(1)}</span>
        </div>
        <div className="flex items-center justify-between mt-3">
          <div>
            <p className="text-sm font-black text-[#0D2D5A]">{formatMoney(teacher.rate, teacher.currency)}/h</p>
            <p className="text-[10px] text-gray-400">{teacher.students} session{teacher.students > 1 ? "s" : ""}</p>
          </div>
          <span className="text-xs font-bold text-[#F5A623] flex items-center gap-1">
            Voir le profil <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </NavLink>
  );
}
