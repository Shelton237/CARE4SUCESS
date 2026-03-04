import { motion } from "framer-motion";
import { GraduationCap, BookOpen, Users, Award, ChevronRight } from "lucide-react";
import { levels } from "@/data/index";
import { ContactForm } from "@/components/ContactForm";
import { IMAGES } from "@/assets/images";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { springPresets, staggerContainer, staggerItem } from "@/lib/motion";

export default function Niveaux() {
  return (
    <div className="min-h-screen">

      {/* ── HERO ── */}
      <section className="relative py-28 overflow-hidden">
        <div className="absolute inset-0 bg-brand-hero-gradient" />
        <div className="absolute inset-0 z-0">
          <img
            src={IMAGES.STUDENTS_STUDYING_2}
            alt="Étudiants"
            className="w-full h-full object-cover opacity-15 mix-blend-overlay"
          />
        </div>
        <div className="absolute top-10 left-10 w-64 h-64 bg-[#F5A623]/10 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springPresets.gentle}
            className="max-w-3xl mx-auto text-center"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F5A623]/20 border border-[#F5A623]/40 text-[#F5A623] text-sm font-bold mb-6">
              <GraduationCap className="w-4 h-4" />
              Tous les niveaux scolaires
            </span>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight text-white leading-tight">
              Accompagnement personnalisé{" "}
              <span className="text-[#F5A623]">pour chaque niveau</span>
            </h1>
            <p className="text-xl text-blue-100 leading-relaxed">
              Du primaire au supérieur, en passant par les formations pour adultes, nous adaptons notre pédagogie à chaque étape du parcours éducatif.
            </p>
          </motion.div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 z-10">
          <svg viewBox="0 0 1440 60" className="w-full" preserveAspectRatio="none">
            <path d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z" fill="oklch(0.99 0.003 230)" />
          </svg>
        </div>
      </section>

      {/* ── GRILLE NIVEAUX ── */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
          >
            {levels.map((level) => (
              <motion.div key={level.id} variants={staggerItem}>
                <Card className="h-full overflow-hidden group hover:shadow-xl transition-all duration-300 border-border/50 hover:border-[#1A6CC8]/30">
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={level.image}
                      alt={level.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0D2D5A]/90 via-[#0D2D5A]/40 to-transparent" />
                    <div className="absolute bottom-4 left-4">
                      <h3 className="text-2xl font-bold text-white">{level.name}</h3>
                    </div>
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#F5A623]" />
                  </div>

                  <CardHeader>
                    <CardDescription className="text-base leading-relaxed">
                      {level.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Classes */}
                    <div>
                      <h4 className="text-xs font-bold text-[#0D2D5A] uppercase tracking-widest mb-2 flex items-center gap-2">
                        <BookOpen className="w-3.5 h-3.5 text-[#1A6CC8]" />
                        Classes concernées
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {level.grades.map((grade) => (
                          <span
                            key={grade}
                            className="px-2 py-0.5 text-xs rounded-full border-2 border-[#1A6CC8] text-[#1A6CC8] font-semibold"
                          >
                            {grade}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Matières */}
                    <div>
                      <h4 className="text-xs font-bold text-[#0D2D5A] uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-[#F5A623]" />
                        Matières principales
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {level.subjects.slice(0, 4).map((subject) => (
                          <span
                            key={subject}
                            className="px-2 py-0.5 text-xs rounded-full bg-[#1A6CC8]/10 text-[#1A6CC8] border border-[#1A6CC8]/20 font-medium"
                          >
                            {subject}
                          </span>
                        ))}
                        {level.subjects.length > 4 && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground font-medium">
                            +{level.subjects.length - 4}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Points clés */}
                    <div>
                      <h4 className="text-xs font-bold text-[#0D2D5A] uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Award className="w-3.5 h-3.5 text-[#F5A623]" />
                        Points clés
                      </h4>
                      <ul className="space-y-1">
                        {level.keyPoints.map((point, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                            <ChevronRight className="w-4 h-4 text-[#F5A623] shrink-0 mt-0.5" />
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
        </div>
      </section>

      {/* ── AVANTAGES ── */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-brand-hero-gradient opacity-95" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#F5A623]/10 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={springPresets.gentle}
            className="max-w-4xl mx-auto"
          >
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4 text-white">Pourquoi choisir Care 4 Success ?</h2>
              <p className="text-xl text-blue-100">
                20 ans d'expertise au service de la réussite scolaire
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-12">
              {[
                {
                  icon: Award,
                  title: "Enseignants qualifiés",
                  desc: "20 000 enseignants Bac+3 minimum, sélectionnés rigoureusement (1 candidat sur 10 retenu).",
                },
                {
                  icon: Users,
                  title: "Suivi personnalisé",
                  desc: "Un conseiller pédagogique dédié assure le suivi de la progression et ajuste le programme.",
                },
                {
                  icon: GraduationCap,
                  title: "Résultats garantis",
                  desc: "+4 points de moyenne en moyenne pour nos élèves suivis régulièrement.",
                },
                {
                  icon: BookOpen,
                  title: "Flexibilité totale",
                  desc: "Sans engagement, cours à domicile, en ligne ou en centre selon vos préférences.",
                },
              ].map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/15 hover:bg-white/15 transition-all duration-300"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-[#F5A623]/20 border border-[#F5A623]/40 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-[#F5A623]" />
                    </div>
                    <h3 className="text-lg font-bold text-white">{title}</h3>
                  </div>
                  <p className="text-blue-100 text-sm leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>

            {/* Bloc crédit impôt */}
            <div className="bg-[#F5A623] rounded-2xl p-8 text-center shadow-2xl">
              <h3 className="text-2xl font-black text-[#0D2D5A] mb-3">
                Crédit d'impôt immédiat de 50%
              </h3>
              <p className="text-[#0D2D5A] mb-5 font-medium">
                Profitez d'une réduction fiscale de 50% sur tous nos cours. Un cours à 36€/h ne vous coûte réellement que 18€/h !
              </p>
              <Button
                size="lg"
                className="bg-[#0D2D5A] text-white hover:bg-[#163F78] gap-2 shadow-lg"
              >
                En savoir plus
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={springPresets.gentle}
            className="max-w-2xl mx-auto"
          >
            <div className="text-center mb-10">
              <span className="badge-gold mx-auto mb-4 inline-flex">Gratuit</span>
              <h2 className="text-4xl font-bold mb-4 text-[#0D2D5A]">
                Demandez votre bilan personnalisé gratuit
              </h2>
              <p className="text-xl text-muted-foreground">
                Nos conseillers pédagogiques analysent les besoins de votre enfant et vous proposent un programme sur mesure.
              </p>
            </div>
            <ContactForm />
          </motion.div>
        </div>
      </section>
    </div>
  );
}
