import { motion } from "framer-motion";
import {
  Award,
  CalendarClock,
  CheckCircle2,
  GraduationCap,
  Shield,
  Star,
  Users,
} from "lucide-react";
import { TeacherApplicationForm } from "@/components/TeacherApplicationForm";
import { ContactForm } from "@/components/ContactForm";
import { springPresets } from "@/lib/motion";

const benefits = [
  {
    icon: GraduationCap,
    title: "Coaching pédagogique",
    description:
      "Parcours d'onboarding, bibliothèque de ressources et observations de cours pour progresser en continu.",
  },
  {
    icon: Shield,
    title: "Missions sécurisées",
    description:
      "Contrats clairs, familles vérifiées et planification par nos conseillers pour vous concentrer sur l'enseignement.",
  },
  {
    icon: Star,
    title: "Reconnaissance",
    description:
      "Suivi des évaluations parents/élèves et primes qualité trimestrielles pour les meilleurs professeurs.",
  },
];

const steps = [
  {
    title: "1. Déposez votre candidature",
    description:
      "Partagez votre parcours, vos matières de prédilection et vos disponibilités. Nous lisons chaque dossier.",
    badge: "10 min",
  },
  {
    title: "2. Entretien & masterclass",
    description:
      "Session en visio avec un conseiller pédagogique + micro-cours filmé pour observer votre posture.",
    badge: "48 h",
  },
  {
    title: "3. Onboarding accompagné",
    description:
      "Accès au backoffice, guides Care4Success et mise en relation progressive avec les premières familles.",
    badge: "1 semaine",
  },
  {
    title: "4. Suivi continu",
    description:
      "Coaching mensuel, retours parents et communauté d’enseignants pour partager vos bonnes pratiques.",
    badge: "Chaque mois",
  },
];

export default function DevenirProfesseur() {
  return (
    <div className="bg-[#F7F9FD] min-h-screen">
      <section className="relative overflow-hidden bg-brand-hero-gradient text-white">
        <div className="absolute inset-0 opacity-10 bg-[url('/noise.png')] pointer-events-none" />
        <div className="container mx-auto px-4 py-32 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto text-center space-y-6"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 border border-white/25 text-sm font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              Programme enseignants Care4Success
            </span>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
              Devenez professeur Care4Success
            </h1>
            <p className="text-lg md:text-xl text-blue-100">
              Rejoignez un réseau d’excellence, enseignez dans vos matières de prédilection et
              bénéficiez d’un accompagnement pédagogique sur mesure.
            </p>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" className="w-full" preserveAspectRatio="none">
            <path d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z" fill="#F7F9FD" />
          </svg>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={springPresets.gentle}
            className="grid md:grid-cols-3 gap-6"
          >
            {[
              {
                icon: Award,
                title: "1 professeur / 10 retenu",
                text: "Processus sélectif pour garantir la qualité auprès des familles.",
              },
              {
                icon: Users,
                title: "Communauté engagée",
                text: "Événements mensuels et partage de pratiques entre enseignants.",
              },
              {
                icon: CalendarClock,
                title: "Planning flexible",
                text: "Vous choisissez vos créneaux : soirées, week-ends ou missions intensives.",
              },
            ].map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="bg-white rounded-2xl p-6 border border-[#1A6CC8]/15 shadow-sm hover:-translate-y-1.5 transition-transform"
              >
                <div className="w-12 h-12 rounded-full bg-[#1A6CC8]/10 flex items-center justify-center text-[#1A6CC8] mb-4">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-[#0D2D5A] mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground">{text}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto text-center mb-12">
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-3xl font-bold text-[#0D2D5A]"
            >
              Votre parcours de candidature
            </motion.h2>
            <p className="text-muted-foreground mt-3">
              Notre équipe recrutement vous accompagne à chaque étape pour rejoindre la
              communauté Care4Success.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {steps.map((step) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45 }}
                className="p-6 rounded-2xl border border-[#1A6CC8]/15 bg-[#F7F9FD]"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-[#0D2D5A]">{step.title}</h3>
                  <span className="text-xs font-semibold uppercase tracking-wide text-[#1A6CC8] bg-[#1A6CC8]/10 px-3 py-1 rounded-full">
                    {step.badge}
                  </span>
                </div>
                <p className="text-muted-foreground">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-[#0D2D5A] text-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl font-bold mb-6">Ce que nous offrons</h2>
              <p className="text-blue-100 mb-8 leading-relaxed">
                Care4Success accompagne les professeurs avant, pendant et après leurs cours.
                Nous prenons en charge l’administratif, la facturation et la relation famille
                pour que vous puissiez vous concentrer sur la pédagogie.
              </p>
              <div className="space-y-6">
                {benefits.map(({ icon: Icon, title, description }) => (
                  <div
                    key={title}
                    className="flex gap-4 items-start bg-white/5 border border-white/10 rounded-2xl p-4"
                  >
                    <div className="w-12 h-12 rounded-full bg-[#F5A623]/20 flex items-center justify-center text-[#F5A623]">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{title}</h3>
                      <p className="text-sm text-blue-100">{description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-3xl p-8 text-[#0D2D5A]"
            >
              <h3 className="text-2xl font-bold mb-4">Une question avant de postuler ?</h3>
              <p className="text-muted-foreground mb-6">
                Laissez-nous vos coordonnées et un conseiller vous recontactera rapidement.
              </p>
              <ContactForm />
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-[#F7F9FD]">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-10">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-3xl font-bold text-[#0D2D5A]"
            >
              Prêt à rejoindre l’aventure ?
            </motion.h2>
            <p className="text-muted-foreground">
              Remplissez le formulaire ci-dessous. Nous revenons vers vous sous 48 heures ouvrées.
            </p>
          </div>
          <TeacherApplicationForm className="bg-white" />
        </div>
      </section>
    </div>
  );
}
