import { motion } from "framer-motion";
import { NavLink } from "react-router-dom";
import { ArrowRight, BookOpen, Check } from "lucide-react";
import { ROUTE_PATHS } from "@/lib/index";
import { springPresets, staggerContainer, staggerItem } from "@/lib/motion";
import { IMAGES } from "@/assets/images";

const LEVELS = [
  {
    id: "primaire",
    label: "Primaire",
    grades: "SIL — CM2",
    desc: "Poser des bases solides en français, mathématiques et éveil. Un accompagnement doux, ludique et encourageant.",
    image: IMAGES.STUDENTS_STUDYING_1,
    subjects: ["Français", "Mathématiques", "Anglais", "Éveil scientifique", "Expression orale"],
    goals: ["Consolider la lecture et l'écriture", "Maîtriser le calcul mental", "Développer la curiosité intellectuelle"],
    accent: "#1A6CC8",
  },
  {
    id: "college",
    label: "Collège",
    grades: "6ème — 3ème",
    desc: "La phase cruciale avant le BEPC. Méthode de travail, compréhension profonde et préparation aux examens.",
    image: IMAGES.STUDENTS_STUDYING_2,
    subjects: ["Mathématiques", "Français", "Physique-Chimie", "SVT", "Anglais", "Histoire-Géo"],
    goals: ["Préparer le BEPC avec méthode", "Renforcer les acquis du primaire", "Développer l'autonomie de travail"],
    accent: "#F5A623",
  },
  {
    id: "lycee",
    label: "Lycée",
    grades: "Seconde — Terminale",
    desc: "La préparation au BAC exige rigueur et méthode. Révisions ciblées, fiches de synthèse et simulations d'épreuves.",
    image: IMAGES.STUDENTS_STUDYING_4,
    subjects: ["Mathématiques", "Physique-Chimie", "SVT", "Philosophie", "Économie", "Langues"],
    goals: ["Viser +4 points au BAC", "Maîtriser la dissertation et le commentaire", "Gérer le stress des épreuves"],
    accent: "#0D2D5A",
  },
  {
    id: "superieur",
    label: "Supérieur",
    grades: "Prépa / BTS / Licence",
    desc: "Classes préparatoires, BTS, universités : des enseignants experts pour accompagner les études supérieures.",
    image: IMAGES.ONLINE_LEARNING_1,
    subjects: ["Mathématiques sup/spé", "Informatique", "Comptabilité", "Gestion", "Langues pro", "Prépa concours"],
    goals: ["Réussir les concours d'accès aux grandes écoles", "Valider les UE du semestre", "Décrocher le BTS ou la licence"],
    accent: "#7C3AED",
  },
  {
    id: "adultes",
    label: "Adultes & Pros",
    grades: "Formation continue",
    desc: "Reconversion, montée en compétences ou remise à niveau : nos enseignants s'adaptent au rythme des adultes actifs.",
    image: IMAGES.TEACHER_STUDENT_2 ?? IMAGES.TEACHER_STUDENT_1,
    subjects: ["Bureautique & Informatique", "Langues (Français, Anglais)", "Comptabilité", "Marketing digital", "Prépa concours administratifs"],
    goals: ["Obtenir une certification professionnelle", "Maîtriser un outil ou une langue", "Progresser dans sa carrière"],
    accent: "#059669",
  },
];

const STATS = [
  { value: "5", label: "niveaux couverts" },
  { value: "30+", label: "matières enseignées" },
  { value: "500+", label: "enseignants spécialisés" },
  { value: "98 %", label: "de satisfaction" },
];

export default function Niveaux() {
  return (
    <div className="min-h-screen" style={{ fontFamily: "Ubuntu, 'Noto Sans', sans-serif" }}>

      {/* ── HERO ── */}
      <section className="relative bg-[#0D2D5A] py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#F5A623]/10 rounded-full blur-3xl -translate-x-1/3 translate-y-1/3 pointer-events-none" />

        <div className="container mx-auto px-6 max-w-5xl relative z-10">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={springPresets.gentle} className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[#F5A623] mb-4">Niveaux scolaires</p>
            <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-5">
              Du primaire au supérieur —<br />
              <span className="text-[#F5A623]">chaque étape accompagnée</span>
            </h1>
            <p className="text-blue-200 text-lg leading-relaxed max-w-xl mb-8">
              Nos enseignants sont spécialisés par niveau et par matière. Quelle que soit l'étape du parcours scolaire, nous avons le profil adapté.
            </p>
            <NavLink to="/inscription" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#F5A623] text-[#0D2D5A] font-bold text-sm hover:bg-white transition-all duration-200 shadow-lg cursor-pointer">
              Trouver un enseignant <ArrowRight className="w-4 h-4" />
            </NavLink>
          </motion.div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-gray-100">
            {STATS.map(({ value, label }) => (
              <div key={label} className="text-center py-8 px-6">
                <p className="text-3xl font-black text-[#0D2D5A] font-mono">{value}</p>
                <p className="text-sm text-gray-500 mt-1 font-medium">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── NIVEAUX ── */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6 max-w-5xl">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-6"
          >
            {LEVELS.map((lvl, i) => (
              <motion.div
                key={lvl.id}
                variants={staggerItem}
                className={`bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col md:flex-row ${i % 2 === 1 ? "md:flex-row-reverse" : ""}`}
              >
                {/* Image */}
                <div className="md:w-64 shrink-0 relative overflow-hidden">
                  <img src={lvl.image} alt={lvl.label} className="w-full h-44 md:h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0D2D5A]/60 to-transparent" />
                  <div className="absolute bottom-3 left-3">
                    <p className="text-white text-lg font-black">{lvl.label}</p>
                    <p className="text-[#F5A623] text-xs font-bold font-mono">{lvl.grades}</p>
                  </div>
                </div>

                {/* Contenu */}
                <div className="flex-1 p-7">
                  <div className="mb-1" style={{ width: 32, height: 3, backgroundColor: lvl.accent, borderRadius: 2 }} />
                  <h3 className="font-black text-[#0D2D5A] text-lg mb-2">{lvl.label} — {lvl.grades}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed mb-5">{lvl.desc}</p>

                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2.5 flex items-center gap-1.5">
                        <BookOpen className="w-3 h-3" /> Matières disponibles
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {lvl.subjects.map(s => (
                          <span key={s} className="text-xs px-2.5 py-1 rounded-full border border-gray-200 text-gray-600 font-medium hover:border-[#1A6CC8] hover:text-[#1A6CC8] transition-colors duration-150">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2.5 flex items-center gap-1.5">
                        <Check className="w-3 h-3" /> Objectifs
                      </p>
                      <ul className="space-y-1.5">
                        {lvl.goals.map(g => (
                          <li key={g} className="flex items-start gap-2 text-xs text-gray-600">
                            <Check className="w-3 h-3 mt-0.5 shrink-0" style={{ color: lvl.accent }} />
                            {g}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-5 pt-5 border-t border-gray-100">
                    <NavLink to="/inscription" className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-150 cursor-pointer hover:opacity-90" style={{ backgroundColor: lvl.accent }}>
                      Trouver un enseignant {lvl.label} <ArrowRight className="w-3.5 h-3.5" />
                    </NavLink>
                  </div>
                </div>
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
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[#F5A623] mb-4">Votre niveau, notre engagement</p>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
              Prêt à commencer ?
            </h2>
            <p className="text-blue-200/70 mb-8">
              Inscrivez-vous en 2 minutes. Un conseiller vous contacte sous 24h pour vous proposer les profils les plus adaptés.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <NavLink to="/inscription" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-[#F5A623] text-[#0D2D5A] font-bold hover:bg-white transition-all duration-200 shadow-lg cursor-pointer">
                S'inscrire gratuitement <ArrowRight className="w-4 h-4" />
              </NavLink>
              <NavLink to={ROUTE_PATHS.CONTACT} className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl border border-white/20 text-white font-semibold hover:bg-white/10 transition-all duration-200 cursor-pointer">
                Nous contacter
              </NavLink>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
