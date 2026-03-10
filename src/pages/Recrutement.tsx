import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import {
    Award,
    BookOpen,
    BriefcaseBusiness,
    CalendarClock,
    CheckCircle2,
    ChevronDown,
    GraduationCap,
    Heart,
    Landmark,
    MapPin,
    Megaphone,
    MessageSquareText,
    Phone,
    Shield,
    Star,
    TrendingUp,
    Users,
    Wallet,
    Zap,
} from "lucide-react";
import { TeacherApplicationForm } from "@/components/TeacherApplicationForm";

/* ================================================================
   DATA
   ================================================================ */

const keyFigures = [
    { value: "3 000+", label: "Enseignants actifs", icon: Users, color: "#F5A623" },
    { value: "15", label: "Pays africains couverts", icon: MapPin, color: "#1A6CC8" },
    { value: "4,9/5", label: "Note de satisfaction", icon: Star, color: "#F5A623" },
    { value: "98 %", label: "Missions honorées", icon: CheckCircle2, color: "#1A6CC8" },
];

const whyJoin = [
    {
        icon: Wallet,
        title: "Rémunération attractive",
        description:
            "Percevez des revenus compétitifs, virés directement sur Mobile Money (Orange, MTN, Wave…). Pas de retard, pas de surprise.",
    },
    {
        icon: CalendarClock,
        title: "Flexibilité totale",
        description:
            "Choisissez vos créneaux : matins, soirs, week-ends. Combinez Care4Success avec vos autres activités professionnelles.",
    },
    {
        icon: GraduationCap,
        title: "Formation continue",
        description:
            "Accédez à notre bibliothèque pédagogique, à des masterclasses mensuelles et à des certifications reconnues en Afrique.",
    },
    {
        icon: Shield,
        title: "Mission sécurisée",
        description:
            "Familles vérifiées, contrats clairs, assistance 7j/7. Vous vous concentrez sur l'enseignement, nous gérons le reste.",
    },
    {
        icon: TrendingUp,
        title: "Évolution de carrière",
        description:
            "Les meilleurs enseignants deviennent mentors, formateurs ou responsables régionaux. Un vrai projet de carrière.",
    },
    {
        icon: Heart,
        title: "Impact réel",
        description:
            "Contribuez à l'excellence éducative africaine. Chaque cours donné renforce une génération de leaders de demain.",
    },
];

const profiles = [
    {
        icon: GraduationCap,
        title: "Enseignants & Professeurs",
        desc: "Du primaire au bac+5, dans toutes les matières. Expérience en institution ou en particulier bienvenue.",
        badge: "Profil le plus recherché",
        highlighted: true,
    },
    {
        icon: Landmark,
        title: "Formateurs pros",
        desc: "Bureautique, langues, comptabilité, droit, marketing digital… Votre expertise métier change des vies.",
        badge: null,
        highlighted: false,
    },
    {
        icon: BriefcaseBusiness,
        title: "Coaches & Mentors",
        desc: "Orientation, préparation aux concours, soutien psycho-scolaire, préparation aux examens officiels.",
        badge: null,
        highlighted: false,
    },
    {
        icon: Zap,
        title: "Tuteurs numériques",
        desc: "Informatique, code, robotique, IA… Les compétences tech sont la priorité pour l'Afrique de 2030.",
        badge: "Forte demande",
        highlighted: false,
    },
];

const steps = [
    {
        number: "01",
        title: "Candidature en ligne",
        desc: "Remplissez notre formulaire en 10 minutes : matières, niveaux, disponibilités et brève présentation.",
        duration: "10 min",
        color: "#F5A623",
    },
    {
        number: "02",
        title: "Entretien visio",
        desc: "Un conseiller pédagogique africain échange avec vous en français ou en anglais pour valider votre profil.",
        duration: "48 h",
        color: "#1A6CC8",
    },
    {
        number: "03",
        title: "Mini-cours filmé",
        desc: "Enregistrez un cours de 5 minutes sur une notion de votre choix. Pas de matériel professionnel requis.",
        duration: "5 min",
        color: "#F5A623",
    },
    {
        number: "04",
        title: "Onboarding & 1ère mission",
        desc: "Accès immédiat à notre plateforme, docs de bienvenue et mise en relation avec votre première famille.",
        duration: "1 semaine",
        color: "#1A6CC8",
    },
];

const testimonials = [
    {
        name: "Aminata Diallo",
        role: "Professeure de Maths · Dakar, Sénégal",
        text: "Care4Success a changé ma vie ! En 6 mois, j'ai doublé mes revenus tout en gardant mon poste au lycée. La communauté des enseignants est vraiment enrichissante.",
        rating: 5,
        avatar: "AD",
        color: "#F5A623",
    },
    {
        name: "Kofi Mensah",
        role: "Tuteur Sciences · Accra, Ghana",
        text: "La flexibilité est incroyable. Je gère mes cours depuis l'appli, les paiements arrivent par Mobile Money le jour même. Sérieusement professionnel.",
        rating: 5,
        avatar: "KM",
        color: "#1A6CC8",
    },
    {
        name: "Fatou Ndiaye",
        role: "Coach orientation · Abidjan, Côte d'Ivoire",
        text: "J'ai rejoint Care4Success après ma licence. La formation continue m'a permis de me spécialiser en prépa aux grandes écoles. Je suis aujourd'hui mentore régionale.",
        rating: 5,
        avatar: "FN",
        color: "#0D2D5A",
    },
];

const faqs = [
    {
        q: "Dois-je avoir un diplôme d'enseignement pour postuler ?",
        a: "Non ! Nous recrutons sur la compétence et la pédagogie. Un diplôme universitaire (licence ou plus) dans votre matière + une expérience d'enseignement ou de tutorat suffisent pour candidater.",
    },
    {
        q: "Dans quelle devise suis-je payé ?",
        a: "Selon votre pays : FCFA (XOF/XAF), GHS (Ghana), KES (Kenya), NGN (Nigéria), MGA (Madagascar)… Les virements se font via Mobile Money, CinetPay ou virement bancaire local.",
    },
    {
        q: "Les cours se donnent-ils uniquement en ligne ?",
        a: "Les deux ! Vous pouvez enseigner en ligne via notre salle de classe virtuelle intégrée, ou en présentiel chez la famille dans votre ville. Vous choisissez selon votre convenance.",
    },
    {
        q: "Combien puis-je gagner en moyenne ?",
        a: "Cela dépend de votre pays, matière et disponibilité. En moyenne nos enseignants à temps partiel (10–15 h/semaine) gagnent entre 50 000 et 150 000 FCFA supplémentaires par mois.",
    },
    {
        q: "Y a-t-il une période d'essai ?",
        a: "Oui, une période de 30 jours pendant laquelle nous suivons ensemble vos premières missions. C'est aussi une opportunité de bénéficier d'un coaching pédagogique personnalisé.",
    },
];

/* ================================================================
   COMPOSANTS INTERNES
   ================================================================ */

function StatCard({ value, label, icon: Icon, color }: { value: string; label: string; icon: any; color: string }) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, amount: 0.5 });
    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center text-center p-6 bg-white rounded-2xl shadow-sm border border-[#1A6CC8]/10 hover:-translate-y-1 transition-transform"
        >
            <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: color + "20" }}>
                <Icon className="w-7 h-7" style={{ color }} />
            </div>
            <p className="text-4xl font-bold text-[#0D2D5A] font-mono">{value}</p>
            <p className="text-sm text-muted-foreground mt-1 font-medium">{label}</p>
        </motion.div>
    );
}

function FaqItem({ q, a, index }: { q: string; a: string; index: number }) {
    const [open, setOpen] = useState(false);
    return (
        <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: index * 0.08 }}
            className="border border-[#1A6CC8]/15 rounded-2xl overflow-hidden"
        >
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between gap-4 p-5 text-left bg-white hover:bg-[#F7F9FD] transition-colors"
            >
                <span className="font-semibold text-[#0D2D5A]">{q}</span>
                <ChevronDown
                    className={`w-5 h-5 text-[#1A6CC8] flex-shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
                />
            </button>
            {open && (
                <div className="px-5 pb-5 bg-white text-muted-foreground text-sm leading-relaxed border-t border-[#1A6CC8]/10">
                    <p className="pt-4">{a}</p>
                </div>
            )}
        </motion.div>
    );
}

/* ================================================================
   PAGE PRINCIPALE
   ================================================================ */

export default function Recrutement() {
    const formRef = useRef<HTMLDivElement>(null);

    const scrollToForm = () => {
        formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    return (
        <div className="bg-[#F7F9FD] min-h-screen overflow-x-hidden">

            {/* ── HERO ────────────────────────────────────────────────────── */}
            <section className="relative bg-brand-hero-gradient text-white overflow-hidden min-h-[92vh] flex items-center">
                {/* Motif kente africain */}
                <div
                    className="absolute inset-0 opacity-5 pointer-events-none"
                    style={{
                        backgroundImage: `repeating-linear-gradient(
              45deg,
              #F5A623 0px, #F5A623 4px,
              transparent 4px, transparent 40px
            ), repeating-linear-gradient(
              -45deg,
              #1A6CC8 0px, #1A6CC8 4px,
              transparent 4px, transparent 40px
            )`,
                    }}
                />

                {/* Cercles décoratifs */}
                <div className="absolute top-20 right-0 w-[600px] h-[600px] rounded-full bg-[#1A6CC8]/20 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-20 left-0 w-[400px] h-[400px] rounded-full bg-[#F5A623]/10 blur-3xl pointer-events-none" />

                <div className="container mx-auto px-4 py-24 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">

                        {/* Colonne texte */}
                        <div>
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6 }}
                            >
                                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F5A623]/20 border border-[#F5A623]/40 text-[#F5A623] text-sm font-bold mb-6">
                                    <Megaphone className="w-4 h-4" />
                                    Espace Recrutement — Care4Success
                                </span>
                                <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
                                    Transmettez votre{" "}
                                    <span className="relative inline-block text-[#F5A623]">
                                        savoir
                                        <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 8" fill="none">
                                            <path d="M2 6C50 2 150 2 198 6" stroke="#F5A623" strokeWidth="3" strokeLinecap="round" />
                                        </svg>
                                    </span>
                                    ,{" "}
                                    <br />
                                    façonnez l'Afrique de demain
                                </h1>
                                <p className="text-lg md:text-xl text-blue-100 leading-relaxed mb-8 max-w-lg">
                                    Rejoignez le réseau d'enseignants N°1 en Afrique francophone. Flexibilité, rémunération attractive et
                                    impact éducatif réel — le tout depuis votre téléphone.
                                </p>

                                <div className="flex flex-wrap gap-4">
                                    <button
                                        onClick={scrollToForm}
                                        id="hero-cta-postuler"
                                        className="inline-flex items-center gap-2 bg-[#F5A623] hover:bg-[#D4891A] text-[#0D2D5A] font-bold px-8 py-4 rounded-full text-base transition-all hover:scale-105 shadow-lg"
                                    >
                                        <GraduationCap className="w-5 h-5" />
                                        Postuler maintenant
                                    </button>
                                    <a
                                        href="tel:+22100000000"
                                        id="hero-cta-phone"
                                        className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-semibold px-8 py-4 rounded-full text-base transition-all"
                                    >
                                        <Phone className="w-5 h-5" />
                                        Nous appeler
                                    </a>
                                </div>

                                {/* Social proof micro */}
                                <div className="flex items-center gap-3 mt-8">
                                    <div className="flex -space-x-2">
                                        {["AD", "KM", "FN", "SO"].map((initials, i) => (
                                            <div
                                                key={i}
                                                className="w-9 h-9 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-white"
                                                style={{ background: i % 2 === 0 ? "#1A6CC8" : "#F5A623", color: i % 2 === 0 ? "white" : "#0D2D5A" }}
                                            >
                                                {initials}
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-sm text-blue-100">
                                        <span className="text-white font-bold">3 000+ enseignants</span> nous font déjà confiance
                                    </p>
                                </div>
                            </motion.div>
                        </div>

                        {/* Colonne visuel: carte flottante */}
                        <motion.div
                            initial={{ opacity: 0, x: 40 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.7, delay: 0.2 }}
                            className="hidden lg:flex items-center justify-center relative"
                        >
                            <div className="relative w-full max-w-sm">
                                {/* Carte principale */}
                                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                                    <div className="bg-gradient-to-br from-[#0D2D5A] to-[#1A6CC8] p-8 text-white text-center">
                                        <div className="w-20 h-20 rounded-full bg-[#F5A623] flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-[#0D2D5A]">
                                            C4S
                                        </div>
                                        <h3 className="text-2xl font-bold">Carta Enseignant</h3>
                                        <p className="text-blue-200 text-sm mt-1">Care4Success Pro</p>
                                    </div>
                                    <div className="p-6 space-y-4">
                                        {[
                                            { icon: CheckCircle2, text: "Profil vérifié & certifié", color: "#1A6CC8" },
                                            { icon: Wallet, text: "Paiements via Mobile Money", color: "#F5A623" },
                                            { icon: Star, text: "Accès formation continue", color: "#0D2D5A" },
                                            { icon: MessageSquareText, text: "Support 7j/7 en français", color: "#1A6CC8" },
                                        ].map(({ icon: Icon, text, color }) => (
                                            <div key={text} className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: color + "15" }}>
                                                    <Icon className="w-4 h-4" style={{ color }} />
                                                </div>
                                                <span className="text-sm text-[#0D2D5A] font-medium">{text}</span>
                                            </div>
                                        ))}
                                        <button
                                            onClick={scrollToForm}
                                            className="w-full mt-2 bg-[#F5A623] hover:bg-[#D4891A] text-[#0D2D5A] font-bold py-3 rounded-xl transition-colors text-sm"
                                        >
                                            Obtenir ma carte →
                                        </button>
                                    </div>
                                </div>

                                {/* Badge flottant */}
                                <motion.div
                                    animate={{ y: [0, -8, 0] }}
                                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                    className="absolute -top-6 -right-6 bg-[#F5A623] text-[#0D2D5A] rounded-2xl px-4 py-2 shadow-lg text-sm font-bold"
                                >
                                    🌍 15 pays
                                </motion.div>
                                <motion.div
                                    animate={{ y: [0, 8, 0] }}
                                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                                    className="absolute -bottom-4 -left-6 bg-white text-[#0D2D5A] rounded-2xl px-4 py-2 shadow-lg text-sm font-bold border border-[#1A6CC8]/20"
                                >
                                    ⭐ 4,9 / 5
                                </motion.div>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Vague de transition */}
                <div className="absolute bottom-0 left-0 right-0">
                    <svg viewBox="0 0 1440 60" className="w-full" preserveAspectRatio="none">
                        <path d="M0,40 C360,0 1080,60 1440,20 L1440,60 L0,60 Z" fill="#F7F9FD" />
                    </svg>
                </div>
            </section>

            {/* ── CHIFFRES CLÉS ───────────────────────────────────────────── */}
            <section className="py-20">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="text-center mb-12"
                    >
                        <span className="inline-block px-4 py-1 rounded-full bg-[#1A6CC8]/10 text-[#1A6CC8] text-sm font-bold mb-3">
                            Care4Success en chiffres
                        </span>
                        <h2 className="text-4xl font-bold text-[#0D2D5A]">Un réseau africain de confiance</h2>
                    </motion.div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {keyFigures.map((f) => (
                            <StatCard key={f.label} {...f} />
                        ))}
                    </div>
                </div>
            </section>

            {/* ── PROFILS RECHERCHÉS ──────────────────────────────────────── */}
            <section className="py-20 bg-white">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="text-center mb-14"
                    >
                        <span className="inline-block px-4 py-1 rounded-full bg-[#F5A623]/15 text-[#D4891A] text-sm font-bold mb-3">
                            Nos opportunités
                        </span>
                        <h2 className="text-4xl font-bold text-[#0D2D5A] mb-4">Nous recherchons des talents comme vous</h2>
                        <p className="text-muted-foreground max-w-xl mx-auto">
                            Quelle que soit votre spécialité, il y a une place pour vous dans la communauté Care4Success.
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {profiles.map((p, i) => (
                            <motion.div
                                key={p.title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.4, delay: i * 0.1 }}
                                className={`relative p-6 rounded-2xl border-2 transition-all hover:-translate-y-2 cursor-default ${p.highlighted
                                        ? "border-[#F5A623] bg-gradient-to-br from-[#0D2D5A] to-[#1A6CC8] text-white shadow-xl"
                                        : "border-[#1A6CC8]/15 bg-[#F7F9FD] hover:border-[#1A6CC8]/40"
                                    }`}
                            >
                                {p.badge && (
                                    <span
                                        className={`absolute -top-3 left-4 px-3 py-1 rounded-full text-xs font-bold ${p.highlighted ? "bg-[#F5A623] text-[#0D2D5A]" : "bg-[#1A6CC8] text-white"
                                            }`}
                                    >
                                        {p.badge}
                                    </span>
                                )}
                                <div
                                    className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${p.highlighted ? "bg-white/20" : "bg-[#1A6CC8]/10"
                                        }`}
                                >
                                    <p.icon className={`w-6 h-6 ${p.highlighted ? "text-[#F5A623]" : "text-[#1A6CC8]"}`} />
                                </div>
                                <h3 className={`text-lg font-bold mb-2 ${p.highlighted ? "text-white" : "text-[#0D2D5A]"}`}>
                                    {p.title}
                                </h3>
                                <p className={`text-sm leading-relaxed ${p.highlighted ? "text-blue-100" : "text-muted-foreground"}`}>
                                    {p.desc}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── POURQUOI REJOINDRE ──────────────────────────────────────── */}
            <section className="py-20 bg-[#F7F9FD]">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="text-center mb-14"
                    >
                        <span className="inline-block px-4 py-1 rounded-full bg-[#1A6CC8]/10 text-[#1A6CC8] text-sm font-bold mb-3">
                            Pourquoi nous choisir
                        </span>
                        <h2 className="text-4xl font-bold text-[#0D2D5A] mb-4">Des avantages pensés pour l'Afrique</h2>
                        <p className="text-muted-foreground max-w-xl mx-auto">
                            Nous avons conçu chaque aspect de notre programme en tenant compte des réalités et des besoins
                            du terrain africain.
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {whyJoin.map((item, i) => (
                            <motion.div
                                key={item.title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.4, delay: i * 0.08 }}
                                className="group bg-white rounded-2xl p-6 border border-[#1A6CC8]/10 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#F5A623]/20 to-[#F5A623]/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                        <item.icon className="w-6 h-6 text-[#F5A623]" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-[#0D2D5A] mb-2">{item.title}</h3>
                                        <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── PROCESSUS ────────────────────────────────────────────────── */}
            <section className="py-20 bg-[#0D2D5A] text-white relative overflow-hidden">
                {/* Motif décoratif */}
                <div className="absolute inset-0 opacity-5" style={{
                    backgroundImage: "radial-gradient(circle at 20% 50%, #F5A623 1px, transparent 1px), radial-gradient(circle at 80% 50%, #1A6CC8 1px, transparent 1px)",
                    backgroundSize: "60px 60px",
                }} />

                <div className="container mx-auto px-4 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="text-center mb-16"
                    >
                        <span className="inline-block px-4 py-1 rounded-full bg-[#F5A623]/20 text-[#F5A623] text-sm font-bold mb-3">
                            Processus de recrutement
                        </span>
                        <h2 className="text-4xl font-bold mb-4">En 4 étapes simples pour rejoindre Care4Success</h2>
                        <p className="text-blue-200 max-w-xl mx-auto">
                            Notre processus est conçu pour être rapide, juste et valorisant. Nous respectons votre temps.
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
                        {/* Ligne connectrice (desktop) */}
                        <div className="absolute top-10 left-1/8 right-1/8 h-0.5 bg-[#F5A623]/20 hidden lg:block" />

                        {steps.map((step, i) => (
                            <motion.div
                                key={step.number}
                                initial={{ opacity: 0, y: 24 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: i * 0.15 }}
                                className="relative bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors"
                            >
                                <div
                                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 text-2xl font-bold font-mono"
                                    style={{ background: step.color + "30", color: step.color }}
                                >
                                    {step.number}
                                </div>
                                <span
                                    className="inline-block px-3 py-1 rounded-full text-xs font-bold mb-3"
                                    style={{ background: step.color + "25", color: step.color }}
                                >
                                    ⏱ {step.duration}
                                </span>
                                <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                                <p className="text-sm text-blue-200 leading-relaxed">{step.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── TÉMOIGNAGES ─────────────────────────────────────────────── */}
            <section className="py-20 bg-white">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="text-center mb-14"
                    >
                        <span className="inline-block px-4 py-1 rounded-full bg-[#F5A623]/15 text-[#D4891A] text-sm font-bold mb-3">
                            Témoignages
                        </span>
                        <h2 className="text-4xl font-bold text-[#0D2D5A] mb-4">Ils ont osé, ils ne regrettent pas</h2>
                        <p className="text-muted-foreground max-w-xl mx-auto">
                            Des enseignants de toute l'Afrique partagent leur expérience Care4Success.
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {testimonials.map((t, i) => (
                            <motion.div
                                key={t.name}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.45, delay: i * 0.12 }}
                                className="bg-[#F7F9FD] rounded-2xl p-6 border border-[#1A6CC8]/10 hover:border-[#1A6CC8]/30 transition-colors"
                            >
                                {/* Étoiles */}
                                <div className="flex gap-1 mb-4">
                                    {Array.from({ length: t.rating }).map((_, j) => (
                                        <Star key={j} className="w-4 h-4 fill-[#F5A623] text-[#F5A623]" />
                                    ))}
                                </div>

                                <p className="text-[#0D2D5A] text-sm leading-relaxed mb-5 italic">"{t.text}"</p>

                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                                        style={{ background: t.color }}
                                    >
                                        {t.avatar}
                                    </div>
                                    <div>
                                        <p className="font-bold text-[#0D2D5A] text-sm">{t.name}</p>
                                        <p className="text-xs text-muted-foreground">{t.role}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── BANNIÈRE IMPACT ──────────────────────────────────────────── */}
            <section className="py-16 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-[#F5A623] to-[#D4891A]" />
                <div className="absolute inset-0 opacity-10" style={{
                    backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
                }} />
                <div className="container mx-auto px-4 relative z-10 text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        <h2 className="text-4xl md:text-5xl font-bold text-[#0D2D5A] mb-4">
                            🌍 Ensemble,{" "}
                            <span className="relative">
                                construisons
                                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 8" fill="none">
                                    <path d="M2 6C75 2 225 2 298 6" stroke="#0D2D5A" strokeWidth="3" strokeLinecap="round" opacity="0.4" />
                                </svg>
                            </span>{" "}
                            l'Afrique savante
                        </h2>
                        <p className="text-[#0D2D5A]/80 text-lg max-w-xl mx-auto mb-8">
                            Chaque leçon donnée est une graine plantée. Rejoignez-nous et faites partie de la plus grande
                            révolution éducative d'Afrique.
                        </p>
                        <button
                            onClick={scrollToForm}
                            id="mid-cta-postuler"
                            className="inline-flex items-center gap-2 bg-[#0D2D5A] hover:bg-[#163F78] text-white font-bold px-10 py-4 rounded-full text-base transition-all hover:scale-105 shadow-lg"
                        >
                            <BookOpen className="w-5 h-5" />
                            Je postule maintenant
                        </button>
                    </motion.div>
                </div>
            </section>

            {/* ── FAQ ────────────────────────────────────────────────────── */}
            <section className="py-20 bg-[#F7F9FD]">
                <div className="container mx-auto px-4 max-w-3xl">
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="text-center mb-12"
                    >
                        <span className="inline-block px-4 py-1 rounded-full bg-[#1A6CC8]/10 text-[#1A6CC8] text-sm font-bold mb-3">
                            FAQ
                        </span>
                        <h2 className="text-4xl font-bold text-[#0D2D5A] mb-4">Vos questions, nos réponses</h2>
                        <p className="text-muted-foreground">
                            Vous avez d'autres questions ? Contactez-nous directement sur WhatsApp.
                        </p>
                    </motion.div>
                    <div className="space-y-3">
                        {faqs.map((faq, i) => (
                            <FaqItem key={i} q={faq.q} a={faq.a} index={i} />
                        ))}
                    </div>
                </div>
            </section>

            {/* ── FORMULAIRE DE CANDIDATURE ───────────────────────────────── */}
            <section ref={formRef} id="formulaire-candidature" className="py-24 bg-white scroll-mt-20">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto text-center mb-12">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                        >
                            <span className="inline-block px-4 py-1 rounded-full bg-[#F5A623]/15 text-[#D4891A] text-sm font-bold mb-4">
                                🎓 Candidature en ligne
                            </span>
                            <h2 className="text-4xl font-bold text-[#0D2D5A] mb-4">
                                Prêt(e) à rejoindre la famille Care4Success ?
                            </h2>
                            <p className="text-muted-foreground text-lg max-w-lg mx-auto">
                                Remplissez le formulaire ci-dessous. Notre équipe vous recontacte sous{" "}
                                <strong className="text-[#1A6CC8]">48 heures ouvrées</strong>.
                            </p>
                            {/* Badges de confiance */}
                            <div className="flex flex-wrap justify-center gap-3 mt-6">
                                {[
                                    { icon: Shield, text: "Données sécurisées" },
                                    { icon: CheckCircle2, text: "Réponse garantie 48h" },
                                    { icon: Phone, text: "Support WhatsApp" },
                                ].map(({ icon: Icon, text }) => (
                                    <span key={text} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F7F9FD] border border-[#1A6CC8]/15 text-sm font-medium text-[#0D2D5A]">
                                        <Icon className="w-4 h-4 text-[#1A6CC8]" />
                                        {text}
                                    </span>
                                ))}
                            </div>
                        </motion.div>
                    </div>

                    <TeacherApplicationForm className="bg-[#F7F9FD] max-w-4xl mx-auto rounded-3xl" />
                </div>
            </section>

            {/* ── CTA WHATSAPP FLOTTANT ──────────────────────────────────── */}
            <a
                href="https://wa.me/22100000000?text=Bonjour%2C%20je%20souhaite%20en%20savoir%20plus%20sur%20le%20recrutement%20Care4Success"
                target="_blank"
                rel="noopener noreferrer"
                id="whatsapp-cta"
                className="fixed bottom-6 right-6 bg-[#25D366] hover:bg-[#20B558] text-white px-5 py-3 rounded-full shadow-xl flex items-center gap-3 font-bold text-sm z-50 hover:scale-105 transition-all"
            >
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Discuter sur WhatsApp
            </a>
        </div>
    );
}
