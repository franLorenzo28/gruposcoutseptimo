import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import PublicAuthDialog from "@/components/auth/PublicAuthDialog";

const mocks = vi.hoisted(() => ({ signUp: vi.fn(), apiFetch: vi.fn(), refreshUser: vi.fn() }));

vi.mock("@/integrations/supabase/client", () => ({ supabase: {
  auth: { signUp: mocks.signUp },
} }));
vi.mock("@/lib/backend", () => ({
  apiFetch: mocks.apiFetch,
  getBackendUrl: vi.fn(),
  isLocalBackend: () => false,
  saveLocalAccessToken: vi.fn(),
}));
vi.mock("@/providers/AppProviders", () => ({
  useSupabaseUser: () => ({ refreshUser: mocks.refreshUser }),
}));

function renderDialog() {
  render(<MemoryRouter initialEntries={["/?auth=register"]}>
    <Routes>
      <Route path="/" element={<PublicAuthDialog />} />
      <Route path="/mi-perfil" element={<p>Perfil abierto</p>} />
    </Routes>
  </MemoryRouter>);
  fireEvent.change(screen.getByLabelText("Nombre completo"), { target: { value: "Scout Prueba" } });
  fireEvent.change(screen.getByLabelText("Correo electrónico"), { target: { value: "SCOUT@example.com" } });
  fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: "password-segura" } });
  fireEvent.click(screen.getByRole("button", { name: /^Crear cuenta$/ }));
}

beforeEach(() => { vi.clearAllMocks(); });
afterEach(cleanup);

describe("public account registration", () => {
  it("signs up from the visitor browser and opens the public profile when a session is returned", async () => {
    mocks.signUp.mockResolvedValue({ data: { session: { access_token: "test" } }, error: null });
    renderDialog();

    await waitFor(() => expect(mocks.signUp).toHaveBeenCalledWith({
      email: "scout@example.com",
      password: "password-segura",
      options: { data: { nombre_completo: "Scout Prueba", account_kind: "publico" } },
    }));
    expect(await screen.findByText("Perfil abierto")).toBeInTheDocument();
    expect(mocks.apiFetch).not.toHaveBeenCalled();
  });

  it("shows a useful message when Supabase limits signup attempts", async () => {
    mocks.signUp.mockResolvedValue({ data: { session: null }, error: { status: 429, code: "over_request_rate_limit" } });
    renderDialog();

    expect(await screen.findByRole("status")).toHaveTextContent("Hubo demasiados intentos de registro");
    expect(mocks.apiFetch).not.toHaveBeenCalled();
  });

  it("explains how to continue when the email already has an account", async () => {
    mocks.signUp.mockResolvedValue({ data: { session: null }, error: { status: 422, code: "user_already_exists" } });
    renderDialog();

    expect(await screen.findByRole("status")).toHaveTextContent("Ese correo ya tiene una cuenta");
  });

  it("uses a conditional confirmation message when signup returns no session", async () => {
    mocks.signUp.mockResolvedValue({ data: { session: null }, error: null });
    renderDialog();

    expect(await screen.findByRole("status")).toHaveTextContent("Si el correo es nuevo");
    expect(screen.queryByText("Perfil abierto")).not.toBeInTheDocument();
  });
});
