import { getSupabaseClient } from "@/lib/supabase";

export type Tweet = {
  tweet_id: string;
  author_name: string;
  author_username: string;
  author_profile_image?: string | null;
  tweet_text: string;
  images: string[] | null;
  videos: string[] | null;
  created_at: string;
  url: string;
};

export type FetchOptions = {
  limit?: number;
  journalists?: string[];
  keywords?: string[];
  hasMedia?: boolean;
  since?: string;
  until?: string; // ISO 문자열
  afterId?: string;
  beforeId?: string;
};

export type FetchTweetsResult = {
  items: Tweet[];
  pagination: {
    nextCursor: string | null;
    prevCursor: string | null;
    hasMore: boolean;
  };
};

export const fetchTweets = async ({
  limit = 20,
  journalists,
  keywords,
  hasMedia,
  since,
  until,
  afterId,
  beforeId,
}: FetchOptions = {}): Promise<FetchTweetsResult> => {
  if (afterId && beforeId) {
    throw new Error("afterId와 beforeId는 동시에 사용할 수 없습니다.");
  }

  const supabase = getSupabaseClient();
  let query = supabase
    .from("tweets")
    .select(
      "tweet_id,author_name,author_username,author_profile_image,tweet_text,images,videos,created_at,url",
      { count: "exact" }
    );

  if (since) {
    query = query.gte("created_at", since);
  }
  if (until) {
    query = query.lte("created_at", until);
  }

  if (journalists && journalists.length > 0) {
    query = query.in("author_username", journalists);
  }

  if (keywords && keywords.length > 0) {
    const ors = keywords.map((k) => `tweet_text.ilike.%${k}%`).join(",");
    query = query.or(ors);
  }

  if (hasMedia) {
    query = query.or("array_length(images,1).gt.0,array_length(videos,1).gt.0");
  }

  query = query.order("created_at", { ascending: false, nullsLast: true });

  if (afterId || beforeId) {
    const cursorId = afterId || (beforeId as string);
    const { data: cursorRow, error: cursorErr } = await supabase
      .from("tweets")
      .select("created_at,tweet_id")
      .eq("tweet_id", cursorId)
      .single();
    if (cursorErr) {
      console.error("[fetchTweets] cursor fetch error", cursorErr);
      throw new Error(
        "데이터를 불러오는 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요."
      );
    }

    const createdAt = cursorRow.created_at;
    const tId = cursorRow.tweet_id;

    if (afterId) {
      query = query.gt("created_at", createdAt);
    } else {
      query = query.lt("created_at", createdAt);
    }
  }

  const pageSize = Math.min(Math.max(1, limit), 100);
  query = query.limit(pageSize);

  const { data, error } = await query;
  if (error) {
    console.error("[fetchTweets] supabase error", error);
    throw new Error(
      "데이터를 불러오는 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요."
    );
  }

  const items: Tweet[] = (data ?? []).map(
    (row: {
      tweet_id: string;
      author_name: string;
      author_username: string;
      author_profile_image?: string | null;
      tweet_text: string;
      images: string[] | null;
      videos: string[] | null;
      created_at: string;
      url: string;
    }) => ({
      tweet_id: row.tweet_id,
      author_name: row.author_name,
      author_username: row.author_username,
      author_profile_image: row.author_profile_image ?? null,
      tweet_text: row.tweet_text,
      images: row.images ?? null,
      videos: row.videos ?? null,
      created_at: new Date(row.created_at).toISOString(),
      url: row.url,
    })
  );

  const nextCursor = items.length > 0 ? items[items.length - 1].tweet_id : null;
  const prevCursor = items.length > 0 ? items[0].tweet_id : null;

  return {
    items,
    pagination: {
      nextCursor,
      prevCursor,
      hasMore: items.length === pageSize,
    },
  };
};
