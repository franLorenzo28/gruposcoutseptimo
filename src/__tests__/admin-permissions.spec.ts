import { beforeEach, describe, expect, it, vi } from "vitest";
import { getCurrentUserAdminAccess, requestCurrentUserAdminAccess } from "@/lib/admin-permissions";

const mocks = vi.hoisted(() => ({
  apiFetch: vi.fn(),
  isLocalBackend: vi.fn(),
  getSession: vi.fn(),
  from: vi.fn(),
  eq: vi.fn(),
  maybeSingle: vi.fn(),
}));
vi.mock("@/lib/backend", () => mocks);
vi.mock("@/integrations/supabase/client", () => ({ supabase: {
  auth: { getSession: mocks.getSession },
  from: mocks.from,
} }));
beforeEach(() => {
  vi.resetAllMocks();
  localStorage.clear();
  mocks.isLocalBackend.mockReturnValue(true);
  mocks.from.mockReturnValue({ select: () => ({ eq: mocks.eq }) });
  mocks.eq.mockReturnValue({ maybeSingle: mocks.maybeSingle });
});

describe("admin permission authority", () => {
  it("uses the authenticated backend role in local mode", async () => {
    mocks.apiFetch.mockResolvedValue({ userId: "admin-id", email: "admin@example.com", role: "admin" });
    await expect(requestCurrentUserAdminAccess()).resolves.toMatchObject({
      userId: "admin-id", isSuperAdmin: true, canOpenAdminPanel: true,
    });
    expect(mocks.apiFetch).toHaveBeenCalledWith("/v1/me/access");
  });

  it("ignores stale adminUser storage and inconsistent permission flags", async () => {
    localStorage.setItem("adminUser", JSON.stringify({ role: "admin" }));
    mocks.apiFetch.mockResolvedValue({ userId: "member-id", role: "user", canOpenAdminPanel: true });
    await expect(requestCurrentUserAdminAccess()).resolves.toMatchObject({
      role: "user", isSuperAdmin: false, canOpenAdminPanel: false,
    });
  });

  it("hides optional admin controls on error but lets the route guard distinguish outages", async () => {
    mocks.apiFetch.mockRejectedValue(new Error("API unavailable"));
    await expect(getCurrentUserAdminAccess()).resolves.toMatchObject({ userId: null, canOpenAdminPanel: false });
    await expect(requestCurrentUserAdminAccess()).rejects.toThrow("API unavailable");
  });

  it("reads the role from Supabase profiles in Supabase mode", async () => {
    mocks.isLocalBackend.mockReturnValue(false);
    mocks.getSession.mockResolvedValue({ data: { session: { user: { id: "u1", email: "u1@example.com" } } } });
    mocks.maybeSingle.mockResolvedValue({ data: { role: "mod", email: null }, error: null });
    await expect(getCurrentUserAdminAccess()).resolves.toMatchObject({
      userId: "u1", isMod: true, canOpenAdminPanel: true,
    });
    expect(mocks.apiFetch).not.toHaveBeenCalled();
  });
});
