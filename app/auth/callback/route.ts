import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/";

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
          new URL("/login?error=config", requestUrl.origin)
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
              // The `setAll` method was called from a Server Component.
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
        return NextResponse.redirect(
          new URL(
            `/login?error=${encodeURIComponent(error.message)}`,
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
          `/login?error=${encodeURIComponent(
            error instanceof Error
              ? error.message
              : "알 수 없는 오류가 발생했습니다."
          )}`,
          requestUrl.origin
        )
      );
    }
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
