import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
    Users, CalendarDays, GraduationCap, ChevronRight,
    Search, X, Phone, BookOpen, Clock, GitMerge, Loader2,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchAdvisorFamilies } from "@/api/backoffice";

interface Family {
    id: string;
    parent: string;
    child: string;
    level: string;
    subject?: string;
    teacher: string;
    nextRdv: string;
    status: string;
}

const STATUS_COLOR: Record<string, string> = {
    "suivi actif": "bg-green-50  text-green-600  border-green-200",
    "matching": "bg-blue-50   text-blue-600   border-blue-200",
    "bilan planifié": "bg-[#F5A623]/10 text-[#F5A623] border-[#F5A623]/30",
    "nouveau": "bg-purple-50 text-purple-600 border-purple-200",
};

function SkeletonCard() {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
            <div className="flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gray-100 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-100 rounded w-2/3" />
                    <div className="h-3 bg-gray-100 rounded w-1/3" />
                    <div className="h-3 bg-gray-100 rounded w-1/2 mt-3" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
            </div>
        </div>
    );
}

function FamilyPanel({
    family,
    onClose,
    onAssign,
    onContact,
    onSchedule,
}: {
    family: Family;
    onClose: () => void;
    onAssign: (f: Family) => void;
    onContact: (f: Family) => void;
    onSchedule: (f: Family) => void;
}) {
    const { toast } = useToast();
    const [note, setNote] = useState("");
    const [noteSaved, setNoteSaved] = useState(false);
    const needsTeacher = !family.teacher || family.teacher === "—";

    const saveNote = () => {
        if (!note.trim()) return;
        setNoteSaved(true);
        setTimeout(() => setNoteSaved(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/25 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white w-full max-w-md shadow-2xl flex flex-col" style={{ animation: "slideInRight 0.25s ease" }}>
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-[#a855f7]/10 flex items-center justify-center text-xl font-bold text-[#a855f7]">
                            {family.child[0]}
                        </div>
                        <div>
                            <div className="font-bold text-[#0D2D5A] text-lg leading-tight">{family.child}</div>
                            <div className="text-sm text-gray-500">{family.level}</div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    <span className={`inline-flex text-sm font-bold px-3 py-1.5 rounded-full border ${STATUS_COLOR[family.status] ?? "bg-gray-100 text-gray-500 border-gray-200"}`}>
                        {family.status}
                    </span>

                    <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Informations</p>
                        <div className="flex items-center gap-3 text-sm">
                            <Users className="w-4 h-4 text-[#a855f7] flex-shrink-0" />
                            <span className="text-gray-500">Parent :</span>
                            <span className="font-semibold text-[#0D2D5A]">{family.parent}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <GraduationCap className="w-4 h-4 text-[#a855f7] flex-shrink-0" />
                            <span className="text-gray-500">Enseignant :</span>
                            {needsTeacher
                                ? <span className="font-semibold text-[#F5A623]">À assigner</span>
                                : <span className="font-semibold text-[#0D2D5A]">{family.teacher}</span>}
                        </div>
                        {family.subject && (
                            <div className="flex items-center gap-3 text-sm">
                                <BookOpen className="w-4 h-4 text-[#a855f7] flex-shrink-0" />
                                <span className="text-gray-500">Matière :</span>
                                <span className="font-semibold text-[#0D2D5A]">{family.subject}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-3 text-sm">
                            <CalendarDays className="w-4 h-4 text-[#a855f7] flex-shrink-0" />
                            <span className="text-gray-500">Prochain RDV :</span>
                            {family.nextRdv && family.nextRdv !== "—"
                                ? <span className="font-semibold text-[#0D2D5A]">{family.nextRdv}</span>
                                : <span className="text-gray-400 italic">Non planifié</span>}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Actions rapides</p>
                        <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => onContact(family)} className="flex items-center gap-2 justify-center p-3 rounded-xl bg-[#a855f7]/10 text-[#a855f7] hover:bg-[#a855f7]/20 font-semibold text-sm transition-colors">
                                <Phone className="w-4 h-4" /> Contacter
                            </button>
                            <button onClick={() => onSchedule(family)} className="flex items-center gap-2 justify-center p-3 rounded-xl bg-[#1A6CC8]/10 text-[#1A6CC8] hover:bg-[#1A6CC8]/20 font-semibold text-sm transition-colors">
                                <CalendarDays className="w-4 h-4" /> Planifier RDV
                            </button>
                            {needsTeacher || family.status === "matching" || family.status === "nouveau" ? (
                                <button onClick={() => onAssign(family)} className="col-span-2 flex items-center gap-2 justify-center p-3 rounded-xl bg-green-50 text-green-700 hover:bg-green-100 font-semibold text-sm transition-colors">
                                    <GitMerge className="w-4 h-4" /> Assigner un enseignant
                                </button>
                            ) : (
                                <button onClick={() => toast({ title: "Bilan planifié", description: "La planification de bilan a été initiée." })} className="col-span-2 flex items-center gap-2 justify-center p-3 rounded-xl bg-orange-50 text-orange-600 hover:bg-orange-100 font-semibold text-sm transition-colors">
                                    <Clock className="w-4 h-4" /> Planifier un bilan
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="bg-[#a855f7]/5 border border-[#a855f7]/15 rounded-xl p-4">
                        <p className="text-xs font-bold text-[#a855f7] uppercase tracking-wider mb-2">Note conseiller</p>
                        <textarea
                            placeholder="Ajouter une note sur cette famille…"
                            rows={3}
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            className="w-full bg-transparent text-sm text-gray-600 placeholder-gray-400 resize-none focus:outline-none"
                        />
                        <div className="flex items-center justify-end mt-2 gap-2">
                            {noteSaved && <span className="text-xs text-green-600 font-semibold">✓ Sauvegardé</span>}
                            <button onClick={saveNote} className="text-xs font-bold px-3 py-1.5 rounded-lg bg-[#a855f7] text-white hover:bg-[#9333ea] transition-colors"> Sauvegarder </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function AdvisorFamilies() {
    const navigate = useNavigate();
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [selected, setSelected] = useState<Family | null>(null);

    const { data: families = [], isLoading } = useQuery({
        queryKey: ["advisorFamilies"],
        queryFn: fetchAdvisorFamilies
    });

    const handleAssign = (f: Family) => {
        setSelected(null);
        navigate("/advisor/matching", {
            state: { childName: f.child, level: f.level, subject: f.subject },
        });
    };

    const handleContact = (f: Family) => {
        setSelected(null);
        navigate("/advisor/messages", {
            state: { contactName: f.parent, defaultRole: "parent" },
        });
    };

    const handleSchedule = (f: Family) => {
        setSelected(null);
        navigate("/advisor/schedule", {
            state: { familyName: `${f.parent} (${f.child})` },
        });
    };

    const filtered = families.filter((f: Family) => {
        const q = search.toLowerCase();
        const matchSearch =
            !q ||
            f.child.toLowerCase().includes(q) ||
            f.parent.toLowerCase().includes(q) ||
            (f.teacher || "").toLowerCase().includes(q) ||
            (f.subject ?? "").toLowerCase().includes(q);
        const matchStatus = !statusFilter || f.status === statusFilter;
        return matchSearch && matchStatus;
    });

    return (
        <>
            <div className="p-8 space-y-6">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-2xl font-bold text-[#0D2D5A]">Mes familles</h1>
                        <p className="text-gray-500 text-sm mt-1">
                            {isLoading ? "Chargement…" : `${filtered.length} famille${filtered.length > 1 ? "s" : ""} affichée${filtered.length > 1 ? "s" : ""} · ${families.length} total`}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {Object.entries(STATUS_COLOR).map(([label, cls]) => (
                            <button
                                key={label}
                                onClick={() => setStatusFilter(statusFilter === label ? null : label)}
                                className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all
                                    ${statusFilter === label
                                        ? `${cls} ring-2 ring-offset-1 ring-current scale-105`
                                        : `${cls} opacity-60 hover:opacity-100`}`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Rechercher par enfant, parent, enseignant ou matière…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#a855f7]/30 focus:border-[#a855f7] transition-all"
                    />
                    {search && (
                        <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {isLoading ? (
                    <div className="grid lg:grid-cols-2 gap-4">
                        {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20 text-gray-400">
                        <Users className="w-16 h-16 opacity-10 mx-auto mb-4" />
                        <p className="font-semibold text-gray-500">Aucune famille trouvée</p>
                    </div>
                ) : (
                    <div className="grid lg:grid-cols-2 gap-4">
                        {filtered.map((f: Family) => (
                            <button
                                key={f.id}
                                onClick={() => setSelected(f)}
                                className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-[#a855f7]/30 transition-all p-5 flex items-start gap-4 group cursor-pointer text-left w-full"
                            >
                                <div className="w-12 h-12 rounded-2xl bg-[#a855f7]/10 flex items-center justify-center text-lg font-bold text-[#a855f7] flex-shrink-0">
                                    {f.child[0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <div className="font-bold text-[#0D2D5A]">{f.child}</div>
                                            <div className="text-xs text-gray-400 mt-0.5">
                                                {f.level}{f.subject ? ` · ${f.subject}` : ""}
                                            </div>
                                        </div>
                                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border whitespace-nowrap flex-shrink-0 ${STATUS_COLOR[f.status] ?? "bg-gray-100 text-gray-500 border-gray-200"}`}>
                                            {f.status}
                                        </span>
                                    </div>
                                    <div className="mt-3 space-y-1.5">
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <Users className="w-3.5 h-3.5 text-gray-300" />
                                            <span className="font-medium text-gray-600">Parent :</span> {f.parent}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <GraduationCap className="w-3.5 h-3.5 text-gray-300" />
                                            <span className="font-medium text-gray-600">Enseignant :</span>
                                            {f.teacher && f.teacher !== "—" ? f.teacher : <span className="text-[#F5A623] font-semibold">À assigner</span>}
                                        </div>
                                    </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-200 group-hover:text-[#a855f7] transition-colors mt-1 flex-shrink-0" />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {selected && (
                <FamilyPanel
                    family={selected}
                    onClose={() => setSelected(null)}
                    onAssign={handleAssign}
                    onContact={handleContact}
                    onSchedule={handleSchedule}
                />
            )}
        </>
    );
}
