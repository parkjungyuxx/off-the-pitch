import { createClient } from "./supabase-client";

export interface FollowedJournalist {
  id: string;
  user_id: string;
  journalist_handle: string;
  journalist_name: string;
  created_at: string;
}

export async function followJournalist(
  journalistHandle: string,
  journalistName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();
    
    // 현재 사용자 세션 확인
    const {
      data: { session },
    } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return { success: false, error: "로그인이 필요합니다." };
    }

    const { data: existing } = await supabase
      .from("user_follows")
      .select("id")
      .eq("user_id", session.user.id)
      .eq("journalist_handle", journalistHandle)
      .single();

    if (existing) {
      return { success: false, error: "이미 팔로우 중입니다." };
    }

    const { data, error } = await supabase
      .from("user_follows")
      .insert({
        user_id: session.user.id,
        journalist_handle: journalistHandle,
        journalist_name: journalistName,
      })
      .select();

    if (error) {
      console.error("Follow error:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        user_id: session.user.id,
        journalist_handle: journalistHandle,
      });
      return { success: false, error: error.message };
    }

    console.log("Follow success:", data);

    return { success: true };
  } catch (error) {
    console.error("Unexpected follow error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
    };
  }
}

export async function unfollowJournalist(
  journalistHandle: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();
    
    const {
      data: { session },
    } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return { success: false, error: "로그인이 필요합니다." };
    }

    const { error } = await supabase
      .from("user_follows")
      .delete()
      .eq("user_id", session.user.id)
      .eq("journalist_handle", journalistHandle);

    if (error) {
      console.error("Unfollow error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected unfollow error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
    };
  }
}

export async function getFollowedJournalists(): Promise<{
  data: FollowedJournalist[] | null;
  error: string | null;
}> {
  try {
    const supabase = createClient();
    
    const {
      data: { session },
    } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return { data: null, error: "로그인이 필요합니다." };
    }

    const { data, error } = await supabase
      .from("user_follows")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Get followed journalists error:", error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error) {
    console.error("Unexpected get followed journalists error:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
    };
  }
}

export async function isFollowingJournalist(
  journalistHandle: string
): Promise<boolean> {
  try {
    const supabase = createClient();
    
    const {
      data: { session },
    } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return false;
    }

    const { data } = await supabase
      .from("user_follows")
      .select("id")
      .eq("user_id", session.user.id)
      .eq("journalist_handle", journalistHandle)
      .single();

    return !!data;
  } catch {
    return false;
  }
}

