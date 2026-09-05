import { createHash } from "node:crypto";
import type { User } from "@supabase/supabase-js";

export interface LocalUserRow {
  id: string;
  email: string | null;
  email_verified_at: string | null;
  account_status: string | null;
  app_metadata: Record<string, unknown> | null;
  user_metadata: Record<string, unknown> | null;
  password_reset_required: boolean;
}

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function localUserFromRow(row: LocalUserRow): User {
  return {
    id: row.id,
    aud: "authenticated",
    role: "authenticated",
    email: row.email ?? undefined,
    phone: undefined,
    app_metadata: row.app_metadata ?? {},
    user_metadata: row.user_metadata ?? {},
    identities: [],
    created_at: new Date(0).toISOString(),
    updated_at: new Date().toISOString(),
    email_confirmed_at: row.email_verified_at ?? undefined,
    confirmed_at: row.email_verified_at ?? undefined,
    last_sign_in_at: undefined,
    recovery_sent_at: undefined,
    confirmation_sent_at: undefined,
    phone_confirmed_at: undefined,
    is_anonymous: false,
  } as User;
}
