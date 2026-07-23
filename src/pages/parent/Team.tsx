import { useMemo } from "react";
import { useQuery, useQueries } from "@tanstack/react-query";
import {
    GraduationCap,
    Users,
    Star,
    Mail,
    MessageSquare,
    ShieldCheck,
    Loader2,
    Award,
    MailCheck,
    CalendarClock
} from "lucide-react";
import { fetchChildrenByParent, fetchScheduleByRole, fetchTeachersByStudent } from "@/api/backoffice";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const TEACHER_COLORS = ["#1A6CC8", "#F5A623", "#0D2D5A", "#475569", "#1e293b"];

interface TeacherInfo {
    id: string;
    name: string;
    email?: string;
    color: string;
    children: { childName: string; childId: string }[];
    // true si l'enseignant est confirmé (student_teacher) mais n'a encore
    // aucune séance planifiée : évite d'afficher "0/0" comme s'il s'agissait
    // d'une anomalie.
    awaitingFirstSession?: boolean;
}

export default function ParentTeam() {
    const { user } = useAuth();
    const { toast } = useToast();

    const childrenQuery = useQuery({
        queryKey: ["parentChildren", user?.id],
        queryFn: () => fetchChildrenByParent(user!.id),
        enabled: Boolean(user?.id),
    });

    const scheduleQuery = useQuery({
        queryKey: ["schedule", "parent", user?.id],
        queryFn: () => fetchScheduleByRole("parent", user!.id),
        enabled: Boolean(user?.id),
    });

    const children = useMemo(() => childrenQuery.data ?? [], [childrenQuery.data]);
    const sessions = useMemo(() => scheduleQuery.data ?? [], [scheduleQuery.data]);

    // Enseignants confirmés (table student_teacher) pour chaque enfant, alimentée
    // dès `confirmAssignment` — indépendamment de l'existence d'une séance.
    const matchedTeachersQueries = useQueries({
        queries: children.map((child) => ({
            queryKey: ["studentTeachers", child.id],
            queryFn: () => fetchTeachersByStudent(child.id),
            enabled: Boolean(child.id),
        })),
    });

    const teachers = useMemo<TeacherInfo[]>(() => {
        const teacherMap = new Map<string, TeacherInfo>();
        let colorIndex = 0;

        const getOrCreate = (id: string, name: string) => {
            if (!teacherMap.has(id)) {
                teacherMap.set(id, {
                    id,
                    name,
                    email: `${name.toLowerCase().replace(" ", ".")}@care4success.usra-care.com`,
                    color: TEACHER_COLORS[colorIndex % TEACHER_COLORS.length],
                    children: [],
                    awaitingFirstSession: true,
                });
                colorIndex++;
            }
            return teacherMap.get(id)!;
        };

        // 1. Matching confirmé (student_teacher), sans attendre de séance.
        children.forEach((child, index) => {
            const matchedTeachers = matchedTeachersQueries[index]?.data ?? [];
            matchedTeachers.forEach((teacher) => {
                const teacherEntry = getOrCreate(teacher.id, teacher.name);
                const alreadyLinked = teacherEntry.children.some((c) => c.childId === child.id);
                if (!alreadyLinked) {
                    teacherEntry.children.push({ childName: child.name, childId: child.id });
                }
            });
        });

        // 2. Séances planifiées : source historique, met aussi à jour le statut
        // "en attente de première séance" dès qu'une séance existe.
        sessions.forEach((session) => {
            if (!session.teacherId || !session.teacher) return;

            const teacherEntry = getOrCreate(session.teacherId, session.teacher);
            teacherEntry.awaitingFirstSession = false;

            const alreadyLinked = teacherEntry.children.some((c) => c.childId === session.studentId);
            if (!alreadyLinked && session.studentId && session.student) {
                teacherEntry.children.push({
                    childName: session.student,
                    childId: session.studentId,
                });
            }
        });

        return Array.from(teacherMap.values());
    }, [sessions, children, matchedTeachersQueries]);

    const teacherSubjects = useMemo(() => {
        const map = new Map<string, Set<string>>();
        sessions.forEach((s) => {
            if (!s.teacherId) return;
            if (!map.has(s.teacherId)) map.set(s.teacherId, new Set());
            if (s.subject) map.get(s.teacherId)!.add(s.subject);
        });
        return map;
    }, [sessions]);

    const teacherSessionCounts = useMemo(() => {
        const map = new Map<string, { completed: number; upcoming: number }>();
        sessions.forEach((s) => {
            if (!s.teacherId) return;
            if (!map.has(s.teacherId)) map.set(s.teacherId, { completed: 0, upcoming: 0 });
            const entry = map.get(s.teacherId)!;
            if (s.status === "effectué") entry.completed++;
            else entry.upcoming++;
        });
        return map;
    }, [sessions]);

    const handleContact = (teacherName: string) => {
        toast({
            title: "Demande de contact envoyée",
            description: `Votre demande de discussion avec ${teacherName} a été transmise au conseiller pédagogique.`,
        });
    };

    if (childrenQuery.isLoading || scheduleQuery.isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-[#0D2D5A]/20" />
            </div>
        );
    }

    return (
        <div className="p-4 md:p-4 md:p-6 space-y-6 w-full bg-white min-h-screen font-sans text-[#0D2D5A]">
            {/* Slim Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-100 pb-4 gap-4">
                <div>
                    <h1 className="text-xl font-black text-[#0D2D5A] uppercase tracking-tight flex items-center gap-3">
                        Équipe Pédagogique 
                        <ShieldCheck className="w-5 h-5 text-emerald-500" />
                    </h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                        Encadrement et suivi d'excellence Care4Success
                    </p>
                </div>
                <div className="flex gap-2">
                    <Badge variant="outline" className="text-[10px] font-black px-3 h-6 rounded-none uppercase tracking-widest bg-slate-50 text-slate-600 border-none">
                        {teachers.length} INTERVENANTS ACTIFS
                    </Badge>
                </div>
            </div>

            {teachers.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 border border-dashed border-slate-200 bg-slate-50/30">
                    <GraduationCap className="w-12 h-12 text-slate-100" />
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-[#0D2D5A] uppercase tracking-widest">Dossier en cours d'affectation</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">La liste des enseignants sera disponible dès confirmation du planning.</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {teachers.map((teacher) => {
                        const subjects = teacherSubjects.get(teacher.id);
                        const counts = teacherSessionCounts.get(teacher.id);

                        return (
                            <div
                                key={teacher.id}
                                className="border border-slate-100 bg-white relative overflow-hidden group rounded-none"
                            >
                                {/* Active Status Indicator */}
                                <div className="absolute top-4 right-4 z-20">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                </div>

                                <div className="p-5 space-y-4">
                                    <div className="flex items-start gap-4">
                                        <div className="w-16 h-16 bg-[#0D2D5A] text-white flex items-center justify-center font-black text-xl relative">
                                            {teacher.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#F5A623] flex items-center justify-center border-2 border-white">
                                                <Award className="w-3 h-3 text-[#0D2D5A]" />
                                            </div>
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <h3 className="text-sm font-black text-[#0D2D5A] uppercase tracking-tight">{teacher.name}</h3>
                                            <div className="flex items-center gap-1">
                                                <Star className="w-3 h-3 text-[#F5A623] fill-[#F5A623]" />
                                                <span className="text-[9px] font-black text-[#F5A623] uppercase">Profil Certifié</span>
                                            </div>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                                                Intervenant Grade III • Care4Success
                                            </p>
                                        </div>
                                    </div>

                                    {/* Subjects Section */}
                                    <div className="space-y-2">
                                        <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest border-b border-slate-50 pb-1">
                                            Expertise Matières
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {subjects && [...subjects].map((subject) => (
                                                <Badge key={subject} className="bg-slate-50 text-[#0D2D5A] text-[8px] font-black rounded-none border border-slate-100 shadow-none uppercase px-2 py-0.5">
                                                    {subject}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Stats Grid */}
                                    {teacher.awaitingFirstSession ? (
                                        <div className="flex items-center justify-center gap-2 border-y border-slate-50 py-3 bg-slate-50/30">
                                            <CalendarClock className="w-3.5 h-3.5 text-[#F5A623]" />
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                Première séance à planifier
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 divide-x divide-slate-100 border-y border-slate-50 py-3 bg-slate-50/30">
                                            <div className="px-3 flex flex-col items-center">
                                                <span className="text-xs font-black text-emerald-600 tracking-tight">{counts?.completed || 0}</span>
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter text-center">Sessions Terminées</span>
                                            </div>
                                            <div className="px-3 flex flex-col items-center">
                                                <span className="text-xs font-black text-[#1A6CC8] tracking-tight">{counts?.upcoming || 0}</span>
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter text-center">Sessions À Venir</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Students Followed */}
                                    <div className="space-y-2">
                                        <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
                                            <Users className="w-3 h-3" /> Étudiants Suivis
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {teacher.children.map((c) => (
                                                <div key={c.childId} className="flex items-center gap-2 px-2 py-1 border border-slate-100 bg-white">
                                                     <div className="w-4 h-4 bg-emerald-50 text-emerald-600 flex items-center justify-center text-[8px] font-black">
                                                        {c.childName.charAt(0)}
                                                    </div>
                                                    <span className="text-[9px] font-black text-[#0D2D5A] uppercase">{c.childName}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Contact Actions */}
                                    <div className="flex gap-2 pt-2">
                                        <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => handleContact(teacher.name)}
                                            className="flex-1 rounded-none border-slate-200 text-[#0D2D5A] font-black text-[9px] uppercase tracking-widest h-9 hover:bg-slate-50"
                                        >
                                            <MessageSquare className="w-3 h-3 mr-2" />
                                            Discuter
                                        </Button>
                                        <Button 
                                            size="sm"
                                            className="bg-[#0D2D5A] hover:bg-[#1A6CC8] text-white rounded-none font-black text-[9px] uppercase tracking-widest h-9 px-3"
                                            onClick={() => {
                                                window.location.href = `mailto:${teacher.email}`;
                                            }}
                                        >
                                            <Mail className="w-3 h-3" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="h-0.5 bg-gradient-to-r from-transparent via-slate-100 to-transparent w-full" />
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
