import { useState } from "react";
import { NavLink } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { ROUTE_PATHS } from "@/lib/index";
import { IMAGES } from "@/assets/images";
import { Breadcrumb } from "@/components/Layout";

const PARCOURS = {
  langues: {
    tabLabel: "Cours de langues",
    steps: [
      { title: "Choisissez votre langue", desc: "Parcourez les profils de coachs, comparez les prix et les avis.", timing: "Immédiat" },
      { title: "Réservez une session", desc: "Sélectionnez un créneau, choisissez le format (en ligne ou présentiel) et payez.", timing: "2 minutes" },
      { title: "Suivez votre cours", desc: "En visioconférence ou en personne. Votre coach s'adapte à votre niveau.", timing: "Session de 60 min" },
      { title: "Progressez et re-réservez", desc: "Évaluez votre coach, suivez votre progression, réservez la prochaine session.", timing: "À votre rythme" },
    ],
    cta: { label: "Trouver un coach de langue", color: "#F5A623", textColor: "#0D2D5A" },
  },
  scolaire: {
    tabLabel: "Soutien scolaire",
    steps: [
      { title: "Vous nous contactez", desc: "Remplissez le formulaire de demande de bilan. Décrivez les besoins de votre enfant.", timing: "2 minutes" },
      { title: "Nous évaluons", desc: "Notre équipe analyse le profil, identifie les difficultés et le curriculum de votre enfant.", timing: "24 à 48h" },
      { title: "Nous proposons le coach", desc: "Le superviseur sélectionne le coach le plus adapté. Le tarif horaire est fixé. Vous décidez.", timing: "Vous choisissez" },
      { title: "Vous suivez tout", desc: "Présence, devoirs, progression, facturation, tout est dans votre espace parent, en temps réel.", timing: "Chaque session" },
    ],
    cta: { label: "Demander une évaluation gratuite", color: "#0F9B8E", textColor: "#ffffff" },
  },
} as const;

export default function CommentCaMarche() {
  const [tab, setTab] = useState<"langues" | "scolaire">("langues");
  const parcours = PARCOURS[tab];

  return (
    <div className="min-h-screen bg-[#F4F2ED]" style={{ fontFamily: "Nunito, 'Noto Sans', sans-serif" }}>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-[#0B2545]">
        <div className="absolute inset-0">
          <img
            src={IMAGES.TEACHER_STUDENT_3}
            alt="Coach et apprenant"
            className="w-full h-full object-cover opacity-70 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B2545]/80 to-[#0B2545]/50" />
        </div>
        <div className="container mx-auto px-6 max-w-4xl relative z-10 py-5 md:py-6 text-center">
          <p className="text-[#F5A623] text-xs font-bold uppercase tracking-[0.2em] mb-4">Comment ça marche</p>
          <h1
            className="text-4xl md:text-5xl font-bold text-white leading-tight mb-6"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Deux parcours, un même <span className="text-[#F5A623]">objectif</span> : progresser
          </h1>
          <p className="text-blue-200 text-xl max-w-2xl mx-auto leading-relaxed">
            Le fonctionnement dépend de votre besoin. Choisissez votre parcours.
          </p>
        </div>
      </section>

      <Breadcrumb />

      <section className="py-5 md:py-6">
        <div className="container mx-auto px-6 max-w-5xl">

          {/* Tabs */}
          <div className="inline-flex bg-white rounded-xl p-1 mb-10 border border-gray-100">
            {(Object.keys(PARCOURS) as Array<keyof typeof PARCOURS>).map(key => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-colors duration-200 ${
                  tab === key ? "bg-[#0D2D5A] text-white" : "text-[#0D2D5A]/70 hover:text-[#0D2D5A]"
                }`}
              >
                {PARCOURS[key].tabLabel}
              </button>
            ))}
          </div>

          {/* Steps */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
            {parcours.steps.map((step, i) => (
              <div key={step.title} className="bg-white rounded-2xl p-6">
                <div className="w-8 h-8 rounded-full bg-[#0D2D5A] text-white flex items-center justify-center text-sm font-bold mb-4">
                  {i + 1}
                </div>
                <h3 className="font-bold text-[#0D2D5A] mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-3">{step.desc}</p>
                <p className="text-xs font-bold text-[#0F9B8E]">{step.timing}</p>
              </div>
            ))}
          </div>

          <NavLink
            to={ROUTE_PATHS.PROFESSEURS}
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg font-bold transition-opacity hover:opacity-90"
            style={{ backgroundColor: parcours.cta.color, color: parcours.cta.textColor }}
          >
            {parcours.cta.label} <ArrowRight className="w-4 h-4" />
          </NavLink>
        </div>
      </section>
    </div>
  );
}
