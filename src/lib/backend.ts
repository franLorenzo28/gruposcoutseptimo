import { readOwnProfile } from "@/lib/profile-reader";
import type { Profile } from "@/types/profile";
import { supabase } from "@/integrations/supabase/client";
import { getBackendURL } from "@/lib/env";

const LOCAL_ACCESS_TOKEN_KEY = "grupo7_local_access_token";
export const LOCAL_AUTH_CHANGED_EVENT = "grupo7:local-auth-changed";

export function getBackendUrl(path: string): string {
  const apiBase = getBackendURL();
  if (!apiBase) {
    throw new BackendError("El servicio del sitio todavía no está configurado. Contacta al responsable de la web.", 503, "API_NOT_CONFIGURED");
  }
  return `${apiBase}${path.startsWith("/") ? path : `/${path}`}`;
}

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
  if (isLocalBackend()) {
    if (refresh) return getStoredLocalAccessToken();
    return getStoredLocalAccessToken();
  }

  const result = refresh
    ? await supabase.auth.refreshSession()
    : await supabase.auth.getSession();
  if (result.error) return null;
  return result.data.session?.access_token ?? null;
}

function getStoredLocalAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(LOCAL_ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function saveLocalAccessToken(token: string): void {
  window.localStorage.setItem(LOCAL_ACCESS_TOKEN_KEY, token);
  window.dispatchEvent(new Event(LOCAL_AUTH_CHANGED_EVENT));
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

    return fetch(getBackendUrl(path), {
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
    if (response.ok && response.status !== 204 && !response.headers.get("content-type")?.includes("application/json")) {
      throw new BackendError("El servidor devolvió una respuesta inválida. Intenta nuevamente más tarde.", 502, "API_INVALID_RESPONSE");
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
      "No se pudo conectar al servidor. Revisa tu conexión e intenta nuevamente.",
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
  try {
    window.localStorage.removeItem(LOCAL_ACCESS_TOKEN_KEY);
  } catch {
    // Storage may be unavailable in private browsing contexts.
  }
  if (typeof window !== "undefined") window.dispatchEvent(new Event(LOCAL_AUTH_CHANGED_EVENT));
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
  profile?: Profile;
} | null> {
  if (isLocalBackend()) {
    const token = getStoredLocalAccessToken();
    if (!token) return null;

    try {
      const response = await apiFetch<{
        user: {
          id: string;
          email?: string | null;
          email_confirmed_at?: string | null;
        };
      }>("/v1/auth/session");
      return {
        id: response.user.id,
        email: response.user.email,
        email_verified: Boolean(response.user.email_confirmed_at),
        account_status: null,
        account_classification: null,
        isLocal: true,
      };
    } catch {
      resetLocalBackendAuth();
      return null;
    }
  }

  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;
  if (!user) return null;

  const { data: profile } = await readOwnProfile(user.id);

  return {
    id: user.id,
    email: user.email,
    email_verified: Boolean(user.email_confirmed_at),
    account_status: profile?.account_status ?? null,
    account_classification: profile?.account_classification ?? null,
    isLocal: false,
    profile: profile ?? undefined,
  };
}
