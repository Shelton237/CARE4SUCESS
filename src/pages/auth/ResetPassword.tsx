import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";
import { resetPasswordWithToken } from "@/api/backoffice";

const INPUT =
    "w-full h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm text-[#0D2D5A] outline-none focus:border-[#1A6CC8] focus:ring-2 focus:ring-[#1A6CC8]/20";

/** Page ouverte depuis le lien reçu par email : l'utilisateur choisit un nouveau mot de passe. */
export default function ResetPassword() {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const token = params.get("token") ?? "";

    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [show, setShow] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [done, setDone] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (password.length < 8) {
            setError("Le mot de passe doit contenir au moins 8 caractères.");
            return;
        }
        if (password !== confirm) {
            setError("La confirmation ne correspond pas au mot de passe.");
            return;
        }
        setLoading(true);
        try {
            await resetPasswordWithToken(token, password);
            setDone(true);
            window.setTimeout(() => navigate("/login", { replace: true }), 2500);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Impossible de modifier le mot de passe.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center bg-[#F7FAFC] px-4 py-10"
            style={{ fontFamily: "Ubuntu, 'Noto Sans', sans-serif" }}
        >
            <div className="w-full max-w-md rounded-3xl bg-white border border-gray-100 shadow-sm p-6 sm:p-8">
                <img src="/logo/Care 4 Success-logo-Ok_compact.png" alt="Care 4 Success" className="h-10 w-auto mb-6" />

                {done ? (
                    <div className="text-center space-y-3 py-4">
                        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                        <h1 className="text-xl font-bold text-[#0D2D5A]">Mot de passe modifié</h1>
                        <p className="text-sm text-gray-500">Redirection vers la page de connexion...</p>
                        <Link to="/login" className="inline-block text-sm font-semibold text-[#1A6CC8] hover:underline">
                            Se connecter maintenant
                        </Link>
                    </div>
                ) : !token ? (
                    <div className="space-y-4">
                        <h1 className="text-xl font-bold text-[#0D2D5A]">Lien invalide</h1>
                        <p className="text-sm text-gray-500">
                            Ce lien de réinitialisation est incomplet. Demandez-en un nouveau depuis la page de connexion
                            (« Mot de passe oublié ? »).
                        </p>
                        <Link to="/login" className="inline-block text-sm font-semibold text-[#1A6CC8] hover:underline">
                            Retour à la connexion
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="flex items-center gap-3">
                            <span className="w-10 h-10 rounded-2xl bg-[#1A6CC8]/10 text-[#1A6CC8] flex items-center justify-center">
                                <KeyRound className="w-5 h-5" />
                            </span>
                            <div>
                                <h1 className="text-xl font-bold text-[#0D2D5A] leading-tight">Nouveau mot de passe</h1>
                                <p className="text-sm text-gray-500">Choisissez-en un que vous n'utilisez nulle part ailleurs.</p>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="rp-new" className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                                Nouveau mot de passe
                            </label>
                            <div className="relative mt-1">
                                <input
                                    id="rp-new"
                                    type={show ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                                    required
                                    minLength={8}
                                    autoComplete="new-password"
                                    className={`${INPUT} pe-11`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShow((v) => !v)}
                                    aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                                    className="absolute inset-y-0 end-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
                                >
                                    {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            <p className="mt-1 text-xs text-gray-400">8 caractères minimum.</p>
                        </div>

                        <div>
                            <label htmlFor="rp-confirm" className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                                Confirmation
                            </label>
                            <input
                                id="rp-confirm"
                                type={show ? "text" : "password"}
                                value={confirm}
                                onChange={(e) => { setConfirm(e.target.value); setError(""); }}
                                required
                                minLength={8}
                                autoComplete="new-password"
                                className={`${INPUT} mt-1`}
                            />
                        </div>

                        {error && (
                            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-11 rounded-xl bg-[#0D2D5A] text-white text-sm font-bold hover:bg-[#1A6CC8] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            Enregistrer le mot de passe
                        </button>
                        <Link to="/login" className="block text-center text-sm text-[#1A6CC8] hover:underline">
                            Retour à la connexion
                        </Link>
                    </form>
                )}
            </div>
        </div>
    );
}
