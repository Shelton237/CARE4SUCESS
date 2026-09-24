import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, Eye, EyeOff, Loader2, Mail } from "lucide-react";
import { forgotPassword, updateUserPassword } from "@/api/backoffice";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Props {
    userId: string;
    email?: string;
}

const LABEL = "text-xs font-semibold text-gray-500 uppercase tracking-widest";

/**
 * Formulaire de changement de mot de passe, commun à tous les rôles
 * (parent, élève, conseiller, admin, enseignant, tuteur).
 * Si l'utilisateur ne connaît plus son mot de passe actuel (oubli, compte créé via
 * Google), il peut recevoir un lien de réinitialisation par email.
 */
export function ChangePasswordForm({ userId, email }: Props) {
    const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
    const [showPwd, setShowPwd] = useState(false);
    const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const change = useMutation({
        mutationFn: () =>
            updateUserPassword(userId, { currentPassword: form.currentPassword, newPassword: form.newPassword }),
        onSuccess: () => {
            setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
            setFeedback({ type: "success", text: "Mot de passe mis à jour. Utilisez-le à votre prochaine connexion." });
        },
        onError: (error: Error) => setFeedback({ type: "error", text: error.message }),
    });

    const sendLink = useMutation({
        mutationFn: () => forgotPassword(email!),
        onSuccess: (res) => setFeedback({ type: "success", text: res.message }),
        onError: (error: Error) => setFeedback({ type: "error", text: error.message }),
    });

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        setFeedback(null);
        if (form.newPassword.length < 8) {
            setFeedback({ type: "error", text: "Le nouveau mot de passe doit contenir au moins 8 caractères." });
            return;
        }
        if (form.newPassword !== form.confirmPassword) {
            setFeedback({ type: "error", text: "La confirmation ne correspond pas au nouveau mot de passe." });
            return;
        }
        if (form.newPassword === form.currentPassword) {
            setFeedback({ type: "error", text: "Le nouveau mot de passe doit être différent de l'actuel." });
            return;
        }
        change.mutate();
    };

    const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setFeedback(null);
        setForm((state) => ({ ...state, [key]: e.target.value }));
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className={LABEL} htmlFor="cpf-current">Mot de passe actuel</label>
                <div className="relative">
                    <Input
                        id="cpf-current"
                        type={showPwd ? "text" : "password"}
                        value={form.currentPassword}
                        onChange={set("currentPassword")}
                        required
                        autoComplete="current-password"
                        className="pe-10"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPwd((v) => !v)}
                        aria-label={showPwd ? "Masquer les mots de passe" : "Afficher les mots de passe"}
                        className="absolute inset-y-0 end-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
                    >
                        {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                </div>
            </div>
            <div>
                <label className={LABEL} htmlFor="cpf-new">Nouveau mot de passe</label>
                <Input
                    id="cpf-new"
                    type={showPwd ? "text" : "password"}
                    value={form.newPassword}
                    onChange={set("newPassword")}
                    required
                    minLength={8}
                    autoComplete="new-password"
                />
                <p className="mt-1 text-xs text-gray-400">8 caractères minimum.</p>
            </div>
            <div>
                <label className={LABEL} htmlFor="cpf-confirm">Confirmation</label>
                <Input
                    id="cpf-confirm"
                    type={showPwd ? "text" : "password"}
                    value={form.confirmPassword}
                    onChange={set("confirmPassword")}
                    required
                    minLength={8}
                    autoComplete="new-password"
                />
            </div>

            {feedback && (
                <p
                    role={feedback.type === "error" ? "alert" : "status"}
                    className={`flex items-start gap-2 rounded-lg px-3 py-2 text-sm ${
                        feedback.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
                    }`}
                >
                    {feedback.type === "success" && <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />}
                    <span>{feedback.text}</span>
                </p>
            )}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                {email ? (
                    <button
                        type="button"
                        onClick={() => { setFeedback(null); sendLink.mutate(); }}
                        disabled={sendLink.isPending}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-[#1A6CC8] hover:underline disabled:opacity-60 text-start"
                    >
                        {sendLink.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                        Mot de passe oublié ? Recevoir un lien par email
                    </button>
                ) : <span />}
                <Button
                    type="submit"
                    variant="outline"
                    className="text-[#22c55e] border-[#22c55e] hover:bg-[#22c55e]/10 min-w-[160px]"
                    disabled={change.isPending}
                >
                    {change.isPending ? (
                        <span className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Mise à jour...
                        </span>
                    ) : (
                        "Mettre à jour"
                    )}
                </Button>
            </div>
        </form>
    );
}

export default ChangePasswordForm;
