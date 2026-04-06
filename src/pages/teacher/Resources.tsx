import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Upload, FileText, Video, Link2, Image, Trash2, Loader2, BookOpen, PlusCircle, X } from "lucide-react";
import { toast } from "sonner";

const API = import.meta.env.VITE_API_URL || "/api";

const SUBJECTS = ["Mathématiques","Français","Anglais","Physique-Chimie","SVT","Histoire-Géo","Informatique","Autre"];
const LEVELS = ["Primaire","Collège","Lycée","Prépa/Supérieur","Tous niveaux"];
const TYPE_ICONS: Record<string, any> = { pdf: FileText, video: Video, link: Link2, image: Image };
const TYPE_COLORS: Record<string, string> = { pdf: "text-red-500 bg-red-50", video: "text-purple-500 bg-purple-50", link: "text-blue-500 bg-blue-50", image: "text-emerald-500 bg-emerald-50" };

export default function TeacherResources() {
    const { user, token } = useAuth();
    const qc = useQueryClient();
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ title: "", description: "", subject: "", level: "", type: "pdf", fileUrl: "" });
    const [file, setFile] = useState<File | null>(null);
    const [filterSubject, setFilterSubject] = useState("");

    const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
        setForm(f => ({ ...f, [k]: e.target.value }));

    const { data: resources = [], isLoading } = useQuery({
        queryKey: ["resources", filterSubject],
        queryFn: async () => {
            const params = filterSubject ? `?subject=${encodeURIComponent(filterSubject)}` : "";
            const res = await fetch(`${API}/resources${params}`, { headers: { Authorization: `Bearer ${token}` } });
            return res.json();
        },
        enabled: !!token,
    });

    const addMutation = useMutation({
        mutationFn: async () => {
            const fd = new FormData();
            Object.entries(form).forEach(([k, v]) => fd.append(k, v));
            if (file) fd.append("file", file);
            const res = await fetch(`${API}/resources`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: fd,
            });
            if (!res.ok) throw new Error();
            return res.json();
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["resources"] });
            setForm({ title: "", description: "", subject: "", level: "", type: "pdf", fileUrl: "" });
            setFile(null);
            setShowForm(false);
            toast.success("Ressource ajoutée !");
        },
        onError: () => toast.error("Erreur lors de l'ajout"),
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await fetch(`${API}/resources/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["resources"] }),
    });

    const myResources = (resources as any[]).filter((r: any) => r.teacher_id === user?.id);
    const othersResources = (resources as any[]).filter((r: any) => r.teacher_id !== user?.id);

    return (
        <div className="p-4 md:p-6 space-y-6 bg-white min-h-screen font-sans text-[#0D2D5A]">
            <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-black text-[#0D2D5A] uppercase tracking-tight flex items-center gap-3">
                        Ressources Pédagogiques <BookOpen className="w-5 h-5 text-[#1A6CC8]" />
                    </h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                        {(resources as any[]).length} ressource{(resources as any[]).length !== 1 ? "s" : ""} disponible{(resources as any[]).length !== 1 ? "s" : ""}
                    </p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 h-9 px-4 bg-[#0D2D5A] text-white text-[9px] font-black uppercase tracking-widest rounded-lg"
                >
                    <PlusCircle className="w-3.5 h-3.5" /> Ajouter
                </button>
            </div>

            {/* Filtre */}
            <div className="flex gap-2 flex-wrap">
                <button onClick={() => setFilterSubject("")} className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg border transition-colors ${!filterSubject ? "bg-[#0D2D5A] text-white border-[#0D2D5A]" : "text-slate-400 border-slate-200"}`}>Tout</button>
                {SUBJECTS.map(s => (
                    <button key={s} onClick={() => setFilterSubject(s)} className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg border transition-colors ${filterSubject === s ? "bg-[#1A6CC8] text-white border-[#1A6CC8]" : "text-slate-400 border-slate-200"}`}>{s}</button>
                ))}
            </div>

            {/* Formulaire ajout */}
            {showForm && (
                <div className="border border-[#1A6CC8]/20 rounded-xl p-4 bg-blue-50/30 space-y-3">
                    <div className="flex items-center justify-between">
                        <p className="text-[10px] font-black text-[#1A6CC8] uppercase tracking-widest">Nouvelle ressource</p>
                        <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-slate-400" /></button>
                    </div>
                    <input value={form.title} onChange={set("title")} placeholder="Titre *" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1A6CC8]" />
                    <textarea value={form.description} onChange={set("description")} placeholder="Description (optionnel)" rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1A6CC8] resize-none" />
                    <div className="grid grid-cols-3 gap-2">
                        <select value={form.subject} onChange={set("subject")} className="border border-gray-200 rounded-lg px-2 py-2 text-xs outline-none focus:border-[#1A6CC8] bg-white">
                            <option value="">Matière *</option>
                            {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <select value={form.level} onChange={set("level")} className="border border-gray-200 rounded-lg px-2 py-2 text-xs outline-none focus:border-[#1A6CC8] bg-white">
                            <option value="">Niveau *</option>
                            {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                        <select value={form.type} onChange={set("type")} className="border border-gray-200 rounded-lg px-2 py-2 text-xs outline-none focus:border-[#1A6CC8] bg-white">
                            <option value="pdf">PDF</option>
                            <option value="video">Vidéo</option>
                            <option value="link">Lien</option>
                            <option value="image">Image</option>
                        </select>
                    </div>
                    {form.type === "link" ? (
                        <input value={form.fileUrl} onChange={set("fileUrl")} placeholder="URL du lien" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1A6CC8]" />
                    ) : (
                        <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center">
                            <input type="file" id="res-file" className="hidden" accept=".pdf,.png,.jpg,.jpeg,.mp4,.mov" onChange={e => setFile(e.target.files?.[0] || null)} />
                            <label htmlFor="res-file" className="cursor-pointer flex flex-col items-center gap-2">
                                <Upload className="w-6 h-6 text-slate-300" />
                                <span className="text-[10px] font-bold text-slate-400">{file ? file.name : "Cliquer pour choisir un fichier"}</span>
                            </label>
                        </div>
                    )}
                    <button
                        disabled={!form.title || !form.subject || !form.level || addMutation.isPending}
                        onClick={() => addMutation.mutate()}
                        className="w-full h-9 bg-[#0D2D5A] text-white text-[9px] font-black uppercase tracking-widest rounded-lg disabled:opacity-50"
                    >
                        {addMutation.isPending ? "..." : "Publier la ressource"}
                    </button>
                </div>
            )}

            {isLoading ? (
                <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-[#1A6CC8]/30" /></div>
            ) : (
                <div className="space-y-6">
                    {/* Mes ressources */}
                    {myResources.length > 0 && (
                        <div>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Mes ressources ({myResources.length})</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {myResources.map((r: any) => <ResourceCard key={r.id} r={r} onDelete={() => deleteMutation.mutate(r.id)} isOwner />)}
                            </div>
                        </div>
                    )}
                    {/* Ressources des collègues */}
                    {othersResources.length > 0 && (
                        <div>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Bibliothèque partagée ({othersResources.length})</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {othersResources.map((r: any) => <ResourceCard key={r.id} r={r} />)}
                            </div>
                        </div>
                    )}
                    {(resources as any[]).length === 0 && (
                        <div className="py-20 text-center border-2 border-dashed border-slate-100">
                            <BookOpen className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Aucune ressource disponible</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function ResourceCard({ r, onDelete, isOwner }: { r: any; onDelete?: () => void; isOwner?: boolean }) {
    const API = import.meta.env.VITE_API_URL || "/api";
    const Icon = TYPE_ICONS[r.type] || FileText;
    const colorClass = TYPE_COLORS[r.type] || "text-gray-500 bg-gray-50";

    const handleOpen = async () => {
        await fetch(`${API}/resources/${r.id}/download`, { method: "PATCH" }).catch(() => {});
        window.open(r.file_url, "_blank");
    };

    return (
        <div className="border border-slate-100 hover:border-[#1A6CC8]/30 transition-colors p-3 group">
            <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                    <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-black text-[#0D2D5A] leading-tight">{r.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[8px] font-bold text-[#1A6CC8] bg-blue-50 px-1.5 py-0.5 rounded">{r.subject}</span>
                        <span className="text-[8px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">{r.level}</span>
                    </div>
                    {r.description && <p className="text-[9px] text-slate-400 mt-1 line-clamp-1">{r.description}</p>}
                    <div className="flex items-center justify-between mt-2">
                        <span className="text-[8px] text-slate-300">{r.teacher_name} · {r.downloads} télécharg.</span>
                        <div className="flex gap-1">
                            <button onClick={handleOpen} className="text-[8px] font-black text-[#1A6CC8] uppercase tracking-widest">Ouvrir</button>
                            {isOwner && onDelete && (
                                <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 text-red-300 hover:text-red-500 ml-2 transition-opacity">
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
