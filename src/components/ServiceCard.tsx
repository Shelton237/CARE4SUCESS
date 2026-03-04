import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Service, ROUTE_PATHS } from "@/lib/index";
import { springPresets, hoverLift } from "@/lib/motion";

interface ServiceCardProps {
  service: Service;
}

export function ServiceCard({ service }: ServiceCardProps) {
  return (
    <motion.div
      variants={hoverLift}
      initial="rest"
      whileHover="hover"
      className="h-full"
    >
      <Card className="h-full flex flex-col overflow-hidden border-border/50 hover:border-[#1A6CC8]/40 hover:shadow-xl transition-all duration-300">
        {/* Barre or en haut */}
        <div className="h-1.5 bg-[#F5A623] w-full" />

        <div className="relative h-48 overflow-hidden">
          <motion.img
            src={service.image}
            alt={service.title}
            className="w-full h-full object-cover"
            whileHover={{ scale: 1.05 }}
            transition={springPresets.gentle}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0D2D5A]/85 via-[#0D2D5A]/30 to-transparent" />
          <div className="absolute bottom-4 left-4">
            <span className="px-3 py-1 rounded-full bg-[#F5A623] text-[#0D2D5A] text-xs font-bold">
              {service.price}
            </span>
          </div>
        </div>

        <CardHeader className="pb-3">
          <CardTitle className="text-xl font-bold text-[#0D2D5A]">{service.title}</CardTitle>
          <CardDescription className="text-base">
            {service.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="flex-1 space-y-4">
          <div className="space-y-2">
            <h4 className="font-bold text-xs text-[#1A6CC8] uppercase tracking-widest">
              Avantages clés
            </h4>
            <ul className="space-y-2">
              {service.features.slice(0, 4).map((feature, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ ...springPresets.snappy, delay: index * 0.05 }}
                  className="flex items-start gap-2 text-sm"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#F5A623] mt-0.5 flex-shrink-0" />
                  <span className="text-foreground/80">{feature}</span>
                </motion.li>
              ))}
            </ul>
          </div>

          {service.benefits.length > 0 && (
            <div className="pt-2 border-t border-border/50">
              <div className="flex flex-wrap gap-2">
                {service.benefits.slice(0, 3).map((benefit, index) => (
                  <span
                    key={index}
                    className="px-2 py-0.5 text-xs rounded-full bg-[#1A6CC8]/10 text-[#1A6CC8] border border-[#1A6CC8]/20 font-medium"
                  >
                    {benefit}
                  </span>
                ))}
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="pt-4 border-t border-border/50">
          <Link
            to={ROUTE_PATHS.CONTACT}
            className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-[#1A6CC8] text-white font-semibold hover:bg-[#0D2D5A] transition-colors duration-200 group shadow-lg shadow-[#1A6CC8]/20"
          >
            Demander un bilan gratuit
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </CardFooter>
      </Card>
    </motion.div>
  );
}