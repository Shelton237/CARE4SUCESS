import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import {
    Calendar, Clock, Users, Loader2, CheckCircle2, ArrowRight, ArrowLeft, BookOpen, Lock,
} from "lucide-react";
import {
    fetchPublicGroupClass,
    initiateGroupClassRegistration,
    authorizeGroupClassRegistration,
    checkGroupClassRegistrationStatus,
    type MobileMoneyNetwork,
} from "@/api/public";
import { formatMoney } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type RegistrationStep = "form" | "otp" | "waiting" | "redirect" | "success";

export default function GroupClassCheckout() {
    const { id } = useParams<{ id: string }>();

    const { data: groupClass, isLoading, isError } = useQuery({
        queryKey: ["public-group-class", id],
        queryFn: () => fetchPublicGroupClass(id!),
        enabled: Boolean(id),
        refetchInterval: 15000, // les places restantes peuvent changer pendant que la page reste ouverte
    });

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#1A6CC8]" />
            </div>
        );
    }

    if (isError || !groupClass) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-6">
                <p className="text-xl font-bold text-[#0D2D5A]">Cours groupé introuvable</p>
                <NavLink to="/" className="text-[#1A6CC8] font-semibold hover:underline">← Retour à l'accueil</NavLink>
            </div>
        );
    }

    const isFull = groupClass.spotsLeft <= 0;
    const isCancelled = groupClass.status === "cancelled";
    const isClosed = isFull || isCancelled;

    return (
        <div className="min-h-screen bg-gray-50" style={{ fontFamily: "Ubuntu, 'Noto Sans', sans-serif" }}>
            <section className="bg-[#0D2D5A] py-16">
                <div className="container mx-auto px-6 max-w-3xl">
                    <div className="flex items-center gap-2 text-blue-200 text-xs font-black uppercase tracking-widest mb-4">
                        <BookOpen className="w-4 h-4" /> {groupClass.subject}
                    </div>
                    <h1 className="text-2xl md:text-4xl font-black text-white">{groupClass.title}</h1>
                    <p className="text-blue-200 mt-2">Avec {groupClass.teacherName}</p>
                </div>
            </section>

            <section className="py-12">
                <div className="container mx-auto px-6 max-w-3xl grid md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-6">
                        <div className="bg-white rounded-2xl border border-gray-100 p-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Date</p>
                                <p className="text-sm font-bold text-[#0D2D5A] mt-1">{new Date(`${groupClass.sessionDate}T00:00:00`).toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long" })}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Heure</p>
                                <p className="text-sm font-bold text-[#0D2D5A] mt-1">{groupClass.sessionTime}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1"><Users className="w-3.5 h-3.5" /> Places</p>
                                <p className="text-sm font-bold text-[#0D2D5A] mt-1">
                                    {isFull ? "Complet" : `${groupClass.spotsLeft} / ${groupClass.maxParticipants} restante${groupClass.spotsLeft > 1 ? "s" : ""}`}
                                </p>
                            </div>
                        </div>

                        {groupClass.description && (
                            <div className="bg-white rounded-2xl border border-gray-100 p-6">
                                <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">Programme</h2>
                                <p className="text-sm text-gray-600 whitespace-pre-line">{groupClass.description}</p>
                            </div>
                        )}
                    </div>

                    <div className="md:col-span-1">
                        {isClosed ? (
                            <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center space-y-2">
                                <Lock className="w-8 h-8 text-gray-300 mx-auto" />
                                <p className="font-bold text-[#0D2D5A]">{isCancelled ? "Cours annulé" : "Cours complet"}</p>
                                <p className="text-sm text-gray-400">
                                    {isCancelled ? "Ce cours groupé a été annulé par l'enseignant." : "Toutes les places ont été réservées."}
                                </p>
                            </div>
                        ) : (
                            <RegistrationPanel groupClassId={groupClass.id} price={groupClass.price} currency={groupClass.currency} />
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}

function RegistrationPanel({ groupClassId, price, currency }: { groupClassId: string; price: number; currency: string }) {
    const [step, setStep] = useState<RegistrationStep>("form");
    const [parentName, setParentName] = useState("");
    const [parentEmail, setParentEmail] = useState("");
    const [parentPhone, setParentPhone] = useState("");
    const [studentName, setStudentName] = useState("");
    const [network, setNetwork] = useState<MobileMoneyNetwork>("MTN");
    const [momoPhone, setMomoPhone] = useState("");
    const [charge, setCharge] = useState<{ chargeId: string; reference: string } | null>(null);
    const [otpType, setOtpType] = useState<"otp" | "pin">("otp");
    const [code, setCode] = useState("");
    const [testRedirectUrl, setTestRedirectUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const pollAttempts = useRef(0);
    const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

    const startPolling = (reference: string) => {
        pollAttempts.current = 0;
        pollTimer.current = setInterval(async () => {
            pollAttempts.current += 1;
            try {
                const result = await checkGroupClassRegistrationStatus(reference);
                if (result.success) {
                    if (pollTimer.current) clearInterval(pollTimer.current);
                    setStep("success");
                    return;
                }
            } catch {
                // erreur transitoire — on continue de sonder
            }
            if (pollAttempts.current >= 20) {
                if (pollTimer.current) clearInterval(pollTimer.current);
                setError("Paiement non confirmé après plusieurs minutes. Vérifiez votre téléphone ou réessayez.");
                setStep("form");
            }
        }, 4000);
    };

    const handleSubmit = async () => {
        setError(null);
        if (!parentName || !parentEmail || !studentName || !momoPhone) {
            setError("Merci de renseigner tous les champs obligatoires.");
            return;
        }
        setSubmitting(true);
        try {
            const data = await initiateGroupClassRegistration(groupClassId, {
                network,
                phoneNumber: momoPhone,
                parentName,
                parentEmail,
                parentPhone,
                studentName,
            });
            setCharge({ chargeId: data.chargeId, reference: data.reference });
            const nextAction = data.nextAction;
            if (nextAction?.type === "requires_otp") {
                setOtpType("otp");
                setStep("otp");
            } else if (nextAction?.type === "requires_pin") {
                setOtpType("pin");
                setStep("otp");
            } else if (nextAction?.type === "redirect_url" && nextAction.redirect_url?.url) {
                setTestRedirectUrl(nextAction.redirect_url.url);
                setStep("redirect");
                startPolling(data.reference);
            } else {
                setStep("waiting");
                startPolling(data.reference);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Impossible d'initier l'inscription.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleAuthorize = async () => {
        if (!charge) return;
        setError(null);
        setSubmitting(true);
        try {
            const data = await authorizeGroupClassRegistration(charge.chargeId, otpType, code);
            if (data.nextAction?.type === "requires_otp" || data.nextAction?.type === "requires_pin") {
                setError("Code invalide, réessayez.");
                setCode("");
            } else {
                setStep("waiting");
                startPolling(charge.reference);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Autorisation refusée.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-6 space-y-4">
            <div className="pb-4 border-b border-gray-100 text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Tarif</p>
                <p className="text-2xl font-black text-[#0D2D5A] mt-1">{formatMoney(price, currency)}</p>
                <p className="text-xs text-gray-400">par participant</p>
            </div>

            {step === "form" && (
                <div className="space-y-3">
                    <div className="space-y-1">
                        <Label className="text-xs">Votre nom</Label>
                        <Input value={parentName} onChange={e => setParentName(e.target.value)} placeholder="Jean Dupont" />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs">Votre email</Label>
                        <Input type="email" value={parentEmail} onChange={e => setParentEmail(e.target.value)} placeholder="vous@email.com" />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs">Votre téléphone</Label>
                        <Input value={parentPhone} onChange={e => setParentPhone(e.target.value)} placeholder="+237 6XX XXX XXX" />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs">Nom du participant</Label>
                        <Input value={studentName} onChange={e => setStudentName(e.target.value)} placeholder="Nom de l'enfant (ou le vôtre)" />
                    </div>

                    <div className="pt-2 border-t border-gray-100 space-y-3">
                        <div className="space-y-1">
                            <Label className="text-xs">Opérateur Mobile Money</Label>
                            <Select value={network} onValueChange={v => setNetwork(v as MobileMoneyNetwork)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="MTN">MTN Mobile Money</SelectItem>
                                    <SelectItem value="ORANGE">Orange Money</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Numéro Mobile Money</Label>
                            <Input value={momoPhone} onChange={e => setMomoPhone(e.target.value)} placeholder="6XX XXX XXX" />
                        </div>
                    </div>

                    {error && <p className="text-xs text-red-500">{error}</p>}

                    <Button className="w-full" disabled={submitting} onClick={handleSubmit}>
                        {submitting ? "Initialisation..." : "Réserver ma place"} <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                </div>
            )}

            {step === "otp" && (
                <div className="space-y-3">
                    <p className="text-xs text-gray-500">
                        {otpType === "pin" ? "Entrez votre code PIN Mobile Money." : "Entrez le code reçu par SMS."}
                    </p>
                    <Input value={code} onChange={e => setCode(e.target.value)} placeholder="Code" />
                    {error && <p className="text-xs text-red-500">{error}</p>}
                    <Button className="w-full" disabled={!code.trim() || submitting} onClick={handleAuthorize}>
                        {submitting ? "Vérification..." : "Valider"}
                    </Button>
                </div>
            )}

            {step === "redirect" && testRedirectUrl && (
                <div className="flex flex-col items-center gap-3 py-4 text-center">
                    <p className="text-xs text-gray-500">Environnement de test — validez le paiement sur la page Flutterwave.</p>
                    <Button className="w-full" onClick={() => window.open(testRedirectUrl, "_blank", "noopener,noreferrer")}>
                        Ouvrir la page de test Flutterwave
                    </Button>
                    <div className="flex items-center gap-2 text-xs text-slate-400"><Loader2 className="w-3.5 h-3.5 animate-spin" /> En attente de confirmation...</div>
                    {error && <p className="text-xs text-red-500">{error}</p>}
                </div>
            )}

            {step === "waiting" && (
                <div className="flex flex-col items-center gap-3 py-6 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-[#1A6CC8]" />
                    <p className="text-sm text-gray-600">Validez la transaction sur votre téléphone ({network === "MTN" ? "MTN Mobile Money" : "Orange Money"})...</p>
                    {error && <p className="text-xs text-red-500">{error}</p>}
                </div>
            )}

            {step === "success" && (
                <div className="flex flex-col items-center gap-3 py-6 text-center">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                    <p className="font-bold text-[#0D2D5A]">Inscription confirmée !</p>
                    <p className="text-sm text-gray-500">
                        Un email de confirmation avec le lien de la classe virtuelle vient d'être envoyé à <b>{parentEmail}</b>.
                    </p>
                </div>
            )}

            <NavLink to="/" className="flex items-center justify-center gap-1.5 text-[10px] text-gray-400 hover:text-gray-600 pt-2">
                <ArrowLeft className="w-3 h-3" /> Retour à l'accueil
            </NavLink>
        </motion.div>
    );
}
