import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth, ROLE_REDIRECTS } from "@/contexts/AuthContext";
import { GraduationCap, Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPwd, setShowPwd] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

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
        const stored = sessionStorage.getItem("c4s_user");
        if (stored) {
            const user = JSON.parse(stored);
            navigate(ROLE_REDIRECTS[user.role as keyof typeof ROLE_REDIRECTS]);
        }
    };

    return (
        <div className="min-h-screen flex" style={{ fontFamily: "Ubuntu, 'Noto Sans', sans-serif" }}>
            {/* Left — Branding */}
            <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-[#0D2D5A] relative overflow-hidden">
                {/* Blobs décoratifs */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-[#F5A623]/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#1A6CC8]/20 rounded-full blur-2xl" />

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <img src="/logo/Care 4 Success-logo-Ok_compact.png" alt="Care 4 Success" className="h-14 w-auto object-contain brightness-0 invert" />
                    </div>
                </div>

                <div className="relative z-10 space-y-6">
                    <h1 className="text-4xl font-bold text-white leading-tight">
                        Bienvenue sur votre <span className="text-[#F5A623]">espace professionnel</span>
                    </h1>
                    <p className="text-blue-200 text-lg leading-relaxed">
                        Gérez vos activités, suivez les progressions et collaborez avec toute l'équipe Care4Success en un seul endroit.
                    </p>
                    <div className="grid grid-cols-2 gap-4 pt-4">
                        {[
                            { v: "500+", l: "Enseignants actifs" },
                            { v: "312", l: "Élèves suivis" },
                            { v: "4.4/5", l: "Satisfaction" },
                            { v: "15", l: "Centres Cameroun" },
                        ].map(({ v, l }) => (
                            <div key={l} className="bg-white/10 rounded-xl p-4 text-center">
                                <div className="text-2xl font-bold text-[#F5A623]">{v}</div>
                                <div className="text-xs text-blue-200 mt-1">{l}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <p className="relative z-10 text-xs text-blue-300">© 2026 Care4Success • Douala, Cameroun</p>
            </div>

            {/* Right — Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="w-full max-w-md"
                >
                    {/* Mobile logo */}
                    <div className="lg:hidden flex justify-center mb-8">
                        <img src="/logo/Care 4 Success-logo-Ok_large.png" alt="Care 4 Success" className="h-14 w-auto object-contain" />
                    </div>

                    <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                        <div className="mb-8">
                            <div className="w-12 h-12 bg-[#1A6CC8]/10 rounded-2xl flex items-center justify-center mb-4">
                                <GraduationCap className="w-6 h-6 text-[#1A6CC8]" />
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
                                        placeholder="••••••••"
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
                    </div>

                    <p className="text-center text-xs text-gray-400 mt-6">
                        <a href="/#/" className="text-[#1A6CC8] font-medium hover:underline">← Retour au site</a>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
