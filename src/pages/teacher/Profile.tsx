import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    User, Mail, Phone, MapPin, Globe, Camera, Shield,
    Bell, CreditCard, Save, Loader2, Calendar, Briefcase,
    BadgeCheck, ShieldCheck, ChevronRight, UserCircle2, ArrowLeft
} from "lucide-react";
import { fetchUserProfile, updateUserProfile, uploadUserAvatar } from "@/api/backoffice";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function TeacherProfile() {
    const { user: authUser } = useAuth();
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [activeTab, setActiveTab] = useState("personal");

    const { data: profile, isLoading } = useQuery({
        queryKey: ["userProfile", authUser?.id],
        queryFn: () => fetchUserProfile(authUser!.id),
        enabled: !!authUser?.id,
    });

    const updateMutation = useMutation({
        mutationFn: (payload: any) => updateUserProfile(authUser!.id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["userProfile"] });
            toast.success("Profil mis à jour ✅");
        }
    });

    const avatarMutation = useMutation({
        mutationFn: (file: File) => uploadUserAvatar(authUser!.id, file),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["userProfile"] });
            toast.success("Avatar mis à jour");
        }
    });

    const [formData, setFormData] = useState<any>({});

    useEffect(() => {
        if (profile) setFormData(profile);
    }, [profile]);

    const handleSave = () => {
        updateMutation.mutate(formData);
    };

    if (isLoading) {
        return (
            <div className="p-4 md:p-8 flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin text-[#1A6CC8] w-10 h-10" />
            </div>
        );
    }

    return (
        <div className="w-full p-3 space-y-3 bg-white min-h-screen">
            {/* Header / Profile Hero */}
            <div className="bg-white border border-slate-200 p-4 relative overflow-hidden">
                <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
                    <div className="relative group">
                        <div className="w-16 h-16 bg-[#0D2D5A] border border-slate-200 overflow-hidden flex items-center justify-center text-white text-2xl font-black">
                            {profile?.avatarUrl ? (
                                <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                profile?.avatar || profile?.name?.charAt(0)
                            )}
                        </div>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute -bottom-1.5 -right-1.5 w-6 h-6 bg-[#1A6CC8] text-white flex items-center justify-center hover:bg-[#0D2D5A] transition-colors border border-white"
                        >
                            <Camera className="w-3 h-3" />
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={(e) => e.target.files?.[0] && avatarMutation.mutate(e.target.files[0])}
                        />
                    </div>

                    <div className="text-center md:text-left space-y-1">
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                            <h1 className="text-xl font-black text-[#0D2D5A] uppercase tracking-tight">{profile?.name}</h1>
                            {authUser?.role === 'tutor' && authUser?.secondaryRole === 'teacher' ? (
                                <>
                                    <Badge className="bg-purple-50 text-purple-600 border border-purple-100 font-bold px-2 py-0 text-[9px] uppercase tracking-wider">Tuteur Vérifié <BadgeCheck className="w-3 h-3 ml-1 inline" /></Badge>
                                    <Badge className="bg-blue-50 text-blue-600 border border-blue-100 font-bold px-2 py-0 text-[9px] uppercase tracking-wider">Enseignant <BadgeCheck className="w-3 h-3 ml-1 inline" /></Badge>
                                </>
                            ) : authUser?.role === 'teacher' ? (
                                <Badge className="bg-blue-50 text-blue-600 border border-blue-100 font-bold px-2 py-0 text-[9px] uppercase tracking-wider">Enseignant Vérifié <BadgeCheck className="w-3 h-3 ml-1 inline" /></Badge>
                            ) : (
                                <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold px-2 py-0 text-[9px] uppercase tracking-wider">Tuteur Vérifié <BadgeCheck className="w-3 h-3 ml-1 inline" /></Badge>
                            )}
                        </div>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">
                            <span className="flex items-center gap-1.5">
                                <Briefcase className="w-3 h-3 text-[#1A6CC8]" />
                                {authUser?.role === 'tutor' && authUser?.secondaryRole === 'teacher'
                                    ? "Tuteur-Enseignant"
                                    : authUser?.role === 'teacher' ? "Enseignant" : "Tuteur Expert"}
                            </span>
                            <span className="flex items-center gap-1.5"><MapPin className="w-3 h-3 text-[#1A6CC8]" /> {profile?.location || "Cameroun"}</span>
                            <span className="flex items-center gap-1.5"><Mail className="w-3 h-3 text-[#1A6CC8]" /> {profile?.email}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                {/* Navigation Sidebar */}
                <div className="lg:col-span-12 xl:col-span-3">
                    <div className="border border-slate-200 bg-white p-2 space-y-1">
                        {[
                            { id: "personal", label: "Infos Personnelles", icon: UserCircle2 },
                            { id: "banking", label: "Paiement & RIB", icon: CreditCard },
                            { id: "security", label: "Sécurité & Accès", icon: ShieldCheck },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "w-full px-3 py-2 flex items-center gap-3 transition-all text-left",
                                    activeTab === tab.id
                                        ? "bg-[#1A6CC8]/5 text-[#1A6CC8] border-l-2 border-[#1A6CC8]"
                                        : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                                )}
                            >
                                <tab.icon className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
                                {activeTab === tab.id && <ChevronRight className="w-3 h-3 ml-auto" />}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Area */}
                <div className="lg:col-span-12 xl:col-span-9">
                    <div className="border border-slate-200 bg-white overflow-hidden">
                        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                            <h2 className="text-[10px] font-black text-[#0D2D5A] uppercase tracking-widest">
                                {activeTab === 'personal'
                                    ? (authUser?.role === 'teacher' ? "Informations de l'Enseignant" : "Informations du Tuteur")
                                    : activeTab === 'banking' ? 'Coordonnées de Reversement' : 'Sécurité du compte'}
                            </h2>
                            <Button
                                onClick={handleSave}
                                className="bg-[#1A6CC8] hover:bg-[#0D2D5A] font-black h-8 px-4 rounded-none shadow-none text-[10px] uppercase tracking-widest gap-2"
                                disabled={updateMutation.isPending}
                            >
                                {updateMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                Enregistrer
                            </Button>
                        </div>

                        <div className="p-4">
                            {activeTab === 'personal' && (
                                <div className="grid grid-cols-1 md:grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nom complet</label>
                                        <input
                                            value={formData.name || ""}
                                            onChange={e => setFormData({...formData, name: e.target.value})}
                                            className="w-full h-9 bg-slate-50/50 px-3 border border-slate-200 font-bold text-[11px] text-[#0D2D5A] outline-none focus:border-[#1A6CC8] transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Email (non modifiable)</label>
                                        <input
                                            value={formData.email || ""}
                                            disabled
                                            className="w-full h-9 bg-slate-100/50 px-3 border border-slate-100 font-bold text-[11px] text-slate-400"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Téléphone</label>
                                        <input
                                            value={formData.phone || ""}
                                            onChange={e => setFormData({...formData, phone: e.target.value})}
                                            className="w-full h-9 bg-slate-50/50 px-3 border border-slate-200 font-bold text-[11px] text-[#0D2D5A] outline-none focus:border-[#1A6CC8] transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Localisation</label>
                                        <input
                                            value={formData.location || ""}
                                            onChange={e => setFormData({...formData, location: e.target.value})}
                                            className="w-full h-9 bg-slate-50/50 px-3 border border-slate-200 font-bold text-[11px] text-[#0D2D5A] outline-none focus:border-[#1A6CC8] transition-all"
                                        />
                                    </div>
                                    <div className="md:col-span-2 space-y-1.5">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Biographie / Présentation</label>
                                        <textarea
                                            value={formData.bio || ""}
                                            onChange={e => setFormData({...formData, bio: e.target.value})}
                                            rows={4}
                                            className="w-full bg-slate-50/50 p-3 border border-slate-200 font-bold text-[11px] text-[#0D2D5A] outline-none focus:border-[#1A6CC8] transition-all resize-none"
                                            placeholder="Parlez-nous de votre expérience et de votre approche..."
                                        />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'banking' && (
                                <div className="space-y-4">
                                    <div className="p-3 bg-[#1A6CC8]/5 border border-[#1A6CC8]/20 flex items-start gap-3">
                                        <Info className="w-4 h-4 text-[#1A6CC8] mt-0.5 shrink-0" />
                                        <p className="text-[10px] text-slate-500 font-bold leading-relaxed">
                                            Vos informations de paiement sont sécurisées. Les reversements sont effectués par virement ou Mobile Money.
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Établissement Bancaire / Service</label>
                                            <input
                                                value={formData.bankName || ""}
                                                onChange={e => setFormData({...formData, bankName: e.target.value})}
                                                placeholder="Ex: Afriland, Orange Money, etc."
                                                className="w-full h-9 bg-slate-50/50 px-3 border border-slate-200 font-bold text-[11px] text-[#0D2D5A] outline-none focus:border-[#1A6CC8] transition-all"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Coordonnées (RIB/Numéro)</label>
                                            <input
                                                value={formData.bankIban || ""}
                                                onChange={e => setFormData({...formData, bankIban: e.target.value})}
                                                className="w-full h-9 bg-slate-50/50 px-3 border border-slate-200 font-bold text-[11px] text-[#0D2D5A] outline-none focus:border-[#1A6CC8] transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'security' && (
                                <div className="space-y-4">
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                        Pour modifier votre mot de passe, merci de contacter l'administrateur.
                                    </p>
                                    <div className="flex items-center gap-3 p-3 border border-slate-200 bg-slate-50/30">
                                        <Shield className="w-4 h-4 text-emerald-500 shrink-0" />
                                        <div>
                                            <p className="text-[10px] font-black text-[#0D2D5A] uppercase tracking-tight">
                                                Authentification à deux facteurs
                                            </p>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                                                Renforcez la sécurité de votre compte.
                                            </p>
                                        </div>
                                        <Button variant="outline" size="sm" className="ml-auto text-[9px] h-7 border-slate-200 rounded-none shadow-none font-black uppercase">
                                            Activer
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Info({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
        </svg>
    );
}
