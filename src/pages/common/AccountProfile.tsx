import { useRef, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Bell, Camera, CheckCircle2, Loader2, MapPin, Phone, ShieldCheck, UserCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchUserProfile, updateUserPassword, updateUserProfile, uploadUserAvatar, UpdateUserProfilePayload } from "@/api/backoffice";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

type ProfileFormState = Required<Pick<UpdateUserProfilePayload, "name" | "phone" | "avatar" | "location" | "timezone" | "language" | "bio" | "notifyEmail" | "notifySms" | "notifyWhatsapp">>;

const TIMEZONES = [
    { value: "Africa/Douala", label: "Cameroun (Africa/Douala)" },
    { value: "Europe/Paris", label: "France (Europe/Paris)" },
    { value: "UTC", label: "UTC" },
    { value: "America/Toronto", label: "Canada (America/Toronto)" },
];

const LANGUAGES = [
    { value: "fr", label: "Français" },
    { value: "en", label: "English" },
];

export default function AccountProfile() {
    const { user, updateUser } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [profileForm, setProfileForm] = useState<ProfileFormState>(() => ({
        name: user?.name ?? "",
        phone: user?.phone ?? "",
        avatar: user?.avatar ?? user?.name?.slice(0, 2).toUpperCase() ?? "",
        location: user?.location ?? "",
        timezone: user?.timezone ?? "Africa/Douala",
        language: user?.language ?? "fr",
        bio: user?.bio ?? "",
        notifyEmail: user?.notifyEmail ?? true,
        notifySms: user?.notifySms ?? false,
        notifyWhatsapp: user?.notifyWhatsapp ?? false,
    }));

    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    const userId = user?.id;

    const profileQuery = useQuery({
        queryKey: ["user-profile", userId],
        queryFn: () => fetchUserProfile(userId!),
        enabled: Boolean(userId),
        initialData: user ?? undefined,
    });

    useEffect(() => {
        if (profileQuery.data) {
            const profile = profileQuery.data;
            setProfileForm({
                name: profile.name ?? "",
                phone: profile.phone ?? "",
                avatar: profile.avatar ?? profile.name?.slice(0, 2).toUpperCase() ?? "",
                location: profile.location ?? "",
                timezone: profile.timezone ?? "Africa/Douala",
                language: profile.language ?? "fr",
                bio: profile.bio ?? "",
                notifyEmail: profile.notifyEmail ?? true,
                notifySms: profile.notifySms ?? false,
                notifyWhatsapp: profile.notifyWhatsapp ?? false,
            });
        }
    }, [profileQuery.data]);

    const profileMutation = useMutation({
        mutationFn: (payload: ProfileFormState) => updateUserProfile(userId!, payload),
        onSuccess: (data) => {
            toast({
                title: "Profil mis à jour",
                description: "Vos informations personnelles ont été sauvegardées.",
            });
            queryClient.setQueryData(["user-profile", userId], data);
            updateUser(data);
        },
        onError: (error: Error) => {
            toast({
                title: "Échec de l'enregistrement",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const avatarMutation = useMutation({
        mutationFn: (file: File) => uploadUserAvatar(userId!, file),
        onSuccess: (data) => {
            toast({
                title: "Avatar mis à jour",
                description: "Votre photo de profil a été enregistrée.",
            });
            queryClient.setQueryData(["user-profile", userId], data);
            updateUser(data);
        },
        onError: (error: Error) => {
            toast({
                title: "Échec de l'upload",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const passwordMutation = useMutation({
        mutationFn: () =>
            updateUserPassword(userId!, {
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword,
            }),
        onSuccess: () => {
            toast({
                title: "Mot de passe mis à jour",
                description: "Vous pouvez désormais utiliser votre nouveau mot de passe.",
            });
            setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        },
        onError: (error: Error) => {
            toast({
                title: "Impossible de modifier le mot de passe",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const fullNameInitials = useMemo(() => {
        return (profileForm.avatar || profileForm.name || "C4S")
            .slice(0, 2)
            .toUpperCase();
    }, [profileForm.avatar, profileForm.name]);

    if (!userId) {
        return null;
    }

    const handleProfileSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        profileMutation.mutate(profileForm);
    };

    const handlePasswordSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            toast({
                title: "Les mots de passe ne correspondent pas",
                description: "Merci de vérifier la confirmation.",
                variant: "destructive",
            });
            return;
        }
        passwordMutation.mutate();
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                toast({
                    title: "Fichier trop volumineux",
                    description: "La taille maximale est de 2 Mo.",
                    variant: "destructive",
                });
                return;
            }
            avatarMutation.mutate(file);
        }
    };

    const lastLoginLabel = user?.lastLoginAt
        ? new Date(user.lastLoginAt).toLocaleString("fr-FR", {
            dateStyle: "medium",
            timeStyle: "short",
        })
        : "Première connexion";

    return (
        <div className="min-h-screen bg-gray-50 pb-16" style={{ fontFamily: "Ubuntu, 'Noto Sans', sans-serif" }}>
            <div className="max-w-6xl mx-auto px-4 lg:px-0">
                <div className="flex items-center gap-3 pt-10">
                    <button
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-[#1A6CC8] hover:text-[#0D2D5A]"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Retour
                    </button>
                    <span className="text-xs uppercase tracking-[3px] text-gray-400 font-black">
                        Profil utilisateur
                    </span>
                </div>

                <div className="mt-6 bg-gradient-to-r from-[#0D2D5A] to-[#1A6CC8] rounded-3xl p-8 text-white shadow-xl">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="relative group">
                                <div className="w-20 h-20 rounded-2xl bg-white/20 overflow-hidden flex items-center justify-center text-2xl font-black shadow-lg border-2 border-white/10">
                                    {user?.avatarUrl ? (
                                        <img src={user.avatarUrl} alt={profileForm.name} className="w-full h-full object-cover" />
                                    ) : (
                                        fullNameInitials
                                    )}
                                </div>
                                <button
                                    onClick={handleAvatarClick}
                                    disabled={avatarMutation.isPending}
                                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl cursor-pointer"
                                    title="Changer de photo"
                                >
                                    {avatarMutation.isPending ? (
                                        <Loader2 className="w-6 h-6 animate-spin text-white" />
                                    ) : (
                                        <Camera className="w-6 h-6 text-white" />
                                    )}
                                </button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    className="hidden"
                                    accept="image/*"
                                />
                            </div>
                            <div>
                                <p className="text-sm uppercase tracking-[4px] text-white/70 font-semibold">
                                    {user?.role}
                                </p>
                                <h1 className="text-3xl font-black">{profileForm.name}</h1>
                                <p className="text-white/80 text-sm">{user?.email}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm font-semibold text-white/80">
                            <div>
                                <p className="text-white/60 text-xs uppercase tracking-[3px]">Dernière connexion</p>
                                <p>{lastLoginLabel}</p>
                            </div>
                            <div>
                                <p className="text-white/60 text-xs uppercase tracking-[3px]">Téléphone</p>
                                <p>{profileForm.phone || "Non renseigné"}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-6 mt-8">
                    <div className="lg:col-span-2 space-y-6">
                        <section className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-2xl bg-[#1A6CC8]/10 text-[#1A6CC8] flex items-center justify-center">
                                    <UserCircle2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-[#0D2D5A]">Informations personnelles</h2>
                                    <p className="text-sm text-gray-500">Identité, coordonnées et biographie</p>
                                </div>
                            </div>

                            <form onSubmit={handleProfileSubmit} className="space-y-5">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                                            Nom complet
                                        </label>
                                        <Input
                                            value={profileForm.name}
                                            onChange={(event) => setProfileForm((state) => ({ ...state, name: event.target.value }))}
                                            placeholder="Nom et prénom"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                                            Adresse e-mail
                                        </label>
                                        <Input value={user?.email ?? ""} disabled className="bg-gray-50" />
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                                            Téléphone
                                        </label>
                                        <Input
                                            value={profileForm.phone}
                                            onChange={(event) => setProfileForm((state) => ({ ...state, phone: event.target.value }))}
                                            placeholder="+237 ..."
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                                            Initiales de l'avatar
                                        </label>
                                        <Input
                                            value={profileForm.avatar}
                                            onChange={(event) =>
                                                setProfileForm((state) => ({
                                                    ...state,
                                                    avatar: event.target.value.toUpperCase().slice(0, 2),
                                                }))
                                            }
                                            maxLength={2}
                                            placeholder="Ex: JD"
                                        />
                                        <p className="text-[10px] text-gray-400 mt-1 italic">Utilisé si aucune photo n'est uploadée</p>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                                        Localisation
                                    </label>
                                    <div className="relative">
                                        <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                        <Input
                                            className="pl-9"
                                            value={profileForm.location}
                                            onChange={(event) => setProfileForm((state) => ({ ...state, location: event.target.value }))}
                                            placeholder="Ville, Pays"
                                        />
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                                            Fuseau horaire
                                        </label>
                                        <select
                                            value={profileForm.timezone}
                                            onChange={(event) =>
                                                setProfileForm((state) => ({ ...state, timezone: event.target.value }))
                                            }
                                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-[#1A6CC8]/20 focus:border-[#1A6CC8]"
                                        >
                                            {TIMEZONES.map((timezone) => (
                                                <option key={timezone.value} value={timezone.value}>
                                                    {timezone.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                                            Langue
                                        </label>
                                        <select
                                            value={profileForm.language}
                                            onChange={(event) =>
                                                setProfileForm((state) => ({ ...state, language: event.target.value }))
                                            }
                                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-[#1A6CC8]/20 focus:border-[#1A6CC8]"
                                        >
                                            {LANGUAGES.map((language) => (
                                                <option key={language.value} value={language.value}>
                                                    {language.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                                        Bio
                                    </label>
                                    <Textarea
                                        value={profileForm.bio}
                                        onChange={(event) => setProfileForm((state) => ({ ...state, bio: event.target.value }))}
                                        rows={4}
                                        placeholder="Votre rôle, vos réussites, votre approche pédagogique..."
                                    />
                                </div>

                                <div className="flex flex-wrap gap-4">
                                    <label className="flex items-center gap-3 rounded-2xl border border-gray-100 px-4 py-3 bg-gray-50/60 flex-1 min-w-[200px]">
                                        <Switch
                                            checked={profileForm.notifyEmail}
                                            onCheckedChange={(checked) =>
                                                setProfileForm((state) => ({ ...state, notifyEmail: checked }))
                                            }
                                        />
                                        <div>
                                            <p className="font-semibold text-sm text-[#0D2D5A]">Alerte email</p>
                                            <p className="text-xs text-gray-500">Résumé quotidien et alertes planning</p>
                                        </div>
                                    </label>
                                    <label className="flex items-center gap-3 rounded-2xl border border-gray-100 px-4 py-3 bg-gray-50/60 flex-1 min-w-[200px]">
                                        <Switch
                                            checked={profileForm.notifySms}
                                            onCheckedChange={(checked) =>
                                                setProfileForm((state) => ({ ...state, notifySms: checked }))
                                            }
                                        />
                                        <div>
                                            <p className="font-semibold text-sm text-[#0D2D5A]">SMS</p>
                                            <p className="text-xs text-gray-500">Rappels de sessions sensibles</p>
                                        </div>
                                    </label>
                                    <label className="flex items-center gap-3 rounded-2xl border border-gray-100 px-4 py-3 bg-gray-50/60 flex-1 min-w-[200px]">
                                        <Switch
                                            checked={profileForm.notifyWhatsapp}
                                            onCheckedChange={(checked) =>
                                                setProfileForm((state) => ({ ...state, notifyWhatsapp: checked }))
                                            }
                                        />
                                        <div>
                                            <p className="font-semibold text-sm text-[#0D2D5A]">WhatsApp</p>
                                            <p className="text-xs text-gray-500">Notifications familles premium</p>
                                        </div>
                                    </label>
                                </div>

                                <div className="flex justify-end">
                                    <Button
                                        type="submit"
                                        disabled={profileMutation.isPending}
                                        className="bg-[#1A6CC8] hover:bg-[#0D2D5A] text-white min-w-[160px] font-bold"
                                    >
                                        {profileMutation.isPending ? (
                                            <span className="flex items-center gap-2">
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Enregistrement...
                                            </span>
                                        ) : (
                                            "Enregistrer"
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </section>

                        <section className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-2xl bg-[#22c55e]/10 text-[#22c55e] flex items-center justify-center">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-[#0D2D5A]">Sécurité</h2>
                                    <p className="text-sm text-gray-500">Mettez à jour votre mot de passe</p>
                                </div>
                            </div>
                            <form onSubmit={handlePasswordSubmit} className="space-y-4">
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                                        Mot de passe actuel
                                    </label>
                                    <Input
                                        type="password"
                                        value={passwordForm.currentPassword}
                                        onChange={(event) =>
                                            setPasswordForm((state) => ({ ...state, currentPassword: event.target.value }))
                                        }
                                        required
                                        autoComplete="current-password"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                                        Nouveau mot de passe
                                    </label>
                                    <Input
                                        type="password"
                                        value={passwordForm.newPassword}
                                        onChange={(event) =>
                                            setPasswordForm((state) => ({ ...state, newPassword: event.target.value }))
                                        }
                                        required
                                        minLength={8}
                                        autoComplete="new-password"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                                        Confirmation
                                    </label>
                                    <Input
                                        type="password"
                                        value={passwordForm.confirmPassword}
                                        onChange={(event) =>
                                            setPasswordForm((state) => ({ ...state, confirmPassword: event.target.value }))
                                        }
                                        required
                                        minLength={8}
                                    />
                                </div>
                                <div className="flex justify-end">
                                    <Button
                                        type="submit"
                                        variant="outline"
                                        className="text-[#22c55e] border-[#22c55e] hover:bg-[#22c55e]/10 min-w-[160px]"
                                        disabled={passwordMutation.isPending}
                                    >
                                        {passwordMutation.isPending ? (
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
                        </section>
                    </div>

                    <aside className="space-y-6">
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-2xl bg-[#F5A623]/10 text-[#F5A623] flex items-center justify-center">
                                    <Bell className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-[#0D2D5A]">Résumé des alertes</h3>
                                    <p className="text-xs text-gray-500">Contrôlez vos préférences globales</p>
                                </div>
                            </div>
                            <ul className="space-y-3 text-sm">
                                <li className="flex items-center gap-2 text-gray-600">
                                    <CheckCircle2 className={`w-4 h-4 ${profileForm.notifyEmail ? "text-[#1A6CC8]" : "text-gray-300"}`} />
                                    Email quotidiens {profileForm.notifyEmail ? "activés" : "désactivés"}
                                </li>
                                <li className="flex items-center gap-2 text-gray-600">
                                    <CheckCircle2 className={`w-4 h-4 ${profileForm.notifySms ? "text-[#1A6CC8]" : "text-gray-300"}`} />
                                    SMS pour les urgences {profileForm.notifySms ? "activés" : "désactivés"}
                                </li>
                                <li className="flex items-center gap-2 text-gray-600">
                                    <CheckCircle2 className={`w-4 h-4 ${profileForm.notifyWhatsapp ? "text-[#1A6CC8]" : "text-gray-300"}`} />
                                    WhatsApp familles premium {profileForm.notifyWhatsapp ? "activé" : "désactivé"}
                                </li>
                            </ul>
                        </div>

                        <div className="bg-[#0D2D5A] text-white rounded-3xl p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <Phone className="w-5 h-5" />
                                <div>
                                    <p className="text-xs uppercase tracking-[4px] text-white/60">Hotline Care4Success</p>
                                    <p className="text-lg font-bold">+237 233 42 12 54</p>
                                </div>
                            </div>
                            <p className="text-sm text-white/80">
                                Une question sur votre compte, vos accès ou vos préférences ? Notre équipe support vous répond de 8h à 22h.
                            </p>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}
