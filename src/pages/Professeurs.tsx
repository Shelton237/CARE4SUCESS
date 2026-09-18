import { motion } from "framer-motion";
import { NavLink } from "react-router-dom";
import { ArrowRight, GraduationCap, Globe, Briefcase } from "lucide-react";
import { IMAGES } from "@/assets/images";
import { ROUTE_PATHS } from "@/lib/index";
import { springPresets } from "@/lib/motion";
import { Breadcrumb } from "@/components/Layout";

const OBJECTIVE_CARDS = [
  {
    icon: GraduationCap, color: "#0F9B8E",
    title: "Mon enfant a besoin d'un coach scolaire",
    desc: "Nous évaluons son niveau, trouvons le coach idéal et vous suivez sa progression en temps réel.",
    cta: "Évaluation gratuite",
    to: ROUTE_PATHS.CONTACT,
  },
  {
    icon: Globe, color: "#F5A623",
    title: "Je veux apprendre une langue",
    desc: "Choisissez votre coach, comparez les prix et les avis, réservez votre première session.",
    cta: "Voir les coachs",
    to: `${ROUTE_PATHS.ANNUAIRE_COACHS}?categorie=langues`,
  },
  {
    icon: Briefcase, color: "#E2574C",
    title: "Je veux développer une compétence pro",
    desc: "Formations, conférences, certifications — par des experts. Lancement bientôt.",
    cta: "Me prévenir",
    to: "#",
  },
];

export default function Professeurs() {
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
          </motion.div>
        </div>
      </section>

      <Breadcrumb />

      {/* ── QUEL EST VOTRE OBJECTIF ── */}
      <section className="py-16 bg-[#0D2D5A]">
        <div className="container mx-auto px-6 max-w-5xl text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
            Quel est votre objectif ?
          </h2>
          <p className="text-blue-200 mt-2">Choisissez votre univers pour commencer.</p>
        </div>
        <div className="container mx-auto px-6 max-w-5xl grid md:grid-cols-3 gap-6">
          {OBJECTIVE_CARDS.map(card => (
            <NavLink key={card.title} to={card.to} className="bg-white rounded-2xl p-7 hover:shadow-xl transition-shadow duration-200 cursor-pointer">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ backgroundColor: card.color }}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-[#0D2D5A] mb-2">{card.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-5">{card.desc}</p>
              <span className="inline-flex items-center gap-1.5 text-sm font-bold" style={{ color: card.color }}>
                {card.cta} <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </NavLink>
          ))}
        </div>
      </section>
    </div>
  );
}
