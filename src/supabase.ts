import { createClient } from '@supabase/supabase-js';
 
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
 
/** null when env vars are missing: the app then runs in offline demo mode. */
export const supabase = url && key ? createClient(url, key) : null;
export const isConfigured = Boolean(supabase);
 
/** Offline sample-data mode (no login) is only allowed in dev or when explicitly enabled, so a misconfigured deploy never exposes the dashboard. */
export const demoAllowed = import.meta.env.DEV || import.meta.env.VITE_ALLOW_DEMO === 'true';