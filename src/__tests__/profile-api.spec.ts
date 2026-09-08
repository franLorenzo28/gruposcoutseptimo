import { beforeEach, describe, expect, it, vi } from "vitest";
import { getProfile } from "@/lib/api";

const mocks = vi.hoisted(() => ({
  apiFetch: vi.fn(), getAuthUser: vi.fn(), isLocalBackend: vi.fn(),
  getSession: vi.fn(), from: vi.fn(), eq: vi.fn(), single: vi.fn(),
}));
vi.mock("@/lib/backend", () => mocks);
vi.mock("@/integrations/supabase/client", () => ({ supabase: {
  auth: { getSession: mocks.getSession }, from: mocks.from,
} }));

beforeEach(() => {
  vi.resetAllMocks();
  mocks.isLocalBackend.mockReturnValue(false);
  mocks.getSession.mockResolvedValue({ data: { session: { user: { id: "self" } } } });
  mocks.getAuthUser.mockResolvedValue({ id: "self" });
  mocks.from.mockReturnValue({ select: () => ({ eq: mocks.eq }) });
  mocks.eq.mockReturnValue({ single: mocks.single });
  mocks.single.mockResolvedValue({ data: { user_id: "self", nombre_completo: "Scout", edad: 16 }, error: null });
});

describe("own profile backend selection", () => {
  it("reads the authenticated user's own profile directly from Supabase", async () => {
    await expect(getProfile("self")).resolves.toMatchObject({ user_id: "self" });
    expect(mocks.from).toHaveBeenCalledWith("profiles");
    expect(mocks.eq).toHaveBeenCalledWith("user_id", "self");
    expect(mocks.apiFetch).not.toHaveBeenCalled();
  });

  it("continues using the private API endpoint in local auth mode", async () => {
    mocks.isLocalBackend.mockReturnValue(true);
    mocks.apiFetch.mockResolvedValue({ user_id: "self" });
    await getProfile("self");
    expect(mocks.apiFetch).toHaveBeenCalledWith("/v1/me/profile");
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("reads other people's profiles from Supabase in Supabase mode", async () => {
    mocks.single.mockResolvedValue({ data: { user_id: "other", is_public: true }, error: null });
    await expect(getProfile("other")).resolves.toMatchObject({ user_id: "other" });
    expect(mocks.from).toHaveBeenCalledWith("profiles");
    expect(mocks.eq).toHaveBeenCalledWith("user_id", "other");
    expect(mocks.apiFetch).not.toHaveBeenCalled();
  });

  it("keeps other people's profiles behind the public API DTO in local mode", async () => {
    mocks.isLocalBackend.mockReturnValue(true);
    mocks.apiFetch.mockResolvedValue({ user_id: "other" });
    await getProfile("other");
    expect(mocks.apiFetch).toHaveBeenCalledWith("/v1/profiles/other");
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("requires authentication before querying a private profile", async () => {
    mocks.getSession.mockResolvedValue({ data: { session: null } });
    await expect(getProfile("self")).rejects.toThrow("No autenticado");
    expect(mocks.from).not.toHaveBeenCalled();
    expect(mocks.apiFetch).not.toHaveBeenCalled();
  });

  it("propagates a Supabase failure without falling back to localhost", async () => {
    mocks.single.mockResolvedValue({ data: null, error: new Error("Profile unavailable") });
    await expect(getProfile("self")).rejects.toThrow("Profile unavailable");
    expect(mocks.apiFetch).not.toHaveBeenCalled();
  });
});
