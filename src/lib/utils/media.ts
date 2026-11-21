const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

export function mediaUrl(path: string | null | undefined): string | null {
  if (!path) {
    return null;
  }
  if (/^https?:\/\//.test(path)) {
    return path;
  }
  try {
    const origin = new URL(API_BASE).origin;
    return `${origin}${path}`;
  } catch {
    return path;
  }
}
