import { PGlite } from "@electric-sql/pglite";
import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { LocalAuthRepository } from "./local-auth.repository.js";
import { createLocalAuthTestDatabase, resetLocalAuthTestDatabase, testAdminId } from "./local-auth.test-database.js";
const profile = { nombre: "Ada", apellido: "Lovelace", grupo_scout: "septimo", rama: "rovers" };
let db: PGlite;
let repository: LocalAuthRepository;

beforeAll(async () => {
  db = await createLocalAuthTestDatabase();
  repository = new LocalAuthRepository({ db } as unknown as FastifyInstance);
}, 30_000);
afterAll(async () => { await db?.close(); });
beforeEach(async () => resetLocalAuthTestDatabase(db));

async function register(email = "ada@example.com", input: object = profile) {
  return repository.createRegistration(email, "hashed-password", input, "verification-hash") as Promise<{
    created: boolean; user_id: string; request_id: string;
  }>;
}

describe("local registration SQL", () => {
  it("creates the account, pending profile and request without auth.users or user-controlled roles", async () => {
    const created = await register("ADA@example.com", { ...profile, role: "admin", account_status: "activo" });
    const { rows } = await db.query<{ email: string; status: string; role: string; auth_count: number }>(`
      select u.email, p.account_status as status, u.app_metadata->>'role' as role,
        (select count(*)::int from auth.users) as auth_count
      from public.app_users u join public.profiles p on p.user_id = u.id where u.id = $1`, [created.user_id]);
    expect(rows[0]).toEqual({ email: "ada@example.com", status: "pendiente_email", role: "user", auth_count: 0 });
    expect((await db.query("select * from public.registration_requests where id = $1", [created.request_id])).rows).toHaveLength(1);
  });

  it("preserves existing UUIDs, credentials and verification tokens on duplicate registration", async () => {
    const first = await register();
    expect(await register("ADA@example.com")).toEqual({ created: false });
    expect((await db.query("select id, password_hash from public.app_users where email = 'ada@example.com'")).rows)
      .toEqual([{ id: first.user_id, password_hash: "hashed-password" }]);
  });

  it("rolls back the whole registration if the request cannot be stored", async () => {
    await expect(register("broken@example.com", { apellido: "Missing name" })).rejects.toThrow();
    expect((await db.query("select id from public.app_users where email = 'broken@example.com'")).rows).toHaveLength(0);
    expect((await db.query("select user_id from public.profiles where email = 'broken@example.com'")).rows).toHaveLength(0);
  });

  it("rejects expired verification and consumes valid tokens once while preserving pending approval", async () => {
    const created = await register();
    await db.query("update public.app_users set email_verification_expires_at = now() - interval '1 second' where id = $1", [created.user_id]);
    await expect(db.query("select public.verify_local_email('verification-hash')")).rejects.toThrow("verification_token_invalid");
    await db.query("update public.app_users set email_verification_expires_at = now() + interval '1 hour' where id = $1", [created.user_id]);
    const { rows } = await db.query<{ result: object }>("select public.verify_local_email('verification-hash') as result");
    expect(rows[0].result).toMatchObject({ success: true, userId: created.user_id, nextStatus: "pendiente_aprobacion" });
    await expect(db.query("select public.verify_local_email('verification-hash')")).rejects.toThrow("verification_token_invalid");
  });

  it("requires verified email before approval and makes repeated decisions idempotent", async () => {
    const created = await register();
    const decide = () => db.query("select public.review_local_registration($1, 'approve', $2, null)", [created.request_id, testAdminId]);
    await expect(decide()).rejects.toThrow("email_not_verified");
    await db.query("select public.verify_local_email('verification-hash')");
    await decide();
    await decide();
    expect((await db.query("select account_status from public.profiles where user_id = $1", [created.user_id])).rows).toEqual([{ account_status: "activo" }]);
    expect((await db.query("select account_status from public.app_users where id = $1", [created.user_id])).rows).toEqual([{ account_status: "activo" }]);
    expect((await db.query("select id from public.notifications")).rows).toHaveLength(1);
    await expect(db.query("select public.review_local_registration($1, 'reject', $2, null)", [created.request_id, testAdminId])).rejects.toThrow("already_reviewed");
  });

  it("consumes a reset once and revokes every existing session atomically", async () => {
    const created = await register();
    await db.query("update public.app_users set password_reset_token_hash = 'reset-hash', password_reset_expires_at = now() + interval '1 hour' where id = $1", [created.user_id]);
    await db.query("insert into public.app_sessions(id, user_id, token_hash, expires_at) select gen_random_uuid(), $1, n::text, now() + interval '1 hour' from generate_series(1, 2) n", [created.user_id]);
    await db.query("select public.reset_local_password('reset-hash', 'new-hash')");
    await expect(db.query("select public.reset_local_password('reset-hash', 'attacker-hash')")).rejects.toThrow("password_reset_token_invalid");
    expect((await db.query("select id from public.app_sessions where revoked_at is null")).rows).toHaveLength(0);
    expect((await db.query("select password_hash from public.app_users where id = $1", [created.user_id])).rows).toEqual([{ password_hash: "new-hash" }]);
  });

  it("changes an authenticated password and revokes all sessions in one transaction", async () => {
    const created = await register();
    await db.query("insert into public.app_sessions(id, user_id, token_hash, expires_at) values (gen_random_uuid(), $1, 'active', now() + interval '1 hour')", [created.user_id]);
    await db.query("select public.change_local_password($1, 'changed-hash')", [created.user_id]);
    expect((await db.query("select password_hash from public.app_users where id = $1", [created.user_id])).rows).toEqual([{ password_hash: "changed-hash" }]);
    expect((await db.query("select id from public.app_sessions where revoked_at is null")).rows).toHaveLength(0);
  });

  it("binds OAuth state to the browser and consumes it once", async () => {
    await repository.createOAuthState("state-hash", "browser-hash", "nonce", "signup", new Date(Date.now() + 60_000).toISOString());
    expect(await repository.consumeOAuthState("state-hash", "other-browser")).toBeNull();
    expect(await repository.consumeOAuthState("state-hash", "browser-hash"))
      .toMatchObject({ nonce: "nonce", intent: "signup" });
    expect(await repository.consumeOAuthState("state-hash", "browser-hash")).toBeNull();

    await repository.createOAuthState("expired", "browser-hash", "nonce", "login", new Date(Date.now() - 1_000).toISOString());
    expect(await repository.consumeOAuthState("expired", "browser-hash")).toBeNull();
  });

  it("does not create an account when Google login has no matching email", async () => {
    expect(await repository.linkGoogleIdentity("missing@example.com", "google-subject", {}, "login"))
      .toEqual({ account_missing: true });
    expect((await db.query("select id from public.app_users where email = 'missing@example.com'")).rows).toHaveLength(0);
  });

  it("creates and completes a Google signup through a single-use ticket", async () => {
    const linked = await repository.linkGoogleIdentity("GOOGLE@example.com", "google-subject", {
      name: "Grace Hopper", role: "admin",
    }, "signup");
    expect(linked).toMatchObject({ is_new: true, status: "pendiente_aprobacion" });
    const userId = linked.user_id!;
    const { rows: users } = await db.query<{
      email: string; google_subject: string; role: string; auth_count: number;
    }>(`select email, google_subject, app_metadata->>'role' as role,
      (select count(*)::int from auth.users) as auth_count from public.app_users where id = $1`, [userId]);
    expect(users[0]).toEqual({
      email: "google@example.com", google_subject: "google-subject", role: "user", auth_count: 0,
    });

    await repository.createOAuthTicket("ticket-hash", userId, "signup", new Date(Date.now() + 60_000).toISOString());
    expect(await repository.findOAuthTicket("ticket-hash")).toMatchObject({
      user_id: userId, intent: "signup", email: "google@example.com",
    });
    await expect(repository.completeGoogleRegistration("ticket-hash", profile))
      .resolves.toMatchObject({ accepted: true, status: "pending" });
    await expect(repository.completeGoogleRegistration("ticket-hash", profile)).rejects.toThrow("oauth_ticket_invalid");
    expect((await db.query("select provider, provider_id, nombre, apellido from public.registration_requests where auth_user_id = $1", [userId])).rows)
      .toEqual([{ provider: "google", provider_id: "google-subject", nombre: "Ada", apellido: "Lovelace" }]);
  });

  it("links Google to an existing email without replacing its local password", async () => {
    const created = await register();
    const linked = await repository.linkGoogleIdentity("ADA@example.com", "linked-subject", { name: "Ada Lovelace" }, "signup");
    expect(linked).toMatchObject({ user_id: created.user_id, is_new: false, status: "pendiente_aprobacion" });
    expect((await db.query("select password_hash, google_subject, email_verified_at is not null as verified from public.app_users where id = $1", [created.user_id])).rows)
      .toEqual([{ password_hash: "hashed-password", google_subject: "linked-subject", verified: true }]);
    await expect(repository.linkGoogleIdentity("ada@example.com", "different-subject", {}, "signup"))
      .rejects.toThrow("google_identity_conflict");
  });

  it("consumes login tickets only for the intended flow", async () => {
    const created = await register();
    await repository.createOAuthTicket("login-ticket", created.user_id, "login", new Date(Date.now() + 60_000).toISOString());
    expect(await repository.consumeOAuthTicket("login-ticket", "signup")).toBeNull();
    expect(await repository.consumeOAuthTicket("login-ticket", "login"))
      .toMatchObject({ user_id: created.user_id, intent: "login" });
    expect(await repository.consumeOAuthTicket("login-ticket", "login")).toBeNull();
  });

  it("stores append-only audit data without raw identifiers or secrets", async () => {
    await repository.recordAudit({
      event_type: "login", success: false, identifier_hash: "a".repeat(64),
      request_id: "request-1", ip_address: "127.0.0.1", user_agent: "test-agent",
      details: { code: "AUTH_CREDENTIALS_INVALID" },
    });
    const { rows } = await db.query<{
      event_type: string; success: boolean; identifier_hash: string; details: object;
    }>("select event_type, success, identifier_hash, details from public.app_auth_audit_events");
    expect(rows).toEqual([{
      event_type: "login", success: false, identifier_hash: "a".repeat(64),
      details: { code: "AUTH_CREDENTIALS_INVALID" },
    }]);
    expect(JSON.stringify(rows)).not.toContain("password");
  });

  it("keeps Supabase signup compatible after retargeting the profile FK", async () => {
    const id = "550e8400-e29b-41d4-a716-446655440001";
    await db.query("insert into auth.users(id, email) values ($1, 'rollback@example.com')", [id]);
    expect((await db.query("select user_id from public.profiles where user_id = $1", [id])).rows).toHaveLength(1);
    expect((await db.query("select id from public.app_users where id = $1", [id])).rows).toHaveLength(1);
  });

  it("retargets remaining public identity FKs so local UUIDs can own business data", async () => {
    const created = await register();
    await db.query(`insert into public.narrativas(titulo, year_section, bloques, autor_id)
      values ('Historia local', '2026', '[]', $1)`, [created.user_id]);
    expect((await db.query("select autor_id from public.narrativas where autor_id = $1", [created.user_id])).rows)
      .toEqual([{ autor_id: created.user_id }]);
    const { rows } = await db.query<{ parent: string }>(`
      select confrelid::regclass::text as parent from pg_constraint
      where conrelid = 'public.narrativas'::regclass and contype = 'f'`);
    expect(rows).toEqual([{ parent: "app_users" }]);
  });

  it("denies browser roles and allows server role without SECURITY DEFINER commands", async () => {
    for (const role of ["anon", "authenticated"]) {
      await db.exec(`set role ${role}`);
      await expect(register()).rejects.toThrow("permission denied");
      await expect(db.query("select * from public.app_users")).rejects.toThrow("permission denied");
      await expect(db.query("select * from public.app_oauth_states")).rejects.toThrow("permission denied");
      await expect(db.query("select * from public.app_auth_audit_events")).rejects.toThrow("permission denied");
      await db.exec("reset role");
    }
    await db.exec("set role service_role");
    try { expect((await register()).created).toBe(true); }
    finally { await db.exec("reset role"); }
  });
});
