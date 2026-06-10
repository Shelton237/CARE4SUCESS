import { motion } from "framer-motion";
import { NavLink } from "react-router-dom";
import {
  Target, Globe, Users, Award, TrendingUp,
  Heart, CheckCircle, ArrowRight, BookOpen, Shield,
} from "lucide-react";
import { ROUTE_PATHS } from "@/lib/index";
import { springPresets, staggerContainer, staggerItem } from "@/lib/motion";
import { IMAGES } from "@/assets/images";

const STATS = [
  { value: "10 ans",  label: "d'expérience",           icon: Award },
  { value: "500+",    label: "enseignants qualifiés",   icon: Users },
  { value: "15",      label: "pays africains couverts", icon: Globe },
  { value: "98 %",    label: "de missions honorées",    icon: CheckCircle },
];

const VALUES = [
  {
    icon: Target,
    title: "Excellence pédagogique",
    desc: "Chaque enseignant est sélectionné sur dossier, entretien et évaluation pédagogique. 1 candidat sur 10 retenu.",
  },
  {
    icon: Heart,
    title: "Accompagnement humain",
    desc: "Un conseiller dédié suit chaque famille de A à Z. Disponible, réactif, investi dans la réussite de votre enfant.",
  },
  {
    icon: Shield,
    title: "Engagement contractuel",
    desc: "+4 points de moyenne garantis en 6 mois, ou remboursement. Notre confiance se traduit par des engagements écrits.",
  },
  {
    icon: Globe,
    title: "Vision panafricaine",
    desc: "Né au Cameroun, présent dans 15 pays. Care4Success construit la plateforme de référence du soutien scolaire en Afrique.",
  },
];

const MILESTONES = [
  { year: "2014", title: "Fondation à Douala", desc: "Lancement des premiers cours particuliers à domicile dans l'arrondissement de Douala 5e." },
  { year: "2017", title: "Expansion nationale", desc: "Ouverture de l'antenne de Yaoundé et des premières franchises régionales au Cameroun." },
  { year: "2019", title: "Plateforme numérique", desc: "Lancement des cours en ligne avec classe virtuelle interactive pour atteindre toute l'Afrique francophone." },
  { year: "2022", title: "Expansion africaine", desc: "Présence dans 15 pays : Sénégal, Côte d'Ivoire, Mali, Gabon, RDC et plus encore." },
  { year: "2024", title: "500+ enseignants", desc: "Le réseau Care4Success dépasse les 500 enseignants actifs et les 10 000 élèves accompagnés." },
];

const AFRICAN_PRESENCE = [
  { flag: "🇨🇲", name: "Cameroun",        code: "CMR" },
  { flag: "🇸🇳", name: "Sénégal",         code: "SEN" },
  { flag: "🇨🇮", name: "Côte d'Ivoire",   code: "CIV" },
  { flag: "🇬🇦", name: "Gabon",           code: "GAB" },
  { flag: "🇲🇱", name: "Mali",            code: "MLI" },
  { flag: "🇧🇫", name: "Burkina Faso",    code: "BFA" },
  { flag: "🇹🇬", name: "Togo",            code: "TGO" },
  { flag: "🇧🇯", name: "Bénin",           code: "BEN" },
  { flag: "🇬🇳", name: "Guinée",          code: "GIN" },
  { flag: "🇨🇩", name: "RD Congo",        code: "COD" },
  { flag: "🇲🇬", name: "Madagascar",      code: "MDG" },
  { flag: "🇨🇫", name: "Centrafrique",    code: "RCA" },
  { flag: "🇬🇼", name: "Guinée-Bissau",   code: "GNB" },
  { flag: "🇰🇲", name: "Comores",         code: "COM" },
  { flag: "🇲🇷", name: "Mauritanie",      code: "MRT" },
];

export default function About() {
  return (
    <div className="min-h-screen" style={{ fontFamily: "Ubuntu, 'Noto Sans', sans-serif" }}>

      {/* ── HERO ── */}
      <section className="relative bg-[#0D2D5A] py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#1A6CC8]/20 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3 pointer-events-none" />

        <div className="container mx-auto px-6 max-w-5xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springPresets.gentle}
            className="max-w-3xl"
          >
            <p className="text-[#F5A623] text-xs font-black uppercase tracking-[0.3em] mb-4">À propos de Care4Success</p>
            <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-6">
              10 ans au service de<br />
              <span className="text-[#F5A623]">la réussite africaine</span>
            </h1>
            <p className="text-blue-200 text-lg leading-relaxed max-w-xl mb-8">
              Fondée à Douala en 2014, Care4Success est aujourd'hui la plateforme de référence du soutien scolaire en Afrique francophone. Notre mission : donner à chaque enfant les moyens de réussir.
            </p>
            <div className="flex flex-wrap gap-3">
              <NavLink to="/inscription" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#1A6CC8] text-white font-bold text-sm hover:bg-white hover:text-[#0D2D5A] transition-all duration-200 shadow-lg cursor-pointer">
                <BookOpen className="w-4 h-4" /> Commencer maintenant
              </NavLink>
              <NavLink to={ROUTE_PATHS.CONTACT} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/20 text-white font-semibold text-sm hover:bg-white/10 transition-all duration-200 cursor-pointer">
                Nous contacter <ArrowRight className="w-4 h-4" />
              </NavLink>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-6 max-w-5xl">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-gray-100"
          >
            {STATS.map(({ value, label, icon: Icon }) => (
              <motion.div key={label} variants={staggerItem} className="flex flex-col items-center text-center py-10 px-6">
                <div className="w-10 h-10 rounded-xl bg-[#1A6CC8]/8 flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5 text-[#1A6CC8]" />
                </div>
                <p className="text-3xl font-black text-[#0D2D5A] font-mono leading-none">{value}</p>
                <p className="text-sm text-gray-500 mt-1.5 font-medium">{label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── MISSION ── */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={springPresets.gentle}
            >
              <p className="text-xs font-black uppercase tracking-[0.3em] text-[#F5A623] mb-3">Notre mission</p>
              <h2 className="text-3xl md:text-4xl font-black text-[#0D2D5A] leading-tight mb-5">
                Rendre l'excellence<br />accessible à tous
              </h2>
              <p className="text-gray-600 leading-relaxed mb-5">
                Trop longtemps, le soutien scolaire de qualité a été un privilège. Care4Success change cela. En connectant des familles avec des enseignants rigoureusement sélectionnés, nous rendons l'excellence pédagogique accessible partout en Afrique francophone.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Notre modèle repose sur trois piliers : <strong className="text-[#0D2D5A]">la sélection rigoureuse</strong> des enseignants, <strong className="text-[#0D2D5A]">le suivi personnalisé</strong> de chaque élève, et <strong className="text-[#0D2D5A]">l'engagement sur les résultats</strong>.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={springPresets.gentle}
              className="relative"
            >
              <div className="relative rounded-2xl overflow-hidden aspect-[4/3]">
                <img src={IMAGES.TEACHER_STUDENT_1} alt="Cours particuliers Care4Success" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0D2D5A]/60 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3">
                  <p className="text-white text-sm font-bold">+4 points de moyenne garantis</p>
                  <p className="text-[#F5A623] text-xs font-semibold">En 6 mois — ou remboursé</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── NOS VALEURS ── */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6 max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={springPresets.gentle}
            className="text-center mb-14"
          >
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[#F5A623] mb-3">Ce qui nous guide</p>
            <h2 className="text-3xl md:text-4xl font-black text-[#0D2D5A]">Nos valeurs fondamentales</h2>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid sm:grid-cols-2 gap-6"
          >
            {VALUES.map(({ icon: Icon, title, desc }) => (
              <motion.div key={title} variants={staggerItem} className="flex gap-4 p-6 rounded-2xl border border-gray-100 hover:border-[#1A6CC8]/20 hover:shadow-md transition-all duration-200 bg-white">
                <div className="w-11 h-11 rounded-xl bg-[#0D2D5A] flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-[#F5A623]" />
                </div>
                <div>
                  <h3 className="font-black text-[#0D2D5A] mb-1.5">{title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── TIMELINE ── */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={springPresets.gentle}
            className="text-center mb-14"
          >
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[#F5A623] mb-3">Notre histoire</p>
            <h2 className="text-3xl md:text-4xl font-black text-[#0D2D5A]">10 ans de croissance</h2>
          </motion.div>

          <div className="relative">
            <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px bg-[#0D2D5A]/10 -translate-x-1/2" />
            <div className="space-y-8">
              {MILESTONES.map((m, i) => (
                <motion.div
                  key={m.year}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -24 : 24 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ ...springPresets.gentle, delay: i * 0.08 }}
                  className={`relative flex gap-6 md:gap-0 ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"}`}
                >
                  <div className={`hidden md:block md:w-1/2 ${i % 2 === 0 ? "pr-12 text-right" : "pl-12 text-left"}`}>
                    <div className={`inline-block bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200 ${i % 2 === 0 ? "ml-auto" : ""}`}>
                      <p className="text-xs font-black text-[#F5A623] uppercase tracking-widest mb-1">{m.year}</p>
                      <h3 className="font-black text-[#0D2D5A] mb-1">{m.title}</h3>
                      <p className="text-sm text-gray-500 leading-relaxed">{m.desc}</p>
                    </div>
                  </div>
                  {/* Dot */}
                  <div className="absolute left-8 md:left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-[#1A6CC8] border-2 border-white shadow-md top-5" />
                  {/* Mobile card */}
                  <div className="md:hidden pl-14">
                    <p className="text-xs font-black text-[#F5A623] uppercase tracking-widest mb-1">{m.year}</p>
                    <h3 className="font-black text-[#0D2D5A] mb-1">{m.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{m.desc}</p>
                  </div>
                  <div className="hidden md:block md:w-1/2" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PRÉSENCE AFRICAINE ── */}
      <section className="py-20 bg-[#0D2D5A]">
        <div className="container mx-auto px-6 max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={springPresets.gentle}
            className="text-center mb-12"
          >
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[#F5A623] mb-3">Présence internationale</p>
            <h2 className="text-3xl font-black text-white mb-3">
              <Globe className="w-7 h-7 text-[#F5A623] inline mr-2 mb-1" />
              {AFRICAN_PRESENCE.length} pays africains
            </h2>
            <p className="text-blue-200/70 text-sm">De Douala à Antananarivo, nous accompagnons les familles à travers l'Afrique francophone.</p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-3 sm:grid-cols-5 gap-4"
          >
            {AFRICAN_PRESENCE.map(c => (
              <motion.div key={c.code} variants={staggerItem} className="flex flex-col items-center gap-2 py-4 px-3 rounded-xl bg-white/5 border border-white/8 hover:bg-white/10 transition-colors duration-150 cursor-default">
                <span className="text-3xl" role="img" aria-label={c.name}>{c.flag}</span>
                <span className="text-xs font-bold text-white/80">{c.name}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6 max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={springPresets.gentle}
          >
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[#F5A623] mb-3">Rejoignez la famille</p>
            <h2 className="text-3xl md:text-4xl font-black text-[#0D2D5A] mb-4">
              Prêt à faire réussir votre enfant ?
            </h2>
            <p className="text-gray-500 mb-8 leading-relaxed">
              Inscrivez-vous gratuitement et un conseiller vous contacte sous 24h pour construire un programme sur mesure.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <NavLink to="/inscription" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-[#0D2D5A] text-white font-bold hover:bg-[#1A6CC8] transition-all duration-200 shadow-lg cursor-pointer">
                S'inscrire gratuitement <ArrowRight className="w-4 h-4" />
              </NavLink>
              <NavLink to={ROUTE_PATHS.DEVENIR_PROFESSEUR} className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl border-2 border-[#F5A623] text-[#F5A623] font-bold hover:bg-[#F5A623] hover:text-[#0D2D5A] transition-all duration-200 cursor-pointer">
                <TrendingUp className="w-4 h-4" /> Devenir enseignant
              </NavLink>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
