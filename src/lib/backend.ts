import { supabase } from "@/integrations/supabase/client";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080";
const MODE = (import.meta.env.VITE_BACKEND || "supabase").toLowerCase();

export function isLocalBackend() {
  // IMPORTANTE: Solo retornar true si EXPLÍCITAMENTE está en modo "local"
  // En producción (Netlify) siempre será false
  return MODE === "local" && typeof window !== "undefined" && window.location.hostname === "localhost";
}

function getStoredToken() {
  return localStorage.getItem("local_api_token");
}

function getStoredTokenOwner() {
  return localStorage.getItem("local_api_token_owner");
}

function setStoredToken(token: string) {
  localStorage.setItem("local_api_token", token);
}

function setStoredTokenOwner(ownerId: string) {
  localStorage.setItem("local_api_token_owner", ownerId);
}

function clearStoredToken() {
  try {
    localStorage.removeItem("local_api_token");
    localStorage.removeItem("local_api_token_owner");
  } catch {
    /* noop */
  }
}

export async function localAuthRequest<TResponse = unknown>(
  path: string,
  body: unknown,
): Promise<TResponse> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  let payload: any = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  if (!res.ok) {
    const message =
      payload?.error?.message || payload?.error || payload?.message || "Solicitud fallida";
    throw new Error(message);
  }

  return payload as TResponse;
}

export async function localAuthGet<TResponse = unknown>(path: string): Promise<TResponse> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  let payload: any = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  if (!res.ok) {
    const message =
      payload?.error?.message || payload?.error || payload?.message || "Solicitud fallida";
    throw new Error(message);
  }

  return payload as TResponse;
}

export function resetLocalBackendAuth() {
  clearStoredToken();
}

async function login(email: string, password: string) {
  const data = await localAuthRequest<{ token: string }>("/auth/login", {
    email,
    password,
  });
  return data.token;
}

function sanitizeUsername(input: string) {
  // Permitir sólo [a-zA-Z0-9_] y longitud 3-32
  const base = (input || "")
    .normalize("NFKD")
    .replace(/[^\w]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 32);
  if (base.length >= 3) return base;
  return `user_${Math.random().toString(36).slice(2, 8)}`;
}

async function registerBridge(email: string, password: string, username: string) {
  const data = await localAuthRequest<{ token: string }>("/auth/local-bridge", {
    email,
    password,
    username: sanitizeUsername(username),
  });
  return data.token as string;
}

export async function ensureLocalToken() {
  let token = getStoredToken();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  const expectedOwner = user?.id || "guest";

  if (token) {
    const owner = getStoredTokenOwner();
    if (owner === expectedOwner) return token;
    clearStoredToken();
    token = null;
  }

  const DEFAULT_PASSWORD = "supabase-bridge-password";

  if (user?.email) {
    const email = user.email;
    const rawUsername =
      (user.user_metadata as any)?.username || email.split("@")[0];
    const username = sanitizeUsername(rawUsername);
    try {
      token = await login(email, DEFAULT_PASSWORD);
    } catch {
      // Si falla el registro puente por cualquier motivo, caer a invitado para no bloquear
      try {
        token = await registerBridge(email, DEFAULT_PASSWORD, username);
      } catch (_e: any) {
        const rand = Math.random().toString(36).slice(2, 8);
        const guestEmail = `guest-${rand}@local.dev`;
        const guestPass = "guest-123";
        const guestUser = sanitizeUsername(`guest_${rand}`);
        try {
          token = await login(guestEmail, guestPass);
        } catch {
          token = await registerBridge(guestEmail, guestPass, guestUser);
        }
      }
    }
    setStoredToken(token);
    setStoredTokenOwner(user.id);
    return token;
  }

  // Si no hay usuario Supabase, creamos uno invitado
  const rand = Math.random().toString(36).slice(2, 8);
  const email = `guest-${rand}@local.dev`;
  const password = "guest-123";
  const username = sanitizeUsername(`guest_${rand}`);
  try {
    token = await login(email, password);
  } catch {
    token = await registerBridge(email, password, username);
  }
  setStoredToken(token);
  setStoredTokenOwner("guest");
  return token;
}

// API fetch with 15 second timeout using AbortController
export async function apiFetch(path: string, init: RequestInit = {}) {
  // Si no es backend local, lanzar error indicando que debe usarse Supabase
  if (!isLocalBackend()) {
    throw new Error("apiFetch solo funciona con backend local. Usa Supabase para operaciones remotas.");
  }

  const timeout = 15000; // 15 seconds timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  async function doRequest(): Promise<Response> {
    const token = await ensureLocalToken();
    const headers = new Headers(init.headers || {});
    headers.set("Authorization", `Bearer ${token}`);
    if (!headers.has("Content-Type") && !(init.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }
    return fetch(`${API_BASE}${path}`, { ...init, headers, signal: controller.signal });
  }

  try {
    // Primer intento
    let res = await doRequest();
    // Si token inválido/usuario faltante, limpiar y reintentar una vez
    if (res.status === 401) {
      clearStoredToken();
      res = await doRequest();
    }

    if (!res.ok) {
      let msg = `Error ${res.status}`;
      try {
        const j = await res.json();
        if (j?.error) {
          if (typeof j.error === "string") msg = j.error;
          else if (typeof j.error?.message === "string") msg = j.error.message;
          else msg = JSON.stringify(j.error);
        } else if (typeof j?.message === "string") {
          msg = j.message;
        }
      } catch {
        // mantener mensaje genérico
      }
      throw new Error(msg);
    }
    const contentType = res.headers.get("content-type") || "";
    return contentType.includes("application/json") ? res.json() : res.text();
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function uploadImage(file: File): Promise<string> {
  // Si no es backend local, lanzar error
  if (!isLocalBackend()) {
    throw new Error("uploadImage solo funciona con backend local. Para Supabase, usa el cliente de storage directamente.");
  }

  const timeout = 15000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const token = await ensureLocalToken();
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`${API_BASE}/upload/image`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
      signal: controller.signal,
    });
    if (!res.ok) throw new Error("Error al subir imagen");
    const data = await res.json();
    return data.url as string;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Helper: obtener usuario autenticado de forma agnóstica (local o Supabase)
export async function getAuthUser(): Promise<{
  id: string;
  email?: string | null;
  email_verified?: boolean;
  account_status?: string | null;
  account_classification?: string | null;
  isLocal: boolean;
} | null> {
  if (isLocalBackend()) {
    try {
      await ensureLocalToken();
      const me = (await apiFetch("/profiles/me")) as any;
      if (me && me.id) {
        return { 
          id: String(me.id), 
          email: me.email || null, 
          email_verified: !!me.email_verified_at,
          account_status: me.account_status || null,
          account_classification: me.account_classification || null,
          isLocal: true 
        };
      }
      return null;
    } catch {
      return null;
    }
  } else {
    const { data } = await supabase.auth.getUser();
    if (data?.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", data.user.id)
        .maybeSingle();
      const accountStatus =
        profile && typeof (profile as any).account_status === "string"
          ? ((profile as any).account_status as string)
          : null;
      const accountClassification =
        profile && typeof (profile as any).account_classification === "string"
          ? ((profile as any).account_classification as string)
          : null;

      return {
        id: data.user.id,
        email: data.user.email,
        email_verified: !!data.user.email_confirmed_at,
        account_status: accountStatus,
        account_classification: accountClassification,
        isLocal: false,
      };
    }
    return null;
  }
}
