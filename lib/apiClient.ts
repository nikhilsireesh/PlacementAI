/** Thin fetch wrapper for client components calling our own API routes. */
export class ClientApiError extends Error {}

export async function apiFetch<T = unknown>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers:
      options?.body && !(options.body instanceof FormData)
        ? { "Content-Type": "application/json", ...options?.headers }
        : options?.headers,
  });

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    // no JSON body (e.g. 204)
  }

  if (!res.ok) {
    const message =
      body && typeof body === "object" && "error" in body && typeof body.error === "string"
        ? body.error
        : "Something went wrong. Please try again.";
    throw new ClientApiError(message);
  }
  return body as T;
}

export function apiPost<T = unknown>(url: string, data?: unknown): Promise<T> {
  return apiFetch<T>(url, {
    method: "POST",
    body: data instanceof FormData ? data : JSON.stringify(data ?? {}),
  });
}

export function apiPatch<T = unknown>(url: string, data?: unknown): Promise<T> {
  return apiFetch<T>(url, { method: "PATCH", body: JSON.stringify(data ?? {}) });
}

export function apiPut<T = unknown>(url: string, data?: unknown): Promise<T> {
  return apiFetch<T>(url, { method: "PUT", body: JSON.stringify(data ?? {}) });
}
