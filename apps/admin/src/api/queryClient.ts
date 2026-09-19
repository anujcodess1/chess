import { QueryClient } from '@tanstack/react-query';

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError) {
    const status = error.status;
    // Client-side problems (validation, auth, 404, 403) will never succeed on retry.
    if (status >= 400 && status < 500 && status !== 429) return false;
    if (error.code === 'INVALID_RESPONSE' || error.code === 'NETWORK_ERROR') return failureCount < 1;
  }
  return failureCount < 2;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 20_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: true,
      retry: shouldRetry,
    },
    mutations: {
      retry: false,
    },
  },
});
