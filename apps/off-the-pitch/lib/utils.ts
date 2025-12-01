import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import {
  CREDIBILITY_TIER_1_JOURNALISTS,
  CREDIBILITY_TIER_2_JOURNALISTS,
  CREDIBILITY_TIER_3_JOURNALISTS,
} from '@/lib/constants'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const normalizeTwitterMediaUrl = (url?: string | null): string | undefined => {
  if (!url) return undefined;
  if (url.startsWith("https://pbs.twimg.com/media/") && !url.includes("?")) {
    return `${url}?format=jpg&name=large`;
  }
  return url;
};

export const formatRelativeTime = (iso: string): string => {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = Math.max(0, Math.floor((now - then) / 1000));
  if (diff < 60) return `${diff}s`;
  const m = Math.floor(diff / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
};

/**
 * 기자 username을 기반으로 공신력(credibility)을 반환
 * @param username 기자 Twitter username (without @)
 * @returns 공신력 레벨 (1, 2, 3) 또는 기본값 2
 */
export const getJournalistCredibility = (
  username: string
): 1 | 2 | 3 => {
  const normalizedUsername = username.toLowerCase().trim();

  if (
    CREDIBILITY_TIER_1_JOURNALISTS.some(
      (j) => j.toLowerCase() === normalizedUsername
    )
  ) {
    return 1;
  }

  if (
    CREDIBILITY_TIER_2_JOURNALISTS.some(
      (j) => j.toLowerCase() === normalizedUsername
    )
  ) {
    return 2;
  }

  if (
    CREDIBILITY_TIER_3_JOURNALISTS.some(
      (j) => j.toLowerCase() === normalizedUsername
    )
  ) {
    return 3;
  }

  // 목록에 없는 기자는 기본값 2 (중간 공신력)
  return 2;
};
