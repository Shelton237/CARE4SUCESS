import type { User, Role } from "@/types/user";
import type {
    BackofficeRequest,
    AdvisorAssignment,
    ScheduleSession,
    TeacherApplication,
    TeacherApplicationStatus,
    CreateTeacherApplicationPayload,
    TeacherApplicationDecisionPayload,
    TeacherFeedback,
    TeacherRating,
    CreateTeacherFeedbackPayload,
    ParentOverview,
    ParentProgressPoint,
    ParentInvoice,
    CourseSummary,
    QuizSummary,
    QuizAttempt,
    PlatformSettings,
    Homework,
    LessonResource,
    CreateHomeworkPayload,
    CreateLessonResourcePayload,
    Notification,
} from "@/integrations/supabase/types";

type ScheduleRole = "teacher" | "parent" | "student";
type CourseRole = "teacher" | "student" | "admin";

export type UpdateUserProfilePayload = {
    name?: string;
    phone?: string;
    avatar?: string;
    location?: string;
    timezone?: string;
    language?: string;
    bio?: string;
    notifyEmail?: boolean;
    notifySms?: boolean;
    notifyWhatsapp?: boolean;
    bankName?: string;
    bankIban?: string;
    bankAccountHolder?: string;
    availability?: any[];
};

export type RegisterUserPayload = UpdateUserProfilePayload & {
    name: string;
    email: string;
    password: string;
    role: Role;
    childrenIds?: string[];
    parentIds?: string[];
    teacherIds?: string[];
    studentIds?: string[];
};

export type RegisterUserResponse = {
    token?: string;
    user: User;
};

export type AdminDashboardResponse = {
    stats: {
        totalTeachers: number;
        activeStudents: number;
        pendingRequests: number;
        monthlyRevenue: number;
        previousRevenue: number;
        satisfactionRate: number;
        newFamiliesThisMonth: number;
    };
    monthlyRevenue: { month: string; amount: number }[];
    latestRequests: {
        id: string;
        parent: string;
        child: string;
        level: string;
        subject: string;
        status: string;
        date: string;
        phone?: string | null;
    }[];
};

const API_BASE = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

const getAuthToken = () => {
    if (typeof window === "undefined") return null;
    try {
        return window.sessionStorage.getItem("c4s_token");
    } catch {
        return null;
    }
};

async function request<T>(path: string, options?: RequestInit): Promise<T> {
    const isFormData = options?.body instanceof FormData;
    const headers: Record<string, string> = {};
    if (options?.headers) {
        Object.assign(headers, options.headers as Record<string, string>);
    }

    if (!isFormData && !headers["Content-Type"]) {
        headers["Content-Type"] = "application/json";
    }
    const authToken = getAuthToken();
    if (authToken && !headers.Authorization) {
        headers.Authorization = `Bearer ${authToken}`;
    }

    const fetchOptions: RequestInit = {
        ...options,
        headers,
    };

    const response = await fetch(`${API_BASE}${path}`, fetchOptions);

    let payload: unknown = null;
    const text = await response.text();
    if (text) {
        try {
            payload = JSON.parse(text);
        } catch {
            payload = text;
        }
    }

    if (!response.ok) {
        const message =
            typeof payload === "string"
                ? payload
                : payload && typeof payload === "object" && "message" in payload
                    ? String((payload as { message: unknown }).message)
                    : "Requete API echouee";
        throw new Error(message);
    }

    return payload as T;
}

export const fetchRequests = () => request<BackofficeRequest[]>("/requests");

export const createRequest = (payload: {
    parentName: string;
    childName: string;
    level: string;
    subject: string;
    phone: string;
}) => request<BackofficeRequest>("/requests", {
    method: "POST",
    body: JSON.stringify(payload),
});

export const updateRequestStatus = (id: string, status: string) => request<BackofficeRequest>(`/requests/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
});

export const fetchAdvisorAssignments = () => request<AdvisorAssignment[]>("/assignments");

export const confirmAssignment = (assignmentId: string, teacherName: string) =>
    request<AdvisorAssignment>(`/assignments/${assignmentId}`, {
        method: "PATCH",
        body: JSON.stringify({ selectedTeacher: teacherName }),
    });

export const fetchScheduleByRole = (role: ScheduleRole, userId: string) => {
    const params = new URLSearchParams({ role, userId });
    return request<ScheduleSession[]>(`/sessions?${params.toString()}`);
};

export const fetchParentOverview = (parentId: string, studentId?: string) => {
    const params = studentId ? `?studentId=${studentId}` : "";
    return request<ParentOverview>(`/parents/${parentId}/overview${params}`);
};

export const fetchStudentOverview = (studentId: string) =>
    request<any>(`/students/${studentId}/overview`);

export const fetchStudentsByTeacher = (teacherId: string) =>
    request<any[]>(`/teachers/${teacherId}/students`);

export const fetchParentProgress = (parentId: string, studentId?: string) => {
    const params = studentId ? `?studentId=${studentId}` : "";
    return request<ParentProgressPoint[]>(`/parents/${parentId}/progress${params}`);
};

export const fetchProgressReport = (parentId: string) =>
    request<any>(`/parents/${parentId}/progress-report`);

export const fetchEarningsHistory = (teacherId: string) =>
    request<any[]>(`/teachers/${teacherId}/earnings-history`);

export const fetchStudentProgress = (studentId: string) =>
    request<any[]>(`/students/${studentId}/progress`);

export const fetchStudentGrades = (studentId: string) =>
    request<any[]>(`/students/${studentId}/grades`);

export const fetchParentInvoices = (parentId: string) =>
    request<ParentInvoice[]>(`/parents/${parentId}/invoices`);

export const fetchCourses = (role: CourseRole = "admin", userId?: string) => {
    const params = new URLSearchParams();
    if (role) params.set("role", role);
    if (userId) params.set("userId", userId);
    const query = params.toString();
    const suffix = query ? `?${query}` : "";
    return request<CourseSummary[]>(`/courses${suffix}`);
};

export const fetchCourseDetails = (courseId: string) =>
    request<CourseSummary>(`/courses/${courseId}`);

export const createCourse = (payload: {
    title: string;
    description: string;
    subject: string;
    level: string;
    status?: "draft" | "published";
    coverUrl?: string;
    createdBy?: string;
}) =>
    request<CourseSummary>("/courses", {
        method: "POST",
        body: JSON.stringify(payload),
    });

export const createCourseLesson = (
    courseId: string,
    payload: { title: string; content: string; videoUrl?: string; order?: number }
) =>
    request<CourseSummary>(`/courses/${courseId}/lessons`, {
        method: "POST",
        body: JSON.stringify(payload),
    });

export const createLessonQuiz = (
    lessonId: string,
    payload: { title: string; instructions?: string; totalPoints?: number }
) =>
    request<{ quizId: string; course: CourseSummary }>(`/lessons/${lessonId}/quizzes`, {
        method: "POST",
        body: JSON.stringify(payload),
    });

export const createQuizQuestion = (
    quizId: string,
    payload: { prompt: string; choices: { id: string; label: string }[]; correctAnswer: string; points?: number }
) =>
    request<CourseSummary>(`/quizzes/${quizId}/questions`, {
        method: "POST",
        body: JSON.stringify(payload),
    });

export const assignCourseToStudent = (
    courseId: string,
    payload: { studentId: string; studentName: string; assignedBy?: string }
) =>
    request<CourseSummary>(`/courses/${courseId}/enrollments`, {
        method: "POST",
        body: JSON.stringify(payload),
    });

export const fetchCourseBookmarks = (userId: string) =>
    request<string[]>(`/users/${userId}/course-bookmarks`);

export const addCourseBookmark = (userId: string, courseId: string) =>
    request<any>(`/users/${userId}/course-bookmarks/${courseId}`, {
        method: "POST",
    });

export const removeCourseBookmark = (userId: string, courseId: string) =>
    request<any>(`/users/${userId}/course-bookmarks/${courseId}`, {
        method: "DELETE",
    });

export const updateCourseProgress = (userId: string, courseId: string, payload: { lessonId: string; completed?: boolean }) =>
    request<any>(`/users/${userId}/courses/${courseId}/progress`, {
        method: "POST",
        body: JSON.stringify(payload),
    });

export const fetchActiveCourse = (userId: string) =>
    request<{ courseId: string; lastLessonId: string; courseTitle: string; subject: string; lessonTitle: string } | null>(`/users/${userId}/active-course`);

export const fetchQuiz = (quizId: string, includeCorrect = false) => {
    const params = includeCorrect ? "?includeCorrect=true" : "";
    return request<QuizSummary>(`/quizzes/${quizId}${params}`);
};

export const submitQuizAttempt = (
    quizId: string,
    payload: { studentId: string; studentName: string; answers: { questionId: string; answer: string }[] }
) =>
    request<{ attemptId: string; score: number; totalPoints: number }>(`/quizzes/${quizId}/attempts`, {
        method: "POST",
        body: JSON.stringify(payload),
    });

export const fetchQuizAttempts = (quizId: string) =>
    request<QuizAttempt[]>(`/quizzes/${quizId}/attempts`);

export const fetchStudentQuizAttempts = (studentId: string) =>
    request<QuizAttempt[]>(`/students/${studentId}/quiz-attempts`);

export const fetchTeacherApplications = (status?: TeacherApplicationStatus | "all") => {
    const query = status && status !== "all" ? `?status=${status}` : "";
    return request<TeacherApplication[]>(`/teacher-applications${query}`);
};

export const submitTeacherApplication = (payload: FormData) =>
    request<TeacherApplication>("/teacher-applications", {
        method: "POST",
        body: payload,
    });

export const reviewTeacherApplication = (
    applicationId: string,
    payload: TeacherApplicationDecisionPayload
) =>
    request<TeacherApplication & { credentials?: { email: string; password?: string; name: string; alreadyExists?: boolean } }>(`/teacher-applications/${applicationId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
    });


export const fetchTeacherRatings = () => request<TeacherRating[]>("/teacher-ratings");

export const fetchTeacherFeedback = (teacherId: string) =>
    request<TeacherFeedback[]>(`/teachers/${teacherId}/feedback`);

export const fetchTeacherDashboard = (teacherId: string) =>
    request<any>(`/teachers/${teacherId}/dashboard`);

export const fetchTeacherEarnings = (teacherId: string) =>
    request<any[]>(`/teachers/${teacherId}/earnings`);


export const fetchTeacherStudents = (teacherId: string) =>
    request<any[]>(`/teachers/${teacherId}/students`);

export const fetchTeacherContacts = (teacherId: string) =>
    request<any[]>(`/teachers/${teacherId}/contacts`);

export const fetchAdvisorDashboard = (advisorId: string) =>
    request<any>(`/advisors/${advisorId}/dashboard`);

export const fetchAdvisorFamilies = () =>
    request<any[]>(`/advisor/families`);

export const fetchAdvisorAppointments = (advisorId: string) =>
    request<any[]>(`/advisors/${advisorId}/appointments`);

export const createAdvisorAppointment = (advisorId: string, payload: any) =>
    request<any>(`/advisors/${advisorId}/appointments`, {
        method: "POST",
        body: JSON.stringify(payload),
    });

export const fetchMessages = (userId: string) =>
    request<any[]>(`/messages/${userId}`);

export const sendMessage = (payload: any) =>
    request<any>("/messages", {
        method: "POST",
        body: JSON.stringify(payload),
    });

export const markMessageAsRead = (messageId: string) =>
    request<any>(`/messages/${messageId}/read`, {
        method: "PATCH",
    });

export const uploadMessageAttachment = (payload: FormData) =>
    request<{ fileUrl: string }>("/messages/upload", {
        method: "POST",
        body: payload,
    });

export const submitTeacherFeedback = (payload: CreateTeacherFeedbackPayload) =>
    request<TeacherFeedback>("/teacher-feedback", {
        method: "POST",
        body: JSON.stringify(payload),
    });

export const submitStudentEvaluation = (studentId: string, payload: { teacherId: string; teacherName: string; rating: number; comment: string }) =>
    request<any>(`/students/${studentId}/evaluations`, {
        method: "POST",
        body: JSON.stringify(payload),
    });

export const fetchPlatformSettings = () => request<PlatformSettings>("/platform-settings");

export const savePlatformSettings = (payload: PlatformSettings) =>
    request<PlatformSettings>("/platform-settings", {
        method: "PUT",
        body: JSON.stringify(payload),
    });

export const updateSessionStatus = (sessionId: string, status: string) =>
    request<any>(`/sessions/${sessionId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
    });

export const updateSessionNotes = (sessionId: string, notes: string) =>
    request<any>(`/sessions/${sessionId}/notes`, {
        method: "PATCH",
        body: JSON.stringify({ notes }),
    });

export const fetchHomework = (role: ScheduleRole, userId: string) =>
    request<Homework[]>(`/homework/${role}/${userId}`);

export const createHomework = (payload: CreateHomeworkPayload) =>
    request<Homework>("/homework", {
        method: "POST",
        body: JSON.stringify(payload),
    });

export const updateHomework = (id: string, payload: Partial<Homework>) =>
    request<Homework>(`/homework/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
    });

export const uploadHomeworkFile = (id: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return request<any>(`/homework/${id}/upload`, {
        method: "POST",
        body: formData,
    });
};

export const fetchLessonResources = (role: ScheduleRole, userId: string) =>
    request<LessonResource[]>(`/lesson-resources/${role}/${userId}`);

export const createLessonResource = (payload: CreateLessonResourcePayload) =>
    request<LessonResource>("/lesson-resources", {
        method: "POST",
        body: JSON.stringify(payload),
    });

export const deleteLessonResource = (id: string) =>
    request<any>(`/lesson-resources/${id}`, {
        method: "DELETE",
    });

export const fetchNotifications = (userId: string) =>
    request<Notification[]>(`/notifications/${userId}`);

export const globalSearch = (query: string) =>
    request<{ courses: any[]; teachers: any[]; homework: any[] }>(`/search?q=${encodeURIComponent(query)}`);

export const markNotificationAsRead = (id: string) =>
    request<any>(`/notifications/${id}/read`, {
        method: "PATCH"
    });

export const fetchAdminDashboard = () =>
    request<AdminDashboardResponse>("/admin/dashboard");

export const sessionCheckIn = (sessionId: string) =>
    request<{ success: boolean }>(`/sessions/${sessionId}/check-in`, { method: "PATCH" });

export const sessionCheckOut = (sessionId: string) =>
    request<{ success: boolean }>(`/sessions/${sessionId}/check-out`, { method: "PATCH" });

export const submitSessionReport = (sessionId: string, payload: {
    reportText: string;
    understandingScore: number;
    rating?: number;
    comment?: string;
    lessonId?: string;
    courseId?: string;
}) =>
    request<{ success: boolean }>(`/sessions/${sessionId}/report`, {
        method: "POST",
        body: JSON.stringify(payload),
    });

export const registerUser = (payload: RegisterUserPayload) =>
    request<RegisterUserResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
    });

export const fetchUsers = (role?: Role) => {
    const params = role ? `?role=${role}` : "";
    return request<User[]>(`/users${params}`);
};

export const fetchUserProfile = (userId: string) =>
    request<User>(`/users/${userId}`);

export const updateUserProfile = (userId: string, payload: UpdateUserProfilePayload) =>
    request<User>(`/users/${userId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
    });

export const updateUserPassword = (
    userId: string,
    payload: { currentPassword: string; newPassword: string }
) =>
    request<{ success: boolean }>(`/users/${userId}/password`, {
        method: "PATCH",
        body: JSON.stringify(payload),
    });

export const uploadUserAvatar = (userId: string, file: File) => {
    const formData = new FormData();
    formData.append("avatar", file);
    return request<User>(`/users/${userId}/avatar`, {
        method: "POST",
        body: formData,
    });
};

export const fetchChildrenByParent = (parentId: string) =>
    request<User[]>(`/relationships/parent-child?parentId=${parentId}`);

export const fetchParentsByStudent = (studentId: string) =>
    request<User[]>(`/relationships/parent-child?childId=${studentId}`);

export const fetchTeachersByStudent = (studentId: string) =>
    request<User[]>(`/relationships/student-teacher?studentId=${studentId}`);

export const fetchStudentsLinkedToTeacher = (teacherId: string) =>
    request<User[]>(`/relationships/student-teacher?teacherId=${teacherId}`);

export const linkParentChildRelation = (parentId: string, childId: string) =>
    request("/relationships/parent-child", {
        method: "POST",
        body: JSON.stringify({ parentId, childId }),
    });

export const unlinkParentChildRelation = (parentId: string, childId: string) =>
    request("/relationships/parent-child", {
        method: "DELETE",
        body: JSON.stringify({ parentId, childId }),
    });

export const linkStudentTeacherRelation = (studentId: string, teacherId: string) =>
    request("/relationships/student-teacher", {
        method: "POST",
        body: JSON.stringify({ studentId, teacherId }),
    });

export const unlinkStudentTeacherRelation = (studentId: string, teacherId: string) =>
    request("/relationships/student-teacher", {
        method: "DELETE",
        body: JSON.stringify({ studentId, teacherId }),
    });

export const submitGradeDispute = (payload: { studentId: string; sessionId: string; reason: string }) =>
    request("/grade-disputes", {
        method: "POST",
        body: JSON.stringify(payload),
    });

export const fetchStudentHomework = (studentId: string) =>
    request<Homework[]>(`/students/${studentId}/homework`);

export const fetchStudentProgressData = (studentId: string) =>
    request<any[]>(`/students/${studentId}/progress`);

export const fetchStudentSessions = (studentId: string) =>
    request<ScheduleSession[]>(`/students/${studentId}/sessions`);

