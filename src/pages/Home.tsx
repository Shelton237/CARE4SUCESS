import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { NavLink } from "react-router-dom";
import {
  ArrowRight, Users, ShieldCheck, Wallet, CreditCard, ClipboardCheck,
  Search, BadgeCheck, CalendarCheck, MapPin, BookOpen, ChevronDown,
  Phone, Smartphone, Download, GraduationCap, CheckCircle,
} from "lucide-react";
import { fetchPublicTeachers } from "@/api/public";
import { ALL_SUBJECTS } from "@/lib/education";
import { IMAGES } from "@/assets/images";
import { HERO_IMAGES } from "@/assets/hero-images";
import { springPresets, staggerContainer, staggerItem } from "@/lib/motion";
import { ROUTE_PATHS } from "@/lib/index";

/* ─── DONNÉES ────────────────────────────────── */

const WHY_CARDS = [
  {
    icon: ShieldCheck,
    title: "Profils vérifiés",
    desc: "Chaque enseignant est examiné et validé par notre équipe avant d'apparaître sur la plateforme.",
  },
  {
    icon: Wallet,
    title: "Prix transparent",
    desc: "Le tarif de chaque enseignant est affiché clairement dès sa fiche, sans frais cachés.",
  },
  {
    icon: CreditCard,
    title: "Paiement sécurisé",
    desc: "Réglez vos séances en Mobile Money (MTN, Orange) — confirmation immédiate après paiement.",
  },
  {
    icon: ClipboardCheck,
    title: "Suivi personnalisé",
    desc: "Un conseiller pédagogique vous accompagne du premier contact jusqu'au suivi des progrès.",
  },
];

const HOW_IT_WORKS = [
  {
    n: "1", title: "Recherche et sélection",
    desc: "Personnalisez votre recherche à l'aide des filtres, consultez et sélectionnez l'enseignant qui vous convient.",
    image: IMAGES.ONLINE_LEARNING_1,
    pos: { top: "4%", left: "26%" }, textPos: { top: "6%", left: "46%" }, size: 168,
  },
  {
    n: "2", title: "Prise de contact",
    desc: "L'enseignant sélectionné vous répond sous 24h. Sinon, contactez-nous pour d'autres alternatives.",
    image: HERO_IMAGES.professeurs,
    pos: { top: "30%", left: "58%" }, textPos: { top: "26%", left: "2%" }, size: 168,
  },
  {
    n: "3", title: "Planification et réservation",
    desc: "Discutez de vos objectifs avec l'enseignant depuis la plateforme, planifiez vos heures et réservez le cours.",
    image: IMAGES.STUDENTS_STUDYING_9,
    pos: { top: "54%", left: "22%" }, textPos: { top: "56%", left: "46%" }, size: 168,
  },
  {
    n: "4", title: "Apprentissage",
    desc: "Une fois le cours réservé, il est temps de commencer à apprendre et à libérer votre potentiel.",
    image: HERO_IMAGES.professeursSelection,
    pos: { top: "78%", left: "58%" }, textPos: { top: "80%", left: "2%" }, size: 168,
  },
];

const BECOME_TEACHER_BENEFITS = [
  { icon: Users, label: "Trouvez de nouveaux élèves" },
  { icon: CalendarCheck, label: "Fixez vos disponibilités et vos tarifs" },
  { icon: CreditCard, label: "Paiement Mobile Money sécurisé" },
];

function hexClip(): React.CSSProperties {
  return { clipPath: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)" };
}

function HexAvatar({ src, name, size }: { src?: string | null; name: string; size: number }) {
  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div
      className="flex items-center justify-center bg-[#1A6CC8]/15 text-[#0D2D5A] font-black shrink-0 overflow-hidden"
      style={{ width: size, height: size, fontSize: size * 0.28, ...hexClip() }}
    >
      {src ? <img src={src} alt={name} className="w-full h-full object-cover" /> : initials}
    </div>
  );
}

/* ─── COMPOSANT PRINCIPAL ─────────────────────── */
export default function Home() {
  const [search, setSearch] = useState("");
  const [showAllSubjects, setShowAllSubjects] = useState(false);

  const { data: teachers = [] } = useQuery({
    queryKey: ["public-teachers"],
    queryFn: fetchPublicTeachers,
    staleTime: 60_000,
  });

  const topTeachers = teachers.slice(0, 3);
  const showcaseTeachers = teachers.slice(0, 4);

  // Compteurs réels par matière — jamais de chiffre inventé : une matière
  // sans enseignant actif affiche "Sur demande" plutôt qu'un faux total.
  const subjectCounts = useMemo(() => {
    const map = new Map<string, number>();
    teachers.forEach(t => t.subjects.forEach(s => map.set(s, (map.get(s) || 0) + 1)));
    return map;
  }, [teachers]);

  const allSubjects = ALL_SUBJECTS.filter(s => s !== "Autre");
  const visibleSubjects = showAllSubjects ? allSubjects : allSubjects.slice(0, 12);

  return (
    <div className="min-h-screen overflow-x-hidden bg-white" style={{ fontFamily: "Ubuntu, 'Noto Sans', sans-serif" }}>

      {/* ══════════════════════════════════════════════════════
          §1 — HERO : recherche + photos en nid d'abeille
          ══════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden" style={{ background: "linear-gradient(180deg, #EAF3FC 0%, #FFFFFF 100%)" }}>
        <div className="container mx-auto px-6 py-20 md:py-28 grid md:grid-cols-2 gap-12 items-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={springPresets.gentle}>
            <h1 className="text-4xl md:text-5xl font-black text-[#0D2D5A] leading-tight mb-4">
              Trouvez l'enseignant<br />adapté à vos besoins
            </h1>
            <p className="text-gray-500 text-base mb-8 max-w-md">
              Des profils pédagogiques vérifiés et une plateforme transparente, pour apprendre en toute sérénité.
            </p>
            <form
              onSubmit={e => { e.preventDefault(); }}
              className="flex items-center gap-2 bg-white rounded-xl border border-gray-200 shadow-sm p-1.5 max-w-md"
            >
              <Search className="w-4 h-4 text-gray-400 ml-2 shrink-0" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Que voulez-vous apprendre ?"
                className="flex-1 min-w-0 border-none outline-none text-sm text-[#0D2D5A] placeholder:text-gray-400"
              />
              <NavLink
                to={search ? `${ROUTE_PATHS.PROFESSEURS}?q=${encodeURIComponent(search)}` : ROUTE_PATHS.PROFESSEURS}
                className="shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#1A6CC8] text-white text-sm font-bold hover:bg-[#0D2D5A] transition-colors"
              >
                <Search className="w-3.5 h-3.5" /> Rechercher
              </NavLink>
            </form>
          </motion.div>

          {/* Photos en nid d'abeille — vrais enseignants actifs */}
          {topTeachers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ ...springPresets.gentle, delay: 0.15 }}
              className="relative hidden md:flex items-center justify-center h-96"
            >
              {topTeachers[0] && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10">
                  <HexAvatar src={topTeachers[0].avatarUrl} name={topTeachers[0].name} size={160} />
                  <p className="text-xs font-black text-[#0D2D5A] bg-white px-3 py-1 rounded-full shadow-sm">{topTeachers[0].name}</p>
                  <p className="text-[10px] text-gray-400 font-semibold -mt-1">{topTeachers[0].subjects[0]}</p>
                </div>
              )}
              {topTeachers[1] && (
                <div className="absolute bottom-4 left-8 flex flex-col items-center gap-2">
                  <HexAvatar src={topTeachers[1].avatarUrl} name={topTeachers[1].name} size={120} />
                  <p className="text-[11px] font-black text-[#0D2D5A] bg-white px-2.5 py-1 rounded-full shadow-sm">{topTeachers[1].name}</p>
                </div>
              )}
              {topTeachers[2] && (
                <div className="absolute bottom-4 right-8 flex flex-col items-center gap-2">
                  <HexAvatar src={topTeachers[2].avatarUrl} name={topTeachers[2].name} size={120} />
                  <p className="text-[11px] font-black text-[#0D2D5A] bg-white px-2.5 py-1 rounded-full shadow-sm">{topTeachers[2].name}</p>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          §2 — POURQUOI CARE4SUCCESS
          ══════════════════════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-xl mx-auto mb-14">
            <h2 className="text-2xl md:text-3xl font-black text-[#0D2D5A] mb-2">Pourquoi apprendre avec Care4Success ?</h2>
            <p className="text-sm text-gray-500">Renforcez vos connaissances grâce à des enseignants vérifiés et un service transparent.</p>
          </div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {WHY_CARDS.map(({ icon: Icon, title, desc }) => (
              <motion.div key={title} variants={staggerItem} className="text-center px-4">
                <div className="w-14 h-14 rounded-2xl bg-[#1A6CC8]/10 flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-6 h-6 text-[#1A6CC8]" />
                </div>
                <p className="font-black text-[#0D2D5A] text-sm mb-1.5">{title}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </motion.div>

          <div className="text-center mt-12">
            <NavLink
              to={ROUTE_PATHS.PROFESSEURS}
              className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-[#1A6CC8] text-white font-bold text-sm hover:bg-[#0D2D5A] transition-colors shadow-md"
            >
              Trouver un professeur <ArrowRight className="w-4 h-4" />
            </NavLink>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          §3 — ENSEIGNANTS EN VEDETTE (données réelles)
          ══════════════════════════════════════════════════════ */}
      {showcaseTeachers.length > 0 && (
        <section className="py-20 bg-[#F7FAFD]">
          <div className="container mx-auto px-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-[#0D2D5A] mb-2">Nos enseignants du moment</h2>
                <p className="text-sm text-gray-500">Des profils réels, déjà validés et réservables dès aujourd'hui.</p>
              </div>
              <NavLink to={ROUTE_PATHS.PROFESSEURS} className="inline-flex items-center gap-1.5 text-sm font-bold text-[#1A6CC8] hover:text-[#0D2D5A] transition-colors shrink-0">
                Voir tous les enseignants <ArrowRight className="w-4 h-4" />
              </NavLink>
            </div>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5"
            >
              {showcaseTeachers.map(teacher => (
                <motion.div key={teacher.id} variants={staggerItem}>
                  <div className="relative h-72 rounded-2xl overflow-hidden group shadow-sm">
                    {teacher.avatarUrl ? (
                      <img src={teacher.avatarUrl} alt={teacher.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full bg-[#0D2D5A] flex items-center justify-center text-white text-4xl font-black">
                        {teacher.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0D2D5A]/95 via-[#0D2D5A]/30 to-transparent" />
                    <div className="absolute top-3 right-3">
                      <BadgeCheck className="w-5 h-5 text-white drop-shadow" />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <p className="text-white font-black text-sm mb-0.5 truncate">{teacher.name}</p>
                      <p className="text-blue-200 text-xs mb-2 truncate">{teacher.subjects.slice(0, 2).join(" · ")}</p>
                      <NavLink
                        to={`/professeurs/${teacher.id}`}
                        className="inline-flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-[#1A6CC8] text-white text-xs font-bold hover:bg-white hover:text-[#0D2D5A] transition-colors"
                      >
                        Voir le profil <ArrowRight className="w-3 h-3" />
                      </NavLink>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════
          §4 — COMMENT ÇA MARCHE (parcours en 4 étapes, photos reliées)
          ══════════════════════════════════════════════════════ */}
      <section className="py-20 bg-white overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-xl mx-auto mb-14">
            <h2 className="text-2xl md:text-3xl font-black text-[#0D2D5A] mb-2">Mode de fonctionnement de Care4Success</h2>
            <p className="text-sm text-gray-500">Inscrivez-vous gratuitement et apprenez en toute sérénité selon votre emploi du temps.</p>
          </div>

          {/* Version desktop : parcours illustré avec flèches en pointillés */}
          <div className="hidden lg:block relative max-w-5xl mx-auto" style={{ height: 760 }}>
            {/* Texture de fond évoquant une carte du monde */}
            <div
              className="absolute inset-0 opacity-[0.35]"
              style={{ backgroundImage: "radial-gradient(#c8d3e0 1.5px, transparent 1.5px)", backgroundSize: "14px 14px" }}
              aria-hidden
            />
            {[
              { top: "10%", left: "12%" }, { top: "34%", left: "88%" }, { top: "58%", left: "8%" }, { top: "82%", left: "90%" },
              { top: "20%", left: "70%" }, { top: "68%", left: "40%" },
            ].map((p, i) => (
              <MapPin key={i} className="absolute w-4 h-4 text-[#1A6CC8]/30" style={p} aria-hidden />
            ))}

            {/* Flèches en pointillés reliant les 4 étapes */}
            <svg viewBox="0 0 1000 760" className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden>
              <defs>
                <marker id="arrowhead" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                  <path d="M0,0 L8,4 L0,8 Z" fill="#0D2D5A" />
                </marker>
              </defs>
              <path d="M 400 150 Q 560 200, 610 300" stroke="#0D2D5A" strokeWidth="2" strokeDasharray="6 6" fill="none" markerEnd="url(#arrowhead)" opacity="0.5" />
              <path d="M 620 420 Q 460 470, 340 500" stroke="#0D2D5A" strokeWidth="2" strokeDasharray="6 6" fill="none" markerEnd="url(#arrowhead)" opacity="0.5" />
              <path d="M 380 650 Q 520 680, 610 610" stroke="#0D2D5A" strokeWidth="2" strokeDasharray="6 6" fill="none" markerEnd="url(#arrowhead)" opacity="0.5" transform="translate(0,-30)" />
            </svg>

            {HOW_IT_WORKS.map(({ n, title, desc, image, pos, textPos, size }) => (
              <div key={n}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.85 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={springPresets.gentle}
                  className="absolute rounded-full overflow-hidden border-4 border-white shadow-xl"
                  style={{ top: pos.top, left: pos.left, width: size, height: size }}
                >
                  <img src={image} alt={title} className="w-full h-full object-cover" />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ ...springPresets.gentle, delay: 0.1 }}
                  className="absolute max-w-[240px]"
                  style={{ top: textPos.top, left: textPos.left }}
                >
                  <p className="font-black text-[#0D2D5A] text-sm mb-1">{n}. {title}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                </motion.div>
              </div>
            ))}
          </div>

          {/* Version mobile : liste verticale simple */}
          <div className="lg:hidden flex flex-col gap-8 max-w-md mx-auto">
            {HOW_IT_WORKS.map(({ n, title, desc, image }) => (
              <div key={n} className="flex items-start gap-4">
                <img src={image} alt={title} className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md shrink-0" />
                <div>
                  <p className="font-black text-[#0D2D5A] text-sm mb-1">{n}. {title}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          §5 — MATIÈRES
          ══════════════════════════════════════════════════════ */}
      <section className="py-20 bg-[#F7FAFD]">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-xl mx-auto mb-12">
            <h2 className="text-2xl md:text-3xl font-black text-[#0D2D5A] mb-2">Un champ large de connaissances à votre portée</h2>
            <p className="text-sm text-gray-500">Demandez la matière de votre choix — nous mettons en relation dans les meilleurs délais.</p>
          </div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4 max-w-4xl mx-auto"
          >
            {visibleSubjects.map(subject => {
              const count = subjectCounts.get(subject) || 0;
              return (
                <motion.div key={subject} variants={staggerItem}>
                  <NavLink
                    to={ROUTE_PATHS.CONTACT}
                    className="flex flex-col items-center text-center gap-2 p-3 rounded-xl hover:bg-white transition-colors group"
                  >
                    <div className="w-14 h-14 rounded-full bg-[#1A6CC8] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                      <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-xs font-bold text-[#0D2D5A] leading-tight">{subject}</p>
                    <p className="text-[10px] text-gray-400 font-medium">{count > 0 ? `${count} enseignant${count > 1 ? "s" : ""}` : "Sur demande"}</p>
                  </NavLink>
                </motion.div>
              );
            })}
          </motion.div>

          {allSubjects.length > 12 && (
            <div className="text-center mt-10">
              <button
                onClick={() => setShowAllSubjects(v => !v)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#1A6CC8]/30 text-[#1A6CC8] text-sm font-bold hover:bg-[#1A6CC8]/5 transition-colors"
              >
                {showAllSubjects ? "Voir moins de matières" : "Voir plus de matières"}
                <ChevronDown className={`w-4 h-4 transition-transform ${showAllSubjects ? "rotate-180" : ""}`} />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          §6 — DEVENEZ PROFESSEUR (photo pleine largeur)
          ══════════════════════════════════════════════════════ */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${HERO_IMAGES.home})` }} />
        <div className="absolute inset-0 bg-[#0D2D5A]/85" />
        <div className="container mx-auto px-6 relative z-10 text-center">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-3">Donnez des cours sur Care4Success</h2>
          <p className="text-blue-200 max-w-lg mx-auto mb-10">
            Partagez vos connaissances et aidez des milliers d'élèves à progresser. Inscrivez-vous et commencez à enseigner.
          </p>
          <div className="flex flex-wrap justify-center gap-8 mb-10">
            {BECOME_TEACHER_BENEFITS.map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-2 max-w-[160px]">
                <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-[#F5A623]" />
                </div>
                <p className="text-white text-xs font-semibold">{label}</p>
              </div>
            ))}
          </div>
          <NavLink
            to={ROUTE_PATHS.DEVENIR_PROFESSEUR}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-[#1A6CC8] text-white font-bold hover:bg-white hover:text-[#0D2D5A] transition-all duration-200 shadow-lg"
          >
            Devenez professeur <ArrowRight className="w-4 h-4" />
          </NavLink>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          §7 — BANDEAU COMMUNAUTÉ
          ══════════════════════════════════════════════════════ */}
      <section className="py-16" style={{ backgroundColor: "#4F7A5C" }}>
        <div className="container mx-auto px-6 grid md:grid-cols-2 gap-10 items-center">
          <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={springPresets.gentle}>
            <h2 className="text-2xl md:text-3xl font-black text-white mb-4 leading-tight">
              Rejoignez une communauté d'enseignants engagés à travers l'Afrique francophone.
            </h2>
            <p className="text-white/80 text-sm mb-6 max-w-md">
              Ensemble, nous transformons chaque savoir-faire en opportunité — pour rendre l'éducation accessible et de qualité, partout où nous sommes présents.
            </p>
            <NavLink
              to={ROUTE_PATHS.DEVENIR_PROFESSEUR}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0D2D5A] text-white font-bold text-sm hover:bg-black transition-colors"
            >
              Comment ça marche ? <ArrowRight className="w-4 h-4" />
            </NavLink>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={springPresets.gentle}
            className="rounded-2xl overflow-hidden shadow-xl"
          >
            <img src={IMAGES.STUDENTS_STUDYING_3} alt="Communauté Care4Success" className="w-full h-64 object-cover" />
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          §8 — APPLICATION MOBILE
          ══════════════════════════════════════════════════════ */}
      <section className="py-20 bg-white relative overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="relative rounded-3xl bg-gradient-to-br from-[#0D2D5A] via-[#0b2447] to-[#1A6CC8] overflow-hidden p-8 md:p-12 lg:p-16 shadow-2xl">
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
            <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-[#F5A623]/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-[#1A6CC8]/20 blur-3xl pointer-events-none" />

            <div className="relative z-10 grid md:grid-cols-12 gap-8 items-center">
              <div className="md:col-span-7 space-y-6">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F5A623]/20 border border-[#F5A623]/30 text-[#F5A623] text-xs font-black uppercase tracking-widest">
                  <Smartphone className="w-3.5 h-3.5" />
                  Application Android
                </span>

                <h2 className="text-3xl md:text-4xl font-black text-white leading-tight">
                  Toute l'expérience Care4Success dans votre poche
                </h2>

                <p className="text-blue-100 text-sm leading-relaxed max-w-lg">
                  Suivez vos cours, communiquez avec votre enseignant et gérez vos devoirs directement depuis votre smartphone.
                </p>

                <ul className="space-y-2.5 text-blue-100 text-sm">
                  <li className="flex items-center gap-3"><CheckCircle className="w-4 h-4 text-[#F5A623] shrink-0" /> Accès instantané aux cours en ligne</li>
                  <li className="flex items-center gap-3"><CheckCircle className="w-4 h-4 text-[#F5A623] shrink-0" /> Notifications push en temps réel</li>
                  <li className="flex items-center gap-3"><CheckCircle className="w-4 h-4 text-[#F5A623] shrink-0" /> Optimisée pour les connexions lentes</li>
                </ul>

                <div className="flex flex-wrap gap-4 pt-2">
                  <a
                    href="/app-release-signed.apk"
                    download="Care4Success.apk"
                    id="download-apk-btn"
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-[#F5A623] text-[#0D2D5A] font-black text-sm shadow-lg hover:shadow-xl transition-shadow"
                  >
                    <Download className="w-4 h-4" /> Télécharger l'APK
                  </a>
                </div>
              </div>

              <div className="md:col-span-5 flex justify-center">
                <div className="relative w-56 h-96 bg-slate-900 rounded-[36px] border-[6px] border-slate-700 shadow-2xl overflow-hidden flex flex-col justify-between p-3">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-5 bg-slate-700 rounded-b-2xl z-20" />
                  <div className="relative w-full h-full bg-[#0D2D5A] rounded-[26px] overflow-hidden flex flex-col justify-center items-center gap-3 p-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
                      <GraduationCap className="w-7 h-7 text-[#F5A623]" />
                    </div>
                    <h4 className="text-sm font-black text-white uppercase tracking-wide">Care4Success</h4>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          §9 — CTA FINAL
          ══════════════════════════════════════════════════════ */}
      <section className="py-20 bg-[#F7FAFD]">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={springPresets.gentle}
            className="max-w-3xl mx-auto text-center bg-white rounded-3xl border border-gray-100 shadow-sm p-10 md:p-14"
          >
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#1A6CC8] mb-3">Bilan personnalisé — 100% gratuit</p>
            <h2 className="text-3xl md:text-4xl font-black text-[#0D2D5A] mb-4">Décrivez votre projet, on s'occupe du reste.</h2>
            <p className="text-gray-500 mb-8 max-w-lg mx-auto">
              Un conseiller pédagogique vous rappelle sous 24h pour construire avec vous un programme adapté.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <NavLink
                to={ROUTE_PATHS.CONTACT}
                id="footer-cta"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-[#1A6CC8] text-white font-black hover:bg-[#0D2D5A] transition-colors shadow-lg"
              >
                Demander mon bilan gratuit <ArrowRight className="w-4 h-4" />
              </NavLink>
              <a
                href="tel:+237675252048"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl border border-gray-200 text-[#0D2D5A] font-bold hover:bg-gray-50 transition-colors"
              >
                <Phone className="w-4 h-4 text-[#1A6CC8]" /> +237 675 252 048
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
