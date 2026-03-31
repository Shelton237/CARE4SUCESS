import { useState, useEffect } from "react";
import { Search, Loader2, BookOpen, GraduationCap, ClipboardList, Command as CommandIcon } from "lucide-react";
import { 
    CommandDialog, 
    CommandEmpty, 
    CommandGroup, 
    CommandInput, 
    CommandItem, 
    CommandList, 
    CommandSeparator 
} from "@/components/ui/command";
import { globalSearch } from "@/api/backoffice";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

export function GlobalSearch() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<{ courses: any[]; teachers: any[]; homework: any[] }>({
        courses: [],
        teachers: [],
        homework: []
    });
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };
        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.length >= 2) {
                setIsLoading(true);
                try {
                    const data = await globalSearch(query);
                    setResults(data);
                } catch (error) {
                    console.error("Search failed", error);
                } finally {
                    setIsLoading(false);
                }
            } else {
                setResults({ courses: [], teachers: [], homework: [] });
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    const handleSelect = (link: string) => {
        setOpen(false);
        // Map types to their paths based on current role
        const path = window.location.pathname;
        const role = path.split('/')[1] || 'student';
        
        let target = `/${role}`;
        if (link.includes('courses')) target += '/courses';
        else if (link.includes('teachers')) target += '/teachers';
        else if (link.includes('homework')) target += '/homework';
        
        navigate(target);
    };

    const hasResults = results.courses.length > 0 || results.teachers.length > 0 || results.homework.length > 0;

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="relative flex items-center gap-3 px-4 py-2.5 w-full max-w-[300px] text-sm text-gray-400 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-white/20 transition-all group"
            >
                <Search className="w-4 h-4 group-hover:text-blue-300 transition-colors" />
                <span className="flex-1 text-left">Recherche globale...</span>
                <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-white/20 bg-white/10 px-1.5 font-mono text-[10px] font-medium text-white/50 opacity-100">
                    <span className="text-xs">⌘</span>K
                </kbd>
            </button>

            <CommandDialog open={open} onOpenChange={setOpen}>
                <CommandInput 
                    placeholder="Rechercher des cours, profs, devoirs..." 
                    value={query}
                    onValueChange={setQuery}
                />
                <CommandList>
                    {isLoading && (
                        <div className="flex items-center justify-center py-6">
                            <Loader2 className="h-6 w-6 animate-spin text-[#1A6CC8]" />
                        </div>
                    )}
                    
                    {!isLoading && query.length >= 2 && !hasResults && (
                        <CommandEmpty>
                            Aucun résultat trouvé pour "{query}".
                        </CommandEmpty>
                    )}
                    
                    {query.length < 2 && (
                        <div className="p-4 text-center">
                            <CommandIcon className="w-8 h-8 text-gray-200 mx-auto mb-3" />
                            <p className="text-xs text-gray-400 font-medium">Entrez au moins 2 caractères pour rechercher.</p>
                        </div>
                    )}

                    {results.courses.length > 0 && (
                        <CommandGroup heading="Cours">
                            {results.courses.map((course) => (
                                <CommandItem
                                    key={course.id}
                                    onSelect={() => handleSelect(`/student/courses`)}
                                    className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-gray-50"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-[#1A6CC8]">
                                        <BookOpen className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm font-bold text-[#0D2D5A]">{course.title}</div>
                                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{course.subject} • {course.level}</div>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    )}

                    {results.teachers.length > 0 && (
                        <CommandGroup heading="Professeurs">
                            {results.teachers.map((teacher) => (
                                <CommandItem
                                    key={teacher.id}
                                    onSelect={() => handleSelect(`/student/teachers`)}
                                    className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-gray-50"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-[#F5A623] font-black italic">
                                        {teacher.avatar || teacher.name.charAt(0)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm font-bold text-[#0D2D5A]">{teacher.name}</div>
                                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{teacher.subject}</div>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    )}

                    {results.homework.length > 0 && (
                        <CommandGroup heading="Devoirs">
                            {results.homework.map((hw) => (
                                <CommandItem
                                    key={hw.id}
                                    onSelect={() => handleSelect(`/student/homework`)}
                                    className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-gray-50"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-[#a855f7]">
                                        <ClipboardList className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <div className="text-sm font-bold text-[#0D2D5A]">{hw.title}</div>
                                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{hw.subject}</div>
                                    </div>
                                    <Badge variant="outline" className="text-[9px] uppercase tracking-tighter ml-auto">
                                        {hw.status}
                                    </Badge>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    )}
                </CommandList>
            </CommandDialog>
        </>
    );
}
