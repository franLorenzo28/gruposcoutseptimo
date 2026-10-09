import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import MiPerfilPublico from "@/pages/MiPerfilPublico";
import PerfilPublic from "@/pages/PerfilPublic";

const mocks = vi.hoisted(() => ({ apiFetch: vi.fn(), refreshUser: vi.fn() }));
const authState = vi.hoisted(() => ({ isUserLoading: false }));
const followMocks = vi.hoisted(() => ({ getFollowRelation: vi.fn(), followUser: vi.fn(), cancelRequest: vi.fn(), unfollowUser: vi.fn() }));
vi.mock("@/lib/backend", () => ({
  apiFetch: mocks.apiFetch,
  BackendError: class BackendError extends Error { code = "REQUEST_FAILED"; },
}));
vi.mock("@/lib/follows", () => ({
  ...followMocks,
}));
vi.mock("@/providers/AppProviders", () => ({
  useSupabaseUser: () => ({ user: { id: "550e8400-e29b-41d4-a716-446655440011", email: "scout@example.com", internal_access: true }, isUserLoading: authState.isUserLoading, refreshUser: mocks.refreshUser }),
}));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {
  storage: { from: () => ({ getPublicUrl: (path: string) => ({ data: { publicUrl: `https://assets.test/${path}` } }) }) },
} }));

const profile = {
  user_id: "550e8400-e29b-41d4-a716-446655440011",
  nombre_completo: "Scout Prueba",
  username: "scout_prueba",
  avatar_url: null,
  descripcion_personal: "Me gustan los campamentos.",
  is_public: false,
  internal_access: false,
};

beforeEach(() => {
  vi.clearAllMocks();
  authState.isUserLoading = false;
  vi.stubGlobal("ResizeObserver", class {
    observe() {}
    unobserve() {}
    disconnect() {}
  });
  mocks.refreshUser.mockResolvedValue(undefined);
  followMocks.getFollowRelation.mockResolvedValue({ data: null, error: null });
  followMocks.followUser.mockResolvedValue({ error: null, followStatus: "accepted" });
  mocks.apiFetch.mockImplementation(async (path: string, options?: { method?: string }) => {
    if (path === "/v1/me/profile" && options?.method === "PATCH") return { ...profile, is_public: true };
    return profile;
  });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("public profile", () => {
  it("loads the editable profile while account status is being revalidated", async () => {
    authState.isUserLoading = true;
    render(<MemoryRouter><MiPerfilPublico /></MemoryRouter>);
    expect(await screen.findByDisplayValue("Scout Prueba")).toBeInTheDocument();
    expect(screen.queryByText("Cargando cuenta...")).not.toBeInTheDocument();
  });

  it("keeps the share link hidden until visibility is saved", async () => {
    render(<MemoryRouter><MiPerfilPublico /></MemoryRouter>);
    expect(await screen.findByDisplayValue("Scout Prueba")).toBeInTheDocument();
    expect(screen.queryByText("Tu enlace público")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("switch", { name: "Perfil visible" }));
    expect(screen.queryByText("Tu enlace público")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() => expect(mocks.apiFetch).toHaveBeenCalledWith("/v1/me/profile", {
      method: "PATCH", body: JSON.stringify({ is_public: true }),
    }));
    expect(await screen.findByText("Tu enlace público")).toBeInTheDocument();
  });

  it("loads a visitor profile through the safe unauthenticated endpoint", async () => {
    mocks.apiFetch.mockResolvedValueOnce({
      user_id: profile.user_id, nombre_completo: profile.nombre_completo,
      username: profile.username, avatar_url: null, descripcion_personal: profile.descripcion_personal,
    });
    render(<MemoryRouter initialEntries={[`/perfil-public/${profile.user_id}`]}>
      <Routes><Route path="/perfil-public/:id" element={<PerfilPublic />} /></Routes>
    </MemoryRouter>);
    expect(await screen.findByText("Me gustan los campamentos.")).toBeInTheDocument();
    expect(mocks.apiFetch).toHaveBeenCalledWith(`/v1/public/profiles/${profile.user_id}`, { auth: "none" });
    expect(screen.queryByText("scout@example.com")).not.toBeInTheDocument();
  });

  it("keeps following available for an approved internal member", async () => {
    const otherId = "550e8400-e29b-41d4-a716-446655440022";
    mocks.apiFetch.mockResolvedValueOnce({
      user_id: otherId, nombre_completo: "Otra Scout", username: "otra_scout",
      avatar_url: null, descripcion_personal: "Hola comunidad",
    });
    render(<MemoryRouter initialEntries={[`/perfil-public/${otherId}`]}>
      <Routes><Route path="/perfil-public/:id" element={<PerfilPublic />} /></Routes>
    </MemoryRouter>);
    fireEvent.click(await screen.findByRole("button", { name: "Seguir" }));
    await waitFor(() => expect(followMocks.followUser).toHaveBeenCalledWith(otherId));
    expect(await screen.findByRole("button", { name: /Siguiendo/ })).toBeInTheDocument();
  });
});
