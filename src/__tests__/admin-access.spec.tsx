import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, useRoutes } from "react-router-dom";
import { adminRoutes } from "@/app/routes/admin-routes";
import { BackendError } from "@/lib/backend";
import type { AdminAccess } from "@/lib/admin-permissions";

const mocks = vi.hoisted(() => ({
  auth: { user: null as { id: string } | null, isUserLoading: false },
  permissions: vi.fn(), panelMount: vi.fn(),
}));
vi.mock("@/hooks/useUser.tsx", () => ({ useUser: () => mocks.auth }));
vi.mock("@/lib/admin-permissions", () => ({ requestCurrentUserAdminAccess: mocks.permissions }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: {} } }));
vi.mock("@/components/RequireApproval", () => ({ default: ({ children }: { children: React.ReactNode }) => children }));
vi.mock("@/components/layout/ScrollAlInicio", () => ({ default: () => null }));
vi.mock("@/components/layout/TransicionRuta", () => ({ default: ({ children }: { children: React.ReactNode }) => children }));
vi.mock("@/app/routes/lazy-pages", () => ({ AdminPanel: () => {
  mocks.panelMount();
  return <div>Datos privados del panel</div>;
} }));

const admin: AdminAccess = {
  userId: "admin-id", email: "admin@example.com", role: "admin",
  isSuperAdmin: true, isMod: false, canOpenAdminPanel: true,
  canManageEducators: true, canManageRoles: true, canDeleteUsers: true,
};
function Routes() {
  return useRoutes([adminRoutes,
    { path: "/interno/auth", element: <div>Iniciar sesión</div> },
    { path: "/", element: <div>Inicio público</div> },
  ]);
}
function Harness({ path = "/admin" }: { path?: string }) {
  return <MemoryRouter initialEntries={[path]}><Routes /></MemoryRouter>;
}
beforeEach(() => {
  vi.resetAllMocks();
  localStorage.clear();
  mocks.auth = { user: null, isUserLoading: false };
  mocks.permissions.mockResolvedValue(admin);
});
afterEach(cleanup);

describe("admin route boundary", () => {
  it.each(["/admin", "/admin/usuarios", "/admin/solicitudes", "/admin/grupos", "/admin/eventos", "/admin/mensajes", "/admin/paginas"])("blocks %s without login, including its layout", async (path) => {
    localStorage.setItem("adminUser", JSON.stringify({ id: "admin-id", role: "admin" }));
    render(<Harness path={path} />);
    expect(await screen.findByText("Iniciar sesión")).toBeInTheDocument();
    expect(screen.queryByText("Panel admin")).not.toBeInTheDocument();
    expect(mocks.panelMount).not.toHaveBeenCalled();
    expect(mocks.permissions).not.toHaveBeenCalled();
  });

  it("waits for session restoration without mounting the panel", () => {
    mocks.auth.isUserLoading = true;
    render(<Harness />);
    expect(screen.getByText("Verificando permisos...")).toBeInTheDocument();
    expect(mocks.panelMount).not.toHaveBeenCalled();
    expect(mocks.permissions).not.toHaveBeenCalled();
  });

  it("waits for backend permission validation before exposing the layout", async () => {
    mocks.auth.user = { id: "admin-id" };
    let finish!: (access: AdminAccess) => void;
    mocks.permissions.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    render(<Harness />);
    expect(screen.queryByText("Panel admin")).not.toBeInTheDocument();
    await act(async () => { finish(admin); });
    expect(await screen.findByText("Panel admin")).toBeInTheDocument();
    expect(screen.getByText("Datos privados del panel")).toBeInTheDocument();
  });

  it("denies a logged-in member without admin permission", async () => {
    mocks.auth.user = { id: "member-id" };
    mocks.permissions.mockResolvedValue({ ...admin, userId: "member-id", role: "user", canOpenAdminPanel: false });
    render(<Harness />);
    expect(await screen.findByText("Inicio público")).toBeInTheDocument();
    expect(mocks.panelMount).not.toHaveBeenCalled();
  });

  it("closes immediately on logout and ignores an old permission response", async () => {
    mocks.auth.user = { id: "admin-id" };
    let finish!: (access: AdminAccess) => void;
    mocks.permissions.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    const view = render(<Harness />);
    mocks.auth.user = null;
    view.rerender(<Harness />);
    await act(async () => { finish(admin); });
    expect(await screen.findByText("Iniciar sesión")).toBeInTheDocument();
    expect(mocks.panelMount).not.toHaveBeenCalled();
  });

  it("shows a retry screen, without admin content, when the backend is offline", async () => {
    mocks.auth.user = { id: "admin-id" };
    mocks.permissions.mockRejectedValueOnce(new BackendError("No connection", 0, "NETWORK_ERROR"));
    render(<Harness />);
    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudieron verificar los permisos");
    expect(mocks.panelMount).not.toHaveBeenCalled();
    expect(screen.queryByText("Panel admin")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(await screen.findByText("Datos privados del panel")).toBeInTheDocument();
  });

  it("redirects an expired token to login", async () => {
    mocks.auth.user = { id: "admin-id" };
    mocks.permissions.mockRejectedValue(new BackendError("Expired", 401, "AUTH_TOKEN_INVALID"));
    render(<Harness />);
    expect(await screen.findByText("Iniciar sesión")).toBeInTheDocument();
    expect(mocks.panelMount).not.toHaveBeenCalled();
  });
});
