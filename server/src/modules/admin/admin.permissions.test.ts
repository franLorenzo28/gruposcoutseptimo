import type { FastifyInstance } from "fastify";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildApp } from "../../app.js";
import { loadEnvironment } from "../../config/environment.js";

const actorId = "550e8400-e29b-41d4-a716-446655440001";
const targetId = "550e8400-e29b-41d4-a716-446655440002";
let app: FastifyInstance | undefined;

afterEach(async () => { await app?.close(); app = undefined; });

async function setup(targetRole: "admin" | "user") {
  app = await buildApp({ config: loadEnvironment({ NODE_ENV: "test" }), logger: false });
  app.authenticate = async (request) => {
    request.authUser = { id: actorId, email: "mod@example.test", app_metadata: { role: "admin" } } as unknown as typeof request.authUser;
    request.authProfileRole = "mod";
  };
  const update = vi.fn((payload: Record<string, unknown>) => ({
    eq: () => ({ select: () => ({ single: async () => ({ data: { user_id: targetId, ...payload }, error: null }) }) }),
  }));
  const from = vi.fn(() => ({
    select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { role: targetRole }, error: null }) }) }),
    update,
  }));
  app.supabaseAdmin = { from } as unknown as NonNullable<FastifyInstance["supabaseAdmin"]>;
  return { update };
}

describe("moderator and educator permissions", () => {
  it("uses the current profile role instead of stale admin token metadata", async () => {
    await setup("user");
    const result = await app!.inject({ method: "PATCH", url: `/v1/admin/users/${targetId}/profile`,
      payload: { nombre_completo: "Nuevo nombre" } });
    expect(result.statusCode).toBe(403);
    expect(result.json().error.code).toBe("SUPER_ADMIN_REQUIRED");
  });

  it("prevents a moderator from changing an administrator's educator permissions", async () => {
    const { update } = await setup("admin");
    const result = await app!.inject({ method: "PATCH", url: `/v1/admin/users/${targetId}/educator-permissions`,
      payload: { enabled: true, units: ["tropa"], approved: true } });
    expect(result.statusCode).toBe(403);
    expect(update).not.toHaveBeenCalled();
  });

  it("prevents a moderator from changing an administrator's role", async () => {
    const { update } = await setup("admin");
    const result = await app!.inject({ method: "PATCH", url: `/v1/admin/users/${targetId}/role`,
      payload: { role: "user" } });
    expect(result.statusCode).toBe(403);
    expect(update).not.toHaveBeenCalled();
  });

  it("stores the approval flag with the assigned educator units", async () => {
    const { update } = await setup("user");
    const result = await app!.inject({ method: "PATCH", url: `/v1/admin/users/${targetId}/educator-permissions`,
      payload: { enabled: true, units: ["tropa", "rovers"], approved: true } });
    expect(result.statusCode).toBe(200);
    expect(update).toHaveBeenCalledWith({
      rol_adulto: "Educador/a", rama_que_educa: "tropa,rovers", educador_aprobado: true,
    });
  });
});
