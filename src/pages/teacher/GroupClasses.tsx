import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Loader2, Users, Calendar, Clock, Trash2, Link2 } from "lucide-react";
import {
    createGroupClass, fetchTeacherGroupClasses, cancelGroupClass,
    type CreateGroupClassPayload,
} from "@/api/backoffice";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

const SUBJECTS = ["Mathématiques", "Français", "Physique-Chimie", "SVT", "Histoire-Géo", "Anglais", "Philosophie", "Informatique", "Économie", "Autre"];

export default function TeacherGroupClasses() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [showCreate, setShowCreate] = useState(false);

    const { data: groupClasses = [], isLoading } = useQuery({
        queryKey: ["group-classes", "teacher", user?.id],
        queryFn: () => fetchTeacherGroupClasses(user!.id),
        enabled: !!user?.id,
    });

    const teacherCurrency = groupClasses[0]?.currency || "XAF";

    const cancelMutation = useMutation({
        mutationFn: cancelGroupClass,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["group-classes", "teacher"] });
            toast.success("Cours groupé annulé.");
        },
    });

    const handleCopyLink = (url: string) => {
        navigator.clipboard.writeText(url);
        toast.success("Lien copié !");
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-[#1A6CC8]/40" />
            </div>
        );
    }

    return (
        <div className="w-full p-3 space-y-3 bg-white min-h-screen">
            <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-xl font-black text-[#0D2D5A] uppercase tracking-tight">Cours groupés</h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                        Séances payantes à capacité limitée, partagées via un lien public
                    </p>
                </div>
                <Button
                    onClick={() => setShowCreate(true)}
                    className="bg-[#1A6CC8] hover:bg-[#0D2D5A] h-8 px-4 rounded-none shadow-none font-black text-[9px] uppercase tracking-widest shrink-0"
                >
                    <Plus className="mr-1.5 w-3.5 h-3.5" /> Créer un cours groupé
                </Button>
            </div>

            {groupClasses.length === 0 ? (
                <div className="py-16 text-center border-2 border-dashed border-slate-200">
                    <Users className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4">Aucun cours groupé créé</p>
                    <Button
                        onClick={() => setShowCreate(true)}
                        className="bg-[#1A6CC8] hover:bg-[#0D2D5A] h-8 px-4 rounded-none shadow-none font-black text-[9px] uppercase tracking-widest"
                    >
                        <Plus className="mr-1.5 w-3 h-3" /> Créer mon premier cours groupé
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {groupClasses.map((gc) => (
                        <div key={gc.id} className="border border-slate-200 bg-white overflow-hidden flex flex-col">
                            <div className="p-3 space-y-2 flex-1 flex flex-col">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <p className="text-[9px] font-black text-[#1A6CC8] uppercase tracking-widest truncate">{gc.subject}</p>
                                        <h3 className="text-[12px] font-black text-[#0D2D5A] uppercase tracking-tight leading-tight mt-0.5">{gc.title}</h3>
                                    </div>
                                    <span className={cn(
                                        "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 shrink-0",
                                        gc.status === "scheduled" ? "bg-[#0D2D5A] text-white" : "bg-slate-200 text-slate-500"
                                    )}>
                                        {gc.status === "scheduled" ? "Programmé" : "Annulé"}
                                    </span>
                                </div>

                                <div className="flex flex-wrap gap-3 py-2 border-y border-slate-100">
                                    <span className="flex items-center gap-1 text-[9px] text-slate-400 font-black uppercase">
                                        <Calendar className="w-3 h-3" /> {gc.sessionDate}
                                    </span>
                                    <span className="flex items-center gap-1 text-[9px] text-slate-400 font-black uppercase">
                                        <Clock className="w-3 h-3" /> {gc.sessionTime}
                                    </span>
                                    <span className="flex items-center gap-1 text-[9px] text-slate-400 font-black uppercase">
                                        <Users className="w-3 h-3" /> {gc.paidCount ?? 0}/{gc.maxParticipants} inscrit{gc.maxParticipants > 1 ? "s" : ""}
                                    </span>
                                </div>

                                <p className="text-[11px] font-black text-[#0D2D5A]">
                                    {formatMoney(gc.price, gc.currency)} <span className="text-[9px] text-slate-400 font-bold">/ participant</span>
                                </p>

                                <div className="flex gap-2 mt-auto pt-2">
                                    <Button
                                        onClick={() => handleCopyLink(gc.publicUrl)}
                                        variant="outline"
                                        className="flex-1 h-8 rounded-none border-slate-200 shadow-none font-black text-[9px] uppercase tracking-widest gap-1.5"
                                    >
                                        <Link2 className="w-3 h-3" /> Copier le lien
                                    </Button>
                                    {gc.status === "scheduled" && (
                                        <button
                                            onClick={() => { if (confirm("Annuler ce cours groupé ?")) cancelMutation.mutate(gc.id); }}
                                            disabled={cancelMutation.isPending}
                                            className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-red-400 border border-slate-200 transition-colors shrink-0"
                                            title="Annuler"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <CreateGroupClassDialog open={showCreate} onClose={() => setShowCreate(false)} teacherCurrency={teacherCurrency} />
        </div>
    );
}

function CreateGroupClassDialog({ open, onClose, teacherCurrency }: { open: boolean; onClose: () => void; teacherCurrency: string }) {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const [form, setForm] = useState({
        title: "", subject: "", description: "", sessionDate: "", sessionTime: "", price: "", maxParticipants: "10",
    });

    const createMutation = useMutation({
        mutationFn: (payload: CreateGroupClassPayload) => createGroupClass(payload),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["group-classes", "teacher", user?.id] });
            toast.success("Cours groupé créé !");
            navigator.clipboard.writeText(data.publicUrl);
            toast.info("Le lien public a été copié dans le presse-papiers.");
            setForm({ title: "", subject: "", description: "", sessionDate: "", sessionTime: "", price: "", maxParticipants: "10" });
            onClose();
        },
        onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Erreur lors de la création."),
    });

    const handleSubmit = () => {
        if (!form.title.trim() || !form.subject || !form.sessionDate || !form.sessionTime || !form.price || !form.maxParticipants) {
            toast.error("Merci de remplir tous les champs obligatoires.");
            return;
        }
        createMutation.mutate({
            title: form.title.trim(),
            subject: form.subject,
            description: form.description.trim() || undefined,
            sessionDate: form.sessionDate,
            sessionTime: form.sessionTime,
            price: parseFloat(form.price),
            maxParticipants: parseInt(form.maxParticipants, 10),
        });
    };

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="sm:max-w-[500px] rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="text-lg font-black text-[#0D2D5A] uppercase tracking-tight">Créer un cours groupé</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 py-2">
                    <div className="space-y-1.5">
                        <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Titre *</Label>
                        <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: Masterclass Révisions Bac" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Matière *</Label>
                            <select
                                value={form.subject}
                                onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                                className="w-full h-10 bg-slate-50/50 px-3 border border-slate-200 rounded-md font-bold text-[12px] text-[#0D2D5A] outline-none focus:border-[#1A6CC8]"
                            >
                                <option value="">— Choisir —</option>
                                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Places max *</Label>
                            <Input type="number" min="1" value={form.maxParticipants} onChange={e => setForm(f => ({ ...f, maxParticipants: e.target.value }))} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Date *</Label>
                            <Input type="date" value={form.sessionDate} onChange={e => setForm(f => ({ ...f, sessionDate: e.target.value }))} />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Heure *</Label>
                            <Input type="time" value={form.sessionTime} onChange={e => setForm(f => ({ ...f, sessionTime: e.target.value }))} />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tarif par participant ({teacherCurrency}) *</Label>
                        <Input type="number" min="1" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Description (optionnel)</Label>
                        <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="Programme, objectifs, prérequis..." />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={onClose}>Annuler</Button>
                    <Button onClick={handleSubmit} disabled={createMutation.isPending} className="bg-[#1A6CC8] hover:bg-[#0D2D5A]">
                        {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Créer"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
