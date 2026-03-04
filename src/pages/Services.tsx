import { motion } from "framer-motion";
import { Home, Monitor, Calendar, Users, Check, ArrowRight, Star, Phone } from "lucide-react";
import { services, stats } from "@/data/index";
import { ServiceCard } from "@/components/ServiceCard";
import { ContactForm } from "@/components/ContactForm";
import { IMAGES } from "@/assets/images";
import { Card, CardContent } from "@/components/ui/card";
import { springPresets, staggerContainer, staggerItem } from "@/lib/motion";
import { NavLink } from "react-router-dom";
import { ROUTE_PATHS } from "@/lib/index";

const iconMap = {
  home: Home,
  monitor: Monitor,
  calendar: Calendar,
  users: Users,
};

export default function Services() {
  return (
    <div className="min-h-screen">

      {/* ── HERO ── */}
      <section className="relative py-28 overflow-hidden">
        <div className="absolute inset-0 bg-brand-hero-gradient" />
        <div className="absolute inset-0 z-0">
          <img
            src={IMAGES.TEACHER_STUDENT_2}
            alt="Services Care 4 Success"
            className="w-full h-full object-cover opacity-15 mix-blend-overlay"
          />
        </div>
        <div className="absolute top-10 right-10 w-80 h-80 bg-[#F5A623]/10 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springPresets.gentle}
            className="max-w-3xl mx-auto text-center"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F5A623]/20 border border-[#F5A623]/40 text-[#F5A623] text-sm font-bold mb-6">
              Nos Services
            </span>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight text-white leading-tight">
              Des solutions adaptées à{" "}
              <span className="text-[#F5A623]">chaque besoin</span>
            </h1>
            <p className="text-xl text-blue-100 mb-8 leading-relaxed">
              Cours particuliers, stages intensifs, accompagnement en ligne :
              trouvez la formule qui correspond à vos objectifs.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <NavLink
                to={ROUTE_PATHS.CONTACT}
                className="cta-gold flex items-center gap-2 text-base px-8 py-3.5 rounded-xl font-bold shadow-xl hover:scale-105 transition-transform duration-200"
              >
                Bilan gratuit
                <ArrowRight className="w-4 h-4" />
              </NavLink>
              <a
                href="tel:0800123456"
                className="flex items-center gap-2 text-base px-8 py-3.5 rounded-xl border-2 border-white/40 text-white hover:bg-white/10 transition-all duration-200"
              >
                <Phone className="w-4 h-4" />
                Nous contacter
              </a>
            </div>
          </motion.div>
        </div>

        {/* Vague */}
        <div className="absolute bottom-0 left-0 right-0 z-10">
          <svg viewBox="0 0 1440 60" className="w-full" preserveAspectRatio="none">
            <path d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z" fill="oklch(0.99 0.003 230)" />
          </svg>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                variants={staggerItem}
                className="text-center group"
              >
                <div className="text-3xl md:text-4xl font-bold text-[#1A6CC8] group-hover:text-[#F5A623] transition-colors duration-300 mb-1">
                  {stat.value}
                </div>
                <div className="font-semibold text-[#0D2D5A] mb-1">{stat.label}</div>
                <div className="text-xs text-muted-foreground">{stat.description}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── CATALOGUE SERVICES ── */}
      <section className="py-24 bg-secondary/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={springPresets.gentle}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-[#0D2D5A]">
              Nos formules de{" "}
              <span className="text-[#1A6CC8]">soutien scolaire</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choisissez la solution qui correspond le mieux à vos besoins et à votre emploi du temps.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 gap-8 mb-16"
          >
            {services.map((service) => (
              <motion.div key={service.id} variants={staggerItem}>
                <ServiceCard service={service} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── POURQUOI CARE4SUCCESS ── */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={springPresets.gentle}
            >
              <span className="badge-gold mb-6 inline-flex">Pourquoi Care 4 Success ?</span>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-[#0D2D5A]">
                20 ans d'expertise au service de{" "}
                <span className="text-[#1A6CC8]">votre réussite</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Leader du soutien scolaire, Care 4 Success accompagne plus de
                100 000 élèves chaque année avec des enseignants qualifiés et
                une méthodologie éprouvée.
              </p>

              <div className="space-y-3 mb-8">
                {[
                  "Enseignants sélectionnés rigoureusement (1 sur 10 retenu)",
                  "Suivi personnalisé avec conseiller pédagogique dédié",
                  "Garantie de progression (+4 points de moyenne)",
                  "Crédit d'impôt immédiat de 50% sur tous les cours",
                  "Sans engagement, arrêt et reprise libres",
                  "110 centres en France pour un accompagnement de proximité",
                ].map((point, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#F5A623]/15 border border-[#F5A623]/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 text-[#F5A623]" />
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">{point}</p>
                  </div>
                ))}
              </div>

              <NavLink
                to={ROUTE_PATHS.CONTACT}
                className="cta-gold inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold shadow-lg hover:scale-105 transition-transform duration-200"
              >
                Demander un bilan gratuit
                <ArrowRight className="w-4 h-4" />
              </NavLink>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={springPresets.gentle}
              className="relative"
            >
              <div className="relative rounded-2xl overflow-hidden">
                <img
                  src={IMAGES.ONLINE_LEARNING_2}
                  alt="Cours en ligne Care 4 Success"
                  className="w-full h-[500px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0D2D5A]/80 to-transparent" />
                <div className="absolute bottom-8 left-8 right-8">
                  <Card className="bg-white/95 backdrop-blur border-[#F5A623]/30">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-1.5 mb-3">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-[#F5A623] text-[#F5A623]" />
                        ))}
                        <span className="ml-2 font-bold text-[#0D2D5A]">4.4/5</span>
                      </div>
                      <p className="text-sm text-muted-foreground italic leading-relaxed">
                        "Grâce à Care 4 Success, ma fille a gagné 4 points de moyenne
                        en mathématiques. L'enseignante est patiente et pédagogue. Je recommande vivement !"
                      </p>
                      <p className="text-sm font-bold text-[#0D2D5A] mt-3">
                        Sophie M. — Parent d'élève en 3e
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
              {/* Badge flottant */}
              <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-[#F5A623] flex flex-col items-center justify-center shadow-xl">
                <span className="text-xl font-black text-[#0D2D5A]">50%</span>
                <span className="text-xs font-bold text-[#0D2D5A] leading-none">crédit</span>
                <span className="text-xs font-bold text-[#0D2D5A] leading-none">impôt</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── COMMENT ÇA MARCHE ── */}
      <section className="py-24 bg-secondary/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={springPresets.gentle}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-[#0D2D5A]">
              Comment ça{" "}
              <span className="text-[#1A6CC8]">marche ?</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Un processus simple et rapide pour trouver votre enseignant idéal.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-4 gap-6 mb-16"
          >
            {[
              { step: "1", title: "Bilan gratuit", desc: "Nous analysons les besoins de votre enfant et définissons ensemble les objectifs." },
              { step: "2", title: "Sélection enseignant", desc: "Nous trouvons l'enseignant idéal en 4 jours maximum, adapté au profil de votre enfant." },
              { step: "3", title: "Début des cours", desc: "Les cours démarrent rapidement, à domicile, en ligne ou en centre selon votre choix." },
              { step: "4", title: "Suivi personnalisé", desc: "Votre conseiller pédagogique suit la progression et ajuste le programme si nécessaire." },
            ].map((item, index) => (
              <motion.div key={index} variants={staggerItem}>
                <Card className="h-full border-border/50 hover:border-[#1A6CC8]/30 hover:shadow-lg transition-all duration-300">
                  <div className="h-1 bg-[#F5A623] rounded-t-lg" />
                  <CardContent className="p-6 pt-5">
                    <div className="w-12 h-12 rounded-full bg-[#0D2D5A] text-white flex items-center justify-center text-2xl font-black mb-4 shadow-lg">
                      {item.step}
                    </div>
                    <h3 className="text-lg font-bold mb-2 text-[#0D2D5A]">{item.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── CTA CONTACT ── */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-brand-blue-gradient" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#F5A623]/10 rounded-full blur-3xl" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={springPresets.gentle}
              className="text-center mb-12"
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">
                Prêt à{" "}
                <span className="text-[#F5A623]">commencer ?</span>
              </h2>
              <p className="text-xl text-blue-100">
                Demandez votre bilan personnalisé gratuit et trouvez votre enseignant en 4 jours.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ ...springPresets.gentle, delay: 0.2 }}
            >
              <ContactForm className="bg-white rounded-2xl p-8 shadow-2xl" />
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}