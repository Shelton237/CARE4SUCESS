import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { Menu, X, Phone, Mail, MapPin, ArrowRight, Star, Lock, User, GraduationCap } from "lucide-react";
import { SiFacebook, SiX, SiInstagram } from "react-icons/si";
import { FaLinkedinIn } from "react-icons/fa";
import { ROUTE_PATHS } from "@/lib/index";
import { motion, AnimatePresence } from "framer-motion";

interface LayoutProps {
  children: React.ReactNode;
}



export function Layout({ children }: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);


  /* Scroll effect */
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);



  const navLinks = [
    { to: ROUTE_PATHS.HOME, label: "Accueil" },
    { to: ROUTE_PATHS.SERVICES, label: "Services" },
    { to: ROUTE_PATHS.PROFESSEURS, label: "Professeurs" },
    { to: ROUTE_PATHS.RECRUTEMENT, label: "Recrutement" },
    { to: ROUTE_PATHS.CONTACT, label: "Contact" },
  ];

  return (
    <div className="min-h-screen flex flex-col">

      {/* ══ TOP BAR — info utilitaires ══ (masqué au scroll) */}
      <div
        className={`bg-[#0D2D5A] text-white text-xs font-medium hidden lg:block transition-all duration-300 overflow-hidden ${scrolled ? "h-0 opacity-0" : "h-11 opacity-100"}`}
      >
        <div className="container mx-auto px-4 flex items-center justify-between h-full">
          {/* Gauche - Localisation experte */}
          <div className="flex items-center gap-2 text-white/90 text-[11px] md:text-xs">
            <MapPin className="w-3.5 h-3.5 text-[#57c2dc]" />
            <span className="font-bold">15 centres Care4Success au Cameroun</span>
            <span className="mx-2 opacity-30">|</span>
            <NavLink to={ROUTE_PATHS.CONTACT} className="font-medium hover:underline text-white/70 hover:text-white transition-colors">
              Trouvez le plus proche de chez vous
            </NavLink>
          </div>

          {/* Droite - Actions & Compte */}
          <div className="hidden xl:flex items-center gap-5 text-[11px] md:text-xs text-white">
            <a href="tel:+237675252048" className="flex items-center gap-1.5 hover:text-[#57c2dc] transition-colors font-bold tracking-wide">
              <Phone className="w-3.5 h-3.5" />
              09 72 72 83 83
            </a>

            <div className="flex items-center gap-1.5 border-l border-white/20 pl-5 group">
              <span className="text-white/60 font-medium group-hover:text-white/80 transition-colors">Care4Success recrute</span>
              <NavLink to={ROUTE_PATHS.RECRUTEMENT} className="font-bold hover:text-[#57c2dc] hover:underline transition-colors ml-1">
                Devenir enseignant
              </NavLink>
            </div>

            <NavLink to="/login" className="flex items-center gap-1.5 border-l border-white/20 pl-5 font-bold hover:text-[#57c2dc] transition-colors group">
              <div className="w-5 h-5 rounded-full border border-current flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
                <User className="w-3 h-3" />
              </div>
              Connexion à votre espace
            </NavLink>
          </div>
        </div>
      </div>

      {/* ══ NAVBAR PRINCIPALE ══ */}
      <header className={`sticky top-0 w-full z-50 transition-all duration-300 ${scrolled
        ? "bg-white shadow-xl shadow-[#0D2D5A]/5 border-b border-[#0D2D5A]/10 py-1"
        : "bg-white border-b border-[#0D2D5A]/10 py-2 md:py-3"
        }`}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">

            {/* ── Logo ── */}
            <NavLink to={ROUTE_PATHS.HOME} className="flex items-center shrink-0 group">
              <picture>
                <source media="(min-width: 640px)" srcSet="/logo/Care 4 Success-logo-Ok_large.png" />
                <img
                  src="/logo/Care 4 Success-logo-Ok_compact.png"
                  alt="Care 4 Success"
                  className="h-14 md:h-[80px] w-auto object-contain transition-transform duration-300 group-hover:scale-[1.03]"
                />
              </picture>
            </NavLink>

            {/* ── Navigation desktop ── */}
            <nav className="hidden lg:flex items-center gap-2 ml-auto mr-8">

              {/* Accueil */}
              <NavLink
                to={ROUTE_PATHS.HOME}
                className={({ isActive }) =>
                  `px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${isActive ? "text-[#1A6CC8] bg-[#1A6CC8]/10" : "text-[#0D2D5A] hover:text-[#1A6CC8] hover:bg-[#0D2D5A]/5"
                  }`
                }
              >
                Accueil
              </NavLink>



              {/* Autres liens */}
              {navLinks.filter(l => l.to !== ROUTE_PATHS.HOME).map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${isActive ? "text-[#1A6CC8] bg-[#1A6CC8]/10" : "text-[#0D2D5A] hover:text-[#1A6CC8] hover:bg-[#0D2D5A]/5"
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>

            {/* ── CTA desktop ── */}
            <div className="hidden lg:flex items-center gap-4">
              <NavLink
                to={ROUTE_PATHS.CONTACT}
                id="nav-cta"
                className="group relative inline-flex items-center justify-center h-[46px] px-8 rounded-full bg-[#0D2D5A] text-white text-sm font-black uppercase tracking-widest overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
              >
                <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                <span className="relative flex items-center gap-2">
                  Faire un bilan
                  <Star className="w-4 h-4 text-[#F5A623] fill-[#F5A623]" />
                </span>
              </NavLink>
            </div>

            {/* ── Burger mobile ── */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2.5 rounded-2xl hover:bg-blue-50 transition-colors text-[#0D2D5A] ml-auto shrink-0"
              aria-label="Menu"
            >
              {mobileOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
            </button>
          </div>
        </div>

        {/* ── Menu mobile ── */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden border-t border-[#0D2D5A]/10 bg-white"
            >
              <nav className="container mx-auto px-4 py-4 flex flex-col gap-1">
                {navLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `px-4 py-3 rounded-xl text-sm font-bold transition-all duration-150 ${isActive
                        ? "bg-[#0D2D5A] text-white"
                        : "text-[#0D2D5A] hover:bg-[#0D2D5A]/8 hover:text-[#1A6CC8]"
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}

                <div className="flex flex-col gap-2 mt-3 pt-4 border-t border-[#0D2D5A]/10">
                  <NavLink
                    to={ROUTE_PATHS.CONTACT}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black bg-[#0D2D5A] text-white hover:bg-[#1A6CC8] transition-colors shadow-lg"
                  >
                    Faire un bilan
                  </NavLink>
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── MAIN ── */}
      <main className="flex-1">{children}</main>

      {/* ══ FOOTER ══ */}
      <footer className="bg-[#0D2D5A] text-white">

        {/* Bande or tout en haut du footer */}
        <div className="h-1 bg-[#F5A623]" />

        <div className="container mx-auto px-4 pt-14 pb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

            {/* Colonne marque */}
            <div className="lg:col-span-1">
              <img
                src="/logo/Care 4 Success-logo-Ok_compact.png"
                alt="Care 4 Success"
                className="h-14 w-auto object-contain brightness-0 invert mb-4"
              />
              <p className="text-sm text-blue-200 leading-relaxed mb-5">
                Votre partenaire de confiance pour la réussite scolaire en Afrique francophone.
                10 ans d'expérience, 500+ enseignants.
              </p>
              {/* Note */}
              <div className="flex items-center gap-2 mb-5 px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 w-fit">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star key={i} className={`w-3.5 h-3.5 ${i <= 4 ? "fill-[#F5A623] text-[#F5A623]" : "fill-white/15 text-white/15"}`} />
                  ))}
                </div>
                <span className="text-white font-black text-sm">4,4/5</span>
                <span className="text-blue-300 text-xs">— note vérifiée</span>
              </div>
              {/* Réseaux */}
              <div className="flex gap-2.5">
                {[
                  { href: "https://facebook.com", Icon: SiFacebook, label: "Facebook" },
                  { href: "https://x.com", Icon: SiX, label: "X" },
                  { href: "https://linkedin.com", Icon: FaLinkedinIn, label: "LinkedIn" },
                  { href: "https://instagram.com", Icon: SiInstagram, label: "Instagram" },
                ].map(({ href, Icon, label }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="w-9 h-9 rounded-lg bg-white/10 hover:bg-[#F5A623] hover:text-[#0D2D5A] flex items-center justify-center transition-all duration-200 hover:scale-110"
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </a>
                ))}
              </div>
            </div>

            {/* Services */}
            <div>
              <h3 className="text-[10px] font-black text-[#F5A623] mb-5 uppercase tracking-[0.25em]">Services</h3>
              <ul className="space-y-2.5">
                {[
                  "Cours particuliers à domicile",
                  "Cours en ligne",
                  "Stages vacances",
                  "Préparation BEPC & BAC",
                  "Accompagnement adultes",
                ].map((item) => (
                  <li key={item}>
                    <NavLink
                      to={ROUTE_PATHS.SERVICES}
                      className="text-sm text-blue-200 hover:text-[#F5A623] transition-colors flex items-center gap-2 group"
                    >
                      <span className="w-1 h-1 rounded-full bg-[#F5A623]/40 group-hover:bg-[#F5A623] transition-colors shrink-0" />
                      {item}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>

            {/* Niveaux */}
            <div>
              <h3 className="text-[10px] font-black text-[#F5A623] mb-5 uppercase tracking-[0.25em]">Niveaux</h3>
              <ul className="space-y-2.5">
                {["Primaire", "Collège", "Lycée", "Supérieur", "Adultes & Pros"].map((item) => (
                  <li key={item}>
                    <NavLink
                      to={ROUTE_PATHS.NIVEAUX}
                      className="text-sm text-blue-200 hover:text-[#F5A623] transition-colors flex items-center gap-2 group"
                    >
                      <span className="w-1 h-1 rounded-full bg-[#F5A623]/40 group-hover:bg-[#F5A623] transition-colors shrink-0" />
                      {item}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-[10px] font-black text-[#F5A623] mb-5 uppercase tracking-[0.25em]">Contact</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <Phone className="w-4 h-4 mt-0.5 text-[#F5A623] shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-white">+237 675 252 048</p>
                    <p className="text-xs text-blue-300">Lun–Sam 8h–18h</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Mail className="w-4 h-4 mt-0.5 text-[#F5A623] shrink-0" />
                  <a href="mailto:contact@care4success.cm" className="text-sm text-blue-200 hover:text-[#F5A623] transition-colors">
                    contact@care4success.cm
                  </a>
                </li>
                <li className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 mt-0.5 text-[#F5A623] shrink-0" />
                  <div className="text-sm text-blue-200">
                    <p className="font-bold text-white">Bureau Régional</p>
                    <p>Arrondissement Douala 5ᵉ</p>
                    <p>Makepe Bloc L, Cameroun</p>
                  </div>
                </li>
              </ul>
              {/* Badge garantie */}
              <div className="mt-5 p-3.5 rounded-xl bg-[#F5A623]/10 border border-[#F5A623]/20">
                <GraduationCap className="w-4 h-4 text-[#F5A623] mb-1.5" />
                <p className="text-xs text-blue-200 leading-snug">
                  Prépa BEPC & BAC —{" "}
                  <span className="text-[#F5A623] font-black">+4 pts garantis</span>
                </p>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-white/10 mt-12 pt-6 flex flex-col md:flex-row justify-between items-center gap-3">
            <p className="text-xs text-blue-300">© 2026 Care 4 Success. Tous droits réservés.</p>
            <div className="flex gap-6 text-xs text-blue-300">
              {["Mentions légales", "Politique de confidentialité", "CGV"].map((item) => (
                <a key={item} href="#" className="hover:text-[#F5A623] transition-colors">{item}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
