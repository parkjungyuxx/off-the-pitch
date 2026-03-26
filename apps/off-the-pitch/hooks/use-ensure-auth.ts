"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";

/**
 * 세션이 없으면 /login 으로 보내고 false, 있으면 true.
 */
export function useEnsureAuth() {
  const router = useRouter();

  const ensureAuthOrRedirect = useCallback(async (): Promise<boolean> => {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      router.push("/login");
      return false;
    }
    return true;
  }, [router]);

  return { ensureAuthOrRedirect };
}
