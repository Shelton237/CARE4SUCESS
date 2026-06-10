import { motion } from "framer-motion";
import { NavLink } from "react-router-dom";
import {
  Home as HomeIcon, Monitor, Calendar, GraduationCap,
  Check, ArrowRight, Users, Shield, TrendingUp, Clock,
} from "lucide-react";
import { ROUTE_PATHS } from "@/lib/index";
import { springPresets, staggerContainer, staggerItem } from "@/lib/motion";
import { IMAGES } from "@/assets/images";

const SERVICES = [
  {
    id: "domicile",
    icon: HomeIcon,
    label: "Cours à domicile",
    tag: "Le plus choisi",
    price: "Dès 9 000 FCFA/h",
    desc: "Un enseignant qualifié se déplace chez vous. Cours personnalisés 1-à-1, à l'heure et l'endroit qui vous conviennent.",
    image: IMAGES.TEACHER_STUDENT_1,
    features: [
      "Enseignant sélectionné parmi 500+ profils vérifiés",
      "Programme sur mesure dès le premier cours",
      "Rapport écrit après chaque séance",
      "Enseignant remplacé sous 48h si insatisfaction",
      "Annulation libre, sans pénalité",
    ],
    color: "bg-[#1A6CC8]",
  },
  {
    id: "enligne",
    icon: Monitor,
    label: "Cours en ligne",
    tag: null,
    price: "Dès 7 500 FCFA/h",
    desc: "Tableau blanc interactif, enregistrements de sessions, outils pédagogiques numériques. Toute l'Afrique francophone.",
    image: IMAGES.ONLINE_LEARNING_1,
    features: [
      "Classe virtuelle dédiée avec tableau blanc partagé",
      "Enregistrement de chaque cours disponible en replay",
      "Partage de fichiers et de ressources en temps réel",
      "Connexion optimisée pour les réseaux africains",
      "Accessible depuis smartphone ou ordinateur",
    ],
    color: "bg-purple-600",
  },
  {
    id: "stage",
    icon: Calendar,
    label: "Stages vacances",
    tag: "Vacances scolaires",
    price: "Dès 150 000 FCFA",
    desc: "8 élèves maximum par groupe. Programme intensif pour rattraper, consolider ou prendre de l'avance sur la rentrée.",
    image: IMAGES.STUDENTS_STUDYING_4,
    features: [
      "Groupes de 8 élèves maximum pour une attention maximale",
      "Programme 5 jours intensifs par matière",
      "Bilan de progression remis à la fin du stage",
      "Enseignants spécialisés par niveau et par matière",
      "Horaires adaptés aux vacances scolaires camerounaises",
    ],
    color: "bg-emerald-600",
  },
  {
    id: "bac",
    icon: GraduationCap,
    label: "Prépa BEPC & BAC",
    tag: "Examens nationaux",
    price: "Dès 10 000 FCFA/h",
    desc: "Méthodologie d'examen, sujets des 5 dernières années, simulations chronométrées. Pour ne rien laisser au hasard.",
    image: IMAGES.STUDENTS_STUDYING_2,
    features: [
      "Enseignant spécialisé prépa examens nationaux",
      "Sujets corrigés BEPC/BAC des 5 dernières années",
      "Simulations d'épreuves en conditions réelles",
      "Suivi hebdomadaire avec conseiller pédagogique",
      "Garantie +4 points ou remboursement",
    ],
    color: "bg-[#F5A623]",
  },
];

const PROCESS = [
  { n: "01", title: "Bilan pédagogique", desc: "20 min avec un conseiller pour cerner les vrais blocages de votre enfant." },
  { n: "02", title: "Enseignant sélectionné", desc: "Parmi 500+ profils, le plus adapté au niveau et à la personnalité de votre enfant." },
  { n: "03", title: "Programme sur mesure", desc: "Un plan heure par heure conçu pour atteindre l'objectif fixé ensemble." },
  { n: "04", title: "Suivi & progression", desc: "Rapports réguliers, ajustements en continu, conseiller joignable à tout moment." },
];

const TRUST = [
  { icon: Shield,     text: "Garantie +4 points en 6 mois" },
  { icon: Clock,      text: "Enseignant trouvé en 4 jours" },
  { icon: Users,      text: "1 candidat sur 10 retenu" },
  { icon: TrendingUp, text: "10 ans de résultats mesurés" },
];

export default function Services() {
  return (
    <div className="min-h-screen" style={{ fontFamily: "Ubuntu, 'Noto Sans', sans-serif" }}>

      {/* ── HERO ── */}
      <section className="relative bg-[#0D2D5A] py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#1A6CC8]/20 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3 pointer-events-none" />

        <div className="container mx-auto px-6 max-w-5xl relative z-10">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={springPresets.gentle} className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[#F5A623] mb-4">Nos formules</p>
            <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-5">
              Des solutions taillées<br />
              <span className="text-[#F5A623]">pour chaque profil</span>
            </h1>
            <p className="text-blue-200 text-lg leading-relaxed max-w-xl mb-8">
              Cours à domicile, en ligne, stages intensifs ou prépa examens — choisissez la formule adaptée à l'objectif de votre enfant.
            </p>
            <div className="flex flex-wrap gap-3">
              <NavLink to="/inscription" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#F5A623] text-[#0D2D5A] font-bold text-sm hover:bg-white transition-all duration-200 shadow-lg cursor-pointer">
                S'inscrire gratuitement <ArrowRight className="w-4 h-4" />
              </NavLink>
              <NavLink to={ROUTE_PATHS.TARIFS} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/20 text-white font-semibold text-sm hover:bg-white/10 transition-all duration-200 cursor-pointer">
                Voir les tarifs
              </NavLink>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── TRUST BAR ── */}
      <section className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-gray-100">
            {TRUST.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 py-5 px-6">
                <div className="w-8 h-8 rounded-lg bg-[#1A6CC8]/8 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-[#1A6CC8]" />
                </div>
                <p className="text-sm font-semibold text-[#0D2D5A]">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6 max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={springPresets.gentle}
            className="text-center mb-14"
          >
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[#F5A623] mb-3">Formules disponibles</p>
            <h2 className="text-3xl md:text-4xl font-black text-[#0D2D5A]">Choisissez votre formule</h2>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-6"
          >
            {SERVICES.map((s, i) => (
              <motion.div
                key={s.id}
                variants={staggerItem}
                className={`bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col md:flex-row ${i % 2 === 1 ? "md:flex-row-reverse" : ""}`}
              >
                {/* Image */}
                <div className="md:w-72 lg:w-80 shrink-0 relative overflow-hidden">
                  <img src={s.image} alt={s.label} className="w-full h-52 md:h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0D2D5A]/50 to-transparent" />
                  <div className={`absolute top-4 left-4 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full text-white ${s.color}`}>
                    {s.tag ?? "Disponible"}
                  </div>
                </div>

                {/* Contenu */}
                <div className="flex-1 p-7 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-xl bg-[#0D2D5A]/8 flex items-center justify-center">
                        <s.icon className="w-5 h-5 text-[#0D2D5A]" />
                      </div>
                      <div>
                        <h3 className="font-black text-[#0D2D5A] text-lg leading-tight">{s.label}</h3>
                        <p className="text-[#F5A623] text-sm font-bold font-mono">{s.price}</p>
                      </div>
                    </div>
                    <p className="text-gray-500 text-sm leading-relaxed mb-5">{s.desc}</p>
                    <ul className="space-y-2">
                      {s.features.map(f => (
                        <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                          <Check className="w-3.5 h-3.5 text-[#1A6CC8] shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-6 pt-5 border-t border-gray-100 flex flex-wrap gap-3">
                    <NavLink to="/inscription" className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#0D2D5A] text-white text-sm font-bold hover:bg-[#1A6CC8] transition-all duration-150 cursor-pointer">
                      S'inscrire <ArrowRight className="w-3.5 h-3.5" />
                    </NavLink>
                    <NavLink to={ROUTE_PATHS.TARIFS} className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:border-[#1A6CC8] hover:text-[#1A6CC8] transition-all duration-150 cursor-pointer">
                      Voir les tarifs
                    </NavLink>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── PROCESSUS ── */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6 max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={springPresets.gentle}
            className="text-center mb-14"
          >
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[#F5A623] mb-3">Notre méthode</p>
            <h2 className="text-3xl md:text-4xl font-black text-[#0D2D5A]">Comment ça fonctionne</h2>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {PROCESS.map(({ n, title, desc }) => (
              <motion.div key={n} variants={staggerItem} className="relative">
                <div className="text-5xl font-black font-mono text-[#0D2D5A]/5 leading-none mb-3">{n}</div>
                <div className="w-8 h-1 bg-[#F5A623] rounded-full mb-3" />
                <h3 className="font-black text-[#0D2D5A] mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 bg-[#0D2D5A] relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="container mx-auto px-6 max-w-3xl relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={springPresets.gentle}>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[#F5A623] mb-4">Bilan gratuit</p>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
              Pas sûr de la formule ?<br />Demandez conseil.
            </h2>
            <p className="text-blue-200/70 mb-8">
              Un conseiller vous rappelle sous 24h pour vous orienter vers la formule la plus adaptée à votre enfant.
            </p>
            <NavLink to={ROUTE_PATHS.CONTACT} className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-[#F5A623] text-[#0D2D5A] font-bold hover:bg-white transition-all duration-200 shadow-lg cursor-pointer">
              Demander un bilan gratuit <ArrowRight className="w-4 h-4" />
            </NavLink>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
