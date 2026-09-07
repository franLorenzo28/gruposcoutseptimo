import { StrictMode } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { AppProviders } from "@/providers/AppProviders";
import { MemberAuthProvider } from "@/context/MemberAuthContext";
import RequireMemberAuth from "@/components/auth/RequireMemberAuth";
import Auth from "@/pages/Auth";

const mocks = vi.hoisted(() => ({
  listeners: new Set<(event: AuthChangeEvent, session: Session | null) => void>(),
  getSession: vi.fn(), getAuthUser: vi.fn(), getProfile: vi.fn(),
  profileQuery: vi.fn(), signOut: vi.fn(), exchangeCodeForSession: vi.fn(),
  apiFetch: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({ supabase: {
  auth: {
    getSession: mocks.getSession,
    signOut: mocks.signOut,
    exchangeCodeForSession: mocks.exchangeCodeForSession,
    onAuthStateChange: (listener: (event: AuthChangeEvent, session: Session | null) => void) => {
      mocks.listeners.add(listener);
      return { data: { subscription: { unsubscribe: () => mocks.listeners.delete(listener) } } };
    },
  },
  from: () => ({ select: () => ({ eq: () => ({ maybeSingle: mocks.profileQuery, single: mocks.profileQuery }) }) }),
} }));
vi.mock("@/lib/backend", () => ({
  isLocalBackend: () => false, getAuthUser: mocks.getAuthUser,
  LOCAL_AUTH_CHANGED_EVENT: "local-auth", apiFetch: mocks.apiFetch, getBackendUrl: vi.fn(),
  saveLocalAccessToken: vi.fn(), resetLocalBackendAuth: vi.fn(),
}));
vi.mock("@/lib/api", () => ({ getProfile: mocks.getProfile }));
vi.mock("@/context/Notifications", () => ({ NotificationsProvider: ({ children }: { children: React.ReactNode }) => children }));
vi.mock("next-themes", () => ({ ThemeProvider: ({ children }: { children: React.ReactNode }) => children }));

const googleUser = {
  id: "google-user", email: "scout@example.com", app_metadata: { provider: "google" },
  aud: "authenticated", created_at: "2026-09-01T00:00:00Z",
  user_metadata: { profile_complete: true, full_name: "Scout Prueba" },
};
const profile = { id: "profile-id", user_id: googleUser.id, nombre_completo: "Scout Prueba", account_status: "activo", edad: 15 };

function Location() {
  return <output data-testid="location">{useLocation().pathname}</output>;
}

function renderAuth() {
  return render(<StrictMode><AppProviders><MemberAuthProvider>
    <MemoryRouter initialEntries={["/interno/auth/callback"]}>
      <Location />
      <Routes>
        <Route path="/interno/auth" element={<Auth />} />
        <Route path="/interno/auth/callback" element={<Auth />} />
        <Route path="/interno/dashboard" element={<RequireMemberAuth><div>Dashboard listo</div></RequireMemberAuth>} />
      </Routes>
    </MemoryRouter>
  </MemberAuthProvider></AppProviders></StrictMode>);
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.listeners.clear();
  localStorage.clear();
  window.history.replaceState({}, "", "/interno/auth/callback?code=test-code");
  mocks.getSession.mockResolvedValue({ data: { session: { user: googleUser } }, error: null });
  mocks.getAuthUser.mockResolvedValue({ id: googleUser.id, account_status: "activo", isLocal: false });
  mocks.profileQuery.mockResolvedValue({ data: profile, error: null });
  mocks.getProfile.mockResolvedValue(profile);
});
afterEach(cleanup);

describe("Google OAuth navigation", () => {
  it("waits for member validation, then opens the dashboard without exchanging the code again", async () => {
    let finish!: (value: typeof profile) => void;
    mocks.getProfile.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    renderAuth();
    await waitFor(() => expect(mocks.getProfile).toHaveBeenCalled());
    expect(screen.getByTestId("location")).toHaveTextContent("/interno/auth/callback");
    await act(async () => { finish(profile); });
    expect(await screen.findByText("Dashboard listo")).toBeInTheDocument();
    expect(mocks.exchangeCodeForSession).not.toHaveBeenCalled();
  });

  it("stays usable when Google is signed in but the member profile has no eligible unit", async () => {
    mocks.getProfile.mockResolvedValue({ ...profile, edad: null });
    renderAuth();
    expect(await screen.findByText(/Tu rol actual no te permite acceder/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Revisar mi perfil" })).toHaveAttribute("href", "/interno/perfil/editar");
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 350)); });
    expect(screen.getByTestId("location")).toHaveTextContent("/interno/auth/callback");
    expect(screen.queryByText("Dashboard listo")).not.toBeInTheDocument();
  });

  it("keeps a pending Google session so the new user can complete registration", async () => {
    mocks.getSession.mockResolvedValue({ data: { session: { user: {
      ...googleUser, user_metadata: { full_name: "Scout Prueba" },
    } } } });
    mocks.profileQuery.mockResolvedValue({ data: { ...profile, account_status: "pendiente_aprobacion" }, error: null });
    mocks.getAuthUser.mockResolvedValue({ id: googleUser.id, account_status: "pendiente_aprobacion", isLocal: false });
    renderAuth();
    expect(await screen.findByDisplayValue("Scout")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Prueba")).toBeInTheDocument();
    expect(mocks.signOut).not.toHaveBeenCalled();
    expect(localStorage.getItem("grupo7_member_session")).toBeNull();
  });

  it("shows pending approval instead of trusting Google profile_complete as permission", async () => {
    mocks.profileQuery.mockResolvedValue({ data: { ...profile, account_status: "pendiente_aprobacion" }, error: null });
    mocks.getAuthUser.mockResolvedValue({ id: googleUser.id, account_status: "pendiente_aprobacion", isLocal: false });
    renderAuth();
    expect(await screen.findByText(/Tu cuenta está pendiente de aprobación/)).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent("/interno/auth/callback");
  });

  it("does not restore a member session when an old profile request finishes after sign-out", async () => {
    let finish!: (value: typeof profile) => void;
    mocks.getProfile.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    renderAuth();
    await waitFor(() => expect(mocks.getProfile).toHaveBeenCalled());
    mocks.getAuthUser.mockResolvedValue(null);
    await act(async () => {
      for (const listener of mocks.listeners) listener("SIGNED_OUT", null);
      await new Promise((resolve) => setTimeout(resolve, 10));
      finish(profile);
    });
    expect(localStorage.getItem("grupo7_member_session")).toBeNull();
    expect(screen.queryByText("Dashboard listo")).not.toBeInTheDocument();
  });

  it("displays cancellation errors returned in the OAuth fragment", async () => {
    window.history.replaceState({}, "", "/interno/auth/callback#error=access_denied&error_description=Acceso+cancelado");
    mocks.getSession.mockResolvedValue({ data: { session: null } });
    mocks.getAuthUser.mockResolvedValue(null);
    renderAuth();
    expect(await screen.findByText("Acceso cancelado")).toBeInTheDocument();
    expect(window.location.hash).toBe("");
  });

  it("defers Supabase queries until after the SIGNED_IN callback returns", async () => {
    renderAuth();
    expect(await screen.findByText("Dashboard listo")).toBeInTheDocument();
    mocks.getAuthUser.mockClear();
    mocks.profileQuery.mockClear();
    act(() => {
      for (const listener of mocks.listeners) listener("SIGNED_IN", {
        user: googleUser, access_token: "test-token", refresh_token: "test-refresh",
        expires_in: 3600, token_type: "bearer",
      });
      expect(mocks.getAuthUser).not.toHaveBeenCalled();
      expect(mocks.profileQuery).not.toHaveBeenCalled();
    });
    expect(await screen.findByText("Dashboard listo")).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent("/interno/dashboard");
  });

  it("stops loading and denies access if the profile query fails", async () => {
    mocks.profileQuery.mockRejectedValue(new Error("Connection lost"));
    renderAuth();
    expect(await screen.findByText(/Tu cuenta está pendiente de aprobación/)).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent("/interno/auth/callback");
  });

  it("opens the dashboard in Supabase mode even when the separate API cannot be reached", async () => {
    const actualApi = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
    mocks.getProfile.mockImplementation(actualApi.getProfile);
    mocks.apiFetch.mockRejectedValue(new TypeError("Failed to fetch"));
    mocks.profileQuery.mockResolvedValue({ data: {
      ...profile, edad: null, fecha_nacimiento: `${new Date().getFullYear() - 15}-01-01`,
    }, error: null });
    renderAuth();
    expect(await screen.findByText("Dashboard listo")).toBeInTheDocument();
    expect(mocks.apiFetch).not.toHaveBeenCalled();
    expect(JSON.parse(localStorage.getItem("grupo7_member_session")!)).toMatchObject({
      authUserId: googleUser.id, rama: "pioneros",
    });
  });

  it("reports profile connection errors without claiming the member has no permission", async () => {
    mocks.getProfile.mockRejectedValue(new TypeError("Failed to fetch"));
    renderAuth();
    expect(await screen.findByText(/No pudimos cargar tu perfil/)).toBeInTheDocument();
    expect(screen.queryByText(/Tu rol actual no te permite acceder/)).not.toBeInTheDocument();
    expect(screen.queryByText("Dashboard listo")).not.toBeInTheDocument();
  });

  it("keeps registration data and allows retrying after the API is unavailable", async () => {
    mocks.getSession.mockResolvedValue({ data: { session: { user: {
      ...googleUser, user_metadata: { full_name: "Scout Prueba" },
    } } } });
    mocks.profileQuery.mockResolvedValue({ data: null, error: null });
    mocks.getAuthUser.mockResolvedValue(null);
    mocks.apiFetch.mockRejectedValueOnce(new Error("El servicio de registro no está disponible."))
      .mockResolvedValueOnce({ accepted: true });
    renderAuth();
    fireEvent.click(await screen.findByRole("button", { name: "Continuar" }));
    fireEvent.click(await screen.findByRole("button", { name: /Ya fui contactado/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent("El servicio de registro no está disponible.");
    const retry = screen.getByRole("button", { name: /Ya fui contactado/ });
    expect(retry).toBeEnabled();
    fireEvent.click(retry);
    expect(await screen.findByText("Solicitud enviada. Tu cuenta está pendiente de aprobación.")).toBeInTheDocument();
    expect(mocks.apiFetch).toHaveBeenCalledTimes(2);
    expect(mocks.apiFetch.mock.calls[0]).toEqual(mocks.apiFetch.mock.calls[1]);
    expect(mocks.apiFetch.mock.calls[1]?.[0]).toBe("/v1/registration-requests/oauth");
    expect(screen.queryByRole("button", { name: "Continuar" })).not.toBeInTheDocument();
  });
});
