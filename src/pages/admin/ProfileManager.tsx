import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  registerUser,
  fetchUsers,
  updateUserProfile,
  fetchChildrenByParent,
  fetchParentsByStudent,
  fetchTeachersByStudent,
  fetchStudentsLinkedToTeacher,
  linkParentChildRelation,
  unlinkParentChildRelation,
  linkStudentTeacherRelation,
  unlinkStudentTeacherRelation,
  type RegisterUserPayload,
} from "@/api/backoffice";
import type { Role, User } from "@/types/user";
import { Input } from "@/components/ui/input";
import { GeoSelector } from "@/components/GeoSelector";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2, UserPlus, Edit3, Search, Users,
  Link2, Check, X, Mail, Smartphone, MessageCircle, ShieldCheck,
} from "lucide-react";

type CreateLinkKey = "childrenIds" | "parentIds" | "teacherIds" | "studentIds";
type CreateFormState = RegisterUserPayload;
type EditFormState = {
  name: string; phone: string; avatar: string; location: string;
  geoLocationId: number | null;
  timezone: string; language: string; bio: string;
  notifyEmail: boolean; notifySms: boolean; notifyWhatsapp: boolean;
};
type EditLinkState = { children: string[]; parents: string[]; teachers: string[]; students: string[] };

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: "admin",   label: "Admin" },
  { value: "advisor", label: "Conseiller" },
  { value: "parent",  label: "Parent" },
  { value: "student", label: "Élève" },
  { value: "teacher", label: "Tuteur" },
];

const ROLE_STYLE: Record<string, { bg: string; text: string; activeBg: string; activeText: string }> = {
  admin:   { bg: "bg-[#0D2D5A]/5",   text: "text-[#0D2D5A]",   activeBg: "bg-[#0D2D5A]",   activeText: "text-white" },
  advisor: { bg: "bg-purple-50",      text: "text-purple-600",   activeBg: "bg-purple-600",   activeText: "text-white" },
  parent:  { bg: "bg-[#F5A623]/10",   text: "text-[#F5A623]",   activeBg: "bg-[#F5A623]",    activeText: "text-white" },
  student: { bg: "bg-[#1A6CC8]/10",   text: "text-[#1A6CC8]",   activeBg: "bg-[#1A6CC8]",   activeText: "text-white" },
  teacher: { bg: "bg-emerald-50",     text: "text-emerald-600", activeBg: "bg-emerald-600",  activeText: "text-white" },
};

const TIMEZONES = [
  { value: "Africa/Douala", label: "Africa/Douala" },
  { value: "Europe/Paris",  label: "Europe/Paris" },
  { value: "UTC",           label: "UTC" },
  { value: "America/Toronto", label: "America/Toronto" },
];

const LANGUAGES = [
  { value: "fr", label: "Français" },
  { value: "en", label: "English" },
];

const NOTIFICATION_CHANNELS = [
  { key: "notifyEmail" as const,    label: "Email",    hint: "Résumés et confirmations", icon: Mail },
  { key: "notifySms" as const,      label: "SMS",      hint: "Alertes urgentes",         icon: Smartphone },
  { key: "notifyWhatsapp" as const, label: "WhatsApp", hint: "Messages et rappels",      icon: MessageCircle },
];

const createInitialCreateForm = (): CreateFormState => ({
  role: "parent", name: "", email: "", password: "", phone: "", avatar: "",
  location: "", geoLocationId: null, timezone: "Africa/Douala", language: "fr", bio: "",
  notifyEmail: true, notifySms: false, notifyWhatsapp: false,
  childrenIds: [], parentIds: [], teacherIds: [], studentIds: [],
});

const defaultEditForm: EditFormState = {
  name: "", phone: "", avatar: "", location: "", geoLocationId: null,
  timezone: "Africa/Douala", language: "fr", bio: "",
  notifyEmail: true, notifySms: false, notifyWhatsapp: false,
};

const emptyEditLinks: EditLinkState = { children: [], parents: [], teachers: [], students: [] };

const diffIds = (next: string[], prev: string[]) => ({
  added: next.filter(id => !prev.includes(id)),
  removed: prev.filter(id => !next.includes(id)),
});

// ─── Section header ───────────────────────────────────────────────────────
function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground shrink-0">{title}</p>
        <Separator className="flex-1" />
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

// ─── Notification channel toggle ────────────────────────────────────────────
function NotificationCard({ label, hint, icon: Icon, checked, onCheckedChange }: {
  label: string; hint: string; icon: React.ComponentType<{ className?: string }>;
  checked: boolean; onCheckedChange: (v: boolean) => void;
}) {
  return (
    <label
      className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
        checked ? "border-primary bg-primary/5" : "border-border bg-muted/30 hover:bg-muted/50"
      }`}
    >
      <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${
        checked ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
      }`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} className="mt-0.5" />
    </label>
  );
}

// ─── MultiSelect chips ────────────────────────────────────────────────────────
function MultiSelectChips({
  title, description, options, selectedIds, onToggle, loading, emptyLabel,
}: {
  title: string; description: string; options: User[]; selectedIds: string[];
  onToggle: (id: string) => void; loading?: boolean; emptyLabel: string;
}) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Chargement…
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <div>
        <p className="text-xs font-semibold text-foreground">{title}</p>
        <p className="text-[11px] text-muted-foreground">{description}</p>
      </div>
      {options.length === 0 ? (
        <p className="text-xs text-muted-foreground border border-dashed rounded-lg px-3 py-2">{emptyLabel}</p>
      ) : (
        <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
          {options.map(option => {
            const active = selectedIds.includes(option.id);
            return (
              <button
                type="button"
                key={option.id}
                onClick={() => onToggle(option.id)}
                aria-pressed={active}
                className={`flex items-center gap-1.5 pl-1.5 pr-3 py-1.5 rounded-full border text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 ${
                  active
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border bg-background text-foreground hover:border-primary/50 hover:bg-primary/5"
                }`}
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${active ? "bg-white/20" : "bg-muted"}`}>
                  {active ? <Check className="w-3 h-3" /> : option.name?.charAt(0)}
                </div>
                <span className="text-xs font-medium truncate max-w-[120px]">{option.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function ProfileManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { userId } = useParams();
  const [searchParams] = useSearchParams();

  const [mode, setMode] = useState<"create" | "edit">("edit");
  const [userSearch, setUserSearch] = useState("");
  const [createForm, setCreateForm] = useState<CreateFormState>(createInitialCreateForm());
  const [editRole, setEditRole] = useState<Role>((searchParams.get("role") as Role) || "parent");
  const [selectedUserId, setSelectedUserId] = useState<string>(userId || "");
  const [editForm, setEditForm] = useState<EditFormState>(defaultEditForm);
  const [editLinks, setEditLinks] = useState<EditLinkState>(emptyEditLinks);
  const [initialLinks, setInitialLinks] = useState<EditLinkState>(emptyEditLinks);

  const parentsQuery  = useQuery({ queryKey: ["users", "parent"],  queryFn: () => fetchUsers("parent") });
  const studentsQuery = useQuery({ queryKey: ["users", "student"], queryFn: () => fetchUsers("student") });
  const teachersQuery = useQuery({ queryKey: ["users", "teacher"], queryFn: () => fetchUsers("teacher") });
  const editUsersQuery = useQuery({ queryKey: ["users", "edit", editRole], queryFn: () => fetchUsers(editRole) });

  const parentChildrenQuery   = useQuery({ queryKey: ["relationships", "parent-child",    selectedUserId], queryFn: () => fetchChildrenByParent(selectedUserId),        enabled: editRole === "parent"  && Boolean(selectedUserId) });
  const studentParentsQuery   = useQuery({ queryKey: ["relationships", "student-parents",  selectedUserId], queryFn: () => fetchParentsByStudent(selectedUserId),         enabled: editRole === "student" && Boolean(selectedUserId) });
  const studentTeachersQuery  = useQuery({ queryKey: ["relationships", "student-teachers", selectedUserId], queryFn: () => fetchTeachersByStudent(selectedUserId),        enabled: editRole === "student" && Boolean(selectedUserId) });
  const teacherStudentsQuery  = useQuery({ queryKey: ["relationships", "teacher-students", selectedUserId], queryFn: () => fetchStudentsLinkedToTeacher(selectedUserId),  enabled: editRole === "teacher" && Boolean(selectedUserId) });

  const roleUsers   = useMemo(() => editUsersQuery.data ?? [], [editUsersQuery.data]);
  const selectedUser = useMemo(() => roleUsers.find(u => u.id === selectedUserId), [roleUsers, selectedUserId]);

  const filteredUsers = useMemo(() =>
    roleUsers.filter(u =>
      u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase())
    ), [roleUsers, userSearch]);

  useEffect(() => {
    if (userId && selectedUserId === userId) return;
    setSelectedUserId("");
    setEditForm(defaultEditForm);
    setEditLinks(emptyEditLinks);
    setInitialLinks(emptyEditLinks);
  }, [editRole, userId]);

  useEffect(() => {
    if (selectedUserId) return;
    if (userId) { setSelectedUserId(userId); return; }
    if (roleUsers[0]) setSelectedUserId(roleUsers[0].id);
  }, [selectedUserId, roleUsers, userId]);

  useEffect(() => {
    if (!selectedUser) { setEditForm(defaultEditForm); return; }
    setEditForm({
      name: selectedUser.name,
      phone: selectedUser.phone ?? "",
      avatar: (selectedUser.avatar ?? selectedUser.name?.slice(0, 2) ?? "").toUpperCase(),
      location: selectedUser.location ?? "",
      geoLocationId: selectedUser.geoLocationId ?? null,
      timezone: selectedUser.timezone ?? "Africa/Douala",
      language: selectedUser.language ?? "fr",
      bio: selectedUser.bio ?? "",
      notifyEmail: selectedUser.notifyEmail ?? true,
      notifySms: selectedUser.notifySms ?? false,
      notifyWhatsapp: selectedUser.notifyWhatsapp ?? false,
    });
  }, [selectedUser]);

  useEffect(() => {
    if (editRole === "parent" && parentChildrenQuery.data) {
      const ids = parentChildrenQuery.data.map(c => c.id);
      setEditLinks(p => ({ ...p, children: ids }));
      setInitialLinks(p => ({ ...p, children: ids }));
    }
  }, [editRole, parentChildrenQuery.data]);

  useEffect(() => {
    if (editRole === "student") {
      if (studentParentsQuery.data) {
        const ids = studentParentsQuery.data.map(p => p.id);
        setEditLinks(p => ({ ...p, parents: ids }));
        setInitialLinks(p => ({ ...p, parents: ids }));
      }
      if (studentTeachersQuery.data) {
        const ids = studentTeachersQuery.data.map(t => t.id);
        setEditLinks(p => ({ ...p, teachers: ids }));
        setInitialLinks(p => ({ ...p, teachers: ids }));
      }
    }
  }, [editRole, studentParentsQuery.data, studentTeachersQuery.data]);

  useEffect(() => {
    if (editRole === "teacher" && teacherStudentsQuery.data) {
      const ids = teacherStudentsQuery.data.map(s => s.id);
      setEditLinks(p => ({ ...p, students: ids }));
      setInitialLinks(p => ({ ...p, students: ids }));
    }
  }, [editRole, teacherStudentsQuery.data]);

  const toggleCreateLink = (key: CreateLinkKey, value: string) => {
    setCreateForm(prev => {
      const exists = prev[key].includes(value);
      return { ...prev, [key]: exists ? prev[key].filter(id => id !== value) : [...prev[key], value] };
    });
  };

  const toggleEditLink = (key: keyof EditLinkState, value: string) => {
    setEditLinks(prev => {
      const exists = prev[key].includes(value);
      return { ...prev, [key]: exists ? prev[key].filter(id => id !== value) : [...prev[key], value] };
    });
  };

  const invalidateUserCollections = (roles: Role[]) => {
    roles.forEach(role => {
      queryClient.invalidateQueries({ queryKey: ["users", role] });
      queryClient.invalidateQueries({ queryKey: ["users", "edit", role] });
    });
  };

  const registerMutation = useMutation({
    mutationFn: (payload: RegisterUserPayload) => registerUser(payload),
    onSuccess: (_result, variables) => {
      toast({ title: "Compte créé", description: `${variables.name} peut maintenant se connecter.` });
      setCreateForm(createInitialCreateForm());
      invalidateUserCollections([variables.role]);
      queryClient.invalidateQueries({ queryKey: ["relationships"] });
    },
    onError: (error: Error) => {
      toast({ title: "Impossible de créer le compte", description: error.message, variant: "destructive" });
    },
  });

  const applyRelationshipChanges = async () => {
    if (!selectedUserId) return;
    const tasks: Promise<unknown>[] = [];
    if (editRole === "parent") {
      const { added, removed } = diffIds(editLinks.children, initialLinks.children);
      added.forEach(id => tasks.push(linkParentChildRelation(selectedUserId, id)));
      removed.forEach(id => tasks.push(unlinkParentChildRelation(selectedUserId, id)));
    }
    if (editRole === "student") {
      const pd = diffIds(editLinks.parents, initialLinks.parents);
      pd.added.forEach(id => tasks.push(linkParentChildRelation(id, selectedUserId)));
      pd.removed.forEach(id => tasks.push(unlinkParentChildRelation(id, selectedUserId)));
      const td = diffIds(editLinks.teachers, initialLinks.teachers);
      td.added.forEach(id => tasks.push(linkStudentTeacherRelation(selectedUserId, id)));
      td.removed.forEach(id => tasks.push(unlinkStudentTeacherRelation(selectedUserId, id)));
    }
    if (editRole === "teacher") {
      const { added, removed } = diffIds(editLinks.students, initialLinks.students);
      added.forEach(id => tasks.push(linkStudentTeacherRelation(id, selectedUserId)));
      removed.forEach(id => tasks.push(unlinkStudentTeacherRelation(id, selectedUserId)));
    }
    if (tasks.length) { await Promise.all(tasks); setInitialLinks(editLinks); }
  };

  const editMutation = useMutation({
    mutationFn: async () => {
      if (!selectedUserId) throw new Error("Aucun utilisateur sélectionné.");
      const payload = { ...editForm, name: editForm.name.trim(), avatar: editForm.avatar.trim().slice(0, 2).toUpperCase(), location: editForm.location.trim(), geoLocationId: editForm.geoLocationId };
      const updatedUser = await updateUserProfile(selectedUserId, payload);
      await applyRelationshipChanges();
      return updatedUser;
    },
    onSuccess: data => {
      toast({ title: "Profil mis à jour", description: `${data.name} a été synchronisé.` });
      invalidateUserCollections([editRole]);
    },
    onError: (error: Error) => {
      toast({ title: "Impossible de mettre à jour", description: error.message, variant: "destructive" });
    },
  });

  const handleCreateChange = (key: keyof CreateFormState, value: string | boolean) =>
    setCreateForm(prev => ({ ...prev, [key]: value }));

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate({
      ...createForm,
      name: createForm.name.trim(), email: createForm.email.trim(),
      password: createForm.password.trim(),
      avatar: createForm.avatar?.trim().slice(0, 2).toUpperCase() ?? "",
      phone: createForm.phone?.trim() ?? "", location: createForm.location?.trim() ?? "",
      bio: createForm.bio?.trim() ?? "",
    });
  };

  const hasRelationshipSection = ["parent", "student", "teacher"].includes(
    mode === "edit" ? editRole : createForm.role
  );

  const relRole = mode === "edit" ? editRole : createForm.role;

  const relationshipContent = () => {
    if (!hasRelationshipSection) return null;
    if (mode === "create") {
      if (createForm.role === "parent") return (
        <MultiSelectChips title="Enfants rattachés" description="Élèves suivis par ce parent"
          options={studentsQuery.data ?? []} selectedIds={createForm.childrenIds}
          onToggle={id => toggleCreateLink("childrenIds", id)}
          loading={studentsQuery.isLoading} emptyLabel="Aucun élève enregistré." />
      );
      if (createForm.role === "student") return (
        <div className="space-y-5">
          <MultiSelectChips title="Parents référents" description="Au moins un parent"
            options={parentsQuery.data ?? []} selectedIds={createForm.parentIds}
            onToggle={id => toggleCreateLink("parentIds", id)}
            loading={parentsQuery.isLoading} emptyLabel="Aucun parent disponible." />
          <MultiSelectChips title="Tuteurs assignés" description="Optionnel"
            options={teachersQuery.data ?? []} selectedIds={createForm.teacherIds}
            onToggle={id => toggleCreateLink("teacherIds", id)}
            loading={teachersQuery.isLoading} emptyLabel="Aucun tuteur disponible." />
        </div>
      );
      if (createForm.role === "teacher") return (
        <MultiSelectChips title="Élèves suivis" description="Affectations initiales"
          options={studentsQuery.data ?? []} selectedIds={createForm.studentIds}
          onToggle={id => toggleCreateLink("studentIds", id)}
          loading={studentsQuery.isLoading} emptyLabel="Créez d'abord des élèves." />
      );
    } else {
      if (editRole === "parent") return (
        <MultiSelectChips title="Enfants rattachés" description="Élèves liés à ce parent"
          options={studentsQuery.data ?? []} selectedIds={editLinks.children}
          onToggle={id => toggleEditLink("children", id)}
          loading={studentsQuery.isLoading || parentChildrenQuery.isFetching}
          emptyLabel="Aucun élève associé." />
      );
      if (editRole === "student") return (
        <div className="space-y-5">
          <MultiSelectChips title="Parents référents" description="Responsables légaux"
            options={parentsQuery.data ?? []} selectedIds={editLinks.parents}
            onToggle={id => toggleEditLink("parents", id)}
            loading={parentsQuery.isLoading || studentParentsQuery.isFetching}
            emptyLabel="Aucun parent lié." />
          <MultiSelectChips title="Tuteurs" description="Enseignants rattachés"
            options={teachersQuery.data ?? []} selectedIds={editLinks.teachers}
            onToggle={id => toggleEditLink("teachers", id)}
            loading={teachersQuery.isLoading || studentTeachersQuery.isFetching}
            emptyLabel="Aucun tuteur disponible." />
        </div>
      );
      if (editRole === "teacher") return (
        <MultiSelectChips title="Apprenants" description="Élèves de ce tuteur"
          options={studentsQuery.data ?? []} selectedIds={editLinks.students}
          onToggle={id => toggleEditLink("students", id)}
          loading={studentsQuery.isLoading || teacherStudentsQuery.isFetching}
          emptyLabel="Aucun élève disponible." />
      );
    }
    return null;
  };

  const rStyle = ROLE_STYLE[relRole] || ROLE_STYLE.student;

  // ── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <div className="h-[calc(100vh-64px)] flex overflow-hidden bg-background">

      {/* ── COL 1 : User list ───────────────────────────────────────────────── */}
      <div className="w-64 border-r flex flex-col shrink-0">

        {/* Header col 1 */}
        <div className="px-4 py-3 border-b bg-muted/30 flex items-center justify-between shrink-0">
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Utilisateurs</p>
            <p className="text-sm font-bold text-foreground">Profils</p>
          </div>
          <Button
            size="icon"
            variant={mode === "create" ? "default" : "outline"}
            onClick={() => setMode("create")}
            title="Nouveau compte"
            className="h-8 w-8"
          >
            <UserPlus className="w-4 h-4" />
          </Button>
        </div>

        {/* Role tabs */}
        <Tabs
          value={editRole}
          onValueChange={(value) => { setEditRole(value as Role); setMode("edit"); setUserSearch(""); }}
          className="border-b shrink-0"
        >
          <TabsList className="h-auto bg-transparent p-1.5 flex flex-wrap justify-start gap-1 rounded-none">
            {ROLE_OPTIONS.map(r => {
              const s = ROLE_STYLE[r.value];
              const count = r.value === editRole ? roleUsers.length : undefined;
              const active = editRole === r.value && mode === "edit";
              return (
                <TabsTrigger
                  key={r.value}
                  value={r.value}
                  className={`flex items-center gap-1 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide rounded-md transition-colors data-[state=active]:shadow-none ${
                    active ? `${s.activeBg} ${s.activeText}` : `text-muted-foreground hover:${s.text} hover:${s.bg}`
                  }`}
                >
                  {r.label}
                  {count !== undefined && (
                    <span className={`text-[9px] font-bold px-1 rounded ${active ? "bg-white/25" : "bg-muted text-muted-foreground"}`}>
                      {count}
                    </span>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>

        {/* Search */}
        <div className="px-3 py-2 border-b shrink-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Rechercher..."
              value={userSearch}
              onChange={e => setUserSearch(e.target.value)}
              className="pl-8 pr-8 h-8 text-xs"
            />
            {userSearch && (
              <button onClick={() => setUserSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* User list */}
        <div className="flex-1 overflow-y-auto divide-y">
          {mode === "create" ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-primary" />
              </div>
              <p className="text-xs font-semibold text-muted-foreground leading-relaxed">
                Mode création<br />Nouveau compte
              </p>
            </div>
          ) : editUsersQuery.isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground/40" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center py-10 gap-2">
              <Users className="w-6 h-6 text-muted-foreground/30" />
              <p className="text-xs font-semibold text-muted-foreground/70">Aucun profil</p>
            </div>
          ) : (
            filteredUsers.map(user => {
              const s = ROLE_STYLE[editRole] || ROLE_STYLE.student;
              const isActive = selectedUserId === user.id;
              return (
                <button
                  key={user.id}
                  onClick={() => setSelectedUserId(user.id)}
                  className={`w-full px-3 py-2.5 flex items-center gap-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset ${
                    isActive ? "bg-primary" : "hover:bg-muted/60"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                    isActive ? "bg-white/15 text-white" : `${s.bg} ${s.text}`
                  }`}>
                    {(user.avatar || user.name?.slice(0, 2) || "?").toUpperCase().slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-xs truncate ${isActive ? "text-white" : "text-foreground"}`}>
                      {user.name}
                    </p>
                    <p className={`text-[11px] truncate ${isActive ? "text-white/70" : "text-muted-foreground"}`}>
                      {user.email}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── COL 2 : Form ────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Form header */}
        <div className="px-5 py-3 border-b bg-muted/30 flex items-center gap-4 shrink-0">
          {mode === "create" ? (
            <>
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <UserPlus className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Nouveau compte</p>
                <p className="text-sm font-bold text-foreground">Création d'utilisateur</p>
              </div>
            </>
          ) : selectedUser ? (
            <>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${rStyle.activeBg} ${rStyle.activeText}`}>
                {(selectedUser.avatar || selectedUser.name?.slice(0, 2) || "?").toUpperCase().slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{ROLE_OPTIONS.find(r => r.value === editRole)?.label}</p>
                <p className="text-sm font-bold text-foreground truncate">{selectedUser.name}</p>
              </div>
            </>
          ) : (
            <p className="text-xs font-semibold text-muted-foreground">Sélectionnez un utilisateur</p>
          )}

          {/* Mode toggle */}
          <div className="flex gap-1 ml-auto shrink-0">
            <Button
              size="sm"
              variant={mode === "edit" ? "default" : "ghost"}
              onClick={() => setMode("edit")}
              className="h-8 text-xs gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" /> Éditer
            </Button>
            <Button
              size="sm"
              variant={mode === "create" ? "default" : "ghost"}
              onClick={() => setMode("create")}
              className="h-8 text-xs gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" /> Créer
            </Button>
          </div>
        </div>

        {/* Form body */}
        <div className="flex-1 overflow-y-auto p-5">
          {mode === "create" ? (
            <form onSubmit={handleCreateSubmit} className="space-y-6 max-w-2xl">

              <FormSection title="Rôle & accès">
                <div className="flex flex-wrap gap-1.5">
                  {ROLE_OPTIONS.map(r => {
                    const s = ROLE_STYLE[r.value];
                    const active = createForm.role === r.value;
                    return (
                      <button
                        key={r.value} type="button"
                        onClick={() => setCreateForm(prev => ({ ...prev, role: r.value, childrenIds: [], parentIds: [], teacherIds: [], studentIds: [] }))}
                        aria-pressed={active}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 ${
                          active ? `${s.activeBg} ${s.activeText} border-transparent shadow-sm` : `border-border ${s.text} hover:${s.bg}`
                        }`}
                      >
                        {r.label}
                      </button>
                    );
                  })}
                </div>
              </FormSection>

              <FormSection title="Identité">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="create-name">Nom complet *</Label>
                    <Input id="create-name" value={createForm.name} onChange={e => { handleCreateChange("name", e.target.value); if (!createForm.avatar) handleCreateChange("avatar", e.target.value.slice(0, 2).toUpperCase()); }} placeholder="Nom Prénom" required className="mt-1.5" />
                  </div>
                  <div>
                    <Label htmlFor="create-email">Email *</Label>
                    <Input id="create-email" type="email" value={createForm.email} onChange={e => handleCreateChange("email", e.target.value)} placeholder="email@care4success.cm" required className="mt-1.5" />
                  </div>
                  <div>
                    <Label htmlFor="create-password">Mot de passe *</Label>
                    <Input id="create-password" type="password" value={createForm.password} onChange={e => handleCreateChange("password", e.target.value)} placeholder="Min. 8 caractères" required minLength={8} className="mt-1.5" aria-describedby="create-password-hint" />
                    <p id="create-password-hint" className="text-xs text-muted-foreground mt-1">Min. 8 caractères — à communiquer à l'utilisateur.</p>
                  </div>
                  <div>
                    <Label htmlFor="create-avatar">Initiales</Label>
                    <Input id="create-avatar" value={createForm.avatar ?? ""} onChange={e => handleCreateChange("avatar", e.target.value.slice(0, 2).toUpperCase())} maxLength={2} className="mt-1.5 font-bold text-center uppercase" />
                  </div>
                </div>
              </FormSection>

              <FormSection title="Contact & préférences">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="create-phone">Téléphone</Label>
                    <Input id="create-phone" value={createForm.phone} onChange={e => handleCreateChange("phone", e.target.value)} placeholder="+237 6XX XXX XXX" className="mt-1.5" aria-describedby="create-phone-hint" />
                    <p id="create-phone-hint" className="text-xs text-muted-foreground mt-1">Format international recommandé.</p>
                  </div>
                  <div>
                    <Label htmlFor="create-timezone">Fuseau horaire</Label>
                    <Select value={createForm.timezone} onValueChange={v => handleCreateChange("timezone", v)}>
                      <SelectTrigger id="create-timezone" className="mt-1.5"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TIMEZONES.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="create-language">Langue</Label>
                    <Select value={createForm.language} onValueChange={v => handleCreateChange("language", v)}>
                      <SelectTrigger id="create-language" className="mt-1.5"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {LANGUAGES.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <GeoSelector
                  label="Localisation"
                  value={createForm.geoLocationId}
                  onChange={(geoId, path) => setCreateForm(prev => ({ ...prev, geoLocationId: geoId, location: path }))}
                />

                <div>
                  <Label htmlFor="create-bio">Bio</Label>
                  <Textarea id="create-bio" rows={2} value={createForm.bio} onChange={e => handleCreateChange("bio", e.target.value)} placeholder="Courte présentation…" className="mt-1.5 resize-none" />
                </div>

                <div>
                  <Label className="mb-2 block">Notifications</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {NOTIFICATION_CHANNELS.map(({ key, label, hint, icon }) => (
                      <NotificationCard
                        key={key} label={label} hint={hint} icon={icon}
                        checked={createForm[key] as boolean}
                        onCheckedChange={v => handleCreateChange(key, v)}
                      />
                    ))}
                  </div>
                </div>
              </FormSection>

              <div className="pt-1">
                <Button type="submit" disabled={registerMutation.isPending} className="px-6 gap-2">
                  {registerMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  {registerMutation.isPending ? "Création…" : "Créer le compte"}
                </Button>
              </div>
            </form>
          ) : !selectedUser ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground/40">
              <Users className="w-12 h-12" />
              <p className="text-sm font-semibold text-muted-foreground/60">Sélectionnez un utilisateur</p>
            </div>
          ) : (
            <form onSubmit={e => { e.preventDefault(); editMutation.mutate(); }} className="space-y-6 max-w-2xl">

              <FormSection title="Rôle & accès">
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold ${rStyle.activeBg} ${rStyle.activeText}`}>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {ROLE_OPTIONS.find(r => r.value === editRole)?.label}
                </div>
                <p className="text-xs text-muted-foreground">Le rôle d'un compte existant ne se change pas depuis cet écran.</p>
              </FormSection>

              <FormSection title="Identité">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="edit-name">Nom complet *</Label>
                    <Input id="edit-name" value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} required className="mt-1.5" />
                  </div>
                  <div>
                    <Label htmlFor="edit-avatar">Initiales</Label>
                    <Input id="edit-avatar" value={editForm.avatar} onChange={e => setEditForm(p => ({ ...p, avatar: e.target.value.slice(0, 2).toUpperCase() }))} maxLength={2} className="mt-1.5 font-bold text-center uppercase" />
                  </div>
                </div>
              </FormSection>

              <FormSection title="Contact & préférences">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="edit-phone">Téléphone</Label>
                    <Input id="edit-phone" value={editForm.phone} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} placeholder="+237 6XX XXX XXX" className="mt-1.5" aria-describedby="edit-phone-hint" />
                    <p id="edit-phone-hint" className="text-xs text-muted-foreground mt-1">Format international recommandé.</p>
                  </div>
                  <div>
                    <Label htmlFor="edit-timezone">Fuseau horaire</Label>
                    <Select value={editForm.timezone} onValueChange={v => setEditForm(p => ({ ...p, timezone: v }))}>
                      <SelectTrigger id="edit-timezone" className="mt-1.5"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TIMEZONES.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit-language">Langue</Label>
                    <Select value={editForm.language} onValueChange={v => setEditForm(p => ({ ...p, language: v }))}>
                      <SelectTrigger id="edit-language" className="mt-1.5"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {LANGUAGES.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <GeoSelector
                  label="Localisation"
                  value={editForm.geoLocationId}
                  onChange={(geoId, path) => setEditForm(p => ({ ...p, geoLocationId: geoId, location: path }))}
                />

                <div>
                  <Label htmlFor="edit-bio">Bio</Label>
                  <Textarea id="edit-bio" rows={2} value={editForm.bio} onChange={e => setEditForm(p => ({ ...p, bio: e.target.value }))} className="mt-1.5 resize-none" />
                </div>

                <div>
                  <Label className="mb-2 block">Notifications</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {NOTIFICATION_CHANNELS.map(({ key, label, hint, icon }) => (
                      <NotificationCard
                        key={key} label={label} hint={hint} icon={icon}
                        checked={editForm[key] as boolean}
                        onCheckedChange={v => setEditForm(p => ({ ...p, [key]: v }))}
                      />
                    ))}
                  </div>
                </div>
              </FormSection>

              <div className="pt-1">
                <Button type="submit" disabled={editMutation.isPending} className="px-6 gap-2">
                  {editMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {editMutation.isPending ? "Synchronisation…" : "Sauvegarder"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* ── COL 3 : Relations ────────────────────────────────────────────────── */}
      {hasRelationshipSection && (mode === "create" || (mode === "edit" && selectedUser)) && (
        <div className="w-64 border-l flex flex-col shrink-0">
          <div className="px-4 py-3 border-b bg-muted/30 shrink-0">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Liaisons</p>
            <p className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5 text-primary" /> Relations rattachées
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {relationshipContent()}
          </div>
        </div>
      )}
    </div>
  );
}
