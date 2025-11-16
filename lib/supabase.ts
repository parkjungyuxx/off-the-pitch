import { createClient } from "@supabase/supabase-js";

// Prefer client-exposed envs; fall back to non-prefixed if provided.
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_KEY || process.env.SUPABASE_KEY || "";

let supabaseClient: ReturnType<typeof createClient> | null = null;

export const getSupabaseClient = (): ReturnType<typeof createClient> => {
  if (supabaseClient) return supabaseClient;
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    // Throwing helps surface misconfiguration early in both server/client.
    throw new Error(
      "Supabase env vars are not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_KEY (or SUPABASE_URL/SUPABASE_KEY)."
    );
  }
  supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);
  return supabaseClient;
};
