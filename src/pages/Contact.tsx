import { MapPin, Phone, Mail, Clock, Building2, CheckCircle, Star, MessageSquare } from "lucide-react";
import { ContactForm } from "@/components/ContactForm";
import { motion } from "framer-motion";
import { springPresets, staggerContainer, staggerItem } from "@/lib/motion";
import { IMAGES } from "@/assets/images";

const centers = [
  {
    id: "1",
    name: "Bureau Régional — Douala",
    address: "Arrondissement Douala 5ᵉ, Makepe Bloc L",
    city: "Douala, Cameroun",
    phone: "+237675252048",
    phoneDisplay: "+237 675 252 048",
    email: "contact@care4success.cm",
    hours: "Lun-Sam : 8h–18h",
    badge: "Siège principal",
  },
  {
    id: "2",
    name: "Antenne Yaoundé",
    address: "Bastos, Avenue de l'Impératrice",
    city: "Yaoundé, Cameroun",
    phone: "+237675252048",
    phoneDisplay: "+237 675 252 048",
    email: "yaounde@care4success.cm",
    hours: "Lun-Sam : 8h–18h",
    badge: "Antenne",
  },
];

const contactMethods = [
  {
    icon: Phone,
    title: "Téléphone",
    value: "+237 675 252 048",
    href: "tel:+237675252048",
    description: "Disponible lun–sam de 8h à 18h",
  },
  {
    icon: Mail,
    title: "Email",
    value: "contact@care4success.cm",
    href: "mailto:contact@care4success.cm",
    description: "Réponse sous 24h ouvrées",
  },
  {
    icon: MapPin,
    title: "Nos centres",
    value: "15 centres au Cameroun",
    href: "#centres",
    description: "Douala, Yaoundé et autres villes",
  },
];

const guarantees = [
  { icon: CheckCircle, text: "Bilan personnalisé 100% gratuit" },
  { icon: Star, text: "Enseignant trouvé en 4 jours" },
  { icon: MessageSquare, text: "Conseiller dédié tout au long du suivi" },
  { icon: CheckCircle, text: "Sans engagement, arrêt libre" },
];

export default function Contact() {
  return (
    <div className="min-h-screen">

      {/* ── HERO ── */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-brand-hero-gradient" />
        <div className="absolute inset-0 z-0">
          <img
            src={IMAGES.STUDENTS_STUDYING_1}
            alt="Bilan personnalisé"
            className="w-full h-full object-cover opacity-10 mix-blend-overlay"
          />
        </div>
        <div className="absolute top-10 right-0 w-96 h-96 bg-[#F5A623]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-10 w-64 h-64 bg-[#1A6CC8]/20 rounded-full blur-2xl" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springPresets.gentle}
            className="text-center max-w-4xl mx-auto"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F5A623]/20 border border-[#F5A623]/40 text-[#F5A623] text-sm font-bold mb-6">
              Bilan personnalisé — 100% gratuit
            </span>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 text-white leading-tight">
              Demandez votre{" "}
              <span className="text-[#F5A623]">bilan personnalisé</span>
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 leading-relaxed max-w-2xl mx-auto">
              Un conseiller pédagogique vous rappelle sous 24h pour construire un programme sur mesure adapté à votre enfant.
            </p>

            {/* Garanties inline */}
            <div className="flex flex-wrap gap-4 justify-center mt-10">
              {guarantees.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 text-sm text-white">
                  <Icon className="w-4 h-4 text-[#F5A623] flex-shrink-0" />
                  {text}
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 z-10">
          <svg viewBox="0 0 1440 70" className="w-full" preserveAspectRatio="none">
            <path d="M0,35 C360,70 1080,0 1440,35 L1440,70 L0,70 Z" fill="oklch(0.99 0.003 230)" />
          </svg>
        </div>
      </section>

      {/* ── MÉTHODES DE CONTACT ── */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-6 mb-20"
          >
            {contactMethods.map((method) => {
              const Icon = method.icon;
              return (
                <motion.a
                  href={method.href}
                  key={method.title}
                  variants={staggerItem}
                  className="bg-card rounded-2xl p-8 text-center shadow-md hover:shadow-xl transition-all duration-300 border border-border/50 hover:border-[#1A6CC8]/30 group block"
                >
                  <div className="w-full h-1 bg-[#F5A623] rounded-full mb-6 mx-auto max-w-[3rem]" />
                  <div className="w-16 h-16 bg-[#1A6CC8]/10 border border-[#1A6CC8]/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-[#1A6CC8] transition-colors duration-300">
                    <Icon className="w-8 h-8 text-[#1A6CC8] group-hover:text-white transition-colors duration-300" />
                  </div>
                  <h3 className="text-lg font-bold mb-2 text-[#0D2D5A]">{method.title}</h3>
                  <p className="text-xl font-bold text-[#1A6CC8] mb-2">{method.value}</p>
                  <p className="text-sm text-muted-foreground">{method.description}</p>
                </motion.a>
              );
            })}
          </motion.div>

          {/* ── FORMULAIRE + CENTRES ── */}
          <div className="grid lg:grid-cols-5 gap-12 items-start">

            {/* Formulaire (large) */}
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={springPresets.gentle}
              className="lg:col-span-3"
            >
              <div className="mb-6">
                <span className="badge-gold inline-flex mb-3">Gratuit & Sans engagement</span>
                <h2 className="text-3xl md:text-4xl font-bold mb-3 text-[#0D2D5A]">
                  Remplissez le formulaire
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Un conseiller pédagogique vous contacte dans les <strong>24h</strong> pour établir votre bilan personnalisé, identifier les points à améliorer et vous proposer l'enseignant idéal.
                </p>
              </div>

              {/* Card formulaire avec barre gold */}
              <div className="rounded-2xl overflow-hidden shadow-2xl border border-[#1A6CC8]/15">
                <div className="h-2 bg-brand-blue-gradient" />
                <div className="bg-card p-2">
                  <ContactForm />
                </div>
              </div>
            </motion.div>

            {/* Sidebar : centres + stats */}
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={springPresets.gentle}
              className="lg:col-span-2 space-y-6"
              id="centres"
            >
              <h2 className="text-2xl font-bold text-[#0D2D5A]">Nos bureaux</h2>

              <div className="space-y-4">
                {centers.map((center) => (
                  <div
                    key={center.id}
                    className="bg-card rounded-xl p-5 shadow-md hover:shadow-lg transition-all duration-200 border border-border/50 hover:border-[#1A6CC8]/30"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-11 h-11 bg-[#1A6CC8]/10 border border-[#1A6CC8]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Building2 className="w-5 h-5 text-[#1A6CC8]" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <h3 className="text-base font-bold text-[#0D2D5A]">{center.name}</h3>
                          <span className="text-xs font-bold bg-[#F5A623]/15 text-[#0D2D5A] border border-[#F5A623]/40 px-2 py-0.5 rounded-full">{center.badge}</span>
                        </div>
                        <div className="space-y-1.5 text-sm text-muted-foreground">
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#F5A623]" />
                            <div>
                              <div>{center.address}</div>
                              <div className="font-medium text-foreground">{center.city}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 flex-shrink-0 text-[#F5A623]" />
                            <a href={`tel:${center.phone}`} className="hover:text-[#1A6CC8] transition-colors font-medium">
                              {center.phoneDisplay}
                            </a>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 flex-shrink-0 text-[#F5A623]" />
                            <a href={`mailto:${center.email}`} className="hover:text-[#1A6CC8] transition-colors">
                              {center.email}
                            </a>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 flex-shrink-0 text-[#F5A623]" />
                            <span>{center.hours}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Chiffres clés */}
              <div className="bg-brand-blue-gradient rounded-2xl p-6 text-white">
                <h3 className="font-bold mb-4 text-[#F5A623] text-sm uppercase tracking-widest">Nos chiffres</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { value: "500+", label: "Enseignants qualifiés" },
                    { value: "24h", label: "Délai de réponse" },
                    { value: "+4 pts", label: "Progression moyenne" },
                    { value: "4.4/5", label: "Satisfaction clients" },
                  ].map(({ value, label }) => (
                    <div key={label} className="text-center bg-white/10 rounded-xl p-3">
                      <div className="text-2xl font-bold text-[#F5A623]">{value}</div>
                      <div className="text-xs text-blue-200 mt-0.5">{label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA appel direct */}
              <a
                href="tel:+237675252048"
                className="flex items-center justify-center gap-3 w-full py-4 rounded-xl bg-[#F5A623] text-[#0D2D5A] font-black text-lg hover:bg-[#E09419] transition-all duration-200 hover:scale-[1.02] shadow-lg"
              >
                <Phone className="w-5 h-5" />
                Appeler directement
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={springPresets.gentle}
            className="relative overflow-hidden bg-brand-blue-gradient rounded-3xl p-12 text-center shadow-2xl"
          >
            <div className="absolute top-0 right-10 w-40 h-40 bg-[#F5A623]/10 rounded-full blur-2xl" />
            <div className="absolute bottom-0 left-10 w-32 h-32 bg-[#F5A623]/10 rounded-full blur-xl" />

            <div className="relative z-10">
              <h2 className="text-4xl font-bold mb-4 text-white">
                Besoin d'un conseil{" "}
                <span className="text-[#F5A623]">immédiat ?</span>
              </h2>
              <p className="text-xl mb-8 text-blue-100">
                Nos conseillers pédagogiques sont disponibles pour répondre à toutes vos questions
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <a
                  href="tel:+237675252048"
                  className="inline-flex items-center gap-3 bg-[#F5A623] text-[#0D2D5A] px-10 py-4 rounded-full font-black hover:bg-[#E09419] transition-all duration-200 hover:scale-105 shadow-xl text-lg"
                >
                  <Phone className="w-5 h-5" />
                  +237 675 252 048
                </a>
                <span className="text-sm text-blue-200">Lun–Sam · 8h–18h · Réponse immédiate</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
