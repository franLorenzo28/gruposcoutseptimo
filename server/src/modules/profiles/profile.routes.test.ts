import type { PGlite } from "@electric-sql/pglite";
import bcrypt from "bcryptjs";
import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildApp } from "../../app.js";
import { loadEnvironment } from "../../config/environment.js";
import { createLocalAuthTestDatabase } from "../auth/local-auth.test-database.js";

const memberId = "550e8400-e29b-41d4-a716-446655440010";
const publicId = "550e8400-e29b-41d4-a716-446655440011";
const privateId = "550e8400-e29b-41d4-a716-446655440012";
let app: FastifyInstance;
let db: PGlite;
let accessToken: string;

async function insertProfile(id: string, email: string, name: string, username: string, isPublic: boolean): Promise<void> {
  await db.query(`insert into public.app_users(
    id, email, password_hash, password_reset_required, email_verified_at, account_status, app_metadata
  ) values ($1, $2, $3, false, now(), 'activo', '{"role":"user","account_status":"activo"}')`, [
    id, email, bcrypt.hashSync("correct-password", 4),
  ]);
  await db.query(`insert into public.profiles(
    user_id, email, nombre_completo, username, account_status, account_classification, email_verified, is_public
  ) values ($1, $2, $3, $4, 'activo', 'scout', true, $5)`, [id, email, name, username, isPublic]);
}

beforeEach(async () => {
  db = await createLocalAuthTestDatabase();
  app = await buildApp({
    logger: false,
    config: loadEnvironment({
      NODE_ENV: "test", AUTH_MODE: "local", SUPABASE_URL: "https://database.example.test",
      SUPABASE_SERVICE_ROLE_KEY: "service-key", JWT_SECRET: "a-secret-with-at-least-32-characters-long",
    }),
  });
  app.db = db as unknown as FastifyInstance["db"];
  await insertProfile(memberId, "member@example.com", "Miembro Principal", "member", true);
  const login = await app.inject({
    method: "POST", url: "/v1/auth/login",
    payload: { email: "member@example.com", password: "correct-password" },
  });
  expect(login.statusCode).toBe(200);
  accessToken = login.json().data.access_token;
});

afterEach(async () => {
  await app?.close();
  await db?.close();
});

const authorization = () => ({ authorization: `Bearer ${accessToken}` });

describe("direct PostgreSQL profile routes", () => {
  it("reads and updates the authenticated profile without the Supabase Data API", async () => {
    const read = await app.inject({ method: "GET", url: "/v1/me/profile", headers: authorization() });
    expect(read.statusCode).toBe(200);
    expect(read.json().data).toMatchObject({ user_id: memberId, username: "member" });

    const update = await app.inject({
      method: "PATCH", url: "/v1/me/profile", headers: authorization(),
      payload: { username: "member_updated", privacy_preferences: { messages: "contacts" } },
    });
    expect(update.statusCode).toBe(200);
    expect(update.json().data).toMatchObject({
      user_id: memberId, username: "member_updated", privacy_preferences: { messages: "contacts" },
    });

    await insertProfile(publicId, "public@example.com", "Perfil Público", "already_taken", true);
    const duplicate = await app.inject({
      method: "PATCH", url: "/v1/me/profile", headers: authorization(), payload: { username: "already_taken" },
    });
    expect(duplicate.statusCode).toBe(409);
    expect(duplicate.json().error.code).toBe("USERNAME_TAKEN");
  });

  it("filters directory and batch responses to public profiles", async () => {
    await insertProfile(publicId, "public@example.com", "Perfil Público", "public_member", true);
    await insertProfile(privateId, "private@example.com", "Perfil Privado", "private_member", false);

    const directory = await app.inject({
      method: "GET", url: "/v1/profiles?search=Público", headers: authorization(),
    });
    expect(directory.statusCode).toBe(200);
    expect(directory.json().data.map((profile: { user_id: string }) => profile.user_id)).toEqual([publicId]);

    const wildcard = await app.inject({
      method: "GET", url: "/v1/profiles?search=%25", headers: authorization(),
    });
    expect(wildcard.statusCode).toBe(200);
    expect(wildcard.json().data).toEqual([]);

    const batch = await app.inject({
      method: "POST", url: "/profiles/batch", headers: authorization(), payload: { ids: [publicId, privateId] },
    });
    expect(batch.statusCode).toBe(200);
    expect(batch.json().data.map((profile: { user_id: string }) => profile.user_id)).toEqual([publicId]);
  });
});
