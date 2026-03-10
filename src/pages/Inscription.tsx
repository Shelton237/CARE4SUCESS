import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Mail, Lock, Phone, UserPlus, BookOpen, GraduationCap, CheckCircle, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ROUTE_PATHS } from "@/lib";

export default function Inscription() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        parentName: "",
        parentEmail: "",
        parentPassword: "",
        parentPhone: "",
        childName: "",
        childEmail: "",
        childPassword: "",
        childLevel: "6ème",
        subject: "Mathématiques",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleNext = () => setStep(step + 1);
    const handlePrev = () => setStep(step - 1);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";
            const response = await fetch(`${API_BASE_URL}/parents/enroll`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                setStep(4); // Success step
            } else {
                const err = await response.json();
                alert(err.message || "Une erreur est survenue lors de l'enrôlement.");
            }
        } catch (error) {
            console.error(error);
            alert("Erreur de connexion au serveur.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen pt-24 pb-12 bg-slate-50">
            <div className="container mx-auto px-4 max-w-2xl">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-[#0D2D5A] mb-2">Inscription Parent</h1>
                    <p className="text-slate-600">Rejoignez Care4Success et offrez le meilleur à votre enfant.</p>
                </div>

                {/* Progress Bar */}
                <div className="flex justify-between mb-8 relative">
                    <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 -translate-y-1/2 z-0" />
                    <div
                        className="absolute top-1/2 left-0 h-1 bg-[#1A6CC8] -translate-y-1/2 z-0 transition-all duration-500"
                        style={{ width: `${((step - 1) / 2) * 100}%` }}
                    />
                    {[1, 2, 3].map((s) => (
                        <div
                            key={s}
                            className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${step >= s ? "bg-[#1A6CC8] text-white" : "bg-white text-slate-400 border-2 border-slate-200"
                                }`}
                        >
                            {step > s ? <CheckCircle className="w-6 h-6" /> : s}
                        </div>
                    ))}
                </div>

                <Card className="border-none shadow-xl">
                    <CardContent className="pt-8">
                        {step === 1 && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-semibold flex items-center gap-2">
                                    <User className="text-[#1A6CC8]" /> Informations Parent
                                </h2>
                                <div className="grid gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Nom complet</label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                            <Input className="pl-10" name="parentName" placeholder="Ex: Jean Dupont" value={formData.parentName} onChange={handleChange} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Email</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                            <Input className="pl-10" type="email" name="parentEmail" placeholder="votre@email.com" value={formData.parentEmail} onChange={handleChange} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Téléphone</label>
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                                <Input className="pl-10" name="parentPhone" placeholder="+237 ..." value={formData.parentPhone} onChange={handleChange} />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Mot de passe</label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                                <Input className="pl-10" type="password" name="parentPassword" placeholder="••••••••" value={formData.parentPassword} onChange={handleChange} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <Button className="w-full bg-[#1A6CC8] hover:bg-[#0D2D5A]" onClick={handleNext}>
                                    Continuer vers l'enfant <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-semibold flex items-center gap-2">
                                    <GraduationCap className="text-[#1A6CC8]" /> Informations de votre enfant
                                </h2>
                                <div className="grid gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Nom de l'enfant</label>
                                        <Input name="childName" placeholder="Ex: Marie Dupont" value={formData.childName} onChange={handleChange} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Niveau scolaire</label>
                                            <select
                                                className="w-full p-2 border rounded-md"
                                                name="childLevel"
                                                value={formData.childLevel}
                                                onChange={handleChange}
                                            >
                                                <option>6ème</option>
                                                <option>5ème</option>
                                                <option>4ème</option>
                                                <option>3ème</option>
                                                <option>Seconde</option>
                                                <option>Première</option>
                                                <option>Terminale</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Matière prioritaire</label>
                                            <select
                                                className="w-full p-2 border rounded-md"
                                                name="subject"
                                                value={formData.subject}
                                                onChange={handleChange}
                                            >
                                                <option>Mathématiques</option>
                                                <option>Physique-Chimie</option>
                                                <option>Français</option>
                                                <option>Anglais</option>
                                                <option>Informatique</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <Button variant="outline" className="w-1/2" onClick={handlePrev}>Retour</Button>
                                    <Button className="w-1/2 bg-[#1A6CC8] hover:bg-[#0D2D5A]" onClick={handleNext}>Suivant</Button>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-6 text-center">
                                <div className="p-4 bg-blue-50 rounded-lg text-left text-sm text-blue-800">
                                    <strong>Résumé de votre demande :</strong><br />
                                    Parent : {formData.parentName} ({formData.parentPhone})<br />
                                    Enfant : {formData.childName} en {formData.childLevel}<br />
                                    Besoin : Soutien en {formData.subject}
                                </div>
                                <div className="space-y-4">
                                    <label className="text-sm font-medium text-slate-500">Mode de paiement (Mobile Money)</label>
                                    <div className="flex justify-center gap-4">
                                        <div className="p-4 border rounded-lg cursor-pointer hover:border-[#1A6CC8] transition-colors bg-white">
                                            <img src="https://upload.wikimedia.org/wikipedia/commons/9/93/Orange-logo.svg" alt="Orange" className="w-12 h-12 object-contain" />
                                        </div>
                                        <div className="p-4 border rounded-lg cursor-pointer hover:border-[#1A6CC8] transition-colors bg-white">
                                            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/MTN_Logo.svg/1024px-MTN_Logo.svg.png" alt="MTN" className="w-12 h-12 object-contain" />
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-400 italic">Un conseiller vous contactera pour valider le matching avec le meilleur professeur.</p>
                                </div>
                                <div className="flex gap-4">
                                    <Button variant="outline" className="w-1/2" onClick={handlePrev} disabled={loading}>Retour</Button>
                                    <Button
                                        className="w-1/2 bg-[#F5A623] hover:bg-[#d48c1f] text-white"
                                        onClick={handleSubmit}
                                        disabled={loading}
                                    >
                                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
                                        Finaliser l'inscription
                                    </Button>
                                </div>
                            </div>
                        )}

                        {step === 4 && (
                            <div className="text-center py-8 space-y-6 animate-in fade-in zoom-in duration-500">
                                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                                    <CheckCircle className="w-12 h-12" />
                                </div>
                                <h2 className="text-2xl font-bold text-[#0D2D5A]">Félicitations !</h2>
                                <p className="text-slate-600">
                                    Votre compte parent a été créé. Vous pouvez maintenant vous connecter pour suivre les progrès de <strong>{formData.childName}</strong>.
                                </p>
                                <Button className="bg-[#1A6CC8]" onClick={() => navigate("/login")}>
                                    Aller à la page de connexion
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
