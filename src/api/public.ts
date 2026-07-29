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
}

export interface TeacherSlot {
    id: string;
    teacherId: string;
    subject: string | null;
    startTime: string;
    endTime: string;
    status: "open" | "booked" | "cancelled";
}

export interface PublicTeacherProfile extends PublicTeacher {
    slots: TeacherSlot[];
}

export const fetchPublicTeachers = () => publicRequest<PublicTeacher[]>("/public/teachers");

export const fetchPublicTeacherProfile = (id: string) =>
    publicRequest<PublicTeacherProfile>(`/public/teachers/${id}`);

export const fetchTeacherOpenSlots = (teacherId: string) =>
    publicRequest<TeacherSlot[]>(`/teachers/${teacherId}/slots`);

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
