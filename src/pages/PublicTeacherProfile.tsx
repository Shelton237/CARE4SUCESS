import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import {
    Star, MapPin, Calendar, Clock, ArrowLeft, ArrowRight,
    Loader2, CheckCircle2, GraduationCap, Users,
} from "lucide-react";
import {
    fetchPublicTeacherProfile,
    initiateBooking,
    authorizeBookingCharge,
    checkBookingStatus,
    type TeacherSlot,
    type MobileMoneyNetwork,
} from "@/api/public";
import { formatMoney } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const formatSlotDate = (value: string) =>
    new Date(value).toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long" });

const formatSlotTime = (value: string) =>
    new Date(value).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

type BookingStep = "form" | "otp" | "waiting" | "redirect" | "success";

export default function PublicTeacherProfile() {
    const { id } = useParams<{ id: string }>();
    const [selectedSlot, setSelectedSlot] = useState<TeacherSlot | null>(null);

    const { data: teacher, isLoading, isError } = useQuery({
        queryKey: ["public-teacher", id],
        queryFn: () => fetchPublicTeacherProfile(id!),
        enabled: Boolean(id),
    });

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#1A6CC8]" />
            </div>
        );
    }

    if (isError || !teacher) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-6">
                <p className="text-xl font-bold text-[#0D2D5A]">Enseignant introuvable</p>
                <NavLink to="/professeurs" className="text-[#1A6CC8] font-semibold hover:underline">← Retour à l'annuaire</NavLink>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50" style={{ fontFamily: "Ubuntu, 'Noto Sans', sans-serif" }}>
            <section className="bg-[#0D2D5A] py-16">
                <div className="container mx-auto px-6 max-w-4xl">
                    <NavLink to="/professeurs" className="inline-flex items-center gap-1.5 text-blue-200 text-sm font-semibold hover:text-white mb-6">
                        <ArrowLeft className="w-4 h-4" /> Retour à l'annuaire
                    </NavLink>
                    <div className="flex items-center gap-5">
                        <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center font-black text-2xl text-white flex-shrink-0">
                            {teacher.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black text-white">{teacher.name}</h1>
                            <div className="flex items-center gap-3 mt-2 flex-wrap">
                                <div className="flex items-center gap-1">
                                    {[1,2,3,4,5].map(i => (
                                        <Star key={i} className={`w-4 h-4 ${i <= Math.floor(teacher.rating) ? "fill-[#F5A623] text-[#F5A623]" : "text-white/20"}`} />
                                    ))}
                                    <span className="text-[#F5A623] text-sm font-bold ml-1">{teacher.rating.toFixed(1)}</span>
                                </div>
                                {teacher.city && (
                                    <span className="flex items-center gap-1 text-blue-200 text-sm">
                                        <MapPin className="w-3.5 h-3.5" /> {teacher.city}
                                    </span>
                                )}
                                <span className="flex items-center gap-1 text-blue-200 text-sm">
                                    <Users className="w-3.5 h-3.5" /> {teacher.students} élève{teacher.students > 1 ? "s" : ""}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-12">
                <div className="container mx-auto px-6 max-w-4xl grid md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-6">
                        <div className="bg-white rounded-2xl border border-gray-100 p-6">
                            <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
                                <GraduationCap className="w-4 h-4 text-[#1A6CC8]" /> Matières enseignées
                            </h2>
                            <div className="flex flex-wrap gap-2 mb-4">
                                {teacher.subjects.map(s => (
                                    <span key={s} className="text-xs px-3 py-1 rounded-full bg-[#1A6CC8]/8 text-[#1A6CC8] font-semibold border border-[#1A6CC8]/15">{s}</span>
                                ))}
                            </div>
                            {teacher.level && <p className="text-sm text-gray-500">Niveaux : <span className="font-semibold text-[#0D2D5A]">{teacher.level}</span></p>}
                            <p className="text-sm text-gray-500 mt-1">
                                Tarif : <span className="font-semibold text-[#0D2D5A]">
                                    {formatMoney(teacher.rate, teacher.currency)} / {teacher.rateUnitMinutes} min
                                </span>
                            </p>
                        </div>

                        <div className="bg-white rounded-2xl border border-gray-100 p-6">
                            <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-[#1A6CC8]" /> Créneaux disponibles
                            </h2>
                            {teacher.slots.length === 0 ? (
                                <p className="text-sm text-gray-400 py-4">Aucun créneau ouvert pour le moment. Contactez-nous pour être mis en relation.</p>
                            ) : (
                                <div className="grid sm:grid-cols-2 gap-3">
                                    {teacher.slots.map(slot => (
                                        <button
                                            key={slot.id}
                                            onClick={() => setSelectedSlot(slot)}
                                            className={`text-left p-4 rounded-xl border-2 transition-all ${
                                                selectedSlot?.id === slot.id
                                                    ? "border-[#1A6CC8] bg-[#1A6CC8]/5"
                                                    : "border-gray-100 hover:border-[#1A6CC8]/40"
                                            }`}
                                        >
                                            <p className="text-sm font-bold text-[#0D2D5A] capitalize">{formatSlotDate(slot.startTime)}</p>
                                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                                <Clock className="w-3.5 h-3.5" /> {formatSlotTime(slot.startTime)} – {formatSlotTime(slot.endTime)}
                                            </p>
                                            {slot.subject && <p className="text-xs text-[#1A6CC8] font-semibold mt-1">{slot.subject}</p>}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="md:col-span-1">
                        {selectedSlot ? (
                            <BookingPanel teacherName={teacher.name} slot={selectedSlot} onCancel={() => setSelectedSlot(null)} />
                        ) : (
                            <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center text-sm text-gray-400">
                                Sélectionnez un créneau pour réserver.
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}

function BookingPanel({
    teacherName,
    slot,
    onCancel,
}: {
    teacherName: string;
    slot: TeacherSlot;
    onCancel: () => void;
}) {
    const [step, setStep] = useState<BookingStep>("form");
    const [parentName, setParentName] = useState("");
    const [parentEmail, setParentEmail] = useState("");
    const [parentPhone, setParentPhone] = useState("");
    const [studentName, setStudentName] = useState("");
    const [subject, setSubject] = useState(slot.subject || "");
    const [network, setNetwork] = useState<MobileMoneyNetwork>("MTN");
    const [momoPhone, setMomoPhone] = useState("");
    const [amount, setAmount] = useState<{ value: number; currency: string } | null>(null);
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
                const result = await checkBookingStatus(reference);
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
            const data = await initiateBooking({
                slotId: slot.id,
                network,
                phoneNumber: momoPhone,
                parentName,
                parentEmail,
                parentPhone,
                studentName,
                subject: subject || undefined,
            });
            setAmount({ value: data.amount, currency: data.currency });
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
            setError(err instanceof Error ? err.message : "Impossible d'initier la réservation.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleAuthorize = async () => {
        if (!charge) return;
        setError(null);
        setSubmitting(true);
        try {
            const data = await authorizeBookingCharge(charge.chargeId, otpType, code);
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
            <div className="pb-4 border-b border-gray-100">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Créneau sélectionné</p>
                <p className="text-sm font-bold text-[#0D2D5A] capitalize mt-1">{formatSlotDate(slot.startTime)}</p>
                <p className="text-xs text-gray-500">{formatSlotTime(slot.startTime)} – {formatSlotTime(slot.endTime)} avec {teacherName}</p>
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
                        <Label className="text-xs">Nom de l'élève</Label>
                        <Input value={studentName} onChange={e => setStudentName(e.target.value)} placeholder="Nom de l'enfant (ou le vôtre)" />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs">Matière (optionnel)</Label>
                        <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Ex: Mathématiques" />
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
                        {submitting ? "Initialisation..." : "Réserver et payer"} <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                    <button onClick={onCancel} className="w-full text-xs text-gray-400 hover:text-gray-600 text-center">Annuler</button>
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
                    <p className="font-bold text-[#0D2D5A]">Réservation confirmée !</p>
                    <p className="text-sm text-gray-500">
                        Un email de confirmation avec le lien de votre classe virtuelle vient d'être envoyé à <b>{parentEmail}</b>.
                    </p>
                </div>
            )}

            {amount && step !== "success" && (
                <p className="text-xs text-gray-400 text-center pt-2 border-t border-gray-100">
                    Montant : <span className="font-bold text-[#0D2D5A]">{formatMoney(amount.value, amount.currency)}</span>
                </p>
            )}
        </motion.div>
    );
}
