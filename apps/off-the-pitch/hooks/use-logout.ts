import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";

interface UseLogoutReturn {
  handleLogout: () => Promise<void>;
}

/**
 * 로그아웃 비즈니스 로직을 관리하는 훅
 */
export function useLogout(): UseLogoutReturn {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Logout error:", error);
        return;
      }
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Unexpected logout error:", error);
    }
  };

  return {
    handleLogout,
  };
}

