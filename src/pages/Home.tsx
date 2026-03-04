import { motion } from "framer-motion";
import { ArrowRight, CheckCircle, Star, Users, Award, Clock, TrendingUp, BookOpen, GraduationCap, Phone } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NavLink } from "react-router-dom";
import { ServiceCard } from "@/components/ServiceCard";
import { TeacherCard } from "@/components/TeacherCard";
import { services, levels, testimonials, teachers, stats } from "@/data/index";
import { IMAGES } from "@/assets/images";
import { springPresets, staggerContainer, staggerItem } from "@/lib/motion";
import { ROUTE_PATHS } from "@/lib/index";

export default function Home() {
  return (
    <div className="min-h-screen">

      {/* ── HERO ── */}
      <section id="hero" className="relative min-h-[92vh] flex items-center justify-center overflow-hidden">
        {/* Fond dégradé bleu marine */}
        <div className="absolute inset-0 z-0 bg-brand-hero-gradient" />

        {/* Image overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src={IMAGES.STUDENTS_STUDYING_1}
            alt="Étudiants en cours"
            className="w-full h-full object-cover opacity-15 mix-blend-overlay"
          />
        </div>

        {/* Decorations géométriques */}
        <div className="absolute top-20 right-10 w-64 h-64 bg-[#F5A623]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-48 h-48 bg-[#1A6CC8]/20 rounded-full blur-2xl" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springPresets.gentle}
            className="max-w-4xl mx-auto text-center space-y-8"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, ...springPresets.snappy }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F5A623]/20 border border-[#F5A623]/40 text-[#F5A623] text-sm font-bold"
            >
              <Award className="w-4 h-4" />
              10 ans d'expérience • 4.4/5 de satisfaction
            </motion.div>

            {/* Titre */}
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-tight">
              La réussite scolaire,{" "}
              <span className="text-[#F5A623]">notre engagement</span>
            </h1>

            {/* Sous-titre */}
            <p className="text-xl md:text-2xl text-blue-100 max-w-2xl mx-auto leading-relaxed">
              Cours particuliers à domicile, en ligne ou en centre.
              Sans engagement.{" "}
              <span className="font-bold text-[#F5A623]">Résultats garantis.</span>
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <NavLink
                to={ROUTE_PATHS.CONTACT}
                className="cta-gold flex items-center gap-2 text-lg px-9 py-4 rounded-xl shadow-xl hover:scale-105 transition-transform duration-200"
              >
                Bilan gratuit
                <ArrowRight className="w-5 h-5" />
              </NavLink>
              <a
                href="tel:+237675252048"
                className="flex items-center gap-2 text-lg px-9 py-4 rounded-xl border-2 border-white/40 text-white hover:bg-white/10 transition-all duration-200 backdrop-blur-sm"
              >
                <Phone className="w-5 h-5" />
                Être rappelé(e)
              </a>
            </div>

            {/* Checklist */}
            <div className="flex flex-wrap gap-6 justify-center items-center pt-4 text-sm text-blue-100">
              {[
                "Enseignant trouvé en 4 jours",
                "Préparation BEPC / BAC",
                "Sans engagement",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-[#F5A623]" />
                  <span className="font-medium">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Vague de transition */}
        <div className="absolute bottom-0 left-0 right-0 z-10">
          <svg viewBox="0 0 1440 80" className="w-full" preserveAspectRatio="none">
            <path
              d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z"
              fill="oklch(0.99 0.003 230)"
            />
          </svg>
        </div>
      </section>

      {/* ── STATISTIQUES ── */}
      <section className="py-20 bg-background">
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
                className="text-center space-y-1 group"
              >
                <div className="text-4xl font-bold text-[#1A6CC8] group-hover:text-[#F5A623] transition-colors duration-300">
                  {stat.value}
                </div>
                <div className="font-semibold text-[#0D2D5A]">{stat.label}</div>
                <div className="text-xs text-muted-foreground">{stat.description}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section id="services" className="py-24 bg-secondary/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={springPresets.gentle}
            className="text-center max-w-3xl mx-auto mb-16 space-y-4"
          >
            <span className="badge-gold mx-auto inline-flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Nos services
            </span>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-[#0D2D5A]">
              Des solutions adaptées à{" "}
              <span className="text-[#1A6CC8]">chaque besoin</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Cours particuliers, stages intensifs, accompagnement scolaire : trouvez la formule qui vous convient.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 gap-8"
          >
            {services.map((service) => (
              <motion.div key={service.id} variants={staggerItem}>
                <ServiceCard service={service} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── NIVEAUX ── */}
      <section id="niveaux" className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={springPresets.gentle}
            className="text-center max-w-3xl mx-auto mb-16 space-y-4"
          >
            <span className="badge-gold mx-auto inline-flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              Tous les niveaux
            </span>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-[#0D2D5A]">
              Du primaire au{" "}
              <span className="text-[#1A6CC8]">supérieur</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Nous accompagnons les élèves à chaque étape de leur scolarité.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {levels.slice(0, 5).map((level) => (
              <motion.div key={level.id} variants={staggerItem}>
                <Card className="h-full hover:shadow-xl transition-all duration-300 overflow-hidden group border-border/50 hover:border-[#1A6CC8]/30">
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={level.image}
                      alt={level.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0D2D5A]/85 to-transparent" />
                    <div className="absolute bottom-4 left-4">
                      <h3 className="text-2xl font-bold text-white">{level.name}</h3>
                    </div>
                    {/* Bande or en haut */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-[#F5A623]" />
                  </div>
                  <CardHeader>
                    <CardDescription className="text-base">{level.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="text-sm font-semibold mb-2 text-[#0D2D5A]">Classes :</div>
                      <div className="flex flex-wrap gap-2">
                        {level.grades.map((grade) => (
                          <span
                            key={grade}
                            className="px-2 py-0.5 text-xs font-medium rounded-full border-2 border-[#1A6CC8] text-[#1A6CC8]"
                          >
                            {grade}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold mb-2 text-[#0D2D5A]">Points clés :</div>
                      <ul className="space-y-1">
                        {level.keyPoints.slice(0, 3).map((point, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-[#F5A623] mt-0.5 flex-shrink-0" />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          <div className="text-center mt-12">
            <NavLink
              to={ROUTE_PATHS.NIVEAUX}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border-2 border-[#1A6CC8] text-[#1A6CC8] font-semibold hover:bg-[#1A6CC8] hover:text-white transition-all duration-200"
            >
              Voir tous les niveaux
              <ArrowRight className="w-5 h-5" />
            </NavLink>
          </div>
        </div>
      </section>

      {/* ── PROFESSEURS ── */}
      <section className="py-24 bg-secondary/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={springPresets.gentle}
            className="text-center max-w-3xl mx-auto mb-16 space-y-4"
          >
            <span className="badge-gold mx-auto inline-flex items-center gap-2">
              <Users className="w-4 h-4" />
              Nos professeurs
            </span>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-[#0D2D5A]">
              Des enseignants{" "}
              <span className="text-[#1A6CC8]">d'exception</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Sélection rigoureuse : 1 candidat sur 10 retenu. Bac+3 minimum, expérience et pédagogie garanties.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {teachers.slice(0, 4).map((teacher) => (
              <motion.div key={teacher.id} variants={staggerItem}>
                <TeacherCard teacher={teacher} />
              </motion.div>
            ))}
          </motion.div>

          <div className="text-center mt-12">
            <NavLink
              to={ROUTE_PATHS.PROFESSEURS}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border-2 border-[#1A6CC8] text-[#1A6CC8] font-semibold hover:bg-[#1A6CC8] hover:text-white transition-all duration-200"
            >
              Découvrir tous nos professeurs
              <ArrowRight className="w-5 h-5" />
            </NavLink>
          </div>
        </div>
      </section>

      {/* ── TÉMOIGNAGES ── */}
      <section id="temoignages" className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={springPresets.gentle}
            className="text-center max-w-3xl mx-auto mb-16 space-y-4"
          >
            <span className="badge-gold mx-auto inline-flex items-center gap-2">
              <Star className="w-4 h-4" />
              Témoignages
            </span>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-[#0D2D5A]">
              Ils nous font{" "}
              <span className="text-[#1A6CC8]">confiance</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Plus de 100 000 familles satisfaites. Découvrez leurs témoignages.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {testimonials.map((testimonial) => (
              <motion.div key={testimonial.id} variants={staggerItem}>
                <Card className="h-full hover:shadow-xl transition-all duration-300 border-border/50 hover:border-[#F5A623]/40">
                  {/* Barre or top */}
                  <div className="h-1 w-full bg-[#F5A623] rounded-t-lg" />
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <img
                        src={testimonial.photo}
                        alt={testimonial.name}
                        className="w-14 h-14 rounded-full object-cover border-2 border-[#F5A623]"
                      />
                      <div className="flex-1">
                        <CardTitle className="text-base text-[#0D2D5A]">{testimonial.name}</CardTitle>
                        <CardDescription>
                          {testimonial.level} • {testimonial.subject}
                        </CardDescription>
                        <div className="flex gap-1 mt-2">
                          {Array.from({ length: testimonial.rating }).map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-[#F5A623] text-[#F5A623]" />
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground italic text-sm leading-relaxed">"{testimonial.text}"</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── RÉSULTATS GARANTIS ── */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-brand-blue-gradient" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#F5A623]/10 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={springPresets.gentle}
            className="max-w-4xl mx-auto text-center space-y-8"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F5A623]/20 border border-[#F5A623]/40 text-[#F5A623] text-sm font-bold">
              <TrendingUp className="w-4 h-4" />
              Résultats garantis
            </span>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
              +4 points de moyenne{" "}
              <span className="text-[#F5A623]">garantis</span>
            </h2>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Nos élèves progressent en moyenne de 4 points après 6 mois de cours. Méthodologie éprouvée, suivi personnalisé, résultats mesurables.
            </p>

            <div className="grid md:grid-cols-3 gap-8 pt-4">
              {[
                {
                  icon: Clock,
                  title: "Suivi régulier",
                  desc: "Bilan pédagogique tous les 3 mois avec votre conseiller dédié",
                },
                {
                  icon: Users,
                  title: "Enseignants qualifiés",
                  desc: "Bac+3 minimum, sélection rigoureuse, formation continue",
                },
                {
                  icon: Award,
                  title: "Méthode éprouvée",
                  desc: "20 ans d'expérience, 100 000+ familles satisfaites",
                },
              ].map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/15 hover:bg-white/15 transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-full bg-[#F5A623]/20 border border-[#F5A623]/40 flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-6 h-6 text-[#F5A623]" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
                  <p className="text-blue-100 text-sm leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── CTA BILAN — redirige vers /contact ── */}
      <section id="contact" className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-brand-hero-gradient" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#F5A623]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#1A6CC8]/20 rounded-full blur-2xl" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={springPresets.gentle}
            className="max-w-3xl mx-auto text-center space-y-8"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F5A623]/20 border border-[#F5A623]/40 text-[#F5A623] text-sm font-bold">
              <Award className="w-4 h-4" />
              Bilan personnalisé — 100% gratuit
            </span>

            <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-white leading-tight">
              Décrivez votre projet,{" "}
              <span className="text-[#F5A623]">on s'occupe du reste</span>
            </h2>

            <p className="text-xl text-blue-100 max-w-2xl mx-auto leading-relaxed">
              Un conseiller pédagogique vous rappelle sous 24h pour construire avec vous un programme sur mesure adapté à votre enfant.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <NavLink
                to={ROUTE_PATHS.CONTACT}
                className="cta-gold flex items-center gap-2 text-lg px-10 py-4 rounded-xl shadow-2xl hover:scale-105 transition-transform duration-200 font-bold"
              >
                Demander mon bilan gratuit
                <ArrowRight className="w-5 h-5" />
              </NavLink>
              <a
                href="tel:+237675252048"
                className="flex items-center gap-2 text-lg px-9 py-4 rounded-xl border-2 border-white/40 text-white hover:bg-white/10 transition-all duration-200 backdrop-blur-sm"
              >
                <Phone className="w-5 h-5" />
                +237 675 252 048
              </a>
            </div>

            <div className="grid grid-cols-3 gap-6 pt-4">
              {[
                { value: "24h", label: "Réponse garantie" },
                { value: "100%", label: "Gratuit & sans engagement" },
                { value: "500+", label: "Enseignants disponibles" },
              ].map(({ value, label }) => (
                <div key={label} className="text-center">
                  <div className="text-3xl font-bold text-[#F5A623] mb-1">{value}</div>
                  <div className="text-sm text-blue-200">{label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
