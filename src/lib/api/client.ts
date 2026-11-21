const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';
const CSRF_COOKIE = 'csrf_token';
const CSRF_HEADER = 'X-CSRF-Token';
const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function readCookie(name: string): string | undefined {
  if (typeof document === 'undefined') {
    return undefined;
  }
  const entry = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`));
  return entry?.slice(name.length + 1);
}

async function ensureCsrfToken(): Promise<string | undefined> {
  const existing = readCookie(CSRF_COOKIE);
  if (existing) {
    return existing;
  }
  try {
    const response = await fetch(`${BASE_URL}/auth/csrf`, {
      credentials: 'include',
    });
    const data = (await response.json()) as { csrfToken?: string };
    return data.csrfToken;
  } catch {
    return undefined;
  }
}

async function request<TResponse>(
  path: string,
  init?: RequestInit,
): Promise<TResponse> {
  const method = (init?.method ?? 'GET').toUpperCase();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string> | undefined),
  };
  if (UNSAFE_METHODS.has(method)) {
    const csrfToken = await ensureCsrfToken();
    if (csrfToken) {
      headers[CSRF_HEADER] = csrfToken;
    }
  }
  const response = await fetch(`${BASE_URL}${path}`, {
    credentials: 'include',
    ...init,
    headers,
  });
  if (response.status === 204) {
    return undefined as TResponse;
  }
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const problem = (data ?? {}) as { code?: string; title?: string };
    throw new ApiError(
      response.status,
      problem.code ?? 'ERROR',
      problem.title ?? response.statusText,
    );
  }
  return data as TResponse;
}

export const api = {
  get: <TResponse>(path: string): Promise<TResponse> => request<TResponse>(path),
  post: <TResponse>(path: string, body?: unknown): Promise<TResponse> =>
    request<TResponse>(path, {
      method: 'POST',
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  patch: <TResponse>(path: string, body?: unknown): Promise<TResponse> =>
    request<TResponse>(path, {
      method: 'PATCH',
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  del: <TResponse>(path: string): Promise<TResponse> =>
    request<TResponse>(path, { method: 'DELETE' }),
};
