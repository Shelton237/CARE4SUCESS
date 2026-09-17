import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { NavLink } from "react-router-dom";
import {
  ArrowRight, Users, ShieldCheck, Wallet, CreditCard, ClipboardCheck,
  BadgeCheck, CalendarCheck, BookOpen, ChevronDown, ChevronLeft, ChevronRight,
  Smartphone, Download, GraduationCap, CheckCircle, Star, Monitor, MapPin,
  Globe, Briefcase, Eye, Shield,
} from "lucide-react";
import { fetchPublicTeachers } from "@/api/public";
import { ALL_SUBJECTS } from "@/lib/education";
import { IMAGES } from "@/assets/images";
import { HERO_IMAGES } from "@/assets/hero-images";
import { springPresets, staggerContainer, staggerItem } from "@/lib/motion";
import { ROUTE_PATHS } from "@/lib/index";

/* ─── DONNÉES ────────────────────────────────── */

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

// Vraies captures d'écran de la plateforme sur mobile — jamais de maquette
// générée.
const APP_SCREENSHOTS = [
  { src: "/images/app-screens/screen-4-hero.jpg", alt: "Accueil Care4Success sur mobile" },
  { src: "/images/app-screens/screen-1-welcome.jpg", alt: "Choix du profil à l'inscription" },
  { src: "/images/app-screens/screen-2-matieres.jpg", alt: "Catalogue de matières" },
  { src: "/images/app-screens/screen-3-fonctionnement.jpg", alt: "Mode de fonctionnement" },
];

function AppScreensCarousel() {
  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState(0);

  const goTo = (i: number) => {
    setDirection(i > active ? 1 : -1);
    setActive(i);
  };

  return (
    <div className="relative flex flex-col items-center">
      <div className="relative flex items-center justify-center gap-4 md:gap-6">
        <button
          type="button"
          onClick={() => goTo(active === 0 ? APP_SCREENSHOTS.length - 1 : active - 1)}
          className="shrink-0 w-10 h-10 rounded-full bg-white border border-gray-200 shadow-sm hover:border-[#1A6CC8]/40 hover:text-[#1A6CC8] flex items-center justify-center text-[#0D2D5A] transition-colors"
          aria-label="Écran précédent"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="relative w-56 h-[440px] shrink-0">
          {/* Halo doux derrière le téléphone */}
          <div className="absolute inset-0 bg-[#1A6CC8]/10 blur-3xl rounded-full scale-90 pointer-events-none" />

          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={APP_SCREENSHOTS[active].src}
              custom={direction}
              initial={{ opacity: 0, x: direction * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -40 }}
              transition={springPresets.gentle}
              className="absolute inset-0"
            >
              <div className="relative w-full h-full bg-slate-900 rounded-[32px] border-[6px] border-slate-800 shadow-xl overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-slate-800 rounded-b-2xl z-20" />
                <img
                  src={APP_SCREENSHOTS[active].src}
                  alt={APP_SCREENSHOTS[active].alt}
                  className="w-full h-full object-cover object-top"
                />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <button
          type="button"
          onClick={() => goTo(active === APP_SCREENSHOTS.length - 1 ? 0 : active + 1)}
          className="shrink-0 w-10 h-10 rounded-full bg-white border border-gray-200 shadow-sm hover:border-[#1A6CC8]/40 hover:text-[#1A6CC8] flex items-center justify-center text-[#0D2D5A] transition-colors"
          aria-label="Écran suivant"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <p className="text-xs font-bold text-[#0D2D5A] mt-6 mb-3">{APP_SCREENSHOTS[active].alt}</p>

      <div className="flex items-center justify-center gap-2">
        {APP_SCREENSHOTS.map((s, i) => (
          <button
            key={s.src}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Aller à l'écran ${i + 1}`}
            className={`h-1.5 rounded-full transition-all ${active === i ? "w-6 bg-[#1A6CC8]" : "w-1.5 bg-gray-200"}`}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── COMPOSANT PRINCIPAL ─────────────────────── */
export default function Home() {
  const [showAllSubjects, setShowAllSubjects] = useState(false);

  const { data: teachers = [] } = useQuery({
    queryKey: ["public-teachers"],
    queryFn: fetchPublicTeachers,
    staleTime: 60_000,
  });

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
          §1 — HERO
          Fond uni marine, titre serif, badge de localisation, stats
          ══════════════════════════════════════════════════════ */}
      <section className="relative bg-[#0D2D5A] overflow-hidden">
        {/* Photo de fond */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${IMAGES.TEACHER_STUDENT_1})` }}
        />
        {/* Voile de lisibilité */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0D2D5A]/97 via-[#0D2D5A]/92 to-[#0D2D5A]/60" />

        <div className="container mx-auto px-6 pt-24 pb-36 md:pt-28 md:pb-44 relative z-10">
          <div className="w-full max-w-xl">

              {/* Badge localisation */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 border border-white/15 rounded-full px-4 py-2 text-sm text-blue-200 mb-8"
              >
                <MapPin className="w-4 h-4 text-blue-300" />
                Disponible au Cameroun et à Madagascar
              </motion.div>

              {/* Titre */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springPresets.gentle, delay: 0.1 }}
                className="font-bold text-white leading-[1.05] text-[clamp(2.5rem,5vw,3.75rem)]"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Every genius needs{" "}
                <span className="italic text-[#F5A623]">a coach</span>
              </motion.h1>

              {/* Sous-titre */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springPresets.gentle, delay: 0.2 }}
                className="text-blue-200 text-lg leading-relaxed mt-6 mb-10"
              >
                Soutien scolaire. Langues. Compétences pro. Le bon coach, à côté de chez vous ou en ligne.
              </motion.p>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springPresets.gentle, delay: 0.3 }}
                className="flex flex-wrap gap-4 mb-16"
              >
                <NavLink
                  to={ROUTE_PATHS.PROFESSEURS}
                  id="hero-cta-primary"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-[#F5A623] text-[#0D2D5A] font-bold hover:bg-[#e09520] transition-colors duration-200"
                >
                  Trouver mon coach <ArrowRight className="w-4 h-4" />
                </NavLink>
                <a
                  href="#"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-white/5 border border-white/15 text-white font-bold hover:bg-white/10 transition-colors duration-200"
                >
                  Comment ça marche
                </a>
              </motion.div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springPresets.gentle, delay: 0.4 }}
                className="flex flex-wrap gap-10"
              >
                {[
                  { value: "4", label: "systèmes scolaires couverts" },
                  { value: "8+", label: "langues enseignées" },
                  { value: "2", label: "pays actifs" },
                ].map(stat => (
                  <div key={stat.label}>
                    <p
                      className="text-[#F5A623] text-5xl font-bold leading-none"
                      style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                      {stat.value}
                    </p>
                    <p className="text-blue-200 text-base mt-3">{stat.label}</p>
                  </div>
                ))}
              </motion.div>
          </div>
        </div>

        {/* Vague de bas de section */}
        <div className="absolute bottom-0 left-0 right-0 z-20 leading-[0]">
          <svg viewBox="0 0 1440 120" className="w-full block" preserveAspectRatio="none">
            <path d="M0,120 L0,60 C360,120 1080,0 1440,60 L1440,120 Z" fill="oklch(0.99 0.003 230)" />
          </svg>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          §1bis — NOS UNIVERS
          3 cartes objectif : Soutien scolaire / Langues / Compétences
          ══════════════════════════════════════════════════════ */}
      <section className="py-20 md:py-28 bg-background">
        <div className="container mx-auto px-6">
          <div className="max-w-xl mb-14">
            <p className="text-[#0F9B8E] text-xs font-bold uppercase tracking-[0.2em] mb-3">Nos univers</p>
            <h2
              className="text-3xl md:text-4xl font-bold text-[#0D2D5A] mb-3"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Quel est votre objectif ?
            </h2>
            <p className="text-gray-500">Chaque univers a son approche. Choisissez le vôtre.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: GraduationCap,
                color: "#0F9B8E",
                bgFrom: "from-teal-50",
                title: "Soutien scolaire",
                desc: "Nous trouvons le coach parfait pour votre enfant. Évaluation, matching, suivi en temps réel, facturation transparente.",
                tags: ["BAC / Brevet", "IB", "Système US", "Britannique"],
                link: { label: "Évaluation gratuite", to: ROUTE_PATHS.CONTACT },
              },
              {
                icon: Globe,
                color: "#F5A623",
                bgFrom: "from-amber-50",
                title: "Langues",
                desc: "Choisissez votre coach, comparez les prix, réservez et commencez aujourd'hui. En ligne, présentiel ou hybride.",
                tags: ["Anglais", "Français", "Espagnol", "+5 langues"],
                link: { label: "Voir les coachs disponibles", to: ROUTE_PATHS.PROFESSEURS },
              },
              {
                icon: Briefcase,
                color: "#E2574C",
                bgFrom: "from-red-50",
                title: "Compétences et carrière",
                desc: "Formations pro, conférences payantes, certifications, par des experts reconnus. Visio sécurisée incluse.",
                tags: ["Excel / Data", "Management", "Prépa concours"],
                link: { label: "Me prévenir du lancement", to: "#" },
              },
            ].map(card => (
              <div
                key={card.title}
                className={`bg-gradient-to-b ${card.bgFrom} to-white rounded-2xl border border-gray-100 p-8`}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-6"
                  style={{ backgroundColor: card.color }}
                >
                  <card.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-[#0D2D5A] mb-3">{card.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed mb-5">{card.desc}</p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {card.tags.map(tag => (
                    <span
                      key={tag}
                      className="text-xs font-semibold px-3 py-1.5 rounded-full"
                      style={{ backgroundColor: `${card.color}1A`, color: card.color }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <NavLink
                  to={card.link.to}
                  className="inline-flex items-center gap-1.5 text-sm font-bold hover:gap-2.5 transition-all duration-200"
                  style={{ color: card.color }}
                >
                  {card.link.label} <ArrowRight className="w-3.5 h-3.5" />
                </NavLink>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          §2 — POURQUOI CARE4SUCCESS
          ══════════════════════════════════════════════════════ */}
      <section className="py-20 md:py-28 bg-[#F4F2ED]">
        <div className="container mx-auto px-6">
          <div className="max-w-xl mb-14">
            <p className="text-[#0F9B8E] text-xs font-bold uppercase tracking-[0.2em] mb-3">Pourquoi Care4Success</p>
            <h2
              className="text-3xl md:text-4xl font-bold text-[#0D2D5A]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Ce qui nous rend différents
            </h2>
          </div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {[
              {
                icon: CheckCircle,
                color: "#0F9B8E",
                title: "Coachs vérifiés",
                desc: "Chaque coach passe 5 étapes de validation. Diplômes, expertise, pédagogie : nous vérifions tout avant qu'un coach donne son premier cours.",
              },
              {
                icon: Eye,
                color: "#F5A623",
                title: "Suivi transparent",
                desc: "Parents : vous voyez tout. Heure d'arrivée du coach, contenu du cours, devoirs laissés, progression, en temps réel depuis votre espace.",
              },
              {
                icon: CreditCard,
                color: "#0D2D5A",
                title: "Paiement sécurisé",
                desc: "Orange Money, MTN MoMo, MVola, Visa, Mastercard. Vos paiements sont protégés, votre coach est payé automatiquement.",
              },
              {
                icon: Shield,
                color: "#E2574C",
                title: "Zéro frais d'inscription",
                desc: "Pas d'abonnement, pas de frais cachés. Vous ne payez que les cours. Évaluation scolaire et première session de langue gratuites.",
              },
            ].map(card => (
              <motion.div key={card.title} variants={staggerItem} className="bg-white rounded-2xl border border-gray-100 p-6">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
                  style={{ backgroundColor: card.color }}
                >
                  <card.icon className="w-5 h-5 text-white" />
                </div>
                <p className="font-bold text-[#0D2D5A] text-base mb-2">{card.title}</p>
                <p className="text-sm text-gray-500 leading-relaxed">{card.desc}</p>
              </motion.div>
            ))}
          </motion.div>
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
          §3bis — ILS TÉMOIGNENT
          ══════════════════════════════════════════════════════ */}
      <section className="py-20 md:py-28 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-xl mb-14">
            <p className="text-[#0F9B8E] text-xs font-bold uppercase tracking-[0.2em] mb-3">Ils témoignent</p>
            <h2
              className="text-3xl md:text-4xl font-bold text-[#0D2D5A]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Ce que disent nos premiers utilisateurs
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                stars: 5,
                quote: "Mon fils avait 8/20 en maths en début d'année. En 3 mois avec son coach, il est passé à 14. Le suivi en temps réel m'a permis de voir exactement ce qui se passait à chaque session.",
                initials: "MR",
                color: "#0F9B8E",
                name: "Marie R.",
                role: "Parent d'un élève en 3ème · Antananarivo",
              },
              {
                stars: 5,
                quote: "J'enseignais sur Preply depuis 2 ans. Care4Success me donne la même liberté de fixer mes prix, mais avec des étudiants locaux qui veulent du présentiel. C'est exactement ce qui manquait.",
                initials: "AK",
                color: "#F5A623",
                name: "Aminata K.",
                role: "Coach d'anglais · Douala",
              },
              {
                stars: 4,
                quote: "Je cherchais un cours d'anglais pour préparer mon IELTS. J'ai trouvé un coach spécialisé en 5 minutes, réservé ma première session le soir même. Simple et efficace.",
                initials: "PD",
                color: "#E2574C",
                name: "Patrick D.",
                role: "Apprenant anglais · Yaoundé",
              },
            ].map(t => (
              <div key={t.name} className="bg-[#F4F2ED] rounded-2xl p-6">
                <div className="flex gap-0.5 mb-4">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star key={i} className={`w-4 h-4 ${i <= t.stars ? "fill-[#F5A623] text-[#F5A623]" : "fill-transparent text-gray-300"}`} />
                  ))}
                </div>
                <p className="text-sm text-gray-700 italic leading-relaxed mb-6">{t.quote}</p>
                <div className="flex items-center gap-3">
                  <span
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ backgroundColor: t.color }}
                  >
                    {t.initials}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-[#0D2D5A]">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

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
            {/* Carte du monde en fond (pins déjà intégrés à l'image) */}
            <div
              className="absolute inset-0 bg-no-repeat bg-center opacity-70"
              style={{ backgroundImage: `url(${HERO_IMAGES.worldMap})`, backgroundSize: "100% auto" }}
              aria-hidden
            />

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
            <p className="text-sm text-gray-500">Demandez la matière de votre choix, nous mettons en relation dans les meilleurs délais.</p>
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
          §8 — APPLICATION MOBILE (vraies captures d'écran)
          ══════════════════════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-12 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={springPresets.gentle}
              className="md:col-span-6 space-y-6"
            >
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1A6CC8]/8 border border-[#1A6CC8]/15 text-[#1A6CC8] text-xs font-black uppercase tracking-widest">
                <Smartphone className="w-3.5 h-3.5" />
                Application Android
              </span>

              <h2 className="text-3xl md:text-4xl font-black text-[#0D2D5A] leading-tight">
                Toute l'expérience Care4Success dans votre poche
              </h2>

              <p className="text-gray-500 text-sm leading-relaxed max-w-lg">
                Suivez vos cours, communiquez avec votre enseignant et gérez vos devoirs directement depuis votre smartphone.
              </p>

              <ul className="space-y-2.5 text-sm">
                <li className="flex items-center gap-3 text-[#0D2D5A] font-medium"><CheckCircle className="w-4 h-4 text-[#1A6CC8] shrink-0" /> Accès instantané aux cours en ligne</li>
                <li className="flex items-center gap-3 text-[#0D2D5A] font-medium"><CheckCircle className="w-4 h-4 text-[#1A6CC8] shrink-0" /> Notifications push en temps réel</li>
                <li className="flex items-center gap-3 text-[#0D2D5A] font-medium"><CheckCircle className="w-4 h-4 text-[#1A6CC8] shrink-0" /> Optimisée pour les connexions lentes</li>
              </ul>

              <div className="flex flex-wrap gap-4 pt-2">
                <a
                  href="/app-release-signed.apk"
                  download="Care4Success.apk"
                  id="download-apk-btn"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#1A6CC8] text-white font-bold text-sm shadow-md hover:bg-[#0D2D5A] transition-colors"
                >
                  <Download className="w-4 h-4" /> Télécharger l'APK · gratuit
                </a>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ ...springPresets.gentle, delay: 0.1 }}
              className="md:col-span-6"
            >
              <AppScreensCarousel />
            </motion.div>
          </div>
        </div>
      </section>

    </div>
  );
}
