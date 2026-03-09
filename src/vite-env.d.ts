/// <reference types="vite/client" />

// Global constants defined at build time
declare const __ROUTE_MESSAGING_ENABLED__: boolean;

interface ImportMetaEnv {
    readonly VITE_API_URL?: string;
    readonly VITE_SUPABASE_URL?: string;
    readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
