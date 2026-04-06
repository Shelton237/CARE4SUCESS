import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    UserPlus, Calendar, Star, CheckCircle, XCircle, Clock,
    ChevronRight, Loader2, BookOpen, Send, FileText
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const API = import.meta.env.VITE_API_URL || "/api";

async function fetchApplications(token: string) {
    const res = await fetch(`${API}/teacher-applications`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error();
    return res.json();
}

const LEVELS = ["Primaire", "Collège", "Lycée"];
const SUBJECTS = ["Mathématiques", "Français", "Anglais", "Physique-Chimie", "SVT", "Histoire-Géo", "Philosophie"];

const STATUS_UI: Record<string, { label: string; dot: string }> = {
    pending: { label: "En attente", dot: "bg-[#F5A623]" },
    interview_scheduled: { label: "Entretien planifié", dot: "bg-[#1A6CC8]" },
    approved: { label: "Approuvé", dot: "bg-emerald-500" },
    rejected: { label: "Refusé", dot: "bg-red-500" },
};

export default function TutorTeacherApplications() {
    const { token, user } = useAuth();
    const qc = useQueryClient();
    const [selected, setSelected] = useState<any>(null);
    const [tab, setTab] = useState<"interview" | "evaluation">("interview");

    // Interview form
    const [interviewDate, setInterviewDate] = useState("");
    const [interviewNotes, setInterviewNotes] = useState("");

    // Evaluation form
    const [pedagScore, setPedagScore] = useState(3);
    const [punctScore, setPunctScore] = useState(3);
    const [commScore, setCommScore] = useState(3);
    const [overallNotes, setOverallNotes] = useState("");
    const [recommendation, setRecommendation] = useState("pending_training");
    const [levelClassification, setLevelClassification] = useState<Record<string, string[]>>({});

    const { data: apps = [], isLoading } = useQuery({
        queryKey: ["teacherApplicationsTutor"],
        queryFn: () => fetchApplications(token!),
        enabled: !!token,
    });

    const interviewMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`${API}/teacher-applications/${id}/interview`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ interviewDate, interviewNotes, interviewStatus: "scheduled" })
            });
            if (!res.ok) throw new Error();
            return res.json();
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["teacherApplicationsTutor"] });
            qc.invalidateQueries({ queryKey: ["tutorDashboard"] });
            setInterviewDate("");
            setInterviewNotes("");
        }
    });

    const evalMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`${API}/tutor-evaluations`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    applicationId: selected?.id,
                    teacherName: selected?.full_name,
                    tutorId: user?.id,
                    tutorName: user?.name,
                    pedagogicalScore: pedagScore,
                    punctualityScore: punctScore,
                    communicationScore: commScore,
                    levelClassification,
                    overallNotes,
                    recommendation
                })
            });
            if (!res.ok) throw new Error();
            // Si recommendation=approved, approuver la candidature aussi
            if (recommendation === "approved") {
                await fetch(`${API}/teacher-applications/${selected?.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                    body: JSON.stringify({
                        status: "approved",
                        reviewerName: user?.name,
                        reviewerRole: "tutor",
                        reviewNotes: overallNotes
                    })
                });
            } else if (recommendation === "rejected") {
                await fetch(`${API}/teacher-applications/${selected?.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ status: "rejected", reviewerName: user?.name, reviewerRole: "tutor", reviewNotes: overallNotes })
                });
            }
            return res.json();
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["teacherApplicationsTutor"] });
            qc.invalidateQueries({ queryKey: ["tutorDashboard"] });
            setOverallNotes("");
        }
    });

    const toggleSubjectLevel = (subject: string, level: string) => {
        setLevelClassification(prev => {
            const current = prev[subject] || [];
            const next = current.includes(level)
                ? current.filter(l => l !== level)
                : [...current, level];
            return { ...prev, [subject]: next };
        });
    };

    const ScoreSelector = ({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) => (
        <div className="flex items-center gap-3">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest w-40">{label}</span>
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(n => (
                    <button
                        key={n}
                        onClick={() => onChange(n)}
                        className={`w-8 h-8 text-[11px] font-black border transition-colors ${
                            value >= n ? "bg-[#0D2D5A] text-white border-[#0D2D5A]" : "bg-white text-slate-300 border-slate-200"
                        }`}
                    >
                        {n}
                    </button>
                ))}
            </div>
            <span className="text-[10px] font-bold text-[#1A6CC8]">{value}/5</span>
        </div>
    );

    if (isLoading) return (
        <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="w-8 h-8 animate-spin text-[#1A6CC8]/40" />
        </div>
    );

    return (
        <div className="p-4 md:p-6 space-y-6 bg-white min-h-screen font-sans text-[#0D2D5A]">
            <div className="border-b border-slate-100 pb-4 flex items-center gap-3">
                <UserPlus className="w-5 h-5 text-[#1A6CC8]" />
                <div>
                    <h1 className="text-xl font-black text-[#0D2D5A] uppercase tracking-tight">Candidatures Enseignants</h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Évaluation et qualification pédagogique</p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                {/* Liste candidatures */}
                <div className="xl:col-span-5 space-y-2">
                    {(Array.isArray(apps) ? apps : []).map((a: any) => {
                        const ui = STATUS_UI[a.status] || { label: a.status, dot: "bg-slate-400" };
                        return (
                            <div
                                key={a.id}
                                onClick={() => setSelected(a)}
                                className={`p-4 border cursor-pointer transition-all hover:border-[#1A6CC8]/30 ${
                                    selected?.id === a.id ? "border-[#1A6CC8] bg-[#1A6CC8]/5" : "border-slate-100"
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-[12px] font-black text-[#0D2D5A]">{a.full_name}</div>
                                        <div className="text-[10px] font-bold text-slate-400 mt-0.5">
                                            {(a.subjects || []).slice(0, 3).join(" · ")} — {a.experience_years} ans
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${ui.dot}`} />
                                        <span className="text-[9px] font-black text-slate-400 uppercase">{ui.label}</span>
                                        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {apps.length === 0 && (
                        <div className="py-16 text-center text-[10px] font-black text-slate-300 uppercase tracking-widest border border-dashed border-slate-200">
                            Aucune candidature
                        </div>
                    )}
                </div>

                {/* Panel détail */}
                <div className="xl:col-span-7">
                    {selected ? (
                        <div className="border border-slate-100 h-full">
                            <div className="px-4 py-3 bg-slate-50/50 border-b border-slate-100">
                                <div className="text-[12px] font-black text-[#0D2D5A]">{selected.full_name}</div>
                                <div className="text-[10px] text-slate-400 font-bold mt-0.5">{selected.email} · {selected.phone}</div>
                                <div className="mt-2 text-[10px] font-bold text-slate-600">{selected.motivation}</div>
                            </div>

                            {/* Tabs */}
                            <div className="flex border-b border-slate-100">
                                {([
                                    { key: "interview", label: "Entretien", icon: Calendar },
                                    { key: "evaluation", label: "Rapport d'évaluation", icon: Star }
                                ] as const).map(({ key, label, icon: Icon }) => (
                                    <button
                                        key={key}
                                        onClick={() => setTab(key)}
                                        className={`flex items-center gap-2 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest border-b-2 transition-colors ${
                                            tab === key ? "border-[#1A6CC8] text-[#1A6CC8]" : "border-transparent text-slate-400 hover:text-slate-600"
                                        }`}
                                    >
                                        <Icon className="w-3.5 h-3.5" /> {label}
                                    </button>
                                ))}
                            </div>

                            <div className="p-4 space-y-4">
                                {tab === "interview" ? (
                                    <>
                                        <div className="space-y-3">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Date et heure de l'entretien</label>
                                            <input
                                                type="datetime-local"
                                                value={interviewDate}
                                                onChange={e => setInterviewDate(e.target.value)}
                                                className="w-full border border-slate-200 px-3 py-2 text-[11px] font-bold text-[#0D2D5A] outline-none focus:border-[#1A6CC8]"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Notes préparatoires</label>
                                            <textarea
                                                value={interviewNotes}
                                                onChange={e => setInterviewNotes(e.target.value)}
                                                rows={3}
                                                placeholder="Points à aborder, documents requis..."
                                                className="w-full border border-slate-200 px-3 py-2 text-[11px] font-bold text-[#0D2D5A] outline-none focus:border-[#1A6CC8] resize-none"
                                            />
                                        </div>
                                        {selected.interview_date && (
                                            <div className="bg-[#1A6CC8]/5 border border-[#1A6CC8]/20 p-3">
                                                <div className="text-[9px] font-black text-[#1A6CC8] uppercase tracking-widest">Entretien planifié</div>
                                                <div className="text-[11px] font-black text-[#0D2D5A] mt-1">
                                                    {new Date(selected.interview_date).toLocaleString("fr-FR")}
                                                </div>
                                                {selected.interview_notes && (
                                                    <div className="text-[10px] text-slate-500 mt-1">{selected.interview_notes}</div>
                                                )}
                                            </div>
                                        )}
                                        <Button
                                            disabled={!interviewDate || interviewMutation.isPending}
                                            onClick={() => interviewMutation.mutate(selected.id)}
                                            className="h-8 bg-[#1A6CC8] text-white text-[10px] font-black uppercase tracking-widest rounded-none shadow-none"
                                        >
                                            <Calendar className="w-3.5 h-3.5 mr-2" />
                                            {interviewMutation.isPending ? "Enregistrement..." : "Planifier l'entretien"}
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <div className="space-y-3">
                                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Scores d'évaluation</div>
                                            <ScoreSelector value={pedagScore} onChange={setPedagScore} label="Pédagogie" />
                                            <ScoreSelector value={punctScore} onChange={setPunctScore} label="Ponctualité" />
                                            <ScoreSelector value={commScore} onChange={setCommScore} label="Communication" />
                                        </div>

                                        <div className="space-y-2">
                                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Classification niveau / matière</div>
                                            <div className="grid grid-cols-1 gap-2">
                                                {SUBJECTS.filter(s => (selected.subjects || []).includes(s)).map(subject => (
                                                    <div key={subject} className="flex items-center gap-3">
                                                        <span className="text-[10px] font-black text-[#0D2D5A] w-32">{subject}</span>
                                                        <div className="flex gap-1">
                                                            {LEVELS.map(level => (
                                                                <button
                                                                    key={level}
                                                                    onClick={() => toggleSubjectLevel(subject, level)}
                                                                    className={`px-2 py-1 text-[8px] font-black uppercase tracking-widest border transition-colors ${
                                                                        (levelClassification[subject] || []).includes(level)
                                                                            ? "bg-[#0D2D5A] text-white border-[#0D2D5A]"
                                                                            : "bg-white text-slate-400 border-slate-200"
                                                                    }`}
                                                                >
                                                                    {level}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Recommandation finale</label>
                                            <div className="flex gap-2">
                                                {[
                                                    { value: "approved", label: "Approuver", color: "emerald" },
                                                    { value: "pending_training", label: "Formation complémentaire", color: "blue" },
                                                    { value: "rejected", label: "Refuser", color: "red" },
                                                ].map(r => (
                                                    <button
                                                        key={r.value}
                                                        onClick={() => setRecommendation(r.value)}
                                                        className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest border transition-colors ${
                                                            recommendation === r.value
                                                                ? r.value === "approved" ? "bg-emerald-600 text-white border-emerald-600"
                                                                : r.value === "rejected" ? "bg-red-600 text-white border-red-600"
                                                                : "bg-[#1A6CC8] text-white border-[#1A6CC8]"
                                                                : "bg-white text-slate-400 border-slate-200"
                                                        }`}
                                                    >
                                                        {r.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Rapport d'évaluation</label>
                                            <textarea
                                                value={overallNotes}
                                                onChange={e => setOverallNotes(e.target.value)}
                                                rows={4}
                                                placeholder="Observations, points forts, axes d'amélioration..."
                                                className="w-full border border-slate-200 px-3 py-2 text-[11px] font-bold text-[#0D2D5A] outline-none focus:border-[#1A6CC8] resize-none"
                                            />
                                        </div>

                                        <Button
                                            disabled={evalMutation.isPending}
                                            onClick={() => evalMutation.mutate()}
                                            className="h-8 bg-[#0D2D5A] text-white text-[10px] font-black uppercase tracking-widest rounded-none shadow-none"
                                        >
                                            <Send className="w-3.5 h-3.5 mr-2" />
                                            {evalMutation.isPending ? "Enregistrement..." : "Soumettre l'évaluation"}
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="h-full min-h-[400px] flex items-center justify-center border-2 border-dashed border-slate-100">
                            <div className="text-center">
                                <FileText className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                    Sélectionnez un candidat
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
