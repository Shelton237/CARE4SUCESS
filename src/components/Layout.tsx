import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
  Menu, X, Phone, Mail, MapPin, ArrowRight,
  Star, LogIn, UserPlus, GraduationCap
} from "lucide-react";
import { SiFacebook, SiInstagram, SiLinkedin } from "react-icons/si";
import { ROUTE_PATHS } from "@/lib/index";
import { motion, AnimatePresence } from "framer-motion";

interface LayoutProps {
  children: React.ReactNode;
}

const NAV_MAIN = [
  { to: ROUTE_PATHS.SERVICES,    label: "Services" },
  { to: ROUTE_PATHS.NIVEAUX,     label: "Niveaux" },
  { to: ROUTE_PATHS.PROFESSEURS, label: "Professeurs" },
  { to: ROUTE_PATHS.TARIFS,      label: "Tarifs" },
  { to: ROUTE_PATHS.A_PROPOS,    label: "À propos" },
  { to: ROUTE_PATHS.CONTACT,     label: "Contact" },
];

export function Layout({ children }: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled,   setScrolled]   = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const close = () => setMobileOpen(false);

  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: "Ubuntu, 'Noto Sans', sans-serif" }}>

      {/* ── TOP BAR ── */}
      <div className={`bg-[#0D2D5A] text-white hidden lg:block transition-all duration-300 overflow-hidden ${scrolled ? "h-0 opacity-0" : "h-10 opacity-100"}`}>
        <div className="container mx-auto px-6 flex items-center justify-between h-full">
          <div className="flex items-center gap-2 text-[11px] text-white/80">
            <MapPin className="w-3 h-3 text-[#F5A623] shrink-0" />
            <span>Présents dans 15 pays africains</span>
            <span className="opacity-30 mx-2">·</span>
            <a href="tel:+237675252048" className="flex items-center gap-1 hover:text-[#F5A623] transition-colors font-semibold">
              <Phone className="w-3 h-3" />+237 675 252 048
            </a>
            <span className="opacity-30 mx-2">·</span>
            <a href="mailto:contact@usra-care.com" className="hover:text-[#F5A623] transition-colors">
              contact@usra-care.com
            </a>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <NavLink to={ROUTE_PATHS.DEVENIR_PROFESSEUR} className="text-[#F5A623] font-bold hover:text-white transition-colors flex items-center gap-1">
              <GraduationCap className="w-3 h-3" /> Devenir enseignant
            </NavLink>
            <NavLink to="/login" className="text-white/70 font-medium hover:text-white transition-colors flex items-center gap-1">
              <LogIn className="w-3 h-3" /> Connexion
            </NavLink>
          </div>
        </div>
      </div>

      {/* ── NAVBAR PRINCIPALE ── */}
      <header className={`sticky top-0 w-full z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white shadow-lg shadow-[#0D2D5A]/8 border-b border-gray-100"
          : "bg-white border-b border-gray-100"
      }`}>
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-16 md:h-18">

            {/* Logo */}
            <NavLink to={ROUTE_PATHS.HOME} className="flex items-center shrink-0">
              <picture>
                <source media="(min-width: 640px)" srcSet="/logo/Care 4 Success-logo-Ok_large.png" />
                <img
                  src="/logo/Care 4 Success-logo-Ok_compact.png"
                  alt="Care4Success"
                  className="h-12 md:h-14 w-auto object-contain"
                />
              </picture>
            </NavLink>

            {/* Nav desktop */}
            <nav className="hidden lg:flex items-center gap-1 ml-8">
              {NAV_MAIN.map(link => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${
                      isActive
                        ? "text-[#1A6CC8] bg-[#1A6CC8]/8"
                        : "text-[#0D2D5A]/80 hover:text-[#1A6CC8] hover:bg-[#0D2D5A]/5"
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>

            {/* CTAs desktop */}
            <div className="hidden lg:flex items-center gap-3 ml-auto pl-6">
              <NavLink
                to="/login"
                className="h-9 px-4 rounded-lg border border-[#0D2D5A]/20 text-[#0D2D5A] text-sm font-semibold hover:border-[#1A6CC8] hover:text-[#1A6CC8] transition-all duration-150 flex items-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5" /> Connexion
              </NavLink>
              <NavLink
                to="/inscription"
                className="h-9 px-4 rounded-lg bg-[#1A6CC8] text-white text-sm font-bold hover:bg-[#0D2D5A] transition-all duration-150 flex items-center gap-1.5 shadow-sm"
              >
                <UserPlus className="w-3.5 h-3.5" /> S'inscrire
              </NavLink>
              <NavLink
                to={ROUTE_PATHS.CONTACT}
                className="h-9 px-4 rounded-lg bg-[#F5A623] text-[#0D2D5A] text-sm font-bold hover:bg-[#e09520] transition-all duration-150 flex items-center gap-1.5 shadow-sm"
              >
                Bilan gratuit <ArrowRight className="w-3.5 h-3.5" />
              </NavLink>
            </div>

            {/* Burger mobile */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-lg text-[#0D2D5A] hover:bg-gray-100 transition-colors ml-auto cursor-pointer"
              aria-label="Menu"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Menu mobile */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden border-t border-gray-100 bg-white"
            >
              <nav className="container mx-auto px-4 py-4 space-y-1">
                {NAV_MAIN.map(link => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={close}
                    className={({ isActive }) =>
                      `block px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                        isActive ? "bg-[#0D2D5A] text-white" : "text-[#0D2D5A] hover:bg-gray-50"
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}
                <div className="pt-3 border-t border-gray-100 space-y-2">
                  <NavLink to="/login" onClick={close} className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold border-2 border-[#1A6CC8] text-[#1A6CC8] hover:bg-[#1A6CC8] hover:text-white transition-colors cursor-pointer">
                    <LogIn className="w-4 h-4" /> Connexion
                  </NavLink>
                  <NavLink to="/inscription" onClick={close} className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold bg-[#1A6CC8] text-white hover:bg-[#0D2D5A] transition-colors cursor-pointer">
                    <UserPlus className="w-4 h-4" /> S'inscrire
                  </NavLink>
                  <NavLink to={ROUTE_PATHS.DEVENIR_PROFESSEUR} onClick={close} className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold border-2 border-[#F5A623] text-[#F5A623] hover:bg-[#F5A623] hover:text-[#0D2D5A] transition-colors cursor-pointer">
                    <GraduationCap className="w-4 h-4" /> Devenir enseignant
                  </NavLink>
                  <NavLink to={ROUTE_PATHS.CONTACT} onClick={close} className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold bg-[#F5A623] text-[#0D2D5A] hover:bg-[#e09520] transition-colors cursor-pointer">
                    Bilan gratuit <ArrowRight className="w-4 h-4" />
                  </NavLink>
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* MAIN */}
      <main className="flex-1">{children}</main>

      {/* ── FOOTER ── */}
      <footer className="bg-[#0D2D5A] text-white">
        <div className="h-1 bg-[#F5A623]" />
        <div className="container mx-auto px-6 pt-14 pb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">

            {/* Marque */}
            <div className="lg:col-span-2">
              <img src="/logo/Care 4 Success-logo-Ok_compact.png" alt="Care4Success" className="h-12 w-auto object-contain brightness-0 invert mb-4" />
              <p className="text-sm text-blue-200/80 leading-relaxed mb-5 max-w-xs">
                Votre partenaire de réussite scolaire en Afrique francophone. 10 ans d'expérience, 500+ enseignants qualifiés.
              </p>
              <div className="flex items-center gap-1.5 mb-5">
                {[1,2,3,4].map(i => <Star key={i} className="w-4 h-4 fill-[#F5A623] text-[#F5A623]" />)}
                <Star className="w-4 h-4 fill-white/10 text-white/20" />
                <span className="text-white font-bold text-sm ml-1">4,4/5</span>
                <span className="text-blue-300/60 text-xs ml-1">— note vérifiée</span>
              </div>
              <div className="flex gap-2">
                {[
                  { href: "https://facebook.com", Icon: SiFacebook, label: "Facebook" },
                  { href: "https://linkedin.com", Icon: SiLinkedin, label: "LinkedIn" },
                  { href: "https://instagram.com", Icon: SiInstagram, label: "Instagram" },
                ].map(({ href, Icon, label }) => (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
                    className="w-8 h-8 rounded-lg bg-white/8 hover:bg-[#F5A623] hover:text-[#0D2D5A] flex items-center justify-center transition-all duration-200 cursor-pointer">
                    <Icon className="w-3.5 h-3.5" />
                  </a>
                ))}
              </div>
            </div>

            {/* Services */}
            <div>
              <h3 className="text-[10px] font-black text-[#F5A623] mb-4 uppercase tracking-[0.25em]">Services</h3>
              <ul className="space-y-2.5">
                {["Cours à domicile", "Cours en ligne", "Stages vacances", "Prépa BEPC & BAC", "Formation adultes"].map(item => (
                  <li key={item}>
                    <NavLink to={ROUTE_PATHS.SERVICES} className="text-sm text-blue-200/70 hover:text-[#F5A623] transition-colors flex items-center gap-2 group">
                      <span className="w-1 h-1 rounded-full bg-[#F5A623]/30 group-hover:bg-[#F5A623] transition-colors shrink-0" />
                      {item}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>

            {/* Liens utiles */}
            <div>
              <h3 className="text-[10px] font-black text-[#F5A623] mb-4 uppercase tracking-[0.25em]">Liens utiles</h3>
              <ul className="space-y-2.5">
                {[
                  { label: "Niveaux scolaires", to: ROUTE_PATHS.NIVEAUX },
                  { label: "Nos professeurs", to: ROUTE_PATHS.PROFESSEURS },
                  { label: "Tarifs", to: ROUTE_PATHS.TARIFS },
                  { label: "À propos", to: ROUTE_PATHS.A_PROPOS },
                  { label: "Devenir enseignant", to: ROUTE_PATHS.DEVENIR_PROFESSEUR },
                ].map(item => (
                  <li key={item.label}>
                    <NavLink to={item.to} className="text-sm text-blue-200/70 hover:text-[#F5A623] transition-colors flex items-center gap-2 group">
                      <span className="w-1 h-1 rounded-full bg-[#F5A623]/30 group-hover:bg-[#F5A623] transition-colors shrink-0" />
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-[10px] font-black text-[#F5A623] mb-4 uppercase tracking-[0.25em]">Contact</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2.5">
                  <Phone className="w-3.5 h-3.5 mt-0.5 text-[#F5A623] shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-white">+237 675 252 048</p>
                    <p className="text-xs text-blue-300/60">Lun–Sam 8h–18h</p>
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <Mail className="w-3.5 h-3.5 mt-0.5 text-[#F5A623] shrink-0" />
                  <a href="mailto:contact@usra-care.com" className="text-sm text-blue-200/70 hover:text-[#F5A623] transition-colors">
                    contact@usra-care.com
                  </a>
                </li>
                <li className="flex items-start gap-2.5">
                  <MapPin className="w-3.5 h-3.5 mt-0.5 text-[#F5A623] shrink-0" />
                  <div className="text-sm text-blue-200/70">
                    <p className="font-semibold text-white">Douala 5ᵉ, Makepe Bloc L</p>
                    <p>Cameroun · Réseau panafricain</p>
                  </div>
                </li>
              </ul>
              <NavLink to={ROUTE_PATHS.CONTACT} className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-[#F5A623] hover:text-white transition-colors group cursor-pointer">
                Nous contacter <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </NavLink>
            </div>
          </div>

          <div className="border-t border-white/8 mt-12 pt-6 flex flex-col md:flex-row justify-between items-center gap-3">
            <p className="text-xs text-blue-300/50">© 2026 Care4Success. Tous droits réservés.</p>
            <div className="flex gap-6 text-xs text-blue-300/50">
              <a href="#" className="hover:text-[#F5A623] transition-colors">Mentions légales</a>
              <NavLink to={ROUTE_PATHS.POLITIQUE_CONFIDENTIALITE} className="hover:text-[#F5A623] transition-colors">Confidentialité</NavLink>
              <a href="#" className="hover:text-[#F5A623] transition-colors">CGV</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
