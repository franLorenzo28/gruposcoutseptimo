import { supabase } from "@/integrations/supabase/client";

const API_BASE = (import.meta.env.VITE_API_BASE || "http://localhost:4000").replace(/\/$/, "");

type ApiAuthMode = "none" | "optional" | "required";

export interface ApiFetchOptions extends RequestInit {
  auth?: ApiAuthMode;
  timeoutMs?: number;
}

export class BackendError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
    readonly requestId?: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "BackendError";
  }
}

/** Transitional feature flag used by legacy data adapters during cut-over. */
export function isLocalBackend(): boolean {
  return ["api", "local"].includes(String(import.meta.env.VITE_BACKEND || "supabase"));
}

async function currentAccessToken(refresh = false): Promise<string | null> {
  const result = refresh
    ? await supabase.auth.refreshSession()
    : await supabase.auth.getSession();
  if (result.error) return null;
  return result.data.session?.access_token ?? null;
}

async function parseResponse(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined;
  const type = response.headers.get("content-type") || "";
  if (type.includes("application/json")) return response.json();
  return response.text();
}

export async function apiFetch<T = any>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const { auth = "required", timeoutMs = 15_000, ...init } = options;
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  async function execute(forceRefresh = false): Promise<Response> {
    const token = auth === "none" ? null : await currentAccessToken(forceRefresh);
    if (auth === "required" && !token) {
      throw new BackendError("Tu sesión ha expirado. Inicia sesión nuevamente.", 401, "AUTH_REQUIRED");
    }

    const headers = new Headers(init.headers);
    headers.set("Accept", "application/json");
    if (!headers.has("Content-Type") && init.body && !(init.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }
    if (token) headers.set("Authorization", `Bearer ${token}`);

    return fetch(`${API_BASE}${path.startsWith("/") ? path : `/${path}`}`, {
      ...init,
      headers,
      signal: controller.signal,
    });
  }

  try {
    let response = await execute(false);
    if (response.status === 401 && auth !== "none") {
      response = await execute(true);
    }
    const payload = (await parseResponse(response)) as {
      data?: unknown;
      error?: { code?: string; message?: string; requestId?: string; details?: unknown };
      message?: string;
    } | null;

    if (!response.ok) {
      throw new BackendError(
        payload?.error?.message || payload?.message || `Error HTTP ${response.status}`,
        response.status,
        payload?.error?.code || "REQUEST_FAILED",
        payload?.error?.requestId || response.headers.get("x-request-id") || undefined,
        payload?.error?.details,
      );
    }
    return (payload && Object.prototype.hasOwnProperty.call(payload, "data")
      ? payload.data
      : payload) as T;
  } catch (error) {
    if (error instanceof BackendError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new BackendError("El servidor tardó demasiado en responder.", 0, "TIMEOUT");
    }
    throw new BackendError(
      error instanceof Error ? error.message : "No se pudo conectar al servidor.",
      0,
      "NETWORK_ERROR",
    );
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function localAuthRequest<TResponse = unknown>(
  path: string,
  body: unknown,
): Promise<TResponse> {
  return apiFetch<TResponse>(path, {
    method: "POST",
    body: JSON.stringify(body),
    auth: "none",
  });
}

export async function localAuthGet<TResponse = unknown>(path: string): Promise<TResponse> {
  return apiFetch<TResponse>(path, { auth: "none" });
}

export function resetLocalBackendAuth(): void {
  // The API uses the Supabase session; there is no second local JWT to clear.
}

export async function ensureLocalToken(): Promise<string> {
  const token = await currentAccessToken();
  if (!token) {
    throw new BackendError("Tu sesión ha expirado. Inicia sesión nuevamente.", 401, "AUTH_REQUIRED");
  }
  return token;
}

export async function uploadImage(file: File): Promise<string> {
  const signed = await apiFetch<{ path: string; signedUrl: string }>("/v1/media/uploads/sign", {
    method: "POST",
    body: JSON.stringify({
      bucket: "group-covers",
      file_name: file.name,
      content_type: file.type,
      size: file.size,
    }),
  });
  const upload = await fetch(signed.signedUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!upload.ok) {
    throw new BackendError("No se pudo subir la imagen.", upload.status, "UPLOAD_FAILED");
  }
  return supabase.storage.from("group-covers").getPublicUrl(signed.path).data.publicUrl;
}

export async function getAuthUser(): Promise<{
  id: string;
  email?: string | null;
  email_verified?: boolean;
  account_status?: string | null;
  account_classification?: string | null;
  isLocal: boolean;
} | null> {
  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;
  if (!user) return null;

  let profile: { account_status?: string | null; account_classification?: string | null } | null = null;
  try {
    profile = await apiFetch("/v1/me/profile");
  } catch {
    // Auth identity remains usable for logout/recovery while the API is unavailable.
  }

  return {
    id: user.id,
    email: user.email,
    email_verified: Boolean(user.email_confirmed_at),
    account_status: profile?.account_status ?? null,
    account_classification: profile?.account_classification ?? null,
    isLocal: false,
  };
}
