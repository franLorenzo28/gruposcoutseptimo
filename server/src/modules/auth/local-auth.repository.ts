import type { FastifyInstance } from "fastify";
import type { LocalUserRow } from "./local-auth.js";

export interface LocalCredentialRow extends LocalUserRow {
  password_hash: string | null;
}

export interface LocalSessionRow {
  id: string;
  user_id: string;
  expires_at: string;
  revoked_at: string | null;
}

export interface LocalOAuthState {
  nonce: string;
  intent: "login" | "signup";
}

export interface LocalOAuthTicket {
  user_id: string;
  intent: "login" | "signup";
  expires_at: string;
}

export interface LocalAuthAuditEvent {
  event_type: string;
  success: boolean;
  subject_user_id?: string | null;
  identifier_hash?: string | null;
  request_id?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  details?: Record<string, unknown>;
}

function requireAdmin(app: FastifyInstance) {
  if (!app.supabaseAdmin) throw new Error("Local auth database is not configured");
  return app.supabaseAdmin;
}

function databaseError(error: { message?: string; code?: string } | null): void {
  if (error) throw Object.assign(new Error(error.message || "Database request failed"), { code: error.code });
}

export class LocalAuthRepository {
  constructor(private readonly app: FastifyInstance) {}

  async recordAudit(event: LocalAuthAuditEvent): Promise<void> {
    const row = {
      event_type: event.event_type,
      success: event.success,
      subject_user_id: event.subject_user_id ?? null,
      identifier_hash: event.identifier_hash ?? null,
      request_id: event.request_id ?? null,
      ip_address: event.ip_address ?? null,
      user_agent: event.user_agent?.slice(0, 500) ?? null,
      details: event.details ?? {},
    };
    if (this.app.db) {
      await this.app.db.query(`insert into public.app_auth_audit_events(
        event_type, success, subject_user_id, identifier_hash, request_id, ip_address, user_agent, details
      ) values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)`, [
        row.event_type, row.success, row.subject_user_id, row.identifier_hash,
        row.request_id, row.ip_address, row.user_agent, JSON.stringify(row.details),
      ]);
      return;
    }
    const { error } = await requireAdmin(this.app).from("app_auth_audit_events").insert(row);
    databaseError(error);
  }

  async findCredentialsByEmail(email: string): Promise<LocalCredentialRow | null> {
    if (this.app.db) {
      const { rows } = await this.app.db.query<LocalCredentialRow>(`
        select id, email, password_hash, password_reset_required, email_verified_at,
          account_status, app_metadata, user_metadata
        from public.app_users where lower(email) = lower($1) limit 1`, [email]);
      return rows[0] ?? null;
    }
    const { data, error } = await requireAdmin(this.app).from("app_users")
      .select("id,email,password_hash,password_reset_required,email_verified_at,account_status,app_metadata,user_metadata")
      .eq("email", email).maybeSingle();
    databaseError(error);
    return data as LocalCredentialRow | null;
  }

  async findUserById(id: string): Promise<LocalUserRow | null> {
    if (this.app.db) {
      const { rows } = await this.app.db.query<LocalUserRow>(`
        select id, email, password_reset_required, email_verified_at,
          account_status, app_metadata, user_metadata
        from public.app_users where id = $1`, [id]);
      return rows[0] ?? null;
    }
    const { data, error } = await requireAdmin(this.app).from("app_users")
      .select("id,email,email_verified_at,account_status,app_metadata,user_metadata,password_reset_required")
      .eq("id", id).maybeSingle();
    databaseError(error);
    return data as LocalUserRow | null;
  }

  async findSession(id: string, userId: string, tokenHash: string): Promise<LocalSessionRow | null> {
    if (this.app.db) {
      const { rows } = await this.app.db.query<LocalSessionRow>(`
        select id, user_id, expires_at, revoked_at from public.app_sessions
        where id = $1 and user_id = $2 and token_hash = $3`, [id, userId, tokenHash]);
      return rows[0] ?? null;
    }
    const { data, error } = await requireAdmin(this.app).from("app_sessions")
      .select("id,user_id,expires_at,revoked_at").eq("id", id).eq("user_id", userId)
      .eq("token_hash", tokenHash).maybeSingle();
    databaseError(error);
    return data as LocalSessionRow | null;
  }

  async createSession(input: { id: string; user_id: string; token_hash: string; expires_at: string }): Promise<void> {
    if (this.app.db) {
      await this.app.db.query(`insert into public.app_sessions(id, user_id, token_hash, expires_at)
        values ($1, $2, $3, $4)`, [input.id, input.user_id, input.token_hash, input.expires_at]);
      return;
    }
    const { error } = await requireAdmin(this.app).from("app_sessions").insert(input);
    databaseError(error);
  }

  async revokeSession(id: string, userId: string): Promise<void> {
    if (this.app.db) {
      await this.app.db.query(`update public.app_sessions set revoked_at = now()
        where id = $1 and user_id = $2 and revoked_at is null`, [id, userId]);
      return;
    }
    const { error } = await requireAdmin(this.app).from("app_sessions").update({ revoked_at: new Date().toISOString() })
      .eq("id", id).eq("user_id", userId).is("revoked_at", null);
    databaseError(error);
  }

  async revokeAllSessions(userId: string): Promise<void> {
    if (this.app.db) {
      await this.app.db.query("update public.app_sessions set revoked_at = now() where user_id = $1 and revoked_at is null", [userId]);
      return;
    }
    const { error } = await requireAdmin(this.app).from("app_sessions").update({ revoked_at: new Date().toISOString() })
      .eq("user_id", userId).is("revoked_at", null);
    databaseError(error);
  }

  async setVerificationTokenByEmail(email: string, tokenHash: string, expiresAt: string): Promise<string | null> {
    if (this.app.db) {
      const { rows } = await this.app.db.query<{ id: string }>(`
        update public.app_users set email_verification_token_hash = $2,
          email_verification_expires_at = $3, updated_at = now()
        where lower(email) = lower($1) and email_verified_at is null returning id`, [email, tokenHash, expiresAt]);
      return rows[0]?.id ?? null;
    }
    const { data, error } = await requireAdmin(this.app).from("app_users").update({
      email_verification_token_hash: tokenHash, email_verification_expires_at: expiresAt,
    }).ilike("email", email.replace(/[\\%_]/g, "\\$&")).is("email_verified_at", null).select("id").maybeSingle();
    databaseError(error);
    return data?.id ?? null;
  }

  async setVerificationTokenById(userId: string, tokenHash: string, expiresAt: string): Promise<void> {
    if (this.app.db) {
      await this.app.db.query(`update public.app_users set email_verification_token_hash = $2,
        email_verification_expires_at = $3, updated_at = now()
        where id = $1 and email_verified_at is null`, [userId, tokenHash, expiresAt]);
      return;
    }
    const { error } = await requireAdmin(this.app).from("app_users").update({
      email_verification_token_hash: tokenHash, email_verification_expires_at: expiresAt,
    }).eq("id", userId).is("email_verified_at", null);
    databaseError(error);
  }

  async setPasswordResetToken(userId: string, tokenHash: string, expiresAt: string): Promise<void> {
    if (this.app.db) {
      await this.app.db.query(`update public.app_users set password_reset_token_hash = $2,
        password_reset_expires_at = $3, updated_at = now() where id = $1`, [userId, tokenHash, expiresAt]);
      return;
    }
    const { error } = await requireAdmin(this.app).from("app_users").update({
      password_reset_token_hash: tokenHash, password_reset_expires_at: expiresAt,
    }).eq("id", userId);
    databaseError(error);
  }

  async findUserIdByEmail(email: string): Promise<string | null> {
    if (this.app.db) {
      const { rows } = await this.app.db.query<{ id: string }>("select id from public.app_users where lower(email) = lower($1) limit 1", [email]);
      return rows[0]?.id ?? null;
    }
    const { data, error } = await requireAdmin(this.app).from("app_users").select("id")
      .ilike("email", email.replace(/[\\%_]/g, "\\$&")).maybeSingle();
    databaseError(error);
    return data?.id ?? null;
  }

  async findPasswordHash(userId: string): Promise<string | null> {
    if (this.app.db) {
      const { rows } = await this.app.db.query<{ password_hash: string | null }>("select password_hash from public.app_users where id = $1", [userId]);
      return rows[0]?.password_hash ?? null;
    }
    const { data, error } = await requireAdmin(this.app).from("app_users").select("password_hash").eq("id", userId).maybeSingle();
    databaseError(error);
    return data?.password_hash ?? null;
  }

  private async call<T>(name: string, sql: string, params: unknown[], rpcParams: Record<string, unknown>): Promise<T> {
    if (this.app.db) {
      const { rows } = await this.app.db.query<{ data: T }>(`select ${sql} as data`, params);
      return rows[0].data;
    }
    const { data, error } = await requireAdmin(this.app).rpc(name, rpcParams);
    databaseError(error);
    return data as T;
  }

  verifyEmail(tokenHash: string) {
    return this.call<Record<string, unknown>>("verify_local_email", "public.verify_local_email($1)", [tokenHash], { p_token_hash: tokenHash });
  }

  resetPassword(tokenHash: string, passwordHash: string) {
    return this.call<boolean>("reset_local_password", "public.reset_local_password($1, $2)", [tokenHash, passwordHash],
      { p_token_hash: tokenHash, p_password_hash: passwordHash });
  }

  changePassword(userId: string, passwordHash: string) {
    return this.call<boolean>("change_local_password", "public.change_local_password($1, $2)", [userId, passwordHash],
      { p_user_id: userId, p_password_hash: passwordHash });
  }

  createRegistration(email: string, passwordHash: string, profile: object, tokenHash: string) {
    return this.call<{ created?: boolean; user_id?: string }>("create_local_registration",
      "public.create_local_registration($1, $2, $3::jsonb, $4)", [email, passwordHash, JSON.stringify(profile), tokenHash],
      { p_email: email, p_password_hash: passwordHash, p_profile: profile, p_token_hash: tokenHash });
  }

  reviewRegistration(requestId: string, action: string, reviewerId: string, notes: string | null) {
    return this.call<{ user_id?: string | null; status?: string }>("review_local_registration",
      "public.review_local_registration($1, $2, $3, $4)", [requestId, action, reviewerId, notes],
      { p_request_id: requestId, p_action: action, p_reviewer_id: reviewerId, p_admin_notes: notes });
  }

  async createOAuthState(stateHash: string, browserHash: string, nonce: string, intent: "login" | "signup", expiresAt: string): Promise<void> {
    if (this.app.db) {
      await this.app.db.query("delete from public.app_oauth_states where expires_at <= now()");
      await this.app.db.query("delete from public.app_oauth_tickets where expires_at <= now()");
      await this.app.db.query(`insert into public.app_oauth_states(state_hash, browser_hash, nonce, intent, expires_at)
        values ($1, $2, $3, $4, $5)`, [stateHash, browserHash, nonce, intent, expiresAt]);
      return;
    }
    const admin = requireAdmin(this.app);
    const now = new Date().toISOString();
    const [{ error: stateCleanupError }, { error: ticketCleanupError }] = await Promise.all([
      admin.from("app_oauth_states").delete().lte("expires_at", now),
      admin.from("app_oauth_tickets").delete().lte("expires_at", now),
    ]);
    databaseError(stateCleanupError);
    databaseError(ticketCleanupError);
    const { error } = await admin.from("app_oauth_states").insert({
      state_hash: stateHash, browser_hash: browserHash, nonce, intent, expires_at: expiresAt,
    });
    databaseError(error);
  }

  async consumeOAuthState(stateHash: string, browserHash: string): Promise<LocalOAuthState | null> {
    if (this.app.db) {
      const { rows } = await this.app.db.query<LocalOAuthState>(`delete from public.app_oauth_states
        where state_hash = $1 and browser_hash = $2 and expires_at > now() returning nonce, intent`, [stateHash, browserHash]);
      return rows[0] ?? null;
    }
    const { data, error } = await requireAdmin(this.app).from("app_oauth_states").delete()
      .eq("state_hash", stateHash).eq("browser_hash", browserHash).gt("expires_at", new Date().toISOString())
      .select("nonce,intent").maybeSingle();
    databaseError(error);
    return data as LocalOAuthState | null;
  }

  linkGoogleIdentity(email: string, subject: string, metadata: object, intent: "login" | "signup") {
    return this.call<{ user_id?: string; status?: string | null; is_new?: boolean; account_missing?: boolean }>(
      "upsert_local_google_identity", "public.upsert_local_google_identity($1, $2, $3::jsonb, $4)",
      [email, subject, JSON.stringify(metadata), intent],
      { p_email: email, p_google_subject: subject, p_user_metadata: metadata, p_intent: intent },
    );
  }

  async createOAuthTicket(tokenHash: string, userId: string, intent: "login" | "signup", expiresAt: string): Promise<void> {
    if (this.app.db) {
      await this.app.db.query(`insert into public.app_oauth_tickets(token_hash, user_id, intent, expires_at)
        values ($1, $2, $3, $4)`, [tokenHash, userId, intent, expiresAt]);
      return;
    }
    const { error } = await requireAdmin(this.app).from("app_oauth_tickets").insert({
      token_hash: tokenHash, user_id: userId, intent, expires_at: expiresAt,
    });
    databaseError(error);
  }

  async findOAuthTicket(tokenHash: string): Promise<(LocalOAuthTicket & { email: string | null; user_metadata: Record<string, unknown> }) | null> {
    if (this.app.db) {
      const { rows } = await this.app.db.query<LocalOAuthTicket & { email: string | null; user_metadata: Record<string, unknown> }>(`
        select t.user_id, t.intent, t.expires_at, u.email, u.user_metadata
        from public.app_oauth_tickets t join public.app_users u on u.id = t.user_id
        where t.token_hash = $1 and t.expires_at > now()`, [tokenHash]);
      return rows[0] ?? null;
    }
    const { data: ticket, error } = await requireAdmin(this.app).from("app_oauth_tickets")
      .select("user_id,intent,expires_at").eq("token_hash", tokenHash).gt("expires_at", new Date().toISOString()).maybeSingle();
    databaseError(error);
    if (!ticket) return null;
    const user = await this.findUserById(ticket.user_id);
    return user ? { ...ticket, intent: ticket.intent as "login" | "signup", email: user.email, user_metadata: user.user_metadata ?? {} } : null;
  }

  async consumeOAuthTicket(tokenHash: string, intent: "login" | "signup"): Promise<LocalOAuthTicket | null> {
    if (this.app.db) {
      const { rows } = await this.app.db.query<LocalOAuthTicket>(`delete from public.app_oauth_tickets
        where token_hash = $1 and intent = $2 and expires_at > now() returning user_id, intent, expires_at`, [tokenHash, intent]);
      return rows[0] ?? null;
    }
    const { data, error } = await requireAdmin(this.app).from("app_oauth_tickets").delete()
      .eq("token_hash", tokenHash).eq("intent", intent).gt("expires_at", new Date().toISOString())
      .select("user_id,intent,expires_at").maybeSingle();
    databaseError(error);
    return data as LocalOAuthTicket | null;
  }

  completeGoogleRegistration(tokenHash: string, profile: object) {
    return this.call<{ accepted: boolean; status: string; user_id?: string }>("complete_local_google_registration",
      "public.complete_local_google_registration($1, $2::jsonb)", [tokenHash, JSON.stringify(profile)],
      { p_ticket_hash: tokenHash, p_profile: profile });
  }
}
