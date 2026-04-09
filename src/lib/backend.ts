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

function setStoredToken(token: string) {
  localStorage.setItem("local_api_token", token);
}

function clearStoredToken() {
  try {
    localStorage.removeItem("local_api_token");
  } catch {
    /* noop */
  }
}

async function login(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error("Login fallido");
  const data = await res.json();
  return data.token as string;
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

async function register(email: string, password: string, username: string) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password,
      username: sanitizeUsername(username),
    }),
  });
  if (!res.ok) {
    try {
      const j = await res.json();
      throw new Error(j?.error?.message || j?.error || "Registro fallido");
    } catch {
      throw new Error("Registro fallido");
    }
  }
  const data = await res.json();
  return data.token as string;
}

export async function ensureLocalToken() {
  let token = getStoredToken();
  if (token) return token;

  // Intentamos mapear con el usuario de Supabase si existe
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;

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
        token = await register(email, DEFAULT_PASSWORD, username);
      } catch (_e: any) {
        const rand = Math.random().toString(36).slice(2, 8);
        const guestEmail = `guest-${rand}@local.dev`;
        const guestPass = "guest-123";
        const guestUser = sanitizeUsername(`guest_${rand}`);
        try {
          token = await login(guestEmail, guestPass);
        } catch {
          token = await register(guestEmail, guestPass, guestUser);
        }
      }
    }
    setStoredToken(token);
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
    token = await register(email, password, username);
  }
  setStoredToken(token);
  return token;
}

// API fetch with 15 second timeout using AbortController
export async function apiFetch(path: string, init: RequestInit = {}) {
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
      return {
        id: data.user.id,
        email: data.user.email,
        email_verified: !!data.user.email_confirmed_at,
        isLocal: false,
      };
    }
    return null;
  }
}
