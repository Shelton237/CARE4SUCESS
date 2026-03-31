import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    BookOpen,
    Search,
    Filter,
    Plus,
    Loader2,
    ArrowUpRight,
    Settings2,
    FileText,
    Video
} from "lucide-react";
import { fetchCourses } from "@/api/backoffice";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from "react-router-dom";

export default function TeacherCourses() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { id } = useParams();
    const [searchTerm, setSearchTerm] = useState("");

    const isCreating = id === "new";
    const isEditing = id && id !== "new";

    // DYNAMIQUE : Cours réels
    const { data: courses = [], isLoading } = useQuery({
        queryKey: ["courses", "teacher", user?.id],
        queryFn: () => fetchCourses("teacher", user!.id),
        enabled: !!user?.id
    });

    const filteredCourses = courses.filter(c => 
        c.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLoading) {
        return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-[#1A6CC8]" /></div>;
    }

    if (isCreating || isEditing) {
        const course = isEditing ? courses.find((c: any) => c.id === id) : null;
        return (
            <div className="p-8 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <Badge className="bg-blue-50 text-[#1A6CC8] border-none font-bold px-3 mb-2">Editeur</Badge>
                            <h1 className="text-3xl font-bold text-[#0D2D5A] tracking-tight">
                                {isCreating ? "Créer un nouveau cours" : `Éditer : ${course?.title || "Chargement..."}`}
                            </h1>
                        </div>
                        <Button variant="ghost" onClick={() => navigate("/teacher/courses")} className="text-gray-400 hover:text-gray-600">
                            Fermer
                        </Button>
                    </div>
                    
                    <div className="space-y-6 max-w-2xl">
                        <div className="p-12 border-2 border-dashed border-gray-100 rounded-[2rem] text-center space-y-4">
                            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto text-gray-300">
                                <Plus className="w-8 h-8" />
                            </div>
                            <p className="text-gray-400 font-medium">Le module d'édition avancé arrive bientôt.</p>
                            <Button className="bg-[#1A6CC8] hover:bg-blue-700 rounded-xl" onClick={() => navigate("/teacher/courses")}>
                                Retour à la liste
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500 font-bold">
            {/* Header Style Soft & Pro */}
            <div className="bg-white rounded-[2rem] p-8 flex flex-col md:flex-row items-center justify-between gap-6 border border-gray-100 shadow-sm">
                <div className="space-y-2">
                    <Badge className="bg-blue-50 text-[#1A6CC8] border-none font-bold px-3">Catalogue</Badge>
                    <h1 className="text-3xl font-bold text-[#0D2D5A] tracking-tight">Mes Cours & Ressources</h1>
                    <p className="text-gray-500 font-medium italic">Gestion dynamique de vos modules de formation.</p>
                </div>
                <Button 
                    onClick={() => navigate("/teacher/courses/new")}
                    className="bg-[#1A6CC8] hover:bg-blue-700 h-12 px-8 rounded-xl font-bold shadow-md"
                >
                    <Plus className="mr-2 w-5 h-5" /> Créer un Cours
                </Button>
            </div>

            <div className="space-y-6">
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col lg:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Rechercher un module..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-gray-50 rounded-xl pl-10 pr-4 py-3 text-sm font-medium border-none outline-none focus:ring-2 focus:ring-blue-100"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredCourses.length === 0 ? (
                        <div className="col-span-full py-40 text-center text-gray-200 italic font-black text-2xl uppercase tracking-[10px]">Aucun cours</div>
                    ) : (
                        filteredCourses.map((course: any) => (
                            <div 
                                key={course.id} 
                                className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden group hover:shadow-md transition-all flex flex-col cursor-pointer"
                                onClick={() => navigate(`/teacher/courses/${course.id}`)}
                            >
                                <div className="h-48 bg-blue-50 relative flex items-center justify-center p-8">
                                    <div className="w-20 h-20 rounded-[1.5rem] bg-white shadow-xl flex items-center justify-center text-[#1A6CC8]/30 group-hover:text-[#1A6CC8] transition-all">
                                        <BookOpen className="w-10 h-10" />
                                    </div>
                                    <Badge className={`absolute top-4 right-4 border-none font-bold text-[8px] uppercase tracking-widest px-3 py-1 rounded-lg ${course.status === 'published' ? 'bg-emerald-500 text-white' : 'bg-orange-500 text-white'}`}>
                                        {course.status === 'published' ? 'Actif' : 'Brouillon'}
                                    </Badge>
                                </div>

                                <div className="p-8 space-y-4 flex-1 flex flex-col">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-[#1A6CC8] uppercase tracking-widest">{course.subject || "Module"}</p>
                                        <h3 className="text-xl font-bold text-[#0D2D5A] leading-tight group-hover:text-[#1A6CC8] transition-colors">{course.title}</h3>
                                    </div>
                                    
                                    <div className="flex flex-wrap gap-4 py-4 border-y border-gray-50">
                                        <span className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase"><FileText className="w-3.5 h-3.5" /> {course.lessons?.length || 0} Leçons</span>
                                        <span className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase"><Video className="w-3.5 h-3.5" /> Multimédia</span>
                                    </div>

                                    <div className="pt-2">
                                        <Button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/teacher/courses/${course.id}`);
                                            }}
                                            className="w-full bg-[#F8FAFC] hover:bg-[#1A6CC8] text-[#0D2D5A] hover:text-white font-bold text-xs uppercase rounded-xl h-11 transition-all"
                                        >
                                            Editer <Settings2 className="w-3.5 h-3.5 ml-2" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
