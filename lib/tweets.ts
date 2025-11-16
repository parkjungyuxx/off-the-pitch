import { getSupabaseClient } from '@/lib/supabase';

export type Tweet = {
  tweet_id: string;
  author_name: string;
  author_username: string;
  tweet_text: string;
  images: string[] | null;
  videos: string[] | null;
  created_at: string; // ISO
  url: string;
};

export type FetchOptions = {
  limit?: number;
  journalists?: string[];
  keywords?: string[];
  hasMedia?: boolean;
  since?: string; // ISO
  until?: string; // ISO
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
    throw new Error('afterId와 beforeId는 동시에 사용할 수 없습니다.');
  }

  const supabase = getSupabaseClient();
  let query = supabase
    .from('tweets')
    .select(
      'tweet_id,author_name,author_username,tweet_text,images,videos,created_at,url',
      { count: 'exact' },
    );

  // 기간 필터: 기본 최근 30일
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  query = query.gte('created_at', since ?? thirtyDaysAgo.toISOString());
  if (until) {
    query = query.lte('created_at', until);
  }

  if (journalists && journalists.length > 0) {
    query = query.in('author_username', journalists);
  }

  if (keywords && keywords.length > 0) {
    // 여러 키워드 OR 매칭 (ILIKE)
    // 이 때 키워드에 포함될 수 있는 콤마 등은 적절히 이스케이프할 수 없으므로 간단 가정
    const ors = keywords.map((k) => `tweet_text.ilike.%${k}%`).join(',');
    query = query.or(ors);
  }

  if (hasMedia) {
    // images 또는 videos 배열 길이가 0보다 큰 경우만
    query = query.or('array_length(images,1).gt.0,array_length(videos,1).gt.0');
  }

  // 정렬: 최신순 (created_at DESC, tie-breaker: tweet_id DESC)
  query = query.order('created_at', { ascending: false }).order('tweet_id', { ascending: false });

  // 커서 처리
  if (afterId || beforeId) {
    const cursorId = afterId || (beforeId as string);
    const { data: cursorRow, error: cursorErr } = await supabase
      .from('tweets')
      .select('created_at,tweet_id')
      .eq('tweet_id', cursorId)
      .single();
    if (cursorErr) {
      // 사용자에게 안전한 메시지, 상세는 콘솔에 남김
      // eslint-disable-next-line no-console
      console.error('[fetchTweets] cursor fetch error', cursorErr);
      throw new Error('데이터를 불러오는 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    }

    const createdAt = cursorRow.created_at;
    const tId = cursorRow.tweet_id;

    if (afterId) {
      // 커서보다 더 최신: (c > C) OR (c = C AND t > T)
      query = query.or(
        `created_at.gt.${createdAt},and(created_at.eq.${createdAt},tweet_id.gt.${tId})`,
      );
    } else {
      // 커서보다 더 오래된: (c < C) OR (c = C AND t < T)
      query = query.or(
        `created_at.lt.${createdAt},and(created_at.eq.${createdAt},tweet_id.lt.${tId})`,
      );
    }
  }

  const pageSize = Math.min(Math.max(1, limit), 100);
  query = query.limit(pageSize);

  const { data, error } = await query;
  if (error) {
    // eslint-disable-next-line no-console
    console.error('[fetchTweets] supabase error', error);
    throw new Error('데이터를 불러오는 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.');
  }

  const items: Tweet[] = (data ?? []).map((row) => ({
    tweet_id: row.tweet_id,
    author_name: row.author_name,
    author_username: row.author_username,
    tweet_text: row.tweet_text,
    images: row.images ?? null,
    videos: row.videos ?? null,
    created_at: new Date(row.created_at).toISOString(),
    url: row.url,
  }));

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


