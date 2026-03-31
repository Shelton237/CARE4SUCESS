import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    GraduationCap,
    Users,
    Star,
    Mail,
    Phone,
    MapPin,
    BookOpen,
    Loader2,
} from "lucide-react";
import { fetchChildrenByParent, fetchScheduleByRole } from "@/api/backoffice";
import { useAuth } from "@/contexts/AuthContext";

const TEACHER_COLORS = ["#1A6CC8", "#22c55e", "#F5A623", "#a855f7", "#ec4899", "#ef4444", "#06b6d4"];

interface TeacherInfo {
    id: string;
    name: string;
    color: string;
    children: { childName: string; childId: string }[];
}

export default function ParentTeam() {
    const { user } = useAuth();

    // Fetch les enfants du parent
    const childrenQuery = useQuery({
        queryKey: ["parentChildren", user?.id],
        queryFn: () => fetchChildrenByParent(user!.id),
        enabled: Boolean(user?.id),
    });

    // Fetch les sessions pour déduire les enseignants
    const scheduleQuery = useQuery({
        queryKey: ["schedule", "parent", user?.id],
        queryFn: () => fetchScheduleByRole("parent", user!.id),
        enabled: Boolean(user?.id),
    });

    const children = useMemo(() => childrenQuery.data ?? [], [childrenQuery.data]);
    const sessions = useMemo(() => scheduleQuery.data ?? [], [scheduleQuery.data]);

    // Extraire les enseignants uniques depuis les sessions, avec mappage enfant/prof
    const teachers = useMemo<TeacherInfo[]>(() => {
        const teacherMap = new Map<string, TeacherInfo>();
        let colorIndex = 0;

        sessions.forEach((session) => {
            if (!session.teacherId || !session.teacher) return;

            if (!teacherMap.has(session.teacherId)) {
                teacherMap.set(session.teacherId, {
                    id: session.teacherId,
                    name: session.teacher,
                    color: TEACHER_COLORS[colorIndex % TEACHER_COLORS.length],
                    children: [],
                });
                colorIndex++;
            }

            const teacherEntry = teacherMap.get(session.teacherId)!;
            const alreadyLinked = teacherEntry.children.some((c) => c.childId === session.studentId);
            if (!alreadyLinked && session.studentId && session.student) {
                teacherEntry.children.push({
                    childName: session.student,
                    childId: session.studentId,
                });
            }
        });

        return Array.from(teacherMap.values());
    }, [sessions]);

    const isLoading = childrenQuery.isLoading || scheduleQuery.isLoading;
    const isError = childrenQuery.isError || scheduleQuery.isError;

    // Count subjects per teacher from sessions
    const teacherSubjects = useMemo(() => {
        const map = new Map<string, Set<string>>();
        sessions.forEach((s) => {
            if (!s.teacherId) return;
            if (!map.has(s.teacherId)) map.set(s.teacherId, new Set());
            if (s.subject) map.get(s.teacherId)!.add(s.subject);
        });
        return map;
    }, [sessions]);

    // Count sessions per teacher
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

    if (!user) {
        return (
            <div className="p-8 text-sm text-gray-500">
                Connectez-vous pour voir l'équipe pédagogique.
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-[#1A6CC8]" />
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#0D2D5A]">Équipe Pédagogique</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Tous les enseignants assignés au suivi de vos enfants.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-[#1A6CC8]/10 flex items-center justify-center">
                        <GraduationCap className="w-5 h-5 text-[#1A6CC8]" />
                    </div>
                    <span className="text-sm font-bold text-[#0D2D5A]">
                        {teachers.length} enseignant{teachers.length > 1 ? "s" : ""}
                    </span>
                </div>
            </div>

            {isError && (
                <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl p-4 flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    Impossible de charger l'équipe pédagogique. Merci de réessayer plus tard.
                </div>
            )}

            {teachers.length === 0 && !isError && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 flex flex-col items-center justify-center text-center gap-3">
                    <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center">
                        <GraduationCap className="w-8 h-8 text-gray-200" />
                    </div>
                    <p className="text-gray-500 text-sm font-medium">Aucun enseignant assigné pour le moment.</p>
                    <p className="text-gray-400 text-xs">
                        L'équipe pédagogique sera visible dès qu'un professeur sera affecté à votre enfant.
                    </p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {teachers.map((teacher) => {
                    const subjects = teacherSubjects.get(teacher.id);
                    const counts = teacherSessionCounts.get(teacher.id);

                    return (
                        <div
                            key={teacher.id}
                            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-md transition-all duration-300"
                        >
                            {/* Bandeau couleur */}
                            <div
                                className="h-1.5 w-full"
                                style={{ background: `linear-gradient(90deg, ${teacher.color}, ${teacher.color}88)` }}
                            />

                            {/* Profil */}
                            <div className="p-6 pb-4">
                                <div className="flex items-start gap-4">
                                    <div
                                        className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black text-white flex-shrink-0 shadow-lg group-hover:scale-105 transition-transform duration-300"
                                        style={{ background: teacher.color }}
                                    >
                                        {teacher.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-base font-bold text-[#0D2D5A] truncate">{teacher.name}</h3>
                                        <div className="flex items-center gap-1.5 mt-1">
                                            <Star className="w-3.5 h-3.5 text-[#F5A623] fill-[#F5A623]" />
                                            <span className="text-xs font-bold text-[#F5A623]">Certifié</span>
                                            <span className="text-[10px] text-gray-400 ml-1">Care4Success</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Matières enseignées */}
                            {subjects && subjects.size > 0 && (
                                <div className="px-6 pb-3 flex flex-wrap gap-2">
                                    {[...subjects].map((subject) => (
                                        <span
                                            key={subject}
                                            className="text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider"
                                            style={{
                                                background: teacher.color + "10",
                                                color: teacher.color,
                                                borderColor: teacher.color + "25",
                                            }}
                                        >
                                            {subject}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Stats sessions */}
                            {counts && (
                                <div className="px-6 py-3 grid grid-cols-2 gap-3 border-t border-gray-50 bg-gray-50/30">
                                    <div className="text-center">
                                        <div className="text-lg font-black text-[#22c55e]">{counts.completed}</div>
                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Sessions faites</div>
                                    </div>
                                    <div className="text-center border-l border-gray-100">
                                        <div className="text-lg font-black text-[#1A6CC8]">{counts.upcoming}</div>
                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">À venir</div>
                                    </div>
                                </div>
                            )}

                            {/* Enfants suivis par ce professeur */}
                            <div className="px-6 py-4 border-t border-gray-50">
                                <div className="flex items-center gap-2 mb-3">
                                    <Users className="w-3.5 h-3.5 text-[#22c55e]" />
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                        Enfant{teacher.children.length > 1 ? "s" : ""} suivi{teacher.children.length > 1 ? "s" : ""}
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {teacher.children.map((c) => (
                                        <div
                                            key={c.childId}
                                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-gray-100 shadow-sm"
                                        >
                                            <div className="w-5 h-5 rounded-full bg-[#22c55e] flex items-center justify-center text-[8px] font-bold text-white">
                                                {c.childName.charAt(0)}
                                            </div>
                                            <span className="text-xs font-semibold text-[#0D2D5A]">{c.childName}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-3 border-t border-gray-50 flex items-center">
                                <span className="flex items-center gap-1.5 text-[10px] text-gray-400">
                                    <BookOpen className="w-3 h-3" />
                                    Enseignant actif
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
