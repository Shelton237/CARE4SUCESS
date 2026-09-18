import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { NavLink, useSearchParams } from "react-router-dom";
import { Search, Star, ArrowRight, GraduationCap, BookOpen, Award, Users, Filter, MapPin, Loader2 } from "lucide-react";
import { fetchPublicTeachers, type PublicTeacher } from "@/api/public";
import { formatMoney } from "@/lib/money";
import { IMAGES } from "@/assets/images";
import { ALL_SUBJECTS } from "@/lib/education";
import { COACH_CATEGORIES, SUBJECT_TO_CATEGORY } from "@/lib/coachCategories";
import { ROUTE_PATHS } from "@/lib/index";
import { springPresets, staggerContainer, staggerItem } from "@/lib/motion";
import { Breadcrumb } from "@/components/Layout";

const STATS = [
  { value: "500+", label: "coachs actifs",       icon: Users },
  { value: "Bac+3", label: "minimum requis",      icon: GraduationCap },
  { value: "1/10",  label: "candidats retenus",   icon: Award },
  { value: "4,4/5", label: "note moyenne",        icon: Star },
];

export default function Professeurs() {
  const [searchParams] = useSearchParams();

  const [search,   setSearch]   = useState("");
  const [subject,  setSubject]  = useState(() => searchParams.get("matiere") ?? "all");
  const [category, setCategory] = useState(() => searchParams.get("categorie") ?? "all");
  const [level,    setLevel]    = useState(() => searchParams.get("niveau") ?? "all");

  const { data: teachers, isLoading, isError } = useQuery({
    queryKey: ["public-teachers"],
    queryFn: fetchPublicTeachers,
  });

  const levels = useMemo(() => {
    const set = new Set((teachers ?? []).map(t => t.level).filter(Boolean));
    return Array.from(set).sort();
  }, [teachers]);

  const filtered = useMemo(() => (teachers ?? []).filter(t => {
    const q           = search.toLowerCase();
    const matchSearch = !q || t.name.toLowerCase().includes(q) || t.subjects.some(s => s.toLowerCase().includes(q));
    const matchSub     = subject === "all" || t.subjects.includes(subject);
    const matchCategory = category === "all" || t.subjects.some(s => SUBJECT_TO_CATEGORY[s] === category);
    const matchLvl     = level === "all" || t.level === level;
    return matchSearch && matchSub && matchCategory && matchLvl;
  }), [teachers, search, subject, category, level]);

  const reset = () => { setSearch(""); setSubject("all"); setCategory("all"); setLevel("all"); };

  return (
    <div className="min-h-screen" style={{ fontFamily: "Ubuntu, 'Noto Sans', sans-serif" }}>

      {/* ── HERO ── */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${IMAGES.TEACHER_STUDENT_3})` }} />
        <div className="absolute inset-0 bg-[#0D2D5A]/78" />
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#1A6CC8]/20 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3 pointer-events-none" />

        <div className="container mx-auto px-6 max-w-5xl relative z-10">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={springPresets.gentle} className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[#F5A623] mb-4">Nos coachs</p>
            <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-5">
              500+ coachs<br />
              <span className="text-[#F5A623]">rigoureusement sélectionnés</span>
            </h1>
            <p className="text-blue-200 text-lg leading-relaxed max-w-xl mb-8">
              Bac+3 minimum. Entretien pédagogique. Références vérifiées. 1 candidat sur 10 retenu. Sélectionnés à travers 15 pays africains.
            </p>
            <NavLink to="/inscription" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#F5A623] text-[#0D2D5A] font-bold text-sm hover:bg-white transition-all duration-200 shadow-lg cursor-pointer">
              Trouver mon coach <ArrowRight className="w-4 h-4" />
            </NavLink>
          </motion.div>
        </div>
      </section>

      <Breadcrumb />

      {/* ── STATS ── */}
      <section className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-gray-100">
            {STATS.map(({ value, label, icon: Icon }) => (
              <div key={label} className="flex flex-col items-center text-center py-8 px-6">
                <div className="w-9 h-9 rounded-xl bg-[#1A6CC8]/8 flex items-center justify-center mb-2">
                  <Icon className="w-4.5 h-4.5 text-[#1A6CC8]" />
                </div>
                <p className="text-2xl font-black text-[#0D2D5A] font-mono">{value}</p>
                <p className="text-xs text-gray-500 mt-1 font-medium">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FILTRES + GRILLE ── */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6 max-w-6xl">

          {/* Catégories */}
          <div className="flex flex-wrap gap-2 mb-5">
            <button
              onClick={() => setCategory("all")}
              className={`px-4 py-2 rounded-full text-xs font-bold border transition-all duration-150 cursor-pointer ${
                category === "all"
                  ? "bg-[#0D2D5A] border-[#0D2D5A] text-white"
                  : "bg-white border-gray-200 text-gray-500 hover:border-[#0D2D5A]/30"
              }`}
            >
              Tous les univers
            </button>
            {COACH_CATEGORIES.map(cat => (
              <button
                key={cat.key}
                onClick={() => setCategory(cat.key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold border transition-all duration-150 cursor-pointer ${
                  category === cat.key
                    ? "text-white border-transparent"
                    : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
                style={category === cat.key ? { backgroundColor: cat.color } : undefined}
              >
                <cat.icon className="w-3.5 h-3.5" /> {cat.label}
              </button>
            ))}
          </div>

          {/* Filtres */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={springPresets.gentle}
            className="bg-white rounded-2xl border border-gray-100 p-5 mb-8 shadow-sm"
          >
            <div className="flex flex-wrap gap-3 items-end">
              {/* Recherche */}
              <div className="flex-1 min-w-52">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 block mb-1.5">Rechercher</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Nom, matière…"
                    className="w-full h-10 pl-9 pr-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1A6CC8] transition-colors"
                  />
                </div>
              </div>

              {/* Matière */}
              <div className="min-w-44">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 block mb-1.5 flex items-center gap-1">
                  <BookOpen className="w-3 h-3" /> Matière
                </label>
                <select
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className="h-10 w-full rounded-xl border border-gray-200 text-sm px-3 focus:outline-none focus:border-[#1A6CC8] transition-colors bg-white cursor-pointer"
                >
                  <option value="all">Toutes les matières</option>
                  {ALL_SUBJECTS.filter(s => s !== "Autre").map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Niveau */}
              <div className="min-w-44">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 block mb-1.5 flex items-center gap-1">
                  <GraduationCap className="w-3 h-3" /> Niveau
                </label>
                <select
                  value={level}
                  onChange={e => setLevel(e.target.value)}
                  className="h-10 w-full rounded-xl border border-gray-200 text-sm px-3 focus:outline-none focus:border-[#1A6CC8] transition-colors bg-white cursor-pointer"
                >
                  <option value="all">Tous les niveaux</option>
                  {levels.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>

              {/* Reset */}
              {(search || subject !== "all" || category !== "all" || level !== "all") && (
                <button
                  onClick={reset}
                  className="h-10 px-4 rounded-xl text-sm font-semibold text-gray-400 border border-gray-200 hover:border-red-200 hover:text-red-400 transition-all duration-150 flex items-center gap-1.5 cursor-pointer"
                >
                  <Filter className="w-3.5 h-3.5" /> Réinitialiser
                </button>
              )}
            </div>

            {!isLoading && !isError && (
              <p className="text-xs text-gray-400 mt-3 pt-3 border-t border-gray-100">
                <span className="font-bold text-[#0D2D5A]">{filtered.length}</span> coach{filtered.length > 1 ? "s" : ""} trouvé{filtered.length > 1 ? "s" : ""}
              </p>
            )}
          </motion.div>

          {/* Grille */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <Loader2 className="w-7 h-7 text-[#1A6CC8] animate-spin" />
              <p className="text-sm text-gray-400">Chargement des coachs…</p>
            </div>
          ) : isError ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
              <p className="font-bold text-[#0D2D5A] mb-1">Impossible de charger les coachs</p>
              <p className="text-sm text-gray-400">Veuillez réessayer dans quelques instants.</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
              <p className="text-3xl mb-3 opacity-30">🔍</p>
              <p className="font-bold text-[#0D2D5A] mb-1">Aucun résultat</p>
              <p className="text-sm text-gray-400 mb-4">Essayez d'autres critères de recherche.</p>
              <button onClick={reset} className="text-sm font-bold text-[#1A6CC8] hover:underline cursor-pointer">Réinitialiser les filtres</button>
            </div>
          ) : (
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
            >
              {filtered.map(teacher => (
                <TeacherCard key={teacher.id} teacher={teacher} />
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 bg-[#0D2D5A] relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="container mx-auto px-6 max-w-3xl relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={springPresets.gentle}>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[#F5A623] mb-4">Vous voulez coacher ?</p>
            <h2 className="text-3xl font-black text-white mb-4">Rejoignez notre réseau</h2>
            <p className="text-blue-200/70 mb-8">Postulez en 10 minutes. Notre équipe examine votre dossier sous 48h.</p>
            <NavLink to={ROUTE_PATHS.DEVENIR_PROFESSEUR} className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-[#F5A623] text-[#0D2D5A] font-bold hover:bg-white transition-all duration-200 shadow-lg cursor-pointer">
              Devenir coach Care4Success <ArrowRight className="w-4 h-4" />
            </NavLink>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

function TeacherCard({ teacher }: { teacher: PublicTeacher }) {
  const initials = teacher.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const location = [teacher.city, teacher.country].filter(Boolean).join(", ");

  return (
    <motion.div variants={staggerItem}>
      <NavLink to={`/professeurs/${teacher.id}`} className="block h-full cursor-pointer">
        <div className="h-full bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-[#1A6CC8]/20 transition-all duration-200 overflow-hidden flex flex-col">
          <div className="h-1 bg-[#F5A623]" />
          <div className="relative h-52 overflow-hidden bg-gradient-to-br from-[#0D2D5A] to-[#1A6CC8]">
            {teacher.avatarUrl ? (
              <img src={teacher.avatarUrl} alt={teacher.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white font-black text-4xl">
                {initials}
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0D2D5A]/80 via-[#0D2D5A]/10 to-transparent" />
            <div className="absolute bottom-3 left-3 right-3">
              <p className="text-white font-black text-base leading-tight">{teacher.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star key={i} className={`w-3 h-3 ${i <= Math.floor(teacher.rating) ? "fill-[#F5A623] text-[#F5A623]" : "text-white/20"}`} />
                  ))}
                </div>
                <span className="text-[#F5A623] text-xs font-bold">{teacher.rating.toFixed(1)}</span>
              </div>
            </div>
          </div>

          <div className="p-4 flex-1 flex flex-col gap-3">
            {location && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <MapPin className="w-3.5 h-3.5 text-[#1A6CC8]" />
                <span>{location}</span>
              </div>
            )}

            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1.5">Matières</p>
              <div className="flex flex-wrap gap-1">
                {teacher.subjects.slice(0, 3).map(s => (
                  <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-[#1A6CC8]/8 text-[#1A6CC8] font-semibold border border-[#1A6CC8]/15">{s}</span>
                ))}
                {teacher.subjects.length > 3 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-400 font-semibold">+{teacher.subjects.length - 3}</span>
                )}
              </div>
            </div>

            {teacher.level && (
              <span className="self-start text-[10px] px-2 py-0.5 rounded-full border-2 border-[#F5A623]/60 text-[#0D2D5A] font-medium">{teacher.level}</span>
            )}

            <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-black text-[#0D2D5A]">{formatMoney(teacher.rate, teacher.currency)}</p>
                <p className="text-[10px] text-gray-400">/ {teacher.rateUnitMinutes} min</p>
              </div>
              <span className="flex items-center gap-1.5 text-xs font-bold text-[#1A6CC8]">
                Voir le profil <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>
      </NavLink>
    </motion.div>
  );
}
