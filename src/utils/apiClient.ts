/**
 * Safe API Client & Resilience Layer
 * Protects against non-JSON responses, server reboots, and network errors.
 */

export interface SafeFetchResult<T = any> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
}

export async function safeFetchJson<T = any>(
  url: string,
  options?: RequestInit
): Promise<SafeFetchResult<T>> {
  try {
    const headers = new Headers(options?.headers || {});
    if (!headers.has('Accept')) {
      headers.set('Accept', 'application/json');
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const contentType = response.headers.get('content-type') || '';

    // Verify response is JSON before parsing to prevent SyntaxError
    if (!contentType.includes('application/json')) {
      return {
        ok: false,
        status: response.status,
        error: `Endpoint returned non-JSON content (${response.status} ${response.statusText})`,
      };
    }

    const data = (await response.json()) as T;
    return {
      ok: response.ok,
      status: response.status,
      data,
      error: response.ok ? undefined : ((data as any)?.error || `Request failed with status ${response.status}`),
    };
  } catch (err: any) {
    return {
      ok: false,
      status: 0,
      error: err?.message || 'Network communication error',
    };
  }
}
