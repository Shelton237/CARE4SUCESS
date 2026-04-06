import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { BookOpen, FileText, Video, Link2, Image, Loader2, Search } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "/api";

const SUBJECTS = ["Mathématiques","Français","Anglais","Physique-Chimie","SVT","Histoire-Géo","Informatique","Autre"];
const LEVELS = ["Primaire","Collège","Lycée","Prépa/Supérieur","Tous niveaux"];
const TYPE_ICONS: Record<string, any> = { pdf: FileText, video: Video, link: Link2, image: Image };
const TYPE_COLORS: Record<string, string> = {
    pdf: "text-red-500 bg-red-50",
    video: "text-purple-500 bg-purple-50",
    link: "text-blue-500 bg-blue-50",
    image: "text-emerald-500 bg-emerald-50",
};

export default function StudentResources() {
    const { token } = useAuth();
    const [filterSubject, setFilterSubject] = useState("");
    const [filterLevel, setFilterLevel] = useState("");
    const [search, setSearch] = useState("");

    const { data: resources = [], isLoading } = useQuery({
        queryKey: ["resources", filterSubject, filterLevel],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filterSubject) params.set("subject", filterSubject);
            if (filterLevel) params.set("level", filterLevel);
            const res = await fetch(`${API}/resources?${params}`, { headers: { Authorization: `Bearer ${token}` } });
            return res.json();
        },
        enabled: !!token,
    });

    const filtered = (resources as any[]).filter((r: any) =>
        !search || r.title.toLowerCase().includes(search.toLowerCase()) || r.subject.toLowerCase().includes(search.toLowerCase())
    );

    const handleOpen = async (r: any) => {
        await fetch(`${API}/resources/${r.id}/download`, { method: "PATCH" }).catch(() => {});
        window.open(r.file_url, "_blank");
    };

    return (
        <div className="p-4 md:p-6 space-y-6 bg-white min-h-screen font-sans text-[#0D2D5A]">
            <div className="border-b border-slate-100 pb-4">
                <h1 className="text-xl font-black text-[#0D2D5A] uppercase tracking-tight flex items-center gap-3">
                    Bibliothèque <BookOpen className="w-5 h-5 text-[#1A6CC8]" />
                </h1>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                    Ressources pédagogiques mises à disposition par vos professeurs
                </p>
            </div>

            {/* Recherche & filtres */}
            <div className="space-y-3">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Rechercher une ressource..."
                        className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-[#1A6CC8]"
                    />
                </div>
                <div className="flex gap-2 flex-wrap">
                    <button onClick={() => setFilterSubject("")} className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg border transition-colors ${!filterSubject ? "bg-[#0D2D5A] text-white border-[#0D2D5A]" : "text-slate-400 border-slate-200"}`}>Toutes matières</button>
                    {SUBJECTS.map(s => (
                        <button key={s} onClick={() => setFilterSubject(s === filterSubject ? "" : s)} className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg border transition-colors ${filterSubject === s ? "bg-[#1A6CC8] text-white border-[#1A6CC8]" : "text-slate-400 border-slate-200"}`}>{s}</button>
                    ))}
                </div>
                <div className="flex gap-2 flex-wrap">
                    {LEVELS.map(l => (
                        <button key={l} onClick={() => setFilterLevel(l === filterLevel ? "" : l)} className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg border transition-colors ${filterLevel === l ? "bg-emerald-500 text-white border-emerald-500" : "text-slate-400 border-slate-200"}`}>{l}</button>
                    ))}
                </div>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-[#1A6CC8]/30" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="py-20 text-center border-2 border-dashed border-slate-100">
                    <BookOpen className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Aucune ressource disponible</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filtered.map((r: any) => {
                        const Icon = TYPE_ICONS[r.type] || FileText;
                        const colorClass = TYPE_COLORS[r.type] || "text-gray-500 bg-gray-50";
                        return (
                            <button
                                key={r.id}
                                onClick={() => handleOpen(r)}
                                className="border border-slate-100 hover:border-[#1A6CC8]/40 hover:shadow-sm transition-all text-left p-3 group"
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[11px] font-black text-[#0D2D5A] leading-tight line-clamp-2">{r.title}</p>
                                        <div className="flex items-center gap-1.5 mt-1">
                                            <span className="text-[8px] font-bold text-[#1A6CC8] bg-blue-50 px-1.5 py-0.5 rounded">{r.subject}</span>
                                            <span className="text-[8px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">{r.level}</span>
                                        </div>
                                        {r.description && <p className="text-[9px] text-slate-400 mt-1 line-clamp-1">{r.description}</p>}
                                        <p className="text-[8px] text-slate-300 mt-1.5">{r.teacher_name} · {r.downloads} ouverture{r.downloads !== 1 ? "s" : ""}</p>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
