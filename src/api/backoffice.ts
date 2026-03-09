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

const API_BASE = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

async function request<T>(path: string, options?: RequestInit): Promise<T> {
    const isFormData = options?.body instanceof FormData;
    const headers: any = { ...options?.headers };

    if (!isFormData && !headers["Content-Type"]) {
        headers["Content-Type"] = "application/json";
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

export const fetchParentOverview = (parentId: string) =>
    request<ParentOverview>(`/parents/${parentId}/overview`);

export const fetchStudentOverview = (studentId: string) =>
    request<any>(`/students/${studentId}/overview`);

export const fetchStudentsByTeacher = (teacherId: string) =>
    request<any[]>(`/teachers/${teacherId}/students`);

export const fetchParentProgress = (parentId: string) =>
    request<ParentProgressPoint[]>(`/parents/${parentId}/progress`);

export const fetchProgressReport = (parentId: string) =>
    request<any>(`/parents/${parentId}/progress-report`);

export const fetchEarningsHistory = (teacherId: string) =>
    request<any[]>(`/teachers/${teacherId}/earnings-history`);

export const fetchStudentProgress = (studentId: string) =>
    request<any[]>(`/parents/${studentId}/progress`);

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

export const submitTeacherFeedback = (payload: CreateTeacherFeedbackPayload) =>
    request<TeacherFeedback>("/teacher-feedback", {
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

export const markNotificationAsRead = (id: string) =>
    request<any>(`/notifications/${id}/read`, {
        method: "PATCH"
    });
