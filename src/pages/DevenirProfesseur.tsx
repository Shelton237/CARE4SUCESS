import { motion } from "framer-motion";
import {
  GraduationCap, Shield, Star, Users, Wallet,
  CheckCircle, ArrowRight, Clock, BookOpen,
} from "lucide-react";
import { TeacherApplicationForm } from "@/components/TeacherApplicationForm";
import { IMAGES } from "@/assets/images";
import { springPresets, staggerContainer, staggerItem } from "@/lib/motion";

const BENEFITS = [
  {
    icon: Wallet,
    title: "Rémunération attractive",
    desc: "Tarifs compétitifs, paiement ponctuel sous 72h après chaque mission, primes qualité trimestrielles.",
  },
  {
    icon: Shield,
    title: "Missions sécurisées",
    desc: "Familles vérifiées, contrats clairs, planification assurée par nos conseillers. Vous n'avez qu'à enseigner.",
  },
  {
    icon: BookOpen,
    title: "Développement professionnel",
    desc: "Ressources pédagogiques, formations internes, observations de cours et coaching par des experts.",
  },
  {
    icon: Star,
    title: "Reconnaissance",
    desc: "Évaluations transparentes des familles, badging de progression et accès aux missions premium.",
  },
  {
    icon: Clock,
    title: "Flexibilité totale",
    desc: "Vous choisissez vos créneaux, vos matières, votre mode (domicile ou en ligne). Zero contrainte horaire.",
  },
  {
    icon: Users,
    title: "Communauté active",
    desc: "Rejoignez 500+ enseignants, participez aux ateliers mensuels, partagez bonnes pratiques et ressources.",
  },
];

const STEPS = [
  { n: "01", title: "Candidature en ligne", desc: "Remplissez le formulaire ci-dessous en 10 minutes. Décrivez votre parcours, vos matières et vos disponibilités." },
  { n: "02", title: "Examen du dossier", desc: "Notre équipe RH lit chaque candidature sous 48h. Bac+3 minimum, expérience pédagogique vérifiée." },
  { n: "03", title: "Entretien pédagogique", desc: "Entretien vidéo de 30 minutes avec un responsable pédagogique pour évaluer votre méthode d'enseignement." },
  { n: "04", title: "Intégration & 1re mission", desc: "Onboarding complet, accès à la plateforme, et votre première mission assignée sous 7 jours." },
];

const FIGURES = [
  { value: "500+",  label: "enseignants actifs" },
  { value: "15",    label: "pays couverts" },
  { value: "72h",   label: "délai de paiement" },
  { value: "4,9/5", label: "satisfaction profs" },
];

export default function DevenirProfesseur() {
  return (
    <div className="min-h-screen" style={{ fontFamily: "Ubuntu, 'Noto Sans', sans-serif" }}>

      {/* ── HERO ── */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${IMAGES.TEACHER_STUDENT_4})` }} />
        <div className="absolute inset-0 bg-[#0D2D5A]/78" />
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#F5A623]/10 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3 pointer-events-none" />

        <div className="container mx-auto px-6 max-w-5xl relative z-10">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={springPresets.gentle} className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[#F5A623] mb-4">Rejoindre le réseau</p>
            <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-5">
              Enseignez avec Care4Success.<br />
              <span className="text-[#F5A623]">Révélez votre expertise.</span>
            </h1>
            <p className="text-blue-200 text-lg leading-relaxed max-w-xl mb-8">
              Intégrez un réseau de 500+ enseignants qualifiés. Missions sécurisées, rémunération attractive, flexibilité totale.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="#candidature" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#F5A623] text-[#0D2D5A] font-bold text-sm hover:bg-white transition-all duration-200 shadow-lg cursor-pointer">
                <GraduationCap className="w-4 h-4" /> Postuler maintenant
              </a>
              <div className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 border border-white/20 text-white text-sm font-medium">
                <CheckCircle className="w-4 h-4 text-[#F5A623]" /> 1 candidat sur 10 retenu
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── CHIFFRES ── */}
      <section className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-gray-100">
            {FIGURES.map(({ value, label }) => (
              <div key={label} className="text-center py-8 px-6">
                <p className="text-3xl font-black text-[#0D2D5A] font-mono">{value}</p>
                <p className="text-xs text-gray-500 mt-1 font-medium">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AVANTAGES ── */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6 max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={springPresets.gentle}
            className="text-center mb-12"
          >
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[#F5A623] mb-3">Pourquoi nous rejoindre</p>
            <h2 className="text-3xl md:text-4xl font-black text-[#0D2D5A]">Ce que vous gagnez</h2>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {BENEFITS.map(({ icon: Icon, title, desc }) => (
              <motion.div key={title} variants={staggerItem} className="bg-white rounded-2xl border border-gray-100 p-6 hover:border-[#1A6CC8]/20 hover:shadow-md transition-all duration-200">
                <div className="w-10 h-10 rounded-xl bg-[#0D2D5A] flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-[#F5A623]" />
                </div>
                <h3 className="font-black text-[#0D2D5A] mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
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
            className="text-center mb-12"
          >
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[#F5A623] mb-3">Notre processus</p>
            <h2 className="text-3xl md:text-4xl font-black text-[#0D2D5A]">Comment ça marche</h2>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {STEPS.map(({ n, title, desc }) => (
              <motion.div key={n} variants={staggerItem}>
                <div className="text-5xl font-black font-mono text-[#0D2D5A]/5 leading-none mb-3">{n}</div>
                <div className="w-8 h-1 bg-[#F5A623] rounded-full mb-3" />
                <h3 className="font-black text-[#0D2D5A] mb-2 text-sm">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── FORMULAIRE ── */}
      <section id="candidature" className="py-20 bg-gray-50">
        <div className="container mx-auto px-6 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={springPresets.gentle}
            className="text-center mb-10"
          >
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[#F5A623] mb-3">Rejoindre le réseau</p>
            <h2 className="text-3xl font-black text-[#0D2D5A] mb-3">Déposez votre candidature</h2>
            <p className="text-gray-500 text-sm">Notre équipe examine chaque dossier et vous répond sous 48 heures.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ ...springPresets.gentle, delay: 0.1 }}
          >
            <TeacherApplicationForm />
          </motion.div>
        </div>
      </section>
    </div>
  );
}
