import { motion } from "framer-motion";
import { Phone, Mail, MapPin, Clock, CheckCircle, ArrowRight } from "lucide-react";
import { ContactForm } from "@/components/ContactForm";
import { IMAGES } from "@/assets/images";
import { springPresets, staggerContainer, staggerItem } from "@/lib/motion";

const CONTACT_METHODS = [
  {
    icon: Phone,
    title: "Téléphone",
    value: "+237 675 252 048",
    href: "tel:+237675252048",
    note: "Lun–Sam 8h–18h",
  },
  {
    icon: Mail,
    title: "Email",
    value: "contact@usra-care.com",
    href: "mailto:contact@usra-care.com",
    note: "Réponse sous 24h ouvrées",
  },
  {
    icon: MapPin,
    title: "Bureau principal",
    value: "Douala 5ᵉ, Makepe Bloc L",
    href: "#centres",
    note: "Réseau panafricain — 15 pays",
  },
  {
    icon: Clock,
    title: "Horaires",
    value: "Lun–Sam 8h–18h",
    href: null,
    note: "Réponse 24h/24 par email",
  },
];

const GUARANTEES = [
  "Bilan personnalisé 100% gratuit et sans engagement",
  "Enseignant trouvé en 4 jours ouvrés",
  "Conseiller dédié tout au long du suivi",
  "Annulation libre, sans frais ni préavis",
];

const CENTERS = [
  {
    name: "Bureau Régional — Cameroun",
    address: "Arrondissement Douala 5ᵉ, Makepe Bloc L, Douala",
    phone: "+237 675 252 048",
    email: "contact@usra-care.com",
    badge: "Siège Cameroun",
  },
  {
    name: "Siège Social Principal — Madagascar",
    address: "LOT 230 Ankadivory Talatamaty-Ambohidratrimo, Antananarivo 101",
    phone: "+261 038 262 0250",
    email: "contact@usra-care.com",
    badge: "Siège Afrique",
  },
  {
    name: "Bureau Régional — Côte d'Ivoire",
    address: "Koumassi, Immeuble Coulibaly Seydou, Lot 5303 — Îlot 218, Abidjan",
    phone: null,
    email: "contact@usra-care.com",
    badge: "Antenne Abidjan",
  },
];

export default function Contact() {
  return (
    <div className="min-h-screen" style={{ fontFamily: "Ubuntu, 'Noto Sans', sans-serif" }}>

      {/* ── HERO ── */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${IMAGES.STUDENTS_STUDYING_6})` }} />
        <div className="absolute inset-0 bg-[#0D2D5A]/78" />
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-[#F5A623]/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none" />

        <div className="container mx-auto px-6 max-w-5xl relative z-10">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={springPresets.gentle} className="max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[#F5A623] mb-4">Contact & Bilan gratuit</p>
            <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-5">
              Parlons de votre<br />
              <span className="text-[#F5A623]">projet scolaire</span>
            </h1>
            <p className="text-blue-200 text-lg leading-relaxed mb-6">
              Remplissez le formulaire ci-dessous. Un conseiller pédagogique vous contacte sous <strong className="text-white">24 heures</strong> pour construire un programme sur mesure.
            </p>
            <ul className="space-y-2">
              {GUARANTEES.map(g => (
                <li key={g} className="flex items-center gap-2.5 text-sm text-blue-100">
                  <CheckCircle className="w-4 h-4 text-[#F5A623] shrink-0" />
                  {g}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>

      {/* ── FORMULAIRE + CONTACTS ── */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="grid lg:grid-cols-5 gap-10">

            {/* Formulaire — côté gauche (3/5) */}
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={springPresets.gentle}
              className="lg:col-span-3"
            >
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7">
                <div className="mb-6">
                  <p className="text-xs font-black uppercase tracking-[0.3em] text-[#F5A623] mb-2">Formulaire de contact</p>
                  <h2 className="text-2xl font-black text-[#0D2D5A]">Demandez votre bilan gratuit</h2>
                  <p className="text-sm text-gray-500 mt-1">Le formulaire est transmis directement à notre équipe de conseillers.</p>
                </div>
                <ContactForm />
              </div>
            </motion.div>

            {/* Coordonnées — côté droit (2/5) */}
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={springPresets.gentle}
              className="lg:col-span-2 space-y-4"
            >
              {CONTACT_METHODS.map(({ icon: Icon, title, value, href, note }) => (
                <div key={title} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-start gap-4 hover:border-[#1A6CC8]/20 hover:shadow-sm transition-all duration-150">
                  <div className="w-10 h-10 rounded-xl bg-[#0D2D5A] flex items-center justify-center shrink-0">
                    <Icon className="w-4.5 h-4.5 text-[#F5A623]" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-0.5">{title}</p>
                    {href ? (
                      <a href={href} className="font-bold text-[#0D2D5A] hover:text-[#1A6CC8] transition-colors text-sm cursor-pointer">{value}</a>
                    ) : (
                      <p className="font-bold text-[#0D2D5A] text-sm">{value}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">{note}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── NOS CENTRES ── */}
      <section id="centres" className="py-20 bg-white">
        <div className="container mx-auto px-6 max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={springPresets.gentle}
            className="mb-10"
          >
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[#F5A623] mb-3">Nos bureaux</p>
            <h2 className="text-3xl font-black text-[#0D2D5A]">Nous trouver</h2>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {CENTERS.map(c => (
              <motion.div key={c.name} variants={staggerItem} className="bg-gray-50 rounded-2xl border border-gray-100 p-6 hover:border-[#1A6CC8]/20 hover:shadow-md transition-all duration-200">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="font-black text-[#0D2D5A] text-sm leading-snug">{c.name}</h3>
                  <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-[#1A6CC8]/10 text-[#1A6CC8] shrink-0 ml-2">
                    {c.badge}
                  </span>
                </div>
                <div className="space-y-2.5 text-sm">
                  <div className="flex items-start gap-2 text-gray-600">
                    <MapPin className="w-4 h-4 text-[#F5A623] shrink-0 mt-0.5" />
                    <span>{c.address}</span>
                  </div>
                  {c.phone && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="w-4 h-4 text-[#F5A623] shrink-0" />
                      <a href={`tel:${c.phone.replace(/\s/g, "")}`} className="hover:text-[#1A6CC8] transition-colors cursor-pointer">{c.phone}</a>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="w-4 h-4 text-[#F5A623] shrink-0" />
                    <a href={`mailto:${c.email}`} className="hover:text-[#1A6CC8] transition-colors cursor-pointer">{c.email}</a>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  );
}
