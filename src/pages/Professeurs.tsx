import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Filter, Star, Award, BookOpen, GraduationCap } from "lucide-react";
import { teachers, subjects, levels } from "@/data/index";
import { TeacherCard } from "@/components/TeacherCard";
import { ContactForm } from "@/components/ContactForm";
import { IMAGES } from "@/assets/images";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROUTE_PATHS } from "@/lib";

export default function Professeurs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [selectedLevel, setSelectedLevel] = useState<string>("all");

  const filteredTeachers = useMemo(() => {
    return teachers.filter((teacher) => {
      const matchesSearch =
        searchQuery === "" ||
        teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        teacher.subjects.some((s) =>
          s.toLowerCase().includes(searchQuery.toLowerCase())
        ) ||
        teacher.bio.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSubject =
        selectedSubject === "all" ||
        teacher.subjects.some((s) =>
          s.toLowerCase().includes(selectedSubject.toLowerCase())
        );

      const matchesLevel =
        selectedLevel === "all" ||
        teacher.levels.some((l) =>
          l.toLowerCase().includes(selectedLevel.toLowerCase())
        );

      return matchesSearch && matchesSubject && matchesLevel;
    });
  }, [searchQuery, selectedSubject, selectedLevel]);

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedSubject("all");
    setSelectedLevel("all");
  };

  return (
    <div className="min-h-screen">

      {/* ── HERO ── */}
      <section className="relative py-28 overflow-hidden">
        <div className="absolute inset-0 bg-brand-hero-gradient" />
        <div className="absolute inset-0 z-0">
          <img
            src={IMAGES.TEACHER_STUDENT_3}
            alt="Nos professeurs"
            className="w-full h-full object-cover opacity-15 mix-blend-overlay"
          />
        </div>
        <div className="absolute top-10 right-10 w-64 h-64 bg-[#F5A623]/10 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto text-center"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F5A623]/20 border border-[#F5A623]/40 text-[#F5A623] text-sm font-bold mb-6">
              <Award className="w-4 h-4" />
              20 000+ enseignants qualifiés
            </span>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white leading-tight">
              Nos Professeurs{" "}
              <span className="text-[#F5A623]">d'Excellence</span>
            </h1>
            <p className="text-xl text-blue-100 leading-relaxed">
              Des enseignants passionnés, diplômés Bac+3 minimum et rigoureusement
              sélectionnés (1 candidat sur 10 retenu) pour garantir votre réussite.
            </p>
          </motion.div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 z-10">
          <svg viewBox="0 0 1440 60" className="w-full" preserveAspectRatio="none">
            <path d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z" fill="oklch(0.99 0.003 230)" />
          </svg>
        </div>
      </section>

      {/* ── FILTRES ── */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="max-w-5xl mx-auto"
          >
            <div className="bg-card rounded-2xl p-8 shadow-lg border border-[#1A6CC8]/10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-[#1A6CC8]/10 border border-[#1A6CC8]/20 flex items-center justify-center">
                  <Filter className="w-5 h-5 text-[#1A6CC8]" />
                </div>
                <h2 className="text-xl font-bold text-[#0D2D5A]">Filtrer les professeurs</h2>
              </div>

              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1A6CC8]" />
                  <Input
                    type="text"
                    placeholder="Rechercher par nom ou matière..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 border-[#1A6CC8]/20 focus:border-[#1A6CC8] focus:ring-[#1A6CC8]"
                  />
                </div>

                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger className="border-[#1A6CC8]/20">
                    <SelectValue placeholder="Toutes les matières" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les matières</SelectItem>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.name}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                  <SelectTrigger className="border-[#1A6CC8]/20">
                    <SelectValue placeholder="Tous les niveaux" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les niveaux</SelectItem>
                    {levels.map((level) => (
                      <SelectItem key={level.id} value={level.name}>
                        {level.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  <span className="font-bold text-[#1A6CC8]">{filteredTeachers.length}</span>{" "}
                  professeur{filteredTeachers.length > 1 ? "s" : ""} trouvé{filteredTeachers.length > 1 ? "s" : ""}
                </p>
                {(searchQuery || selectedSubject !== "all" || selectedLevel !== "all") && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetFilters}
                    className="border-[#1A6CC8] text-[#1A6CC8] hover:bg-[#1A6CC8] hover:text-white"
                  >
                    Réinitialiser les filtres
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── GRILLE PROFESSEURS ── */}
      <section className="py-12 bg-secondary/30">
        <div className="container mx-auto px-4">
          {filteredTeachers.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto"
            >
              {filteredTeachers.map((teacher, index) => (
                <motion.div
                  key={teacher.id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 * index }}
                >
                  <TeacherCard teacher={teacher} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center py-16"
            >
              <div className="w-20 h-20 rounded-full bg-[#1A6CC8]/10 flex items-center justify-center mx-auto mb-6">
                <BookOpen className="w-10 h-10 text-[#1A6CC8]" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-[#0D2D5A]">
                Aucun professeur trouvé
              </h3>
              <p className="text-muted-foreground mb-6">
                Essayez de modifier vos critères de recherche ou contactez-nous pour trouver le professeur idéal.
              </p>
              <Button
                onClick={resetFilters}
                className="bg-[#1A6CC8] hover:bg-[#0D2D5A] text-white"
              >
                Réinitialiser les filtres
              </Button>
            </motion.div>
          )}
        </div>
      </section>

      {/* ── CARTE INFO + FORMULAIRE ── */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="max-w-4xl mx-auto"
          >
            <div className="bg-card rounded-2xl p-8 md:p-12 shadow-lg border border-[#1A6CC8]/10">
              <div className="grid md:grid-cols-2 gap-8 mb-12">
                {[
                  {
                    icon: GraduationCap,
                    title: "Sélection rigoureuse",
                    desc: "Seul 1 candidat sur 10 est retenu après un processus exigeant : diplômes vérifiés, entretien pédagogique et mise en situation.",
                  },
                  {
                    icon: Star,
                    title: "Suivi personnalisé",
                    desc: "Chaque enseignant bénéficie d'une formation continue et d'un accompagnement pédagogique pour garantir la qualité de l'enseignement.",
                  },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-[#F5A623]/15 border border-[#F5A623]/40 flex items-center justify-center">
                        <Icon className="w-6 h-6 text-[#F5A623]" />
                      </div>
                      <h3 className="text-xl font-bold text-[#0D2D5A]">{title}</h3>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>

              <div className="border-t border-border/50 pt-8">
                <h3 className="text-2xl font-bold mb-6 text-center text-[#0D2D5A]">
                  Trouvez votre professeur en{" "}
                  <span className="text-[#F5A623]">4 jours</span>
                </h3>
                <ContactForm className="max-w-2xl mx-auto" />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-16 bg-[#F7F9FD]">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-5xl mx-auto bg-white rounded-3xl p-10 shadow-lg border border-[#1A6CC8]/10 flex flex-col md:flex-row md:items-center gap-6"
          >
            <div className="flex-1">
              <p className="uppercase text-xs tracking-[0.2em] text-[#1A6CC8] font-semibold mb-3">
                Recrutement ouvert
              </p>
              <h3 className="text-2xl font-bold text-[#0D2D5A] mb-3">
                Vous souhaitez rejoindre l’équipe Care4Success ?
              </h3>
              <p className="text-muted-foreground">
                Découvrez le parcours complet, nos attentes et le formulaire de candidature sur la page dédiée
                «&nbsp;Devenir professeur&nbsp;».
              </p>
            </div>
            <Link to={ROUTE_PATHS.DEVENIR_PROFESSEUR} className="flex-shrink-0">
              <Button className="bg-[#1A6CC8] hover:bg-[#0D2D5A] text-white px-8 h-12">
                En savoir plus
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── POURQUOI NOS PROFS ── */}
      <section className="py-16 bg-brand-blue-gradient">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-10 text-white">
              Pourquoi choisir nos{" "}
              <span className="text-[#F5A623]">professeurs ?</span>
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: Award,
                  title: "Qualifications vérifiées",
                  desc: "Tous nos enseignants sont diplômés Bac+3 minimum avec des qualifications vérifiées et validées.",
                },
                {
                  icon: Star,
                  title: "Pédagogie adaptée",
                  desc: "Méthodes d'enseignement personnalisées selon le profil et les besoins de chaque élève.",
                },
                {
                  icon: GraduationCap,
                  title: "Résultats garantis",
                  desc: "+4 points de moyenne en moyenne pour nos élèves suivis régulièrement.",
                },
              ].map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/15 hover:bg-white/15 transition-all duration-300"
                >
                  <div className="w-14 h-14 rounded-full bg-[#F5A623]/20 border border-[#F5A623]/40 flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-7 h-7 text-[#F5A623]" />
                  </div>
                  <h3 className="text-lg font-bold mb-3 text-white">{title}</h3>
                  <p className="text-blue-100 text-sm leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
