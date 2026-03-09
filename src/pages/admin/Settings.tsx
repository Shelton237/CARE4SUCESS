import { useMemo, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Settings2, MapPin, CreditCard, Bell, Shield, Save, Loader2, Plus, X } from "lucide-react";
import {
    fetchPlatformSettings,
    savePlatformSettings,
} from "@/api/backoffice";
import type {
    PlatformSettings,
    PlatformCenter,
    SubjectRate,
    NotificationPreference,
    SessionTimeoutOption,
    PasswordPolicyOption,
} from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";

const SESSION_TIMEOUTS: Array<{ value: SessionTimeoutOption; label: string }> = [
    { value: "30m", label: "30 minutes" },
    { value: "1h", label: "1 heure" },
    { value: "4h", label: "4 heures" },
    { value: "24h", label: "24 heures" },
];

const PASSWORD_POLICIES: Array<{ value: PasswordPolicyOption; label: string }> = [
    { value: "standard", label: "Standard (min. 8 caractères)" },
    { value: "strong", label: "Fort (majuscule + chiffre + symbole)" },
];

const generateId = () =>
    typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `id-${Math.random().toString(36).slice(2)}`;

type RateField = keyof Pick<SubjectRate, "baseRate" | "premiumRate">;

export default function AdminSettings() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [settings, setSettings] = useState<PlatformSettings | null>(null);
    const [editingCenterId, setEditingCenterId] = useState<string | null>(null);
    const [addingCenter, setAddingCenter] = useState(false);
    const [newCenter, setNewCenter] = useState<Omit<PlatformCenter, "id">>({
        name: "",
        city: "",
        address: "",
        active: true,
    });

    const [addingRate, setAddingRate] = useState(false);
    const [newRate, setNewRate] = useState({
        label: "",
        baseRate: 0,
        premiumRate: 0,
    });

    const { data: serverSettings, isLoading } = useQuery({
        queryKey: ["platformSettings"],
        queryFn: fetchPlatformSettings,
        refetchOnWindowFocus: false,
    });

    useEffect(() => {
        if (serverSettings && !settings) {
            setSettings(serverSettings);
        }
    }, [serverSettings, settings]);

    const mutation = useMutation({
        mutationFn: savePlatformSettings,
        onSuccess: (data) => {
            setSettings(data);
            queryClient.setQueryData(["platformSettings"], data);
            toast({
                title: "Paramètres enregistrés",
                description: "Les changements sont désormais en production.",
            });
        },
        onError: (error: Error) => {
            toast({
                title: "Échec de l'enregistrement",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const pendingSave = mutation.isPending;
    const hasData = Boolean(settings);

    const handleRateChange = (id: string, field: RateField | "label", value: string | number) => {
        if (!settings) return;
        setSettings({
            ...settings,
            hourlyRates: settings.hourlyRates.map((rate) =>
                rate.id === id
                    ? {
                        ...rate,
                        [field]: field === "label" ? value : (Number(value) >= 0 ? Number(value) : 0),
                    }
                    : rate
            ),
        });
    };

    const removeRate = (id: string) => {
        if (!settings) return;
        setSettings({
            ...settings,
            hourlyRates: settings.hourlyRates.filter((rate) => rate.id !== id),
        });
    };

    const handleAddRate = () => {
        if (!settings || !newRate.label.trim()) {
            toast({
                title: "Informations incomplètes",
                description: "Merci de renseigner au moins le nom de la matière.",
                variant: "destructive",
            });
            return;
        }
        setSettings({
            ...settings,
            hourlyRates: [
                ...settings.hourlyRates,
                {
                    id: generateId(),
                    label: newRate.label.trim(),
                    baseRate: Number(newRate.baseRate) || 0,
                    premiumRate: Number(newRate.premiumRate) || 0,
                },
            ],
        });
        setNewRate({ label: "", baseRate: 0, premiumRate: 0 });
        setAddingRate(false);
        toast({
            title: "Tarif ajouté",
            description: "La matière a été ajoutée. Pensez à enregistrer.",
        });
    };

    const toggleNotification = (pref: NotificationPreference) => {
        if (!settings) return;
        setSettings({
            ...settings,
            notifications: settings.notifications.map((item) =>
                item.key === pref.key ? { ...item, enabled: !item.enabled } : item
            ),
        });
    };

    const handleSecurityChange = <K extends keyof PlatformSettings["security"]>(
        key: K,
        value: PlatformSettings["security"][K]
    ) => {
        if (!settings) return;
        setSettings({ ...settings, security: { ...settings.security, [key]: value } });
    };

    const updateCenter = (id: string, patch: Partial<PlatformCenter>) => {
        if (!settings) return;
        setSettings({
            ...settings,
            centers: settings.centers.map((center) =>
                center.id === id ? { ...center, ...patch } : center
            ),
        });
    };

    const removeCenter = (id: string) => {
        if (!settings) return;
        setSettings({
            ...settings,
            centers: settings.centers.filter((center) => center.id !== id),
        });
        if (editingCenterId === id) setEditingCenterId(null);
    };

    const canCreateCenter = useMemo(
        () => newCenter.name.trim() && newCenter.city.trim() && newCenter.address.trim(),
        [newCenter]
    );

    const handleAddCenter = () => {
        if (!settings || !canCreateCenter) {
            toast({
                title: "Informations incomplètes",
                description: "Merci de renseigner le nom, la ville et l'adresse du centre.",
                variant: "destructive",
            });
            return;
        }
        setSettings({
            ...settings,
            centers: [
                ...settings.centers,
                {
                    id: generateId(),
                    ...newCenter,
                },
            ],
        });
        setNewCenter({ name: "", city: "", address: "", active: true });
        setAddingCenter(false);
        toast({
            title: "Centre ajouté",
            description: "Le centre figure maintenant dans la liste. Pensez à enregistrer.",
        });
    };

    const handleSave = () => {
        if (!settings || pendingSave) return;
        mutation.mutate(settings);
    };

    if (isLoading && !hasData) {
        return (
            <div className="p-8">
                <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center text-gray-400 shadow-sm">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-3" />
                    Chargement des paramètres…
                </div>
            </div>
        );
    }

    if (!settings) {
        return null;
    }

    return (
        <div className="p-8 space-y-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#0D2D5A]">Paramètres de la plateforme</h1>
                    <p className="text-gray-500 text-sm mt-1">Configuration générale, tarifs et centres</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={pendingSave}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all shadow-md ${pendingSave ? "bg-gray-400" : "bg-[#1A6CC8] hover:bg-[#0D2D5A]"
                        } disabled:cursor-not-allowed`}
                >
                    {pendingSave ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Save className="w-4 h-4" />
                    )}
                    {pendingSave ? "Enregistrement…" : "Enregistrer"}
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#1A6CC8]/10 flex items-center justify-center">
                            <CreditCard className="w-4 h-4 text-[#1A6CC8]" />
                        </div>
                        <div>
                            <h2 className="font-bold text-[#0D2D5A] text-sm">Tarifs par heure (FCFA)</h2>
                            <p className="text-xs text-gray-400">
                                {settings.hourlyRates.length} tarifs actifs
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setAddingRate((prev) => !prev)}
                        className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[#1A6CC8] text-[#1A6CC8] hover:bg-[#1A6CC8]/5 transition-colors inline-flex items-center gap-1 w-max"
                    >
                        {addingRate ? (
                            <>
                                <X className="w-3 h-3" /> Annuler
                            </>
                        ) : (
                            <>
                                <Plus className="w-3 h-3" /> Ajouter une matière
                            </>
                        )}
                    </button>
                </div>

                {addingRate && (
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/60">
                        <div className="grid gap-3 md:grid-cols-4">
                            <div className="md:col-span-2">
                                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Matière</label>
                                <input
                                    type="text"
                                    value={newRate.label}
                                    onChange={(e) => setNewRate((r) => ({ ...r, label: e.target.value }))}
                                    placeholder="Nom de la matière"
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1A6CC8]/20 focus:border-[#1A6CC8]"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Tarif standard</label>
                                <input
                                    type="number"
                                    value={newRate.baseRate || ""}
                                    onChange={(e) => setNewRate((r) => ({ ...r, baseRate: Number(e.target.value) }))}
                                    placeholder="Ex: 10000"
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1A6CC8]/20 focus:border-[#1A6CC8]"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Tarif premium</label>
                                <input
                                    type="number"
                                    value={newRate.premiumRate || ""}
                                    onChange={(e) => setNewRate((r) => ({ ...r, premiumRate: Number(e.target.value) }))}
                                    placeholder="Ex: 15000"
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1A6CC8]/20 focus:border-[#1A6CC8]"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end mt-3">
                            <button
                                onClick={handleAddRate}
                                className="px-4 py-2 text-sm font-semibold text-white bg-[#1A6CC8] rounded-lg hover:bg-[#0D2D5A]"
                            >
                                Ajouter ce tarif
                            </button>
                        </div>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="text-left px-6 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">
                                    Matière
                                </th>
                                <th className="text-center px-6 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">
                                    Tarif standard (FCFA/h)
                                </th>
                                <th className="text-center px-6 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">
                                    Tarif premium (FCFA/h)
                                </th>
                                <th className="text-right px-6 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {settings.hourlyRates.map((rate, index) => (
                                <tr
                                    key={rate.id}
                                    className={`border-b border-gray-50 ${index % 2 === 0 ? "" : "bg-gray-50/30"}`}
                                >
                                    <td className="px-6 py-3">
                                        <input
                                            type="text"
                                            value={rate.label}
                                            onChange={(e) =>
                                                handleRateChange(rate.id, "label", e.target.value)
                                            }
                                            className="w-full border border-transparent hover:border-gray-200 focus:border-gray-200 bg-transparent rounded-lg px-3 py-1.5 text-sm font-medium text-[#0D2D5A] focus:outline-none focus:ring-2 focus:ring-[#1A6CC8]/20"
                                        />
                                    </td>
                                    <td className="px-6 py-3 text-center">
                                        <input
                                            type="number"
                                            value={rate.baseRate}
                                            onChange={(e) =>
                                                handleRateChange(rate.id, "baseRate", e.target.value)
                                            }
                                            className="w-28 text-center border border-transparent hover:border-gray-200 focus:border-gray-200 bg-transparent rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#1A6CC8]/20 focus:border-[#1A6CC8]"
                                        />
                                    </td>
                                    <td className="px-6 py-3 text-center">
                                        <input
                                            type="number"
                                            value={rate.premiumRate}
                                            onChange={(e) =>
                                                handleRateChange(rate.id, "premiumRate", e.target.value)
                                            }
                                            className="w-28 text-center border border-transparent hover:border-gray-200 focus:border-gray-200 bg-transparent rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#F5A623]/20 focus:border-[#F5A623]"
                                        />
                                    </td>
                                    <td className="px-6 py-3 text-right">
                                        <button
                                            onClick={() => removeRate(rate.id)}
                                            className="text-red-500 hover:bg-red-50 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#F5A623]/10 flex items-center justify-center">
                            <MapPin className="w-4 h-4 text-[#F5A623]" />
                        </div>
                        <div>
                            <h2 className="font-bold text-[#0D2D5A] text-sm">Centres et antennes</h2>
                            <p className="text-xs text-gray-400">
                                {settings.centers.length} centres enregistrés
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setAddingCenter((prev) => !prev)}
                        className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[#1A6CC8] text-[#1A6CC8] hover:bg-[#1A6CC8]/5 transition-colors inline-flex items-center gap-1 w-max"
                    >
                        {addingCenter ? (
                            <>
                                <X className="w-3 h-3" /> Annuler
                            </>
                        ) : (
                            <>
                                <Plus className="w-3 h-3" /> Ajouter un centre
                            </>
                        )}
                    </button>
                </div>

                {addingCenter && (
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/60">
                        <div className="grid gap-3 md:grid-cols-4">
                            <input
                                type="text"
                                value={newCenter.name}
                                onChange={(e) => setNewCenter((c) => ({ ...c, name: e.target.value }))}
                                placeholder="Nom du centre"
                                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1A6CC8]/20 focus:border-[#1A6CC8]"
                            />
                            <input
                                type="text"
                                value={newCenter.city}
                                onChange={(e) => setNewCenter((c) => ({ ...c, city: e.target.value }))}
                                placeholder="Ville"
                                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1A6CC8]/20 focus:border-[#1A6CC8]"
                            />
                            <input
                                type="text"
                                value={newCenter.address}
                                onChange={(e) =>
                                    setNewCenter((c) => ({ ...c, address: e.target.value }))
                                }
                                placeholder="Adresse complète"
                                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1A6CC8]/20 focus:border-[#1A6CC8]"
                            />
                            <label className="flex items-center gap-2 text-sm text-gray-600">
                                <input
                                    type="checkbox"
                                    checked={newCenter.active}
                                    onChange={(e) =>
                                        setNewCenter((c) => ({ ...c, active: e.target.checked }))
                                    }
                                    className="w-4 h-4 accent-[#1A6CC8]"
                                />
                                Activer immédiatement
                            </label>
                        </div>
                        <div className="flex justify-end mt-3">
                            <button
                                onClick={handleAddCenter}
                                className="px-4 py-2 text-sm font-semibold text-white bg-[#1A6CC8] rounded-lg hover:bg-[#0D2D5A]"
                            >
                                Ajouter ce centre
                            </button>
                        </div>
                    </div>
                )}

                <div className="divide-y divide-gray-50">
                    {settings.centers.map((center) => (
                        <div
                            key={center.id}
                            className="flex flex-col gap-4 md:flex-row md:items-center md:gap-4 px-6 py-4 hover:bg-gray-50/50 transition-colors"
                        >
                            <div className="w-10 h-10 rounded-xl bg-[#0D2D5A]/10 flex items-center justify-center flex-shrink-0">
                                <MapPin className="w-5 h-5 text-[#0D2D5A]" />
                            </div>
                            {editingCenterId === center.id ? (
                                <div className="flex-1 w-full grid md:grid-cols-3 gap-3">
                                    <input
                                        type="text"
                                        value={center.name}
                                        onChange={(e) =>
                                            updateCenter(center.id, { name: e.target.value })
                                        }
                                        className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1A6CC8]/20 focus:border-[#1A6CC8]"
                                    />
                                    <input
                                        type="text"
                                        value={center.city}
                                        onChange={(e) =>
                                            updateCenter(center.id, { city: e.target.value })
                                        }
                                        className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1A6CC8]/20 focus:border-[#1A6CC8]"
                                    />
                                    <input
                                        type="text"
                                        value={center.address}
                                        onChange={(e) =>
                                            updateCenter(center.id, { address: e.target.value })
                                        }
                                        className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1A6CC8]/20 focus:border-[#1A6CC8]"
                                    />
                                </div>
                            ) : (
                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-[#0D2D5A] text-sm">{center.name}</div>
                                    <div className="text-xs text-gray-400">
                                        {center.address} · {center.city}
                                    </div>
                                </div>
                            )}
                            <label className="flex items-center gap-2 text-xs font-semibold">
                                <input
                                    type="checkbox"
                                    checked={center.active}
                                    onChange={(e) =>
                                        updateCenter(center.id, { active: e.target.checked })
                                    }
                                    className="w-4 h-4 accent-[#1A6CC8]"
                                />
                                <span
                                    className={`px-3 py-1 rounded-full ${center.active ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-400"
                                        }`}
                                >
                                    {center.active ? "Actif" : "Inactif"}
                                </span>
                            </label>
                            <div className="flex items-center gap-2 text-xs font-medium text-[#1A6CC8]">
                                <button
                                    onClick={() =>
                                        setEditingCenterId((prev) => (prev === center.id ? null : center.id))
                                    }
                                    className="hover:underline"
                                >
                                    {editingCenterId === center.id ? "Terminer" : "Modifier"}
                                </button>
                                <button onClick={() => removeCenter(center.id)} className="text-red-500 hover:underline">
                                    Supprimer
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-8 h-8 rounded-lg bg-[#a855f7]/10 flex items-center justify-center">
                            <Bell className="w-4 h-4 text-[#a855f7]" />
                        </div>
                        <div>
                            <h2 className="font-bold text-[#0D2D5A] text-sm">Notifications</h2>
                            <p className="text-xs text-gray-400">Alertes et rappels automatiques</p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        {settings.notifications.map((notification) => (
                            <label
                                key={notification.key}
                                className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 cursor-pointer group"
                            >
                                <span className="text-sm text-gray-700 group-hover:text-[#0D2D5A] transition-colors">
                                    {notification.label}
                                </span>
                                <input
                                    type="checkbox"
                                    checked={notification.enabled}
                                    onChange={() => toggleNotification(notification)}
                                    className="w-4 h-4 accent-[#1A6CC8] cursor-pointer"
                                />
                            </label>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-8 h-8 rounded-lg bg-[#22c55e]/10 flex items-center justify-center">
                            <Shield className="w-4 h-4 text-[#22c55e]" />
                        </div>
                        <div>
                            <h2 className="font-bold text-[#0D2D5A] text-sm">Sécurité & Accès</h2>
                            <p className="text-xs text-gray-400">Gestion des accès et mots de passe</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">
                                Délai d'expiration de session
                            </label>
                            <select
                                value={settings.security.sessionTimeout}
                                onChange={(e) =>
                                    handleSecurityChange("sessionTimeout", e.target.value as SessionTimeoutOption)
                                }
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A6CC8]/20 text-[#0D2D5A]"
                            >
                                {SESSION_TIMEOUTS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">
                                Politique de mot de passe
                            </label>
                            <select
                                value={settings.security.passwordPolicy}
                                onChange={(e) =>
                                    handleSecurityChange("passwordPolicy", e.target.value as PasswordPolicyOption)
                                }
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A6CC8]/20 text-[#0D2D5A]"
                            >
                                {PASSWORD_POLICIES.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">
                                Double authentification (2FA)
                            </label>
                            <div className="flex items-center gap-3 py-2 px-3 bg-gray-50 rounded-lg">
                                <input
                                    type="checkbox"
                                    id="2fa"
                                    checked={settings.security.enforce2FA}
                                    onChange={(e) => handleSecurityChange("enforce2FA", e.target.checked)}
                                    className="w-4 h-4 accent-[#1A6CC8]"
                                />
                                <label htmlFor="2fa" className="text-sm text-gray-700 cursor-pointer">
                                    Activer pour les comptes admin
                                </label>
                            </div>
                        </div>
                        <div className="pt-2">
                            <div className="flex items-center gap-2 px-3 py-2 bg-[#22c55e]/5 border border-[#22c55e]/20 rounded-lg">
                                <Settings2 className="w-4 h-4 text-[#22c55e]" />
                                <span className="text-xs text-[#22c55e] font-medium">
                                    Aucune intrusion détectée — Système OK
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
