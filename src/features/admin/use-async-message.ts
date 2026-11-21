import { ApiError } from '@/lib/api/client';

export function messageOf(cause: unknown, fallback: string): string {
  return cause instanceof ApiError ? cause.message : fallback;
}
