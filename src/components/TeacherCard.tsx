import { motion } from "framer-motion";
import { Star, GraduationCap, BookOpen, Award } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Teacher } from "@/lib/index";
import { springPresets, hoverLift } from "@/lib/motion";
import { NavLink } from "react-router-dom";
import { ROUTE_PATHS } from "@/lib/index";

interface TeacherCardProps {
  teacher: Teacher;
}

export function TeacherCard({ teacher }: TeacherCardProps) {
  return (
    <motion.div
      variants={hoverLift}
      initial="rest"
      whileHover="hover"
      className="h-full"
    >
      <Card className="h-full overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:border-[#1A6CC8]/30">
        {/* Barre or signature */}
        <div className="h-1 bg-[#F5A623] w-full" />

        {/* Photo */}
        <div className="relative h-60 overflow-hidden">
          <img
            src={teacher.photo}
            alt={teacher.name}
            className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0D2D5A]/90 via-[#0D2D5A]/40 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <h3 className="text-xl font-bold text-white mb-1">{teacher.name}</h3>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3.5 w-3.5 ${i < Math.floor(teacher.rating)
                        ? "fill-[#F5A623] text-[#F5A623]"
                        : "text-white/30"
                      }`}
                  />
                ))}
              </div>
              <span className="text-sm font-bold text-[#F5A623]">
                {teacher.rating.toFixed(1)}
              </span>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Expérience */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <GraduationCap className="h-4 w-4 text-[#1A6CC8]" />
            <span>
              <strong className="text-[#0D2D5A]">{teacher.experience} ans</strong> d'expérience
            </span>
          </div>

          {/* Matières */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="h-4 w-4 text-[#1A6CC8]" />
              <span className="text-xs font-bold text-[#0D2D5A] uppercase tracking-wider">
                Matières
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {teacher.subjects.map((subject) => (
                <span
                  key={subject}
                  className="px-2 py-0.5 text-xs rounded-full bg-[#1A6CC8]/10 text-[#1A6CC8] border border-[#1A6CC8]/20 font-medium"
                >
                  {subject}
                </span>
              ))}
            </div>
          </div>

          {/* Niveaux */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Award className="h-4 w-4 text-[#F5A623]" />
              <span className="text-xs font-bold text-[#0D2D5A] uppercase tracking-wider">
                Niveaux
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {teacher.levels.map((level) => (
                <span
                  key={level}
                  className="px-2 py-0.5 text-xs rounded-full border-2 border-[#F5A623]/60 text-[#0D2D5A] font-medium"
                >
                  {level}
                </span>
              ))}
            </div>
          </div>

          {/* Bio */}
          <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
            {teacher.bio}
          </p>

          {/* Qualifications */}
          {teacher.qualifications.length > 0 && (
            <div className="pt-3 border-t border-border/50">
              <p className="text-xs font-bold text-[#0D2D5A] mb-2 uppercase tracking-wider">
                Qualifications
              </p>
              <ul className="space-y-1">
                {teacher.qualifications.slice(0, 2).map((qual, index) => (
                  <li key={index} className="text-xs text-muted-foreground flex items-start gap-2">
                    <span className="text-[#F5A623] mt-0.5 font-bold">•</span>
                    <span>{qual}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* CTA */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={springPresets.snappy}
          >
            <NavLink
              to={ROUTE_PATHS.CONTACT}
              className="w-full flex items-center justify-center py-2.5 px-4 rounded-xl bg-[#0D2D5A] text-white text-sm font-semibold hover:bg-[#1A6CC8] transition-colors duration-200 shadow-md"
            >
              Contacter ce professeur
            </NavLink>
          </motion.div>
        </div>
      </Card>
    </motion.div>
  );
}
