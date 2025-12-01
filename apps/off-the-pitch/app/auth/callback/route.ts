import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");
  const next = requestUrl.searchParams.get("next") || "/";

  if (error) {
    console.error("OAuth error:", { error, errorDescription });
    let errorMessage = "로그인에 실패했습니다. 잠시 후 다시 시도해주세요.";
    
    if (error === "access_denied" || error === "user_cancelled") {
      errorMessage = "로그인이 취소되었습니다.";
    }
    
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(errorMessage)}`, requestUrl.origin)
    );
  }

  if (code) {
    try {
      const cookieStore = await cookies();
      const supabaseUrl =
        process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
      const supabaseAnonKey =
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_KEY ||
        process.env.SUPABASE_KEY ||
        "";

      if (!supabaseUrl || !supabaseAnonKey) {
        console.error("Missing Supabase env vars:", {
          hasUrl: !!supabaseUrl,
          hasKey: !!supabaseAnonKey,
          envKeys: Object.keys(process.env).filter((key) =>
            key.includes("SUPABASE")
          ),
        });
        return NextResponse.redirect(
          new URL(
            "/login?error=" + encodeURIComponent("로그인에 실패했습니다. 잠시 후 다시 시도해주세요."),
            requestUrl.origin
          )
        );
      }

      const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(
            cookiesToSet: Array<{
              name: string;
              value: string;
              options?: CookieOptions;
            }>
          ) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch (error) {
              console.error("Cookie setAll error:", error);
            }
          },
        },
      });

      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("Auth callback error:", {
          message: error.message,
          status: error.status,
          name: error.name,
        });
        
        let errorMessage = "로그인에 실패했습니다. 잠시 후 다시 시도해주세요.";
        
        if (error.message.includes("expired") || error.message.includes("invalid")) {
          errorMessage = "로그인 세션이 만료되었습니다. 다시 시도해주세요.";
        } else if (error.message.includes("network") || error.message.includes("timeout")) {
          errorMessage = "네트워크 오류가 발생했습니다. 연결을 확인하고 다시 시도해주세요.";
        }
        
        return NextResponse.redirect(
          new URL(
            `/login?error=${encodeURIComponent(errorMessage)}`,
            requestUrl.origin
          )
        );
      }

      console.log("Auth callback success:", {
        hasSession: !!data.session,
        userId: data.session?.user?.id,
      });
    } catch (error) {
      console.error("Unexpected error in auth callback:", error);
      return NextResponse.redirect(
        new URL(
          `/login?error=${encodeURIComponent("로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.")}`,
          requestUrl.origin
        )
      );
    }
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
