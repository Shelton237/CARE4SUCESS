import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let cachedClient: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
    cachedClient = createClient(supabaseUrl, supabaseAnonKey);
} else {
    console.warn(
        "[Supabase] VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY manquant(e). Les fonctionnalités persistées seront indisponibles."
    );
}

export const getSupabaseClient = () => {
    if (!cachedClient) {
        throw new Error("Supabase n'est pas configuré. Ajoutez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans votre .env.local.");
    }
    return cachedClient;
};
