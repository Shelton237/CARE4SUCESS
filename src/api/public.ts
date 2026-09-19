// Endpoints du site public — pas d'authentification requise (recherche
// d'enseignants, profil public, créneaux ouverts à la réservation).
const API_BASE = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

async function publicRequest<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
    });
    const text = await res.text();
    let payload: unknown = null;
    try { payload = text ? JSON.parse(text) : null; } catch { payload = text; }
    if (!res.ok) {
        const msg = payload && typeof payload === "object" && "message" in payload
            ? String((payload as { message: unknown }).message)
            : "Erreur serveur";
        throw new Error(msg);
    }
    return payload as T;
}

export interface PublicTeacher {
    id: string;
    name: string;
    subjects: string[];
    level: string;
    city: string;
    rating: number;
    students: number;
    rateType: "hourly" | "monthly";
    rate: number;
    currency: string;
    rateUnitMinutes: number;
    /** Photo réellement uploadée par l'enseignant — null si aucune (jamais de placeholder généré côté serveur). */
    avatarUrl: string | null;
    countryId: number | null;
    country: string | null;
    regionId: number | null;
    region: string | null;
    /** Présentation publique, à remplir par le coach — vide au départ. */
    bio: string | null;
    specialties: string[];
    /** Description libre par spécialité, clé = nom de la spécialité. */
    specialtyDescriptions: Record<string, string>;
    formats: string[];
    headline: string | null;
    languages: { name: string; level: string }[];
    yearsExperience: number | null;
    videoIntroUrl: string | null;
    educations: { institution: string; degree: string; dates: string }[];
    certificates: { name: string; dates: string }[];
    qualities: string[];
}

export interface TeacherSlot {
    id: string;
    teacherId: string;
    subject: string | null;
    startTime: string;
    endTime: string;
    status: "open" | "booked" | "cancelled";
    posterUrl: string | null;
}

export interface TeacherReview {
    reviewerName: string;
    reviewerType: "parent" | "student" | "advisor";
    rating: number;
    comment: string;
    date: string;
}

export interface PublicTeacherProfile extends PublicTeacher {
    slots: TeacherSlot[];
    reviews: TeacherReview[];
    reviewsCount: number;
    ratingDistribution: Record<1 | 2 | 3 | 4 | 5, number>;
}

export const fetchPublicTeachers = () => publicRequest<PublicTeacher[]>("/public/teachers");

export const fetchPublicTeacherProfile = (id: string) =>
    publicRequest<PublicTeacherProfile>(`/public/teachers/${id}`);

export const fetchTeacherOpenSlots = (teacherId: string) =>
    publicRequest<TeacherSlot[]>(`/teachers/${teacherId}/slots`);

export interface EvaluationRequestPayload {
    parentFirstName: string;
    parentLastName: string;
    email: string;
    phone: string;
    country?: string;
    city?: string;
    childFirstName: string;
    level: string;
    schoolSystem?: string;
    currentSchool?: string;
    subjects?: string;
    format?: string;
    needs?: string;
    urgency?: string;
    availability?: string;
    howHeard?: string;
}

export const submitEvaluationRequest = (payload: EvaluationRequestPayload) =>
    publicRequest<{ id: string }>("/public/evaluation-requests", {
        method: "POST",
        body: JSON.stringify(payload),
    });

export type MobileMoneyNetwork = "MTN" | "ORANGE";

export type FlutterwaveNextAction = {
    type: "payment_instruction" | "requires_otp" | "requires_pin" | "redirect_url" | string;
    redirect_url?: { url: string };
    [key: string]: unknown;
} | null;

export interface InitiateBookingPayload {
    slotId: string;
    network: MobileMoneyNetwork;
    phoneNumber: string;
    countryCode?: string;
    parentName: string;
    parentEmail: string;
    parentPhone?: string;
    studentName: string;
    studentEmail?: string;
    subject?: string;
}

export const initiateBooking = (payload: InitiateBookingPayload) =>
    publicRequest<{
        chargeId: string; reference: string; status: string;
        nextAction: FlutterwaveNextAction; amount: number; currency: string;
    }>("/bookings/initiate", { method: "POST", body: JSON.stringify(payload) });

export const authorizeBookingCharge = (chargeId: string, type: "otp" | "pin", code: string) =>
    publicRequest<{ status: string; nextAction: FlutterwaveNextAction }>("/bookings/authorize", {
        method: "POST",
        body: JSON.stringify({ chargeId, type, code }),
    });

export const checkBookingStatus = (reference: string) =>
    publicRequest<{ success: boolean; alreadyProcessed?: boolean; sessionId?: string; reason?: string }>(
        `/bookings/status/${encodeURIComponent(reference)}`
    );

// ─── Cours groupés payants (capacité limitée, lien public) ─────────────────

export interface PublicGroupClass {
    id: string;
    title: string;
    subject: string;
    description: string | null;
    teacherName: string;
    sessionDate: string;
    sessionTime: string;
    price: number;
    currency: string;
    maxParticipants: number;
    spotsLeft: number;
    status: "scheduled" | "cancelled";
}

export const fetchPublicGroupClass = (id: string) =>
    publicRequest<PublicGroupClass>(`/group-classes/${id}/public`);

export interface InitiateGroupClassRegistrationPayload {
    network: MobileMoneyNetwork;
    phoneNumber: string;
    countryCode?: string;
    parentName: string;
    parentEmail: string;
    parentPhone?: string;
    studentName: string;
    studentEmail?: string;
}

export const initiateGroupClassRegistration = (groupClassId: string, payload: InitiateGroupClassRegistrationPayload) =>
    publicRequest<{
        chargeId: string; reference: string; status: string;
        nextAction: FlutterwaveNextAction; amount: number; currency: string;
    }>(`/group-classes/${groupClassId}/register/initiate`, { method: "POST", body: JSON.stringify(payload) });

export const authorizeGroupClassRegistration = (chargeId: string, type: "otp" | "pin", code: string) =>
    publicRequest<{ status: string; nextAction: FlutterwaveNextAction }>("/group-classes/register/authorize", {
        method: "POST",
        body: JSON.stringify({ chargeId, type, code }),
    });

export const checkGroupClassRegistrationStatus = (reference: string) =>
    publicRequest<{ success: boolean; alreadyProcessed?: boolean; sessionId?: string; reason?: string }>(
        `/group-classes/register/status/${encodeURIComponent(reference)}`
    );
