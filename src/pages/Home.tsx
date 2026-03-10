import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight, CheckCircle, Star, Users, Award,
  Clock, TrendingUp, BookOpen, GraduationCap,
  Phone, Globe, Home as HomeIcon, Monitor, Calendar,
  MessageSquare, Search, ChevronRight, Sparkles,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { TeacherCard } from "@/components/TeacherCard";
import { testimonials, teachers, stats } from "@/data/index";
import { IMAGES } from "@/assets/images";
import { springPresets, staggerContainer, staggerItem } from "@/lib/motion";
import { ROUTE_PATHS } from "@/lib/index";

/* ─── DONNÉES ────────────────────────────────── */

const services: { id: string; icon: React.ComponentType<{ className?: string }>; label: string; desc: string; price: string; image: string; tag: string | null }[] = [
  {
    id: "domicile",
    icon: HomeIcon,
    label: "Cours à domicile",
    desc: "Un enseignant chez vous, à l'heure qui vous convient. Sans déplacement, sans contrainte.",
    price: "Dès 9 000 FCFA/h",
    image: IMAGES.TEACHER_STUDENT_1,
    tag: "Le plus choisi",
  },
  {
    id: "enligne",
    icon: Monitor,
    label: "Cours en ligne",
    desc: "Toute l'Afrique francophone, sur une seule plateforme. Tableau blanc, enregistrements, suivi.",
    price: "Dès 7 500 FCFA/h",
    image: IMAGES.ONLINE_LEARNING_1,
    tag: null,
  },
  {
    id: "stages",
    icon: Calendar,
    label: "Stages vacances",
    desc: "8 élèves max. Programme intensif. Retour en classe avec une longueur d'avance.",
    price: "Dès 150 000 FCFA",
    image: IMAGES.STUDENTS_STUDYING_4,
    tag: "Vacances scolaires",
  },
  {
    id: "accompagnement",
    icon: GraduationCap,
    label: "Prépa BEPC & BAC",
    desc: "Méthodologie d'examen, gestion du stress, révisions ciblées. On ne laisse rien au hasard.",
    price: "Dès 10 000 FCFA/h",
    image: IMAGES.STUDENTS_STUDYING_2,
    tag: "Examens nationaux",
  },
];

const niveaux = [
  { label: "Primaire", sub: "SIL → CM2" },
  { label: "Collège", sub: "6ème → 3ème" },
  { label: "Lycée", sub: "2nde → Terminale" },
  { label: "Supérieur", sub: "Prépa / Univ." },
  { label: "Adultes", sub: "Formation continue" },
];

const processSteps = [
  { n: "01", title: "Bilan pédagogique", desc: "20 min avec un conseiller pour cerner les besoins réels de votre enfant.", icon: MessageSquare, color: "#1A6CC8" },
  { n: "02", title: "Enseignant sélectionné", desc: "Parmi 500+ profils vérifiés, le mieux adapté au niveau et à la personnalité.", icon: Search, color: "#F5A623" },
  { n: "03", title: "Programme sur mesure", desc: "Un plan heure par heure, conçu pour viser +4 points en 3 mois.", icon: BookOpen, color: "#1A6CC8" },
  { n: "04", title: "Suivi & progression", desc: "Bilan trimestriel, ajustement en continu, conseiller dédié joignable.", icon: TrendingUp, color: "#F5A623" },
];

const africanPresence = [
  { code: "CMR", flag: "🇨🇲", name: "Cameroun" },
  { code: "RCA", flag: "🇨🇫", name: "Centrafrique" },
  { code: "GIN", flag: "🇬🇳", name: "Guinée" },
  { code: "MLI", flag: "🇲🇱", name: "Mali" },
  { code: "TGO", flag: "🇹🇬", name: "Togo" },
  { code: "BFA", flag: "🇧🇫", name: "Burkina Faso" },
  { code: "BEN", flag: "🇧🇯", name: "Bénin" },
  { code: "GAB", flag: "🇬🇦", name: "Gabon" },
  { code: "MDG", flag: "🇲🇬", name: "Madagascar" },
  { code: "COM", flag: "🇰🇲", name: "Comores" },
  { code: "GNB", flag: "🇬🇼", name: "Guinée-Bissau" },
];

const popularSubjects = [
  "Mathématiques", "Français", "Anglais",
  "Physique-Chimie", "SVT", "Histoire-Géo",
  "Philosophie", "Informatique",
];

const disciplines = [
  {
    cat: "Sciences exactes",
    items: ["Mathématiques", "Physique-Chimie", "SVT", "Biologie", "Chimie"],
  },
  {
    cat: "Humanités",
    items: ["Français", "Histoire-Géographie", "Philosophie", "Littérature", "Économie"],
  },
  {
    cat: "Langues",
    items: ["Anglais", "Espagnol", "Arabe", "Allemand", "Mandarin"],
  },
  {
    cat: "Professionnel",
    items: ["Informatique", "Comptabilité", "Gestion", "Marketing", "Prépa Concours"],
  },
];

/* ─── COMPOSANT PRINCIPAL ─────────────────────── */
export default function Home() {
  const [selNiveau, setSelNiveau] = useState("");
  const [selMatiere, setSelMatiere] = useState("");

  return (
    <div className="min-h-screen overflow-x-hidden">

      {/* ══════════════════════════════════════════════════════
          §1 — HERO ÉDITORIAL
          Composition asymétrique magazine : texte gauche / images droite
          ══════════════════════════════════════════════════════ */}
      <section className="relative bg-[#0D2D5A] overflow-hidden min-h-[92vh] flex items-stretch">

        {/* Fond : grille de points décoratives */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "28px 28px" }}
        />

        {/* Orbe bleu clair */}
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-[#1A6CC8]/20 blur-3xl pointer-events-none" />

        {/* ── Colonne texte ─────────────── */}
        <div className="relative z-10 flex flex-col justify-center px-8 md:px-14 lg:px-20 py-24 w-full md:max-w-[55%]">

          {/* Numéro éditorial discret */}
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="text-[#F5A623]/50 text-xs font-mono tracking-[0.4em] uppercase mb-6 flex items-center gap-3"
          >
            <span className="inline-block w-8 h-px bg-[#F5A623]/40" />
            N°1 du soutien scolaire africain
          </motion.p>

          {/* Titre éditorial */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springPresets.gentle, delay: 0.1 }}
          >
            <h1 className="font-black text-white leading-[0.92] tracking-tighter">
              <span className="block text-[clamp(3.5rem,7vw,6.5rem)] uppercase">La réussite</span>
              <span className="block text-[clamp(3.5rem,7vw,6.5rem)] uppercase text-[#F5A623]">scolaire,</span>
              <span className="block text-[clamp(2.2rem,4.5vw,4rem)] uppercase text-white/60 font-light tracking-wide mt-1">
                notre engagement
              </span>
            </h1>

            {/* Ligne-accent or */}
            <div className="flex items-center gap-4 mt-7 mb-7">
              <div className="h-0.5 w-16 bg-[#F5A623]" />
              <div className="h-0.5 w-4 bg-[#F5A623]/40" />
              <div className="h-0.5 w-2 bg-[#F5A623]/20" />
            </div>
          </motion.div>

          {/* Sous-titre */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springPresets.gentle, delay: 0.2 }}
            className="text-blue-200 text-lg leading-relaxed max-w-md mb-8"
          >
            Cours particuliers à domicile, en ligne ou en centre.
            Sans engagement.{" "}
            <span className="text-white font-bold">Résultats garantis ou remboursé.</span>
          </motion.p>

          {/* Checklist */}
          <motion.ul
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springPresets.gentle, delay: 0.28 }}
            className="flex flex-col gap-2.5 mb-10"
          >
            {["Enseignant trouvé en 4 jours chrono", "Bac+3 minimum • 1 prof retenu sur 10", "+4 points de moyenne garantis"].map((item) => (
              <li key={item} className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-[#F5A623] shrink-0" />
                <span className="text-blue-100 text-sm font-medium">{item}</span>
              </li>
            ))}
          </motion.ul>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springPresets.gentle, delay: 0.35 }}
            className="flex flex-wrap gap-4"
          >
            <NavLink
              to={ROUTE_PATHS.CONTACT}
              id="hero-cta-primary"
              className="group relative inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#F5A623] text-[#0D2D5A] font-black text-base overflow-hidden shadow-xl shadow-[#F5A623]/20 hover:shadow-[#F5A623]/40 transition-shadow duration-300"
            >
              {/* Shimmer */}
              <span className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-12" />
              <span className="relative">Bilan gratuit</span>
              <ArrowRight className="relative w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </NavLink>
            <a
              href="tel:+237675252048"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full border border-white/20 text-white font-semibold text-base hover:bg-white/10 transition-colors duration-200"
            >
              <Phone className="w-4 h-4 text-[#F5A623]" />
              Être rappelé(e)
            </a>
          </motion.div>

          {/* Trust mini */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center gap-4 mt-10 pt-8 border-t border-white/10"
          >
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} className={`w-4 h-4 ${i <= 4 ? "fill-[#F5A623] text-[#F5A623]" : "fill-white/20 text-white/20"}`} />
              ))}
            </div>
            <span className="text-white font-bold text-sm">4,4/5</span>
            <span className="text-blue-300 text-xs">— note vérifiée</span>
            <span className="text-blue-300 text-xs">•</span>
            <span className="text-blue-300 text-xs">100 000+ familles</span>
          </motion.div>
        </div>

        {/* ── Colonne images mosaïque ─────────────── */}
        <div className="hidden md:flex flex-1 relative overflow-hidden items-center justify-center p-8 gap-4 min-h-full">

          {/* Cadre décoratif or en arrière-plan */}
          <div className="absolute top-16 right-16 w-72 h-72 border border-[#F5A623]/20 rounded-2xl rotate-6 pointer-events-none" />
          <div className="absolute top-12 right-12 w-72 h-72 border border-[#1A6CC8]/20 rounded-2xl rotate-3 pointer-events-none" />

          {/* Image principale */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ ...springPresets.gentle, delay: 0.2 }}
            className="relative w-[52%] aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl shrink-0"
          >
            <img src={IMAGES.TEACHER_STUDENT_1} alt="Cours particuliers" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0D2D5A]/60 to-transparent" />
            {/* Badge flottant */}
            <div className="absolute bottom-5 left-5 right-5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3">
              <p className="text-white text-xs font-bold">Cours particuliers à domicile</p>
              <p className="text-[#F5A623] text-xs font-mono">Dès 9 000 FCFA / heure</p>
            </div>
          </motion.div>

          {/* Colonne d'images secondaires */}
          <div className="flex flex-col gap-4 flex-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...springPresets.gentle, delay: 0.3 }}
              className="relative aspect-square rounded-2xl overflow-hidden shadow-xl"
            >
              <img src={IMAGES.STUDENTS_STUDYING_1} alt="Élèves" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-[#1A6CC8]/30" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...springPresets.gentle, delay: 0.4 }}
              className="relative aspect-video rounded-2xl overflow-hidden shadow-xl"
            >
              <img src={IMAGES.ONLINE_LEARNING_1} alt="Cours en ligne" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-[#0D2D5A]/40" />
              <div className="absolute bottom-3 left-3 flex items-center gap-2">
                <Monitor className="w-4 h-4 text-[#F5A623]" />
                <span className="text-white text-xs font-bold">Cours en ligne</span>
              </div>
            </motion.div>

            {/* Stat box flottante */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ ...springPresets.snappy, delay: 0.5 }}
              className="bg-[#F5A623] rounded-2xl p-4 shadow-xl"
            >
              <p className="text-[#0D2D5A] text-3xl font-black font-mono leading-none">500+</p>
              <p className="text-[#0D2D5A]/70 text-xs font-bold mt-1 uppercase tracking-wide">Enseignants qualifiés</p>
            </motion.div>
          </div>
        </div>

        {/* Coupure diagonale bas */}
        <div className="absolute bottom-0 left-0 right-0 z-20">
          <svg viewBox="0 0 1440 80" className="w-full block" preserveAspectRatio="none">
            <polygon points="0,80 1440,0 1440,80" fill="oklch(0.99 0.003 230)" />
          </svg>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          §2 — CHIFFRES CLÉS
          Ligne sobre sur fond blanc
          ══════════════════════════════════════════════════════ */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 lg:gap-0 divide-y md:divide-y-0 md:divide-x divide-[#0D2D5A]/10"
          >
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                variants={staggerItem}
                className="text-center px-6 py-4 group"
              >
                <p className="text-3xl md:text-4xl font-black text-[#0D2D5A] font-mono group-hover:text-[#1A6CC8] transition-colors duration-300 leading-none">
                  {stat.value}
                </p>
                <p className="text-sm font-bold text-[#0D2D5A] mt-1.5">{stat.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{stat.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          §3 — SÉLECTEUR DE BESOIN
          ══════════════════════════════════════════════════════ */}
      <section className="py-20 bg-[#0D2D5A]/5">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={springPresets.gentle}
            className="max-w-5xl mx-auto"
          >
            {/* Header avec photo conseillère */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 mb-8">
              <div className="relative shrink-0">
                <img
                  src={IMAGES.PORTRAIT_WOMAN_4}
                  alt="Conseillère pédagogique"
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-[#F5A623]"
                />
                <span className="absolute -bottom-1.5 -right-1.5 w-5 h-5 bg-[#1A6CC8] rounded-full border-2 border-white flex items-center justify-center">
                  <Sparkles className="w-2.5 h-2.5 text-white" />
                </span>
              </div>
              <div>
                <p className="text-[#1A6CC8] text-sm font-bold italic mb-0.5">
                  Nos conseillers pédagogiques vous répondent en 24h
                </p>
                <h2 className="text-2xl md:text-3xl font-black text-[#0D2D5A]">
                  Trouver le bon enseignant pour votre enfant
                </h2>
              </div>
            </div>

            {/* Card formulaire */}
            <div className="bg-white rounded-3xl shadow-xl border border-[#0D2D5A]/8 p-6 md:p-8">
              <div className="grid md:grid-cols-3 gap-4 items-end">
                {/* Niveau */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-[#0D2D5A] uppercase tracking-[0.2em]">
                    Niveau scolaire
                  </label>
                  <div className="relative">
                    <select
                      value={selNiveau}
                      onChange={e => setSelNiveau(e.target.value)}
                      className="w-full appearance-none border-2 border-[#0D2D5A]/15 focus:border-[#1A6CC8] rounded-xl px-4 py-3.5 text-sm font-semibold text-[#0D2D5A] bg-[#0D2D5A]/3 outline-none transition-colors cursor-pointer"
                    >
                      <option value="">Je suis au niveau…</option>
                      {niveaux.map(n => (
                        <option key={n.label} value={n.label}>{n.label} — {n.sub}</option>
                      ))}
                    </select>
                    <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0D2D5A]/40 rotate-90 pointer-events-none" />
                  </div>
                </div>

                {/* Matière */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-[#0D2D5A] uppercase tracking-[0.2em]">
                    Matière
                  </label>
                  <div className="relative">
                    <select
                      value={selMatiere}
                      onChange={e => setSelMatiere(e.target.value)}
                      className="w-full appearance-none border-2 border-[#0D2D5A]/15 focus:border-[#1A6CC8] rounded-xl px-4 py-3.5 text-sm font-semibold text-[#0D2D5A] bg-[#0D2D5A]/3 outline-none transition-colors cursor-pointer"
                    >
                      <option value="">Je recherche de l'aide en…</option>
                      {popularSubjects.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0D2D5A]/40 rotate-90 pointer-events-none" />
                  </div>
                </div>

                {/* Bouton */}
                <NavLink
                  to={ROUTE_PATHS.CONTACT}
                  id="selector-cta"
                  className="group flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-[#0D2D5A] text-white font-black text-sm hover:bg-[#1A6CC8] transition-colors duration-200 shadow-lg"
                >
                  Trouver mon enseignant
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </NavLink>
              </div>

              {/* Tags rapides */}
              <div className="flex flex-wrap gap-2 mt-5 pt-5 border-t border-[#0D2D5A]/8 items-center">
                <span className="text-[10px] text-[#0D2D5A]/40 font-bold uppercase tracking-widest mr-1 shrink-0">Accès rapide :</span>
                {popularSubjects.map(sub => (
                  <button
                    key={sub}
                    onClick={() => setSelMatiere(sub)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all duration-150 ${selMatiere === sub
                      ? "bg-[#1A6CC8] border-[#1A6CC8] text-white shadow-md shadow-[#1A6CC8]/20"
                      : "border-[#0D2D5A]/20 text-[#0D2D5A] hover:border-[#1A6CC8] hover:text-[#1A6CC8] bg-white"
                      }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          §4 — SERVICES
          Layout 2×2 asymétrique avec grande image principale
          ══════════════════════════════════════════════════════ */}
      <section id="services" className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={springPresets.gentle}
            className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-14"
          >
            <div className="space-y-3">
              <span className="badge-gold inline-flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5" />
                Nos formules
              </span>
              <h2 className="text-4xl md:text-5xl font-black text-[#0D2D5A] leading-tight">
                Des solutions taillées<br />
                <span className="text-[#1A6CC8]">pour chaque profil</span>
              </h2>
            </div>
            <NavLink
              to={ROUTE_PATHS.SERVICES}
              className="inline-flex items-center gap-2 text-sm font-bold text-[#1A6CC8] hover:text-[#0D2D5A] transition-colors shrink-0"
            >
              Toutes nos formules <ArrowRight className="w-4 h-4" />
            </NavLink>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 gap-5"
          >
            {services.map((s, i) => (
              <motion.div key={s.id} variants={staggerItem}>
                <NavLink
                  to={ROUTE_PATHS.SERVICES}
                  className="group relative flex overflow-hidden rounded-2xl bg-white shadow-md border border-[#0D2D5A]/8 hover:shadow-xl hover:border-[#1A6CC8]/30 transition-all duration-300"
                >
                  {/* Image */}
                  <div className="relative w-40 md:w-48 shrink-0 overflow-hidden">
                    <img src={s.image} alt={s.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/10" />
                  </div>

                  {/* Contenu */}
                  <div className="flex flex-col justify-between p-5 flex-1">
                    <div>
                      {s.tag && (
                        <span className="inline-block text-[10px] font-black uppercase tracking-widest text-[#1A6CC8] bg-[#1A6CC8]/10 px-2.5 py-1 rounded-full mb-2">
                          {s.tag}
                        </span>
                      )}
                      <div className="flex items-center gap-2 mb-1.5">
                        <s.icon className="w-4 h-4 text-[#1A6CC8] shrink-0" />
                        <h3 className="font-black text-[#0D2D5A] text-base group-hover:text-[#1A6CC8] transition-colors">{s.label}</h3>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#0D2D5A]/8">
                      <span className="text-sm font-black text-[#F5A623] font-mono">{s.price}</span>
                      <ArrowRight className="w-4 h-4 text-[#1A6CC8] group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>

                  {/* Accent gauche */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#F5A623] rounded-l-2xl" />
                </NavLink>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          §5 — NOTRE MÉTHODE
          Bento grid éditorial — fond blanc
          ══════════════════════════════════════════════════════ */}
      <section id="methode" className="py-24 bg-background relative overflow-hidden">

        {/* Filigrane typographique décoratif */}
        <div
          className="absolute -right-12 top-1/2 -translate-y-1/2 text-[22rem] font-black text-[#0D2D5A]/[0.025] leading-none select-none pointer-events-none font-mono"
          aria-hidden
        >
          C4S
        </div>

        <div className="container mx-auto px-4 relative z-10">

          {/* En-tête */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={springPresets.gentle}
            className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14"
          >
            <div className="space-y-3">
              <span className="badge-gold inline-flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5" />
                Notre méthode
              </span>
              <h2 className="text-4xl md:text-5xl font-black text-[#0D2D5A] leading-tight">
                De zéro à excellent —<br />
                <span className="text-[#1A6CC8]">voici comment on y arrive.</span>
              </h2>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-sm md:text-right">
              Chaque parcours est unique. Chaque programme est construit
              sur mesure — pas depuis un modèle.
            </p>
          </motion.div>

          {/* ── BENTO GRID ── */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[220px]"
          >

            {/* CARTE 01 — Grande (col-span-2) — Bleu marine */}
            <motion.div
              variants={staggerItem}
              className="md:col-span-2 relative rounded-3xl bg-[#0D2D5A] overflow-hidden group cursor-default"
            >
              {/* Numéro watermark */}
              <span className="absolute -right-4 -bottom-8 text-[10rem] font-black font-mono text-white/[0.06] leading-none select-none pointer-events-none">
                01
              </span>
              {/* Orbe lumineux */}
              <div className="absolute top-0 left-1/3 w-48 h-48 bg-[#1A6CC8]/30 rounded-full blur-2xl pointer-events-none" />

              <div className="relative z-10 h-full flex flex-col justify-between p-7 md:p-8">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-[#1A6CC8]/20 border border-[#1A6CC8]/40 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-[#1A6CC8]" />
                  </div>
                  <span className="text-[11px] font-black font-mono text-white/30 tracking-[0.2em] uppercase">Étape 01</span>
                </div>
                <div>
                  <h3 className="text-2xl md:text-3xl font-black text-white leading-tight mb-2">
                    Bilan pédagogique
                  </h3>
                  <p className="text-blue-200 text-sm leading-relaxed max-w-sm">
                    20 minutes avec un conseiller dédié pour comprendre les vrais
                    blocages de votre enfant — pas juste les mauvaises notes.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* CARTE 02 — Petite (col-span-1) — Or */}
            <motion.div
              variants={staggerItem}
              className="relative rounded-3xl bg-[#F5A623] overflow-hidden group cursor-default"
            >
              <span className="absolute -right-3 -bottom-6 text-[8rem] font-black font-mono text-[#0D2D5A]/[0.08] leading-none select-none pointer-events-none">
                02
              </span>

              <div className="relative z-10 h-full flex flex-col justify-between p-6">
                <div className="w-11 h-11 rounded-2xl bg-[#0D2D5A]/15 flex items-center justify-center">
                  <Search className="w-5 h-5 text-[#0D2D5A]" />
                </div>
                <div>
                  <span className="text-[10px] font-black font-mono text-[#0D2D5A]/50 tracking-[0.2em] uppercase block mb-1">Étape 02</span>
                  <h3 className="text-xl font-black text-[#0D2D5A] leading-tight mb-1.5">
                    L'enseignant parfait
                  </h3>
                  <p className="text-[#0D2D5A]/70 text-xs leading-relaxed">
                    Parmi 500+ profils vérifiés, le plus compatible
                    avec le niveau et la personnalité de votre enfant.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* CARTE 03 — Petite (col-span-1) — Bleu vif */}
            <motion.div
              variants={staggerItem}
              className="relative rounded-3xl bg-[#1A6CC8] overflow-hidden group cursor-default"
            >
              <span className="absolute -right-3 -bottom-6 text-[8rem] font-black font-mono text-white/[0.07] leading-none select-none pointer-events-none">
                03
              </span>

              <div className="relative z-10 h-full flex flex-col justify-between p-6">
                <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="text-[10px] font-black font-mono text-white/40 tracking-[0.2em] uppercase block mb-1">Étape 03</span>
                  <h3 className="text-xl font-black text-white leading-tight mb-1.5">
                    Programme sur mesure
                  </h3>
                  <p className="text-white/70 text-xs leading-relaxed">
                    Un plan heure par heure, conçu pour viser
                    +4 points en 3 mois. Pas de méthode unique.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* CARTE 04 — Grande (col-span-2) — Blanc avec bordure */}
            <motion.div
              variants={staggerItem}
              className="md:col-span-2 relative rounded-3xl bg-white border-2 border-[#0D2D5A]/10 overflow-hidden group cursor-default shadow-sm hover:shadow-xl hover:border-[#F5A623]/40 transition-all duration-300"
            >
              <span className="absolute -right-4 -bottom-8 text-[10rem] font-black font-mono text-[#0D2D5A]/[0.04] leading-none select-none pointer-events-none">
                04
              </span>
              {/* Bande or gauche */}
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#F5A623]" />

              <div className="relative z-10 h-full flex flex-col md:flex-row items-start md:items-center gap-6 p-7 md:p-8 pl-10">
                <div className="w-14 h-14 rounded-2xl bg-[#F5A623]/15 border border-[#F5A623]/30 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-6 h-6 text-[#F5A623]" />
                </div>
                <div className="flex-1">
                  <span className="text-[10px] font-black font-mono text-[#0D2D5A]/40 tracking-[0.2em] uppercase block mb-1">Étape 04</span>
                  <h3 className="text-2xl md:text-3xl font-black text-[#0D2D5A] leading-tight mb-2">
                    Suivi & progression garantis
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed max-w-lg">
                    Bilan trimestriel, ajustement en continu. Si l'objectif n'est pas atteint
                    après 6 mois — on vous rembourse. Sans discussion.
                  </p>
                </div>
                <NavLink
                  to={ROUTE_PATHS.CONTACT}
                  id="methode-cta"
                  className="group/btn shrink-0 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#0D2D5A] text-white font-black text-sm hover:bg-[#F5A623] hover:text-[#0D2D5A] transition-all duration-200 shadow-lg"
                >
                  Démarrer
                  <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </NavLink>
              </div>
            </motion.div>

          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          §6 — NOS DISCIPLINES
          Layout typographique en colonnes — sans icônes
          ══════════════════════════════════════════════════════ */}
      <section id="disciplines" className="py-24 bg-[#0D2D5A]/4 border-y border-[#0D2D5A]/8 relative overflow-hidden">

        {/* Numéro décoratif fond */}
        <div
          className="absolute right-0 top-1/2 -translate-y-1/2 text-[20rem] font-black font-mono text-[#0D2D5A]/[0.04] leading-none select-none pointer-events-none"
          aria-hidden
        >
          30+
        </div>

        <div className="container mx-auto px-4 relative z-10">

          {/* En-tête */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={springPresets.gentle}
            className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14"
          >
            <div className="space-y-2">
              <p className="text-[10px] font-black text-[#F5A623] tracking-[0.3em] uppercase font-mono">Catalogue</p>
              <h2 className="text-4xl md:text-5xl font-black text-[#0D2D5A] leading-tight">
                Toutes les matières,<br />
                <span className="text-[#1A6CC8]">tous les niveaux.</span>
              </h2>
            </div>
            <NavLink
              to={ROUTE_PATHS.CONTACT}
              className="inline-flex items-center gap-2 text-sm font-bold text-[#1A6CC8] hover:text-[#0D2D5A] transition-colors shrink-0 group"
            >
              Une matière non listée ? Contactez-nous
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </NavLink>
          </motion.div>

          {/* Grille 4 colonnes typographiques */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-[#0D2D5A]/10"
          >
            {disciplines.map((col, ci) => (
              <motion.div
                key={col.cat}
                variants={staggerItem}
                className="px-0 sm:px-8 py-6 sm:py-0 first:pl-0 last:pr-0"
              >
                {/* Catégorie */}
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#F5A623] mb-5 font-mono border-b border-[#0D2D5A]/10 pb-3">
                  {col.cat}
                </p>
                {/* Liste matières */}
                <ul className="space-y-3">
                  {col.items.map((item, ii) => (
                    <li key={item}>
                      <NavLink
                        to={ROUTE_PATHS.CONTACT}
                        className="group flex items-center justify-between text-[#0D2D5A] font-semibold text-sm hover:text-[#1A6CC8] transition-colors duration-150"
                      >
                        <span className="relative">
                          {item}
                          <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-[#1A6CC8] group-hover:w-full transition-all duration-300" />
                        </span>
                        <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200 text-[#1A6CC8]" />
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </motion.div>

          {/* Niveaux en ligne compacte */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ ...springPresets.gentle, delay: 0.2 }}
            className="mt-12 pt-8 border-t border-[#0D2D5A]/10 flex flex-wrap items-center gap-3"
          >
            <span className="text-[10px] font-black text-[#0D2D5A]/40 uppercase tracking-[0.25em] font-mono mr-2">Niveaux :</span>
            {niveaux.map((n) => (
              <NavLink
                key={n.label}
                to={ROUTE_PATHS.NIVEAUX}
                className="group inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#0D2D5A]/15 bg-white text-[#0D2D5A] text-xs font-bold hover:border-[#1A6CC8] hover:text-[#1A6CC8] hover:bg-[#1A6CC8]/5 transition-all duration-150"
              >
                {n.label}
                <span className="text-[#0D2D5A]/30 text-[10px] font-mono group-hover:text-[#1A6CC8]/50 transition-colors">{n.sub}</span>
              </NavLink>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          §7 — BANDEAU GARANTIE
          Or plein — la seule section vraiment colorée
          ══════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        <div className="bg-[#F5A623] relative">
          {/* Coupure haute diagonale */}
          <div className="absolute top-0 left-0 right-0">
            <svg viewBox="0 0 1440 60" className="w-full block" preserveAspectRatio="none">
              <polygon points="0,0 1440,60 0,60" fill="oklch(0.99 0.003 230)" />
            </svg>
          </div>

          <div className="container mx-auto px-4 py-24 pt-28 relative z-10">
            <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">

              {/* Texte */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={springPresets.gentle}
                className="space-y-5"
              >
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0D2D5A] text-[#F5A623] text-xs font-black uppercase tracking-widest">
                  <TrendingUp className="w-3 h-3" />
                  Résultats garantis par contrat
                </span>
                <h2 className="text-5xl md:text-7xl font-black text-[#0D2D5A] leading-[0.9]">
                  +4 PTS<br />
                  <span className="text-white">
                    DE MOYENNE
                  </span>
                </h2>
                <p className="text-[#0D2D5A] font-semibold text-lg leading-relaxed max-w-sm">
                  Après 6 mois d'accompagnement, nos élèves gagnent en moyenne 4 points.
                  Sinon, on vous rembourse.
                </p>
                <NavLink
                  to={ROUTE_PATHS.CONTACT}
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#0D2D5A] text-white font-black hover:bg-black transition-colors duration-200 shadow-xl"
                >
                  Demander le bilan <ArrowRight className="w-4 h-4" />
                </NavLink>
              </motion.div>

              {/* Cartes preuves */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={springPresets.gentle}
                className="space-y-3"
              >
                {[
                  { icon: Clock, title: "Suivi trimestriel", desc: "Bilan pédagogique tous les 3 mois avec votre conseiller dédié." },
                  { icon: Users, title: "Enseignants triés", desc: "Bac+3 minimum. 1 candidat sur 10 retenu. Formation continue." },
                  { icon: Award, title: "10 ans de résultats", desc: "Des milliers de BEPC et BAC réussis dans 11 pays africains." },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex items-start gap-4 bg-white/30 backdrop-blur-sm border border-white/50 rounded-2xl p-4">
                    <div className="w-10 h-10 rounded-xl bg-[#0D2D5A] flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-[#F5A623]" />
                    </div>
                    <div>
                      <p className="font-black text-[#0D2D5A] text-sm">{title}</p>
                      <p className="text-[#0D2D5A]/70 text-xs leading-relaxed mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>

          {/* Coupure basse diagonale */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 60" className="w-full block" preserveAspectRatio="none">
              <polygon points="0,0 1440,0 1440,60" fill="#0D2D5A" />
            </svg>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          §8 — PROFESSEURS
          Fond navy, cartes blanches
          ══════════════════════════════════════════════════════ */}
      <section id="professeurs" className="py-24 bg-[#0D2D5A]">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={springPresets.gentle}
            className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-14"
          >
            <div className="space-y-3">
              <span className="badge-gold inline-flex items-center gap-2">
                <Users className="w-3.5 h-3.5" />
                Nos professeurs
              </span>
              <h2 className="text-4xl md:text-5xl font-black text-white leading-tight">
                Des enseignants<br />
                <span className="text-[#F5A623]">d'exception</span>
              </h2>
              <p className="text-blue-200 max-w-md">
                Sélection rigoureuse : 1 candidat sur 10 retenu. Bac+3 minimum, expérience vérifiée.
              </p>
            </div>
            <NavLink
              to={ROUTE_PATHS.PROFESSEURS}
              id="see-all-teachers"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[#F5A623]/40 text-[#F5A623] font-bold text-sm hover:bg-[#F5A623] hover:text-[#0D2D5A] transition-all duration-200 shrink-0"
            >
              Voir tous <ArrowRight className="w-4 h-4" />
            </NavLink>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-5"
          >
            {teachers.slice(0, 4).map((teacher) => (
              <motion.div key={teacher.id} variants={staggerItem}>
                <TeacherCard teacher={teacher} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          §9 — TÉMOIGNAGES
          Fond blanc, masonry 3 colonnes avec citations en grand
          ══════════════════════════════════════════════════════ */}
      <section id="temoignages" className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={springPresets.gentle}
            className="text-center max-w-3xl mx-auto mb-14 space-y-3"
          >
            <span className="badge-gold inline-flex items-center gap-2">
              <Star className="w-3.5 h-3.5" />
              Témoignages
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-[#0D2D5A]">
              Ils nous ont fait confiance.{" "}
              <span className="text-[#1A6CC8]">Résultats.</span>
            </h2>
            {/* Note globale */}
            <div className="inline-flex items-center gap-3 bg-[#0D2D5A]/5 px-5 py-2.5 rounded-full">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(i => (
                  <Star key={i} className={`w-4 h-4 ${i <= 4 ? "fill-[#F5A623] text-[#F5A623]" : "fill-[#0D2D5A]/10 text-[#0D2D5A]/10"}`} />
                ))}
              </div>
              <span className="font-black text-[#0D2D5A]">4,4 / 5</span>
              <span className="text-muted-foreground text-sm">— note vérifiée indépendamment</span>
            </div>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-5"
          >
            {testimonials.map((t, i) => (
              <motion.div key={t.id} variants={staggerItem}>
                <div className={`relative h-full bg-white rounded-2xl border border-[#0D2D5A]/8 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden p-6 ${i === 1 ? "md:mt-8" : ""}`}>
                  {/* Quote mark décoratif */}
                  <span className="absolute top-5 right-5 text-7xl font-black text-[#0D2D5A]/5 leading-none select-none">"</span>

                  {/* Étoiles */}
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: t.rating }).map((_, k) => (
                      <Star key={k} className="w-4 h-4 fill-[#F5A623] text-[#F5A623]" />
                    ))}
                  </div>

                  {/* Citation */}
                  <p className="text-[#0D2D5A] text-sm leading-relaxed font-medium mb-5 relative z-10">
                    « {t.text} »
                  </p>

                  {/* Auteur */}
                  <div className="flex items-center gap-3 pt-4 border-t border-[#0D2D5A]/8">
                    <img src={t.photo} alt={t.name} className="w-10 h-10 rounded-full object-cover border-2 border-[#F5A623]" />
                    <div>
                      <p className="font-black text-[#0D2D5A] text-sm">{t.name}</p>
                      <p className="text-[#1A6CC8] text-xs font-mono font-bold">{t.level} • {t.subject}</p>
                    </div>
                  </div>

                  {/* Bande accent gauche */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#F5A623] to-[#1A6CC8]" />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          §10 — PRÉSENCE AFRICAINE
          Section sobre, rangée de drapeaux
          ══════════════════════════════════════════════════════ */}
      <section className="py-20 bg-[#0D2D5A]/5 border-y border-[#0D2D5A]/10">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={springPresets.gentle}
            className="flex flex-col md:flex-row md:items-center gap-8 max-w-5xl mx-auto"
          >
            {/* Texte */}
            <div className="shrink-0 space-y-2 md:w-56">
              <Globe className="w-8 h-8 text-[#1A6CC8]" />
              <h3 className="text-2xl font-black text-[#0D2D5A]">Présents dans<br />{africanPresence.length} pays</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Afrique francophone, de Douala à Antananarivo.</p>
            </div>

            {/* Séparateur vertical */}
            <div className="hidden md:block w-px self-stretch bg-[#0D2D5A]/15" />

            {/* Drapeaux */}
            <div className="flex flex-wrap gap-3 flex-1">
              {africanPresence.map((c) => (
                <div key={c.code} className="group flex flex-col items-center gap-1 cursor-default" title={c.name}>
                  <span className="text-3xl group-hover:scale-125 transition-transform duration-200">{c.flag}</span>
                  <span className="text-[9px] font-black text-[#0D2D5A]/50 uppercase tracking-wider">{c.code}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          §11 — CTA FINAL
          Navy profond, grand titre, deux boutons
          ══════════════════════════════════════════════════════ */}
      <section id="contact" className="py-28 bg-[#0D2D5A] relative overflow-hidden">
        {/* Orbes de fond */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#1A6CC8]/10 rounded-full translate-x-1/3 -translate-y-1/3 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#F5A623]/8 rounded-full -translate-x-1/3 translate-y-1/3 blur-2xl pointer-events-none" />
        {/* Grille points */}
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "28px 28px" }} />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={springPresets.gentle}
            className="max-w-4xl mx-auto"
          >
            {/* Tag */}
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F5A623]/15 border border-[#F5A623]/30 text-[#F5A623] text-xs font-black uppercase tracking-widest mb-6">
              <Award className="w-3 h-3" />
              Bilan personnalisé — 100% gratuit
            </span>

            {/* Titre */}
            <h2 className="text-5xl md:text-7xl font-black text-white leading-[0.9] mb-6">
              Décrivez votre projet,<br />
              <span className="text-[#F5A623]">on s'occupe du reste.</span>
            </h2>

            <p className="text-blue-200 text-lg leading-relaxed max-w-2xl mb-10">
              Un conseiller pédagogique vous rappelle sous 24h pour construire
              avec vous un programme sur mesure adapté à votre enfant.
            </p>

            {/* Boutons */}
            <div className="flex flex-wrap gap-4 mb-14">
              <NavLink
                to={ROUTE_PATHS.CONTACT}
                id="footer-cta"
                className="group relative inline-flex items-center gap-2 px-9 py-4 rounded-full bg-[#F5A623] text-[#0D2D5A] font-black text-lg overflow-hidden shadow-2xl shadow-[#F5A623]/20 hover:shadow-[#F5A623]/40 transition-shadow duration-300"
              >
                <span className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-12" />
                <span className="relative">Demander mon bilan gratuit</span>
                <ArrowRight className="relative w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </NavLink>
              <a
                href="tel:+237675252048"
                className="inline-flex items-center gap-2 px-9 py-4 rounded-full border border-white/20 text-white font-semibold text-lg hover:bg-white/10 transition-colors duration-200"
              >
                <Phone className="w-5 h-5 text-[#F5A623]" />
                +237 675 252 048
              </a>
            </div>

            {/* Mini stats ligne */}
            <div className="flex flex-wrap gap-10 pt-8 border-t border-white/10">
              {[
                { value: "24h", label: "Réponse garantie" },
                { value: "100%", label: "Gratuit & sans engagement" },
                { value: "500+", label: "Enseignants disponibles" },
              ].map(({ value, label }) => (
                <div key={label}>
                  <p className="text-3xl font-black text-[#F5A623] font-mono leading-none">{value}</p>
                  <p className="text-blue-300 text-xs mt-1 font-medium">{label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
