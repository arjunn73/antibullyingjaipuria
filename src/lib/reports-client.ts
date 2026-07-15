import { createClient } from "@supabase/supabase-js";

// External Supabase project used for reports + admin auth.
const SUPABASE_URL = "https://cafhfyxtvahvxvdhkzqh.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_9vAAMbXpgZmrD9CLeSavdg_NOw0G7iV";

export const reportsDb = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
    storageKey: "reports-db-auth",
  },
});

export function generateTrackId(): string {
  // 10-digit numeric code
  const bytes = new Uint8Array(10);
  (typeof crypto !== "undefined" ? crypto : (globalThis as any).crypto).getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < 10; i++) out += (bytes[i] % 10).toString();
  return out;
}
