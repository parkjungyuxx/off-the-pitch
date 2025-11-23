import { createClient } from "@supabase/supabase-js";

// 클라이언트 노출용 환경변수(NEXT_PUBLIC_*)를 우선 사용하고, 없으면 일반 키를 폴백합니다.
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_KEY || process.env.SUPABASE_KEY || "";

let supabaseClient: ReturnType<typeof createClient> | null = null;

export const getSupabaseClient = (): ReturnType<typeof createClient> => {
  if (supabaseClient) return supabaseClient;
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    // 서버/클라이언트 모두에서 환경설정 누락을 빠르게 알리기 위해 예외를 던집니다.
    throw new Error(
      "Supabase env vars are not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_KEY (or SUPABASE_URL/SUPABASE_KEY)."
    );
  }
  supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);
  return supabaseClient;
};
