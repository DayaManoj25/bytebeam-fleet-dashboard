/// <reference types="vite/client" />
 
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  /** Optional: enables a one-click "Use reviewer account" button on the login page. */
  readonly VITE_DEMO_EMAIL?: string;
  readonly VITE_DEMO_PASSWORD?: string;
  /** Optional: 'true' allows the no-login offline demo mode in production builds. */
  readonly VITE_ALLOW_DEMO?: string;
}
 