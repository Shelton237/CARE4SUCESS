import { NavLink } from "react-router-dom";
import { ArrowRight, GraduationCap, Globe, Briefcase } from "lucide-react";
import { IMAGES } from "@/assets/images";
import { ROUTE_PATHS } from "@/lib/index";

const OBJECTIVE_CARDS = [
  {
    icon: GraduationCap, color: "#0F9B8E", bgFrom: "from-teal-50",
    title: "Mon enfant a besoin d'un coach scolaire",
    desc: "Nous évaluons son niveau, trouvons le coach idéal et vous suivez sa progression en temps réel.",
    cta: "Évaluation gratuite",
    to: ROUTE_PATHS.EVALUATION_GRATUITE,
  },
  {
    icon: Globe, color: "#F5A623", bgFrom: "from-amber-50",
    title: "Je veux apprendre une langue",
    desc: "Choisissez votre coach, comparez les prix et les avis, réservez votre première session.",
    cta: "Voir les coachs",
    to: ROUTE_PATHS.COURS_DE_LANGUES,
  },
  {
    icon: Briefcase, color: "#E2574C", bgFrom: "from-red-50",
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
      <section className="relative overflow-hidden bg-[#0B2545]">
        <div className="absolute inset-0">
          <img
            src={IMAGES.TEACHER_STUDENT_3}
            alt="Coachs Care4Success"
            className="w-full h-full object-cover opacity-70 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B2545]/80 to-[#0B2545]/50" />
        </div>
        <div className="container mx-auto px-6 max-w-4xl relative z-10 py-5 md:py-6 text-center">
          <p className="text-[#F5A623] text-xs font-bold uppercase tracking-[0.2em] mb-4">Nos coachs</p>
          <h1
            className="text-4xl md:text-5xl font-bold text-white leading-tight mb-6"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            500+ coachs <span className="text-[#F5A623]">rigoureusement sélectionnés</span>
          </h1>
          <p className="text-blue-200 text-xl max-w-2xl mx-auto leading-relaxed">
            Bac+3 minimum. Entretien pédagogique. Références vérifiées. 1 candidat sur 10 retenu.
          </p>
        </div>
      </section>

      {/* ── QUEL EST VOTRE OBJECTIF ── */}
      <section className="py-20 md:py-24 bg-white">
        <div className="container mx-auto px-6 max-w-5xl text-center mb-12">
          <p className="text-[#0F9B8E] text-xs font-bold uppercase tracking-[0.2em] mb-3">Nos univers</p>
          <h2 className="text-3xl md:text-4xl font-bold text-[#0D2D5A]" style={{ fontFamily: "'Playfair Display', serif" }}>
            Quel est votre objectif ?
          </h2>
          <p className="text-gray-500 mt-2">Choisissez votre univers pour commencer.</p>
        </div>
        <div className="container mx-auto px-6 max-w-5xl grid md:grid-cols-3 gap-6">
          {OBJECTIVE_CARDS.map(card => (
            <NavLink
              key={card.title}
              to={card.to}
              className={`bg-gradient-to-b ${card.bgFrom} to-white rounded-2xl border border-gray-100 p-7 hover:shadow-lg transition-shadow duration-200 cursor-pointer`}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ backgroundColor: card.color }}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-[#0D2D5A] mb-2">{card.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-5">{card.desc}</p>
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
