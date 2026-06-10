const API_BASE = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

const getAuthToken = () => {
    try { return window.localStorage.getItem("c4s_token"); } catch { return null; }
};

async function geoRequest<T>(path: string, options?: RequestInit): Promise<T> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const token = getAuthToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    const text = await res.text();
    let payload: unknown = null;
    try { payload = text ? JSON.parse(text) : null; } catch { payload = text; }
    if (!res.ok) {
        const msg = payload && typeof payload === "object" && "message" in payload
            ? String((payload as { message: unknown }).message)
            : "Erreur API géographie";
        throw new Error(msg);
    }
    return payload as T;
}

export type GeoType = "country" | "region" | "department" | "arrondissement" | "quartier";

export interface GeoLocation {
    id: number;
    name: string;
    type: GeoType;
    parent_id: number | null;
    status: "active" | "pending";
}

export interface PendingGeoLocation extends GeoLocation {
    suggested_by: string | null;
    created_at: string;
    parent_name: string | null;
    parent_type: GeoType | null;
}

export const fetchGeoLocations = (type: GeoType, parentId?: number): Promise<GeoLocation[]> => {
    let url = `/geo?type=${type}`;
    if (parentId != null) url += `&parent_id=${parentId}`;
    return geoRequest<GeoLocation[]>(url);
};

export const suggestGeoLocation = (payload: {
    name: string;
    type: GeoType;
    parent_id?: number | null;
    suggested_by?: string | null;
}): Promise<GeoLocation & { alreadyExists?: boolean }> =>
    geoRequest("/geo/suggest", { method: "POST", body: JSON.stringify(payload) });

export const fetchPendingGeoLocations = (): Promise<PendingGeoLocation[]> =>
    geoRequest("/geo/pending");

export const validateGeoLocation = (
    id: number,
    action: "validate" | "reject",
    validatedBy?: string
): Promise<{ success: boolean; location?: GeoLocation }> =>
    geoRequest(`/geo/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ action, validated_by: validatedBy }),
    });
