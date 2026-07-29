import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { NavLink } from "react-router-dom";
import {
  Search, Star, ArrowRight, GraduationCap, BookOpen, Users, Filter, Loader2, MapPin,
  ShieldCheck, CalendarCheck, CreditCard, Video, CheckCircle2, BadgeCheck, ClipboardCheck,
  Globe2, SearchX,
} from "lucide-react";
import { fetchPublicTeachers } from "@/api/public";
import { formatMoney } from "@/lib/money";
import { ALL_SUBJECTS, ALL_LEVELS } from "@/lib/education";
import { ROUTE_PATHS } from "@/lib/index";
import { springPresets, staggerContainer, staggerItem } from "@/lib/motion";

const SELECTION_CRITERIA = [
  "Diplôme Bac+3 minimum vérifié",
  "Entretien pédagogique avant validation",
  "Références professionnelles contrôlées",
  "1 candidat sur 10 retenu",
];

const HOW_IT_WORKS = [
  { n: "01", title: "Recherchez", desc: "Filtrez par matière et niveau pour trouver l'enseignant qui correspond à votre besoin.", icon: Search },
  { n: "02", title: "Consultez le profil", desc: "Tarif, matières, créneaux disponibles : tout est visible avant de vous engager.", icon: BadgeCheck },
  { n: "03", title: "Réservez et payez", desc: "Choisissez un créneau et payez en Mobile Money, en toute sécurité.", icon: CreditCard },
  { n: "04", title: "Rejoignez le cours", desc: "Le lien de la classe virtuelle vous est envoyé par email avant la séance.", icon: Video },
];

const OPERATIONAL_BENEFITS = [
  { icon: ShieldCheck, title: "Profils vérifiés", desc: "Chaque enseignant affiché a été validé par notre équipe pédagogique." },
  { icon: CalendarCheck, title: "Créneaux réels", desc: "Les disponibilités affichées sont celles définies par l'enseignant lui-même." },
  { icon: CreditCard, title: "Paiement sécurisé", desc: "Mobile Money (MTN, Orange), confirmation immédiate après paiement." },
  { icon: ClipboardCheck, title: "Suivi assuré", desc: "Vos séances réservées apparaissent automatiquement dans votre espace élève." },
];

function StatSkeleton() {
  return (
    <div className="flex flex-col items-center text-center py-8 px-6">
      <div className="w-9 h-9 rounded-xl bg-gray-100 animate-pulse mb-2" />
      <div className="h-6 w-14 rounded bg-gray-100 animate-pulse mb-2" />
      <div className="h-3 w-20 rounded bg-gray-100 animate-pulse" />
    </div>
  );
}

export default function Professeurs() {
  const [search, setSearch]   = useState("");
  const [subject, setSubject] = useState("all");
  const [level,   setLevel]   = useState("all");
  const [country, setCountry] = useState("all");
  const [region,  setRegion]  = useState("all");

  const { data: teachers = [], isLoading, isError } = useQuery({
    queryKey: ["public-teachers"],
    queryFn: fetchPublicTeachers,
    staleTime: 60_000,
  });

  // Options dérivées des enseignants réels (jamais la liste complète des ~30
  // pays pris en charge par la plateforme) : on ne propose que des filtres
  // qui renvoient au moins un résultat.
  const countryOptions = useMemo(() => {
    const map = new Map<number, string>();
    teachers.forEach(t => { if (t.countryId && t.country) map.set(t.countryId, t.country); });
    return Array.from(map, ([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [teachers]);

  const regionOptions = useMemo(() => {
    const map = new Map<number, string>();
    teachers
      .filter(t => country === "all" || t.countryId === Number(country))
      .forEach(t => { if (t.regionId && t.region) map.set(t.regionId, t.region); });
    return Array.from(map, ([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [teachers, country]);

  const filtered = useMemo(() => teachers.filter(t => {
    const q = search.toLowerCase();
    const matchSearch = !q || t.name.toLowerCase().includes(q) || t.subjects.some(s => s.toLowerCase().includes(q));
    const matchSub     = subject === "all" || t.subjects.some(s => s.toLowerCase().includes(subject.toLowerCase()));
    const matchLvl     = level   === "all" || (t.level || "").toLowerCase().includes(level.toLowerCase());
    const matchCountry = country === "all" || t.countryId === Number(country);
    const matchRegion  = region  === "all" || t.regionId === Number(region);
    return matchSearch && matchSub && matchLvl && matchCountry && matchRegion;
  }), [teachers, search, subject, level, country, region]);

  // Statistiques calculées à partir des enseignants réellement actifs — jamais
  // de chiffres marketing figés : si la plateforme compte 3 enseignants, on
  // affiche 3.
  const liveStats = useMemo(() => {
    if (!teachers.length) return null;
    const rated = teachers.filter(t => t.rating > 0);
    const avgRating = rated.length ? rated.reduce((sum, t) => sum + t.rating, 0) / rated.length : null;
    const subjectsCount = new Set(teachers.flatMap(t => t.subjects)).size;
    const citiesCount = new Set(teachers.map(t => t.city).filter(Boolean)).size;
    return {
      count: teachers.length,
      avgRating,
      subjectsCount,
      citiesCount,
    };
  }, [teachers]);

  const statItems = liveStats ? [
    { value: String(liveStats.count), label: `enseignant${liveStats.count > 1 ? "s" : ""} vérifié${liveStats.count > 1 ? "s" : ""}`, icon: ShieldCheck },
    { value: liveStats.avgRating ? liveStats.avgRating.toFixed(1) + "/5" : "—", label: "note moyenne", icon: Star },
    { value: String(liveStats.subjectsCount), label: `matière${liveStats.subjectsCount > 1 ? "s" : ""} couverte${liveStats.subjectsCount > 1 ? "s" : ""}`, icon: BookOpen },
    { value: String(liveStats.citiesCount), label: `ville${liveStats.citiesCount > 1 ? "s" : ""} couverte${liveStats.citiesCount > 1 ? "s" : ""}`, icon: MapPin },
  ] : [];

  const reset = () => { setSearch(""); setSubject("all"); setLevel("all"); setCountry("all"); setRegion("all"); };

  return (
    <div className="min-h-screen" style={{ fontFamily: "Ubuntu, 'Noto Sans', sans-serif" }}>

      {/* ── HERO ── */}
      <section
        className="relative py-24 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0D2D5A 0%, #123a73 55%, #1A6CC8 130%)" }}
      >
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#F5A623]/10 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#1A6CC8]/30 rounded-full blur-3xl -translate-x-1/3 translate-y-1/3 pointer-events-none" />

        <div className="container mx-auto px-6 max-w-5xl relative z-10">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={springPresets.gentle} className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[#F5A623] mb-4">Nos enseignants</p>
            <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-5">
              Des enseignants<br />
              <span className="text-[#F5A623]">rigoureusement sélectionnés</span>
            </h1>
            <p className="text-blue-200 text-lg leading-relaxed max-w-xl mb-8">
              Bac+3 minimum. Entretien pédagogique. Références vérifiées. Réservez directement un créneau et payez en toute sécurité.
            </p>
            <div className="flex flex-wrap gap-4">
              <NavLink to="/inscription" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#F5A623] text-[#0D2D5A] font-bold text-sm hover:bg-white transition-all duration-200 shadow-lg cursor-pointer">
                Trouver mon enseignant <ArrowRight className="w-4 h-4" />
              </NavLink>
              <a href="#annuaire" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/30 text-white font-bold text-sm hover:bg-white/10 transition-all duration-200 cursor-pointer">
                Voir les profils
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── STATS RÉELLES ── */}
      <section className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-gray-100">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
            ) : liveStats ? (
              statItems.map(({ value, label, icon: Icon }) => (
                <div key={label} className="flex flex-col items-center text-center py-8 px-6">
                  <div className="w-9 h-9 rounded-xl bg-[#1A6CC8]/8 flex items-center justify-center mb-2">
                    <Icon className="w-4.5 h-4.5 text-[#1A6CC8]" />
                  </div>
                  <p className="text-2xl font-black text-[#0D2D5A] font-mono">{value}</p>
                  <p className="text-xs text-gray-500 mt-1 font-medium">{label}</p>
                </div>
              ))
            ) : (
              <div className="col-span-2 md:col-span-4 py-8 px-6 text-center text-sm text-gray-400">
                Nos premiers enseignants rejoignent la plateforme — revenez très bientôt.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── SÉLECTION ── */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6 max-w-5xl grid md:grid-cols-2 gap-10 items-center">
          <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={springPresets.gentle}>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#1A6CC8] mb-3">Notre exigence</p>
            <h2 className="text-2xl md:text-3xl font-black text-[#0D2D5A] mb-4">Pourquoi nos enseignants sont différents</h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              Aucun profil n'est mis en ligne sans validation. Chaque candidature passe par un processus de sélection
              strict avant qu'un enseignant ne puisse apparaître ici et être réservé.
            </p>
            <ul className="flex flex-col gap-3">
              {SELECTION_CRITERIA.map(item => (
                <li key={item} className="flex items-center gap-3">
                  <CheckCircle2 className="w-4.5 h-4.5 text-[#F5A623] shrink-0" />
                  <span className="text-sm font-semibold text-[#0D2D5A]">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={springPresets.gentle}
            className="relative rounded-2xl bg-[#0D2D5A] p-10 overflow-hidden"
          >
            <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
            <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-[#F5A623]/20 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col items-center text-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center">
                <ShieldCheck className="w-8 h-8 text-[#F5A623]" />
              </div>
              <p className="text-white font-black text-lg">Validation manuelle</p>
              <p className="text-blue-200 text-sm max-w-xs">
                Un enseignant n'est jamais visible publiquement tant que son dossier n'a pas été examiné et approuvé par notre équipe.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FILTRES + GRILLE ── */}
      <section id="annuaire" className="py-16 bg-white scroll-mt-4">
        <div className="container mx-auto px-6 max-w-6xl">

          <div className="mb-8 text-center max-w-xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-black text-[#0D2D5A] mb-2">L'annuaire des enseignants</h2>
            <p className="text-sm text-gray-500">Toutes les fiches ci-dessous sont réelles et directement réservables.</p>
          </div>

          {/* Filtres */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={springPresets.gentle}
            className="bg-gray-50 rounded-2xl border border-gray-100 p-5 mb-8"
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
                    className="w-full h-10 pl-9 pr-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-[#1A6CC8] transition-colors"
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
                  {ALL_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>

              {/* Pays — seulement les pays où au moins un enseignant réel est situé */}
              {countryOptions.length > 0 && (
                <div className="min-w-44">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 block mb-1.5 flex items-center gap-1">
                    <Globe2 className="w-3 h-3" /> Pays
                  </label>
                  <select
                    value={country}
                    onChange={e => { setCountry(e.target.value); setRegion("all"); }}
                    className="h-10 w-full rounded-xl border border-gray-200 text-sm px-3 focus:outline-none focus:border-[#1A6CC8] transition-colors bg-white cursor-pointer"
                  >
                    <option value="all">Tous les pays</option>
                    {countryOptions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}

              {/* Région — dépend du pays sélectionné */}
              {regionOptions.length > 0 && (
                <div className="min-w-44">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 block mb-1.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Région
                  </label>
                  <select
                    value={region}
                    onChange={e => setRegion(e.target.value)}
                    className="h-10 w-full rounded-xl border border-gray-200 text-sm px-3 focus:outline-none focus:border-[#1A6CC8] transition-colors bg-white cursor-pointer"
                  >
                    <option value="all">Toutes les régions</option>
                    {regionOptions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
              )}

              {/* Reset */}
              {(search || subject !== "all" || level !== "all" || country !== "all" || region !== "all") && (
                <button
                  onClick={reset}
                  className="h-10 px-4 rounded-xl text-sm font-semibold text-gray-400 border border-gray-200 hover:border-red-200 hover:text-red-400 transition-all duration-150 flex items-center gap-1.5 cursor-pointer"
                >
                  <Filter className="w-3.5 h-3.5" /> Réinitialiser
                </button>
              )}
            </div>

            {!isLoading && filtered.length > 0 && (
              <p className="text-xs text-gray-400 mt-3 pt-3 border-t border-gray-200">
                <span className="font-bold text-[#0D2D5A]">{filtered.length}</span> enseignant{filtered.length > 1 ? "s" : ""} trouvé{filtered.length > 1 ? "s" : ""}
              </p>
            )}
          </motion.div>

          {/* Grille */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-[#1A6CC8]" />
            </div>
          ) : isError ? (
            <div className="text-center py-20 bg-gray-50 rounded-2xl border border-gray-100">
              <p className="font-bold text-[#0D2D5A] mb-1">Impossible de charger les enseignants</p>
              <p className="text-sm text-gray-400">Merci de réessayer dans un instant.</p>
            </div>
          ) : teachers.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 rounded-2xl border border-gray-100">
              <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="font-bold text-[#0D2D5A] mb-1">Aucun enseignant en ligne pour le moment</p>
              <p className="text-sm text-gray-400 mb-4 max-w-sm mx-auto">
                Nos équipes valident actuellement de nouvelles candidatures. Revenez bientôt ou laissez-nous vos coordonnées.
              </p>
              <NavLink to="/inscription" className="text-sm font-bold text-[#1A6CC8] hover:underline">Être recontacté</NavLink>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 rounded-2xl border border-gray-100">
              <SearchX className="w-10 h-10 text-gray-200 mx-auto mb-3" />
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
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-[#1A6CC8]/20 transition-all duration-200 overflow-hidden flex flex-col h-full">
                    <div className="h-1 bg-[#F5A623]" />
                    <div className="p-5 flex flex-col gap-3 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          {teacher.avatarUrl ? (
                            <img
                              src={teacher.avatarUrl}
                              alt={teacher.name}
                              className="w-14 h-14 rounded-2xl object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-2xl bg-[#1A6CC8]/10 flex items-center justify-center font-black text-lg text-[#1A6CC8] flex-shrink-0">
                              {teacher.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-[#0D2D5A] font-black text-base leading-tight truncate">{teacher.name}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <div className="flex gap-0.5">
                                {[1,2,3,4,5].map(i => (
                                  <Star key={i} className={`w-3 h-3 ${i <= Math.floor(teacher.rating) ? "fill-[#F5A623] text-[#F5A623]" : "text-gray-200"}`} />
                                ))}
                              </div>
                              <span className="text-[#F5A623] text-xs font-bold">{teacher.rating.toFixed(1)}</span>
                            </div>
                          </div>
                        </div>
                        <span title="Profil validé par Care4Success" className="shrink-0 mt-1">
                          <BadgeCheck className="w-4.5 h-4.5 text-[#1A6CC8]" />
                        </span>
                      </div>

                      {(teacher.city || teacher.region || teacher.country) && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <MapPin className="w-3.5 h-3.5 text-[#1A6CC8]" />
                          <span>{[teacher.city, teacher.region, teacher.country].filter(Boolean).join(", ")}</span>
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

                      <p className="text-xs font-bold text-[#0D2D5A] mt-1">
                        {formatMoney(teacher.rate, teacher.currency)}
                        <span className="text-gray-400 font-medium"> / {teacher.rateType === "monthly" ? "mois" : `${teacher.rateUnitMinutes} min`}</span>
                      </p>

                      <NavLink
                        to={`/professeurs/${teacher.id}`}
                        className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#0D2D5A] text-white text-xs font-bold hover:bg-[#1A6CC8] transition-all duration-150 cursor-pointer mt-auto"
                      >
                        Voir le profil <ArrowRight className="w-3.5 h-3.5" />
                      </NavLink>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* ── COMMENT ÇA MARCHE ── */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="text-center mb-14">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#1A6CC8] mb-3">Simple et direct</p>
            <h2 className="text-2xl md:text-3xl font-black text-[#0D2D5A]">Comment réserver un enseignant</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            <div className="hidden lg:block absolute top-7 left-[12%] right-[12%] h-px bg-gray-200" />
            {HOW_IT_WORKS.map(({ n, title, desc, icon: Icon }) => (
              <motion.div
                key={n}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={springPresets.gentle}
                className="relative flex flex-col items-center text-center"
              >
                <div className="relative z-10 w-14 h-14 rounded-full bg-white border-2 border-[#0D2D5A] flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-[#0D2D5A]" />
                </div>
                <p className="text-[10px] font-black text-[#F5A623] tracking-[0.2em] mb-1">ÉTAPE {n}</p>
                <p className="font-black text-[#0D2D5A] mb-1.5">{title}</p>
                <p className="text-xs text-gray-500 leading-relaxed max-w-[220px]">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AVANTAGES OPÉRATIONNELS ── */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6 max-w-5xl grid md:grid-cols-2 gap-5">
          {OPERATIONAL_BENEFITS.map(({ icon: Icon, title, desc }) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={springPresets.gentle}
              className="flex items-start gap-4 p-5 rounded-2xl border border-gray-100 hover:border-[#1A6CC8]/20 hover:shadow-sm transition-all duration-200"
            >
              <div className="w-11 h-11 rounded-xl bg-[#1A6CC8]/8 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-[#1A6CC8]" />
              </div>
              <div>
                <p className="font-black text-[#0D2D5A] text-sm mb-1">{title}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 bg-[#0D2D5A] relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#1A6CC8]/15 rounded-full blur-3xl pointer-events-none" />
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
