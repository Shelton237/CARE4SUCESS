import { motion } from "framer-motion";
import { NavLink } from "react-router-dom";
import {
  Check, X, ArrowRight, Phone, Star,
  Home as HomeIcon, Monitor, Calendar, GraduationCap, Users,
} from "lucide-react";
import { ROUTE_PATHS } from "@/lib/index";
import { springPresets, staggerContainer, staggerItem } from "@/lib/motion";
import { IMAGES } from "@/assets/images";

const PLANS = [
  {
    id: "domicile",
    icon: HomeIcon,
    label: "Cours à domicile",
    price: "9 000",
    unit: "FCFA / heure",
    tag: null,
    highlight: false,
    desc: "Un enseignant qualifié se déplace chez vous, à l'heure qui vous convient.",
    features: [
      { text: "Enseignant sélectionné parmi 500+ profils", ok: true },
      { text: "Cours 1-à-1 à votre domicile", ok: true },
      { text: "Programme personnalisé par cours", ok: true },
      { text: "Rapport de cours après chaque séance", ok: true },
      { text: "Conseiller pédagogique dédié", ok: true },
      { text: "Classe virtuelle en ligne", ok: false },
    ],
    cta: "S'inscrire",
    ctaTo: "/inscription",
  },
  {
    id: "enligne",
    icon: Monitor,
    label: "Cours en ligne",
    price: "7 500",
    unit: "FCFA / heure",
    tag: "Le plus flexible",
    highlight: true,
    desc: "Tableau blanc interactif, enregistrements et suivi numérique depuis n'importe où.",
    features: [
      { text: "Enseignant sélectionné parmi 500+ profils", ok: true },
      { text: "Classe virtuelle avec tableau blanc", ok: true },
      { text: "Programme personnalisé par cours", ok: true },
      { text: "Rapport de cours après chaque séance", ok: true },
      { text: "Conseiller pédagogique dédié", ok: true },
      { text: "Accès aux enregistrements de cours", ok: true },
    ],
    cta: "S'inscrire",
    ctaTo: "/inscription",
  },
  {
    id: "stage",
    icon: Calendar,
    label: "Stage vacances",
    price: "150 000",
    unit: "FCFA / stage",
    tag: null,
    highlight: false,
    desc: "8 élèves maximum. Programme intensif pour reprendre confiance pendant les vacances.",
    features: [
      { text: "Groupes de 8 élèves maximum", ok: true },
      { text: "Programme intensif 5 jours", ok: true },
      { text: "Rapport de progression final", ok: true },
      { text: "Conseiller pédagogique dédié", ok: true },
      { text: "Cours individuels inclus", ok: false },
      { text: "Accès aux enregistrements", ok: false },
    ],
    cta: "Nous contacter",
    ctaTo: ROUTE_PATHS.CONTACT,
  },
  {
    id: "bac",
    icon: GraduationCap,
    label: "Prépa BEPC & BAC",
    price: "10 000",
    unit: "FCFA / heure",
    tag: "Résultats garantis",
    highlight: false,
    desc: "Méthodologie d'examen, révisions ciblées, gestion du stress. Pour ne rien laisser au hasard.",
    features: [
      { text: "Enseignant spécialisé examens nationaux", ok: true },
      { text: "Sujets et corrigés des 5 dernières années", ok: true },
      { text: "Simulations d'épreuves chronométrées", ok: true },
      { text: "Rapport de progression bimensuel", ok: true },
      { text: "Conseiller pédagogique dédié", ok: true },
      { text: "Garantie +4 points ou remboursé", ok: true },
    ],
    cta: "S'inscrire",
    ctaTo: "/inscription",
  },
];

const GUARANTEES = [
  { icon: Star,       text: "+4 points de moyenne garantis en 6 mois, ou remboursé" },
  { icon: Users,      text: "Enseignant remplacé sous 48h si insatisfaction" },
  { icon: Check,      text: "Pas de frais d'inscription, annulation libre à tout moment" },
  { icon: Phone,      text: "Conseiller disponible lun–sam 8h–18h" },
];

const FAQ = [
  {
    q: "Comment est calculé le tarif ?",
    a: "Le tarif est au tarif horaire net, sans frais cachés. Vous payez uniquement les heures de cours effectivement dispensées.",
  },
  {
    q: "Puis-je changer d'enseignant si je ne suis pas satisfait ?",
    a: "Oui, sans frais ni délai. Votre conseiller organise le remplacement sous 48 heures ouvrées.",
  },
  {
    q: "La garantie +4 points est-elle vraiment contractuelle ?",
    a: "Oui. Après 6 mois d'accompagnement à raison d'au moins 2 heures par semaine, si la progression n'est pas au rendez-vous, nous vous remboursons intégralement les 3 derniers mois.",
  },
  {
    q: "Les tarifs varient-ils selon le niveau ?",
    a: "Le tarif de base est identique pour tous les niveaux. Pour les classes de terminale et les prépas, nous recommandons la formule Prépa BAC avec ses ressources spécialisées.",
  },
  {
    q: "Y a-t-il un engagement de durée ?",
    a: "Aucun. Vous pouvez arrêter à tout moment, sans préavis ni pénalité.",
  },
  {
    q: "Je suis dans un pays hors zone FCFA, quel tarif s'applique ?",
    a: "Nos tarifs de référence sont en FCFA pour la zone CFA (Cameroun, Sénégal, Côte d'Ivoire, Gabon, etc.). Pour Madagascar, les Comores, la Guinée ou tout autre pays, nos conseillers établissent un équivalent en ariary, franc guinéen ou en USD. Contactez-nous pour un devis adapté à votre pays.",
  },
];

export default function Pricing() {
  return (
    <div className="min-h-screen" style={{ fontFamily: "Ubuntu, 'Noto Sans', sans-serif" }}>

      {/* ── HERO ── */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${IMAGES.ONLINE_LEARNING_1})` }} />
        <div className="absolute inset-0 bg-[#0D2D5A]/78" />
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-[#F5A623]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="container mx-auto px-6 max-w-4xl relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={springPresets.gentle}>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[#F5A623] mb-4">Tarifs transparents</p>
            <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-5">
              Des formules claires,<br />
              <span className="text-[#F5A623]">sans mauvaise surprise</span>
            </h1>
            <p className="text-blue-200 text-lg max-w-xl mx-auto mb-6">
              Tarifs de référence en FCFA (zone CFA). Équivalents disponibles pour tous nos 15 pays. Aucun frais d'inscription. Annulation libre.
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F5A623]/15 border border-[#F5A623]/30 text-[#F5A623] text-sm font-bold">
              <Star className="w-4 h-4" /> +4 pts garantis en 6 mois — ou remboursé
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── PLANS ── */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6 max-w-6xl">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5"
          >
            {PLANS.map(plan => (
              <motion.div
                key={plan.id}
                variants={staggerItem}
                className={`relative rounded-2xl flex flex-col overflow-hidden transition-all duration-200 hover:shadow-xl ${
                  plan.highlight
                    ? "bg-[#0D2D5A] text-white shadow-2xl shadow-[#0D2D5A]/30 ring-2 ring-[#F5A623]"
                    : "bg-white border border-gray-100 shadow-sm"
                }`}
              >
                {plan.tag && (
                  <div className={`absolute top-4 right-4 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${
                    plan.highlight ? "bg-[#F5A623] text-[#0D2D5A]" : "bg-[#1A6CC8]/10 text-[#1A6CC8]"
                  }`}>
                    {plan.tag}
                  </div>
                )}

                <div className="p-6 flex-1 flex flex-col">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${plan.highlight ? "bg-white/15" : "bg-[#0D2D5A]/8"}`}>
                    <plan.icon className={`w-5 h-5 ${plan.highlight ? "text-[#F5A623]" : "text-[#0D2D5A]"}`} />
                  </div>

                  <h3 className={`font-black text-base mb-1 ${plan.highlight ? "text-white" : "text-[#0D2D5A]"}`}>{plan.label}</h3>
                  <p className={`text-xs leading-relaxed mb-5 ${plan.highlight ? "text-blue-200" : "text-gray-500"}`}>{plan.desc}</p>

                  <div className="mb-6">
                    <span className={`text-3xl font-black font-mono ${plan.highlight ? "text-[#F5A623]" : "text-[#0D2D5A]"}`}>{plan.price}</span>
                    <span className={`text-xs ml-1 ${plan.highlight ? "text-blue-200" : "text-gray-400"}`}>{plan.unit}</span>
                  </div>

                  <ul className="space-y-2.5 flex-1">
                    {plan.features.map(f => (
                      <li key={f.text} className={`flex items-start gap-2 text-xs ${
                        f.ok
                          ? plan.highlight ? "text-blue-100" : "text-gray-600"
                          : plan.highlight ? "text-blue-300/40" : "text-gray-300"
                      }`}>
                        {f.ok
                          ? <Check className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${plan.highlight ? "text-[#F5A623]" : "text-[#1A6CC8]"}`} />
                          : <X className="w-3.5 h-3.5 shrink-0 mt-0.5 opacity-40" />
                        }
                        {f.text}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="px-6 pb-6">
                  <NavLink
                    to={plan.ctaTo}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all duration-150 cursor-pointer ${
                      plan.highlight
                        ? "bg-[#F5A623] text-[#0D2D5A] hover:bg-white"
                        : "bg-[#0D2D5A] text-white hover:bg-[#1A6CC8]"
                    }`}
                  >
                    {plan.cta} <ArrowRight className="w-3.5 h-3.5" />
                  </NavLink>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── GARANTIES ── */}
      <section className="py-16 bg-white border-y border-gray-100">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {GUARANTEES.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#1A6CC8]/8 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 text-[#1A6CC8]" />
                </div>
                <p className="text-sm text-gray-600 leading-snug">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={springPresets.gentle}
            className="text-center mb-12"
          >
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[#F5A623] mb-3">Questions fréquentes</p>
            <h2 className="text-3xl font-black text-[#0D2D5A]">Tout ce qu'il faut savoir</h2>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-4"
          >
            {FAQ.map(({ q, a }) => (
              <motion.div key={q} variants={staggerItem} className="bg-white rounded-2xl border border-gray-100 p-6 hover:border-[#1A6CC8]/20 transition-colors duration-150">
                <h3 className="font-black text-[#0D2D5A] mb-2 text-sm">{q}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{a}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="py-20 bg-[#0D2D5A] relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="container mx-auto px-6 max-w-3xl relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={springPresets.gentle}
          >
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[#F5A623] mb-4">Bilan 100% gratuit</p>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
              Une question sur nos tarifs ?<br />Parlons-nous.
            </h2>
            <p className="text-blue-200/70 mb-8 leading-relaxed">
              Un conseiller vous rappelle sous 24h pour construire la formule la plus adaptée à votre budget et aux besoins de votre enfant.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <NavLink to={ROUTE_PATHS.CONTACT} className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-[#F5A623] text-[#0D2D5A] font-bold hover:bg-white transition-all duration-200 shadow-lg cursor-pointer">
                Bilan gratuit <ArrowRight className="w-4 h-4" />
              </NavLink>
              <a href="tel:+237675252048" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl border border-white/20 text-white font-semibold hover:bg-white/10 transition-all duration-200 cursor-pointer">
                <Phone className="w-4 h-4 text-[#F5A623]" /> +237 675 252 048
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
