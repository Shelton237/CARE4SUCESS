import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { NavLink, useSearchParams } from "react-router-dom";
import { Search, Star, ArrowRight, GraduationCap, BookOpen, Award, Users, Filter } from "lucide-react";
import { teachers } from "@/data/index";
import { IMAGES } from "@/assets/images";
import { ALL_SUBJECTS } from "@/lib/education";
import { ROUTE_PATHS } from "@/lib/index";
import { springPresets, staggerContainer, staggerItem } from "@/lib/motion";

const LEVEL_CATEGORIES = ["Primaire", "Collège", "Lycée", "Supérieur", "Adultes"];
const LEVEL_KEYS: Record<string, string> = {
  "Primaire":   "primaire",
  "Collège":    "college",
  "Lycée":      "lycee",
  "Supérieur":  "superieur",
  "Adultes":    "adulte",
};

const STATS = [
  { value: "500+", label: "enseignants actifs",  icon: Users },
  { value: "Bac+3", label: "minimum requis",      icon: GraduationCap },
  { value: "1/10",  label: "candidats retenus",   icon: Award },
  { value: "4,4/5", label: "note moyenne",        icon: Star },
];

export default function Professeurs() {
  const [searchParams] = useSearchParams();

  const [search,  setSearch]  = useState("");
  const [subject, setSubject] = useState(() => searchParams.get("matiere") ?? "all");
  const [level,   setLevel]   = useState(() => searchParams.get("niveau")  ?? "all");

  const filtered = useMemo(() => teachers.filter(t => {
    const q          = search.toLowerCase();
    const matchSearch = !q || t.name.toLowerCase().includes(q) || t.subjects.some(s => s.toLowerCase().includes(q));
    const matchSub    = subject === "all" || t.subjects.some(s => s.toLowerCase().includes(subject.toLowerCase()));
    const key         = LEVEL_KEYS[level] ?? level.toLowerCase();
    const matchLvl    = level   === "all" || t.levels.some(l => l.toLowerCase() === key);
    return matchSearch && matchSub && matchLvl;
  }), [search, subject, level]);

  const reset = () => { setSearch(""); setSubject("all"); setLevel("all"); };

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
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[#F5A623] mb-4">Nos enseignants</p>
            <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-5">
              500+ enseignants<br />
              <span className="text-[#F5A623]">rigoureusement sélectionnés</span>
            </h1>
            <p className="text-blue-200 text-lg leading-relaxed max-w-xl mb-8">
              Bac+3 minimum. Entretien pédagogique. Références vérifiées. 1 candidat sur 10 retenu. Sélectionnés à travers 15 pays africains.
            </p>
            <NavLink to="/inscription" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#F5A623] text-[#0D2D5A] font-bold text-sm hover:bg-white transition-all duration-200 shadow-lg cursor-pointer">
              Trouver mon enseignant <ArrowRight className="w-4 h-4" />
            </NavLink>
          </motion.div>
        </div>
      </section>

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
                  {LEVEL_CATEGORIES.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>

              {/* Reset */}
              {(search || subject !== "all" || level !== "all") && (
                <button
                  onClick={reset}
                  className="h-10 px-4 rounded-xl text-sm font-semibold text-gray-400 border border-gray-200 hover:border-red-200 hover:text-red-400 transition-all duration-150 flex items-center gap-1.5 cursor-pointer"
                >
                  <Filter className="w-3.5 h-3.5" /> Réinitialiser
                </button>
              )}
            </div>

            {filtered.length > 0 && (
              <p className="text-xs text-gray-400 mt-3 pt-3 border-t border-gray-100">
                <span className="font-bold text-[#0D2D5A]">{filtered.length}</span> enseignant{filtered.length > 1 ? "s" : ""} trouvé{filtered.length > 1 ? "s" : ""}
              </p>
            )}
          </motion.div>

          {/* Grille */}
          {filtered.length === 0 ? (
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
                <motion.div key={teacher.id} variants={staggerItem}>
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-[#1A6CC8]/20 transition-all duration-200 overflow-hidden flex flex-col">
                    <div className="h-1 bg-[#F5A623]" />
                    <div className="relative h-52 overflow-hidden">
                      <img src={teacher.photo} alt={teacher.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0D2D5A]/80 via-[#0D2D5A]/20 to-transparent" />
                      <div className="absolute bottom-3 left-3 right-3">
                        <p className="text-white font-black text-base leading-tight">{teacher.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className="flex gap-0.5">
                            {[1,2,3,4,5].map(i => (
                              <Star key={i} className={`w-3 h-3 ${i <= Math.floor(teacher.rating) ? "fill-[#F5A623] text-[#F5A623]" : "text-white/20"}`} />
                            ))}
                          </div>
                          <span className="text-[#F5A623] text-xs font-bold">{teacher.rating.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 flex-1 flex flex-col gap-3">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <GraduationCap className="w-3.5 h-3.5 text-[#1A6CC8]" />
                        <span><strong className="text-[#0D2D5A]">{teacher.experience} ans</strong> d'expérience</span>
                      </div>

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

                      <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed flex-1">{teacher.bio}</p>

                      <NavLink
                        to="/inscription"
                        className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#0D2D5A] text-white text-xs font-bold hover:bg-[#1A6CC8] transition-all duration-150 cursor-pointer mt-auto"
                      >
                        Demander ce prof <ArrowRight className="w-3.5 h-3.5" />
                      </NavLink>
                    </div>
                  </div>
                </motion.div>
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
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[#F5A623] mb-4">Vous enseignez ?</p>
            <h2 className="text-3xl font-black text-white mb-4">Rejoignez notre réseau</h2>
            <p className="text-blue-200/70 mb-8">Postulez en 10 minutes. Notre équipe examine votre dossier sous 48h.</p>
            <NavLink to={ROUTE_PATHS.DEVENIR_PROFESSEUR} className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-[#F5A623] text-[#0D2D5A] font-bold hover:bg-white transition-all duration-200 shadow-lg cursor-pointer">
              Devenir enseignant Care4Success <ArrowRight className="w-4 h-4" />
            </NavLink>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
