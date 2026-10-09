import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth, ROLE_REDIRECTS } from "@/contexts/AuthContext";
import { GraduationCap, Mail, Lock, Eye, EyeOff, AlertCircle, Users, TrendingUp, Briefcase } from "lucide-react";
import { forgotPassword } from "@/api/backoffice";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { toast } from "sonner";
import { HandUnderline } from "@/components/decor";

const SERIF = { fontFamily: "'Playfair Display', serif" };
const HANDWRITING = { fontFamily: "Caveat, cursive" };

const STATS = [
    { v: "500+", l: "Enseignants actifs", icon: Users },
    { v: "312", l: "Élèves suivis", icon: GraduationCap },
    { v: "4.4/5", l: "Satisfaction", icon: TrendingUp },
    { v: "15", l: "Centres Cameroun", icon: Briefcase },
];

export default function Login() {
    const { login, loginWithGoogle } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPwd, setShowPwd] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const redirectAfterLogin = () => {
        const stored = localStorage.getItem("c4s_user");
        if (stored) {
            const user = JSON.parse(stored);
            navigate(ROLE_REDIRECTS[user.role as keyof typeof ROLE_REDIRECTS]);
        }
    };

    const handleGoogleCredential = async (idToken: string) => {
        setError("");
        setLoading(true);
        const result = await loginWithGoogle(idToken);
        setLoading(false);
        if (!result.ok) {
            setError(result.error || "Connexion Google impossible.");
            return;
        }
        redirectAfterLogin();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        await new Promise((r) => setTimeout(r, 600));
        const result = await login(email, password);
        setLoading(false);
        if (!result.ok) {
            setError(result.error || "Email ou mot de passe incorrect.");
            return;
        }
        // Le rôle est déterminé automatiquement à partir des identifiants via AuthContext
        // result.user contient le rôle → on redirige vers l'espace correspondant
        redirectAfterLogin();
    };

    const handleForgotPassword = async () => {
        if (!email) {
            setError("Saisissez votre adresse email ci-dessus, puis cliquez de nouveau sur « Mot de passe oublié ? » pour recevoir un lien de réinitialisation.");
            return;
        }

        setLoading(true);
        try {
            const res = await forgotPassword(email);
            toast.success(res.message);
            setError("");
        } catch (err: any) {
            setError(err.message || "Impossible de traiter la demande.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex" style={{ fontFamily: "Nunito, 'Noto Sans', sans-serif" }}>
            {/* ══════════ Left — Branding (reprend le motif hero du site) ══════════ */}
            <div className="hidden lg:flex lg:w-[56%] flex-col justify-between p-10 xl:p-12 bg-[#07284B] relative overflow-hidden">
                {/* Photo en fond, à droite, avec dégradé navy pour la lisibilité du texte */}
                <div className="absolute inset-y-0 end-0 w-[72%]">
                    <img
                        src="/images/soutien/hero-soutien.jpg"
                        alt=""
                        className="w-full h-full object-cover object-[65%_30%]"
                    />
                    <div
                        className="absolute inset-0"
                        style={{ background: "linear-gradient(to right, #07284B 0%, rgba(7,40,75,0.75) 30%, rgba(7,40,75,0.25) 60%, transparent 100%)" }}
                        aria-hidden
                    />
                </div>

                {/* Décor : cercle teal en bas à droite */}
                <div className="absolute -bottom-10 end-10 w-40 h-40 rounded-full bg-[#0F9B8E]/25 blur-[2px]" aria-hidden />
                {/* Décor : courbe or en bas */}
                <svg className="absolute bottom-0 inset-x-0 w-full h-16 text-[#F5A623]/80" viewBox="0 0 800 60" preserveAspectRatio="none" aria-hidden>
                    <path d="M0 45 C 150 10, 350 55, 550 30 C 650 18, 730 28, 800 12" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
                </svg>

                {/* Logo + texte manuscrit */}
                <div className="relative z-10 flex items-start justify-between">
                    <img src="/logo/care4success-long-white.png" alt="Care 4 Success" className="h-12 xl:h-14 w-auto object-contain" />
                    <p className="hidden xl:block text-white text-[20px] leading-[1.15] text-end -rotate-2" style={HANDWRITING}>
                        Chaque potentiel<br />mérite d'être accompagné
                        <HandUnderline className="w-[90px] h-2.5 mt-0.5 ms-auto" />
                    </p>
                </div>

                {/* Titre + stats */}
                <div className="relative z-10 space-y-6 max-w-[480px]">
                    <h1 className="text-[2.3rem] xl:text-[2.65rem] font-bold text-white leading-[1.12]" style={SERIF}>
                        Bienvenue sur votre <span className="italic text-gold-shimmer">espace professionnel</span>
                    </h1>
                    <p className="text-blue-100/90 text-base xl:text-lg leading-relaxed">
                        Gérez vos activités, suivez les progressions et collaborez avec toute l'équipe Care4Success en un seul endroit.
                    </p>
                    <div className="grid grid-cols-2 gap-3 xl:gap-4 pt-2">
                        {STATS.map(({ v, l, icon: Icon }) => (
                            <div key={l} className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-3.5 xl:p-4">
                                <div className="w-9 h-9 xl:w-10 xl:h-10 rounded-full bg-[#0F9B8E] flex items-center justify-center shrink-0">
                                    <Icon className="w-4.5 h-4.5 xl:w-5 xl:h-5 text-white" strokeWidth={2} />
                                </div>
                                <div>
                                    <div className="text-lg xl:text-xl font-bold text-[#F5A623] leading-tight">{v}</div>
                                    <div className="text-[11px] xl:text-xs text-blue-100/80">{l}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <p className="relative z-10 text-xs text-blue-200/70">© 2026 Care4Success • Douala, Cameroun</p>
            </div>

            {/* ══════════ Right — Form ══════════ */}
            <div className="w-full lg:w-[44%] flex items-center justify-center p-8 relative overflow-hidden bg-gradient-to-br from-[#EEF5FB] to-[#F8FBFE]">
                {/* Décor : formes en fond */}
                <div className="absolute -top-8 end-10 w-28 h-28 rounded-full bg-[#0F9B8E]/15" aria-hidden />
                <svg className="absolute bottom-0 end-0 w-56 h-40 text-[#F5A623]/25" viewBox="0 0 200 140" aria-hidden>
                    <path d="M200 140 C 140 140, 90 100, 110 60 C 125 30, 170 20, 200 40 Z" fill="currentColor" />
                </svg>
                <BookOutline className="hidden md:block absolute top-16 start-10 w-10 h-10 text-[#1A6CC8]/20 -rotate-12" />
                <CapOutline className="hidden md:block absolute top-10 end-16 w-10 h-10 text-[#1A6CC8]/20 rotate-6" />
                <DotGrid className="hidden md:block absolute bottom-24 start-8 w-20 h-20 text-[#1A6CC8]/15" />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="w-full max-w-md relative z-10"
                >
                    {/* Mobile logo */}
                    <div className="lg:hidden flex justify-center mb-8">
                        <img src="/logo/Care 4 Success-logo-Ok_large.png" alt="Care 4 Success" className="h-14 w-auto object-contain" />
                    </div>

                    <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                        <div className="mb-8">
                            <div className="w-12 h-12 bg-[#0F9B8E]/10 rounded-2xl flex items-center justify-center mb-4">
                                <GraduationCap className="w-6 h-6 text-[#0F9B8E]" />
                            </div>
                            <h2 className="text-2xl font-bold text-[#0D2D5A]">Connexion</h2>
                            <p className="text-gray-500 text-sm mt-1">Accédez à votre espace personnel</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Adresse email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        id="login-email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => { setEmail(e.target.value); setError(""); }}
                                        placeholder="votre@email.cm"
                                        required
                                        autoComplete="email"
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A6CC8] focus:ring-2 focus:ring-[#1A6CC8]/20 outline-none transition-all text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mot de passe</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        id="login-password"
                                        type={showPwd ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => { setPassword(e.target.value); setError(""); }}
                                        placeholder="Votre mot de passe"
                                        required
                                        autoComplete="current-password"
                                        className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 focus:border-[#1A6CC8] focus:ring-2 focus:ring-[#1A6CC8]/20 outline-none transition-all text-sm"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPwd(!showPwd)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                        aria-label={showPwd ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                                    >
                                        {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                <div className="flex justify-end mt-1.5">
                                    <button
                                        type="button"
                                        onClick={handleForgotPassword}
                                        className="text-xs font-medium text-[#1A6CC8] hover:underline"
                                    >
                                        Mot de passe oublié ?
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100"
                                >
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    {error}
                                </motion.div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 rounded-xl font-bold text-[#0D2D5A] text-sm transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                                style={{ background: "linear-gradient(135deg,#F5A623,#E09419)" }}
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                        </svg>
                                        Connexion en cours…
                                    </span>
                                ) : "Se connecter →"}
                            </button>
                        </form>

                        <div className="flex items-center gap-3 my-6">
                            <div className="flex-1 h-px bg-gray-200" />
                            <span className="text-xs font-semibold text-gray-400 uppercase">ou</span>
                            <div className="flex-1 h-px bg-gray-200" />
                        </div>

                        <GoogleSignInButton onCredential={handleGoogleCredential} disabled={loading} text="signin_with" />
                    </div>

                    <p className="text-center text-xs text-gray-400 mt-6">
                        <Link to="/" className="text-[#1A6CC8] font-medium hover:underline">← Retour au site</Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}

/* ─── Décor léger du panneau de droite ───────────────────────────────── */
function BookOutline({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 32 32" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
            <path d="M16 7c-3-2-7-2-13-1v19c6-1 10-1 13 1 3-2 7-2 13-1V6c-6-1-10-1-13 1z" />
            <path d="M16 7v19" />
        </svg>
    );
}
function CapOutline({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 32 32" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden>
            <path d="M16 6 2 13l14 7 14-7-14-7z" />
            <path d="M8 16.5V24c0 1.7 3.6 3 8 3s8-1.3 8-3v-7.5" />
        </svg>
    );
}
function DotGrid({ className }: { className?: string }) {
    const dots = [];
    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
            dots.push(<circle key={`${row}-${col}`} cx={6 + col * 8} cy={6 + row * 8} r="2" fill="currentColor" />);
        }
    }
    return (
        <svg viewBox="0 0 32 32" className={className} aria-hidden>
            {dots}
        </svg>
    );
}
