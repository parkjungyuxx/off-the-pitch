import { getSupabaseClient } from "@/lib/supabase";

export type JournalistProfile = {
  username: string;
  name: string;
  profileImage: string | null;
  credibility: 1 | 2 | 3;
  tweetCount: number;
};

export const fetchJournalistProfile = async (
  username: string
): Promise<JournalistProfile | null> => {
  const supabase = getSupabaseClient();

  try {
    const { data: sampleTweets, error: sampleError } = await supabase
      .from("tweets")
      .select("author_name, author_username, author_profile_image")
      .eq("author_username", username)
      .limit(1);

    if (sampleError) {
      console.error("[fetchJournalistProfile] sample error", sampleError);
      return null;
    }

    if (!sampleTweets || sampleTweets.length === 0) {
      return null;
    }

    const sampleTweet = sampleTweets[0] as {
      author_name: string;
      author_username: string;
      author_profile_image?: string | null;
    };

    const { count, error: countError } = await supabase
      .from("tweets")
      .select("*", { count: "exact", head: true })
      .eq("author_username", username);

    if (countError) {
      console.error("[fetchJournalistProfile] count error", countError);
    }

    const displayName =
      (sampleTweet.author_name?.split("@")[0]?.trim() as string) ||
      sampleTweet.author_name ||
      username;

    return {
      username,
      name: displayName,
      profileImage: sampleTweet.author_profile_image || null,
      credibility: (Math.floor(Math.random() * 3) + 1) as 1 | 2 | 3,
      tweetCount: count || 0,
    };
  } catch (error) {
    console.error("[fetchJournalistProfile] error", error);
    return null;
  }
};
