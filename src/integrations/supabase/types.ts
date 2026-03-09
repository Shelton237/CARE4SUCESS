export type RequestStatus = "reçu" | "en traitement" | "assigné" | "clôturé";

export interface RequestRow {
    id: string;
    parent_name: string;
    child_name: string;
    level: string;
    subject: string;
    phone: string;
    status: RequestStatus;
    request_date: string;
    created_at: string;
}

export interface BackofficeRequest {
    id: string;
    parent: string;
    child: string;
    level: string;
    subject: string;
    phone: string;
    status: RequestStatus;
    date: string;
}

export interface AssignmentCandidate {
    name: string;
    rating: number;
    available: boolean;
}

export type AssignmentStatus = "pending" | "selected" | "confirmed";

export interface AssignmentRow {
    id: string;
    child_name: string;
    level: string;
    subject: string;
    needs: string[];
    schedule: string;
    candidates: AssignmentCandidate[];
    selected_teacher: string | null;
    status: AssignmentStatus;
    created_at: string;
    updated_at: string | null;
}

export interface AdvisorAssignment {
    id: string;
    child: string;
    level: string;
    subject: string;
    needs: string[];
    schedule: string;
    candidates: AssignmentCandidate[];
    selectedTeacher: string | null;
    status: AssignmentStatus;
}

export type SessionStatus = "effectué" | "à venir" | "planifié";

export interface SessionRow {
    id: string;
    session_day: string;
    session_date: string;
    session_time: string;
    subject: string;
    location: string;
    status: SessionStatus;
    teacher_id: string;
    teacher_name: string;
    student_id: string;
    student_name: string;
    parent_id: string;
    parent_name: string;
    virtual_link: string | null;
    notes: string | null;
    created_at: string;
}

export interface ScheduleSession {
    id: string;
    day: string;
    date: string;
    time: string;
    subject: string;
    location: string;
    status: SessionStatus;
    teacher: string;
    teacherId: string;
    student: string;
    studentId: string;
    parent: string;
    parentId: string;
    virtualLink?: string | null;
    notes?: string | null;
    whiteboardData?: string | null;
    codeData?: string | null;
}

export type ReviewerRole = "admin" | "advisor";
export type TeacherApplicationStatus = "pending" | "approved" | "rejected";

export interface TeacherApplicationRow {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    subjects: string[];
    experience_years: number;
    availability: string;
    motivation: string;
    cv_url: string | null;
    status: TeacherApplicationStatus;
    reviewed_by: string | null;
    reviewer_role: ReviewerRole | null;
    review_notes: string | null;
    reviewed_at: string | null;
    created_at: string;
}

export interface TeacherApplication {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    subjects: string[];
    experienceYears: number;
    availability: string;
    motivation: string;
    cvUrl?: string | null;
    status: TeacherApplicationStatus;
    reviewedBy?: string | null;
    reviewerRole?: ReviewerRole | null;
    reviewNotes?: string | null;
    reviewedAt?: string | null;
    createdAt: string;
}

export interface CreateTeacherApplicationPayload {
    fullName: string;
    email: string;
    phone: string;
    subjects: string[];
    experienceYears: number;
    availability: string;
    motivation: string;
    cvUrl?: string;
}

export type TeacherApplicationDecisionPayload = {
    status: Exclude<TeacherApplicationStatus, "pending">;
    reviewNotes?: string;
    reviewerName: string;
    reviewerRole: ReviewerRole;
};

export type TeacherFeedbackReviewer = "parent" | "student" | "advisor";

export interface TeacherFeedback {
    id: string;
    teacherId: string;
    teacherName: string;
    reviewerName: string;
    reviewerType: TeacherFeedbackReviewer;
    rating: number;
    comment?: string | null;
    sessionId?: string | null;
    createdAt: string;
}

export interface CreateTeacherFeedbackPayload {
    teacherId: string;
    teacherName: string;
    reviewerName: string;
    reviewerType: TeacherFeedbackReviewer;
    rating: number;
    comment?: string;
    sessionId?: string;
}

export interface TeacherRating {
    teacherId: string;
    teacherName: string;
    averageRating: number;
    reviewCount: number;
    lastReviewAt: string | null;
}

export type ParentInvoiceStatus = "paid" | "pending";

export interface ParentInvoice {
    id: string;
    parentId: string;
    date: string;
    description: string;
    amount: number;
    status: ParentInvoiceStatus;
}

export interface ParentOverview {
    parentId: string;
    parentName: string;
    studentId: string;
    childName: string;
    childLevel: string;
    focusSubject: string;
    sessionsThisMonth: number;
    currentAvg: number;
    previousAvg: number;
    totalPaidThisMonth: number;
    upcomingSession: ScheduleSession | null;
    pendingInvoice: ParentInvoice | null;
    latestEvaluations?: ParentEvaluationSummary[];
}

export interface ParentProgressPoint {
    month: string;
    maths: number;
    francais: number;
    anglais: number;
}

export interface ParentEvaluationSummary {
    id: string;
    score: number;
    totalPoints: number;
    quizTitle: string;
    courseTitle: string;
    subject: string;
    createdAt: string;
}

export type CourseStatus = "draft" | "published";

export interface CourseLesson {
    id: string;
    courseId: string;
    title: string;
    content: string;
    videoUrl?: string | null;
    order: number;
    quiz?: QuizSummary | null;
}

export interface QuizSummary {
    id: string;
    courseId: string;
    lessonId?: string | null;
    title: string;
    instructions?: string | null;
    totalPoints: number;
    questionCount?: number;
    questions?: QuizQuestion[];
}

export interface QuizChoice {
    id: string;
    label: string;
}

export interface QuizQuestion {
    id: string;
    quizId: string;
    prompt: string;
    choices: QuizChoice[];
    points: number;
    correctAnswer?: string;
}

export interface CourseSummary {
    id: string;
    title: string;
    description: string;
    subject: string;
    level: string;
    status: CourseStatus;
    coverUrl?: string | null;
    createdBy?: string | null;
    createdAt: string;
    lessons: CourseLesson[];
}

export interface QuizAttempt {
    id: string;
    quizId: string;
    studentId: string;
    studentName: string;
    answers: { questionId: string; answer: string }[];
    score: number;
    createdAt: string;
    quizTitle?: string;
    courseTitle?: string;
    subject?: string;
    totalPoints?: number;
}

export interface SubjectRate {
    id: string;
    label: string;
    baseRate: number;
    premiumRate: number;
}

export interface PlatformCenter {
    id: string;
    name: string;
    city: string;
    address: string;
    active: boolean;
}

export interface NotificationPreference {
    key: string;
    label: string;
    enabled: boolean;
}

export type SessionTimeoutOption = "30m" | "1h" | "4h" | "24h";
export type PasswordPolicyOption = "standard" | "strong";

export interface SecuritySettings {
    sessionTimeout: SessionTimeoutOption;
    passwordPolicy: PasswordPolicyOption;
    enforce2FA: boolean;
}

export interface PlatformSettings {
    hourlyRates: SubjectRate[];
    centers: PlatformCenter[];
    notifications: NotificationPreference[];
    security: SecuritySettings;
}

export interface Homework {
    id: string;
    teacherId: string;
    teacherName: string;
    studentId: string;
    studentName: string;
    sessionId?: string | null;
    title: string;
    description?: string | null;
    dueDate: string;
    subject: string;
    status: "à faire" | "rendu" | "corrigé";
    fileUrl?: string | null;
    submissionUrl?: string | null;
    feedback?: string | null;
    createdAt: string;
}

export interface CreateHomeworkPayload {
    teacherId: string;
    studentId: string;
    sessionId?: string;
    title: string;
    description?: string;
    dueDate: string;
    subject: string;
    fileUrl?: string;
}

export interface LessonResource {
    id: string;
    teacherId: string;
    teacherName: string;
    studentId?: string | null;
    title: string;
    fileUrl: string;
    fileType: string;
    subject: string;
    createdAt: string;
}

export interface CreateLessonResourcePayload {
    teacherId: string;
    studentId?: string;
    title: string;
    fileUrl: string;
    fileType?: string;
    subject: string;
}

export interface Notification {
    id: string;
    userId: string;
    title: string;
    content: string;
    type: 'info' | 'message' | 'homework' | 'success' | 'warning';
    isRead: boolean;
    link?: string | null;
    createdAt: string;
}
