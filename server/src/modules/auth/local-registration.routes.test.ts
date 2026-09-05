import type { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildApp } from "../../app.js";
import { loadEnvironment } from "../../config/environment.js";
import { hashSessionToken } from "./local-auth.js";

let app: FastifyInstance | undefined;
afterEach(async () => { await app?.close(); app = undefined; });
const input = { email: "ADA@example.com", password: "a strong password", nombre: "Ada", apellido: "Lovelace" };
const localConfig = {
  AUTH_MODE: "local", SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "service-key", JWT_SECRET: "a-secret-with-at-least-32-characters-long",
  SMTP_HOST: "smtp.example.com", SMTP_FROM: "noreply@example.com", APP_URL: "https://example.com",
};

async function setup(created: boolean, production = true, mailFails = false) {
  const authMailer = vi.fn(async () => { if (mailFails) throw new Error("SMTP secret must not be exposed"); });
  const rpc = vi.fn(async () => ({ data: { created, user_id: "user-id" }, error: null }));
  app = await buildApp({ config: loadEnvironment({ ...localConfig, NODE_ENV: production ? "production" : "test" }), logger: false, authMailer });
  const auditInsert = vi.fn(async () => ({ error: null }));
  const from = vi.fn((table: string) => {
    if (table === "app_auth_audit_events") return { insert: auditInsert };
    throw new Error("Unexpected non-transactional write");
  });
  app.supabaseAdmin = { rpc, from } as unknown as NonNullable<FastifyInstance["supabaseAdmin"]>;
  const externalAuth = vi.spyOn(app, "createPublicSupabase").mockImplementation(() => { throw new Error("Supabase Auth must not run"); });
  return { rpc, authMailer, externalAuth, from, auditInsert };
}

describe("local registration HTTP boundary", () => {
  it("hashes passwords, strips client privilege fields and sends a token only by email in production", async () => {
    const { rpc, authMailer, externalAuth, from } = await setup(true);
    const result = await app!.inject({ method: "POST", url: "/v1/registration-requests", payload: { ...input, role: "admin", app_metadata: { role: "admin" } } });
    expect(result.statusCode).toBe(202);
    expect(result.body).not.toContain("verificationUrl");
    expect(result.body).not.toContain(input.password);
    const [name, args] = rpc.mock.calls[0] as unknown as [string, { p_password_hash: string; p_profile: object; p_token_hash: string }];
    expect(name).toBe("create_local_registration");
    expect(await bcrypt.compare(input.password, args.p_password_hash)).toBe(true);
    expect(args.p_profile).not.toHaveProperty("password");
    expect(args.p_profile).not.toHaveProperty("role");
    expect(args.p_profile).not.toHaveProperty("app_metadata");
    const [email, token, kind] = authMailer.mock.calls[0] as unknown as [string, string, string];
    expect(email).toBe("ada@example.com");
    expect(kind).toBe("verification");
    expect(hashSessionToken(token)).toBe(args.p_token_hash);
    expect(externalAuth).not.toHaveBeenCalled();
    expect(from).toHaveBeenCalledTimes(1);
    expect(from).toHaveBeenCalledWith("app_auth_audit_events");
  });

  it("does not resend verification or overwrite existing accounts on duplicate signup", async () => {
    const { authMailer } = await setup(false);
    const result = await app!.inject({ method: "POST", url: "/v1/registration-requests", payload: input });
    expect(result.statusCode).toBe(202);
    expect(result.json().data).toEqual({ accepted: true, message: "Si los datos son válidos, la solicitud quedará pendiente de revisión." });
    expect(authMailer).not.toHaveBeenCalled();
  });

  it("returns the same accepted response on SMTP failure and never leaks transport errors", async () => {
    await setup(true, true, true);
    const result = await app!.inject({ method: "POST", url: "/v1/registration-requests", payload: input });
    expect(result.statusCode).toBe(202);
    expect(result.json().data).toEqual({ accepted: true, message: "Si los datos son válidos, la solicitud quedará pendiente de revisión." });
    expect(result.body).not.toContain("SMTP");
  });

  it("provides a configured verification link in development only", async () => {
    await setup(true, false);
    const result = await app!.inject({ method: "POST", url: "/v1/registration-requests", payload: input });
    expect(result.json().data.verificationUrl).toMatch(/^https:\/\/example.com\/verificar-email\?token=[a-f0-9]{64}$/);
  });

  it("rejects bcrypt truncation, including multibyte passwords, before database access", async () => {
    const { rpc } = await setup(true);
    const result = await app!.inject({ method: "POST", url: "/v1/registration-requests", payload: { ...input, password: "🔐".repeat(19) } });
    expect(result.statusCode).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("maps consumed or expired email tokens to a safe validation error", async () => {
    const { rpc } = await setup(true);
    rpc.mockResolvedValueOnce({ data: null, error: { message: "verification_token_invalid" } } as never);
    const result = await app!.inject({ method: "POST", url: "/v1/auth/verify-email", payload: { token: "a".repeat(64) } });
    expect(result.statusCode).toBe(400);
    expect(result.json().error.code).toBe("VERIFICATION_TOKEN_INVALID");
  });

  it("protects local approval with the administrator guard", async () => {
    const { rpc } = await setup(true);
    const result = await app!.inject({ method: "POST", url: "/v1/admin/registration-requests/550e8400-e29b-41d4-a716-446655440000/decision", payload: { action: "approve" } });
    expect(result.statusCode).toBe(401);
    expect(rpc).not.toHaveBeenCalled();
  });
});
