import { createBrowserClient } from "@supabase/ssr";

export const createClient = () => {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_KEY ||
    process.env.SUPABASE_KEY ||
    "";

  // 빌드 타임에는 환경 변수가 없을 수 있으므로 더미 URL로 클라이언트 생성
  // 런타임에 실제 사용 시 에러가 발생할 수 있지만 빌드는 성공
  if (!supabaseUrl || !supabaseAnonKey) {
    if (typeof window === "undefined") {
      // 서버 사이드 빌드 타임: 더미 값으로 클라이언트 생성
      return createBrowserClient(
        "https://placeholder.supabase.co",
        "placeholder-key"
      );
    }
    throw new Error(
      "Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)."
    );
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
};
