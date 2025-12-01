import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase-client";

type SocialProvider = "google" | "kakao";

interface UseLoginReturn {
  loading: boolean;
  error: string | null;
  handleSocialLogin: (provider: SocialProvider) => Promise<void>;
}

/**
 * 로그인 페이지의 비즈니스 로직을 관리하는 훅
 */
export function useLogin(): UseLoginReturn {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(() => {
    if (!errorParam) return null;
    return decodeURIComponent(errorParam);
  });
  const supabase = createClient();

  // 세션 체크 및 자동 리다이렉트
  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        router.push("/");
      }
    };
    checkSession();

    // URL에서 에러 파라미터 제거
    if (errorParam) {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("error");
      window.history.replaceState({}, "", newUrl.toString());
    }
  }, [router, supabase, errorParam]);

  /**
   * 소셜 로그인 처리
   */
  const handleSocialLogin = async (provider: SocialProvider) => {
    try {
      setLoading(true);
      setError(null);

      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (authError) {
        let errorMessage = "로그인에 실패했습니다. 잠시 후 다시 시도해주세요.";
        if (
          authError.message.includes("network") ||
          authError.message.includes("timeout")
        ) {
          errorMessage =
            "네트워크 오류가 발생했습니다. 연결을 확인하고 다시 시도해주세요.";
        }
        setError(errorMessage);
        setLoading(false);
      }
    } catch {
      setError("로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    handleSocialLogin,
  };
}

