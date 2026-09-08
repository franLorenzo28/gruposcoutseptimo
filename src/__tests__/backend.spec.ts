import { afterEach, describe, expect, it, vi } from "vitest";
import { apiFetch } from "@/lib/backend";
import { getBackendURL } from "@/lib/env";

vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: {} } }));
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe("registration API connection", () => {
  it("does not send production requests to localhost when the API is not configured", async () => {
    vi.stubEnv("DEV", false);
    vi.stubEnv("VITE_API_BASE", "");
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    await expect(apiFetch("/v1/admin/users", { auth: "none" }))
      .rejects.toMatchObject({ code: "API_NOT_CONFIGURED" });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("rejects the SPA HTML fallback instead of treating it as API data", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("<html>App</html>", {
      status: 200, headers: { "Content-Type": "text/html" },
    })));
    await expect(apiFetch("/v1/me/access", { auth: "none" }))
      .rejects.toMatchObject({ code: "API_INVALID_RESPONSE" });
  });
  it("uses the Vite proxy in development unless an API URL is explicitly configured", () => {
    vi.stubEnv("DEV", true);
    vi.stubEnv("VITE_API_BASE", "");
    expect(getBackendURL()).toBe("/api");
    vi.stubEnv("VITE_API_BASE", " https://api.example.com/ ");
    expect(getBackendURL()).toBe("https://api.example.com");
  });

  it("translates fetch failures and does not automatically repeat a registration POST", async () => {
    const fetch = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    vi.stubGlobal("fetch", fetch);
    await expect(apiFetch("/v1/registration-requests", { auth: "none", method: "POST", body: "{}" }))
      .rejects.toMatchObject({ code: "NETWORK_ERROR", message: "No se pudo conectar al servidor. Revisa tu conexión e intenta nuevamente." });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("preserves an unavailable API response instead of treating it as a successful registration", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: {
      code: "API_UNAVAILABLE", message: "El servicio de registro no está disponible.",
    } }), { status: 503, headers: { "Content-Type": "application/json" } })));
    await expect(apiFetch("/v1/registration-requests", { auth: "none", method: "POST", body: "{}" }))
      .rejects.toMatchObject({ status: 503, code: "API_UNAVAILABLE" });
  });
});
