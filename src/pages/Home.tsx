import { motion } from "framer-motion";
import { NavLink } from "react-router-dom";
import {
  ArrowRight, CreditCard, GraduationCap, CheckCircle, Star, MapPin,
  Globe, Briefcase, Eye, Shield,
} from "lucide-react";
import { IMAGES } from "@/assets/images";
import { springPresets, staggerContainer, staggerItem } from "@/lib/motion";
import { ROUTE_PATHS } from "@/lib/index";

/* ─── DONNÉES ────────────────────────────────── */

/* ─── COMPOSANT PRINCIPAL ─────────────────────── */
export default function Home() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-white" style={{ fontFamily: "Nunito, 'Noto Sans', sans-serif" }}>

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
                <NavLink
                  to={ROUTE_PATHS.COMMENT_CA_MARCHE}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-white/5 border border-white/15 text-white font-bold hover:bg-white/10 transition-colors duration-200"
                >
                  Comment ça marche
                </NavLink>
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
          §9 — CTA FINAL
          ══════════════════════════════════════════════════════ */}
      <section className="relative py-20 bg-[#0B2545] overflow-hidden">
        {/* Bulles décoratives floutées */}
        <div className="absolute -top-16 -left-10 w-52 h-52 rounded-full bg-[#1A6CC8]/20 blur-3xl pointer-events-none" />
        <div className="absolute -top-24 -right-16 w-80 h-80 rounded-full bg-[#F5A623]/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 left-1/4 w-64 h-64 rounded-full bg-[#0F9B8E]/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-10 w-56 h-56 rounded-full bg-[#1A6CC8]/15 blur-3xl pointer-events-none" />

        <div className="container mx-auto px-6 text-center relative z-10">
          <h2
            className="text-3xl md:text-4xl font-bold text-white mb-4"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Prêt à atteindre votre objectif ?
          </h2>
          <p className="text-blue-200 max-w-lg mx-auto mb-8">
            Le bon coach est à quelques clics. Scolaire, langues ou compétences, à vous de jouer.
          </p>
          <NavLink
            to={ROUTE_PATHS.PROFESSEURS}
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-[#F5A623] text-[#0D2D5A] font-bold hover:bg-[#e09520] transition-colors duration-200"
          >
            Trouver mon coach <ArrowRight className="w-4 h-4" />
          </NavLink>
        </div>
      </section>

    </div>
  );
}
