"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FcGoogle } from "react-icons/fc";
import { createClient } from "@/lib/supabase-client";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

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
  }, [router, supabase]);

  const handleSocialLogin = async (provider: "google" | "kakao") => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setError(error.message);
        setLoading(false);
      }
    } catch {
      setError("로그인 중 오류가 발생했습니다.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 rounded-2xl border border-[rgb(57,57,57)] bg-card">
        <div className="flex flex-col items-center mb-8">
          <div className="mb-6">
            <Image
              src="/logo.svg"
              alt="OFF THE PITCH"
              width={64}
              height={64}
              className="rounded-full"
            />
          </div>
          <h1 className="text-3xl font-display font-bold tracking-wide text-balance">
            오프 더 피치
          </h1>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20">
            <p className="text-destructive text-sm text-center">{error}</p>
          </div>
        )}

        <div className="space-y-3">
          <Button
            onClick={() => handleSocialLogin("google")}
            disabled={loading}
            className="w-full h-12 rounded-2xl bg-white text-black hover:bg-white/90 font-medium flex items-center justify-center relative"
          >
            <FcGoogle className="w-5 h-5 absolute left-4" />
            <span>{loading ? "로딩 중..." : "Google로 로그인"}</span>
          </Button>

          <Button
            onClick={() => handleSocialLogin("kakao")}
            disabled={loading}
            className="w-full h-12 rounded-2xl bg-[#FEE500] text-black hover:bg-[#FEE500]/90 font-medium flex items-center justify-center relative"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="absolute left-4"
            >
              <path
                d="M12 3C6.477 3 2 7.477 2 12c0 3.237 1.707 6.074 4.27 7.613l-.587 2.24c-.12.46.35.83.75.55l2.5-1.87c.5.08 1.02.12 1.57.12 5.523 0 10-4.477 10-10S17.523 3 12 3z"
                fill="#000000"
              />
            </svg>
            <span>{loading ? "로딩 중..." : "카카오로 로그인"}</span>
          </Button>
        </div>

        <p className="mt-6 text-xs text-muted-foreground text-center">
          원하는 기자들의 이적 소식을 한 곳에서 — OFF THE PITCH
        </p>
      </Card>
    </div>
  );
}
