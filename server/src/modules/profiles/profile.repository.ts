import type { FastifyInstance, FastifyRequest } from "fastify";

export const ownProfileFields =
  "id,user_id,email,nombre_completo,username,avatar_url,telefono,descripcion_personal,profesion_ocupacion,fecha_nacimiento,edad,patrulla,seisena,adelanto,equipo_pioneros,comunidad_rovers,promesa,ppp_url,is_public,privacy_preferences,notification_preferences,rol_adulto,rama_que_educa,account_status,account_classification,email_verified,created_at,updated_at";
export const publicProfileFields =
  "user_id,nombre_completo,username,avatar_url,descripcion_personal,profesion_ocupacion,patrulla,seisena,adelanto,equipo_pioneros,comunidad_rovers,promesa,rol_adulto,rama_que_educa";

type UserDatabaseClient = NonNullable<FastifyRequest["userSupabase"]>;

const writableFields = new Set([
  "nombre_completo", "username", "telefono", "descripcion_personal", "profesion_ocupacion",
  "fecha_nacimiento", "avatar_url", "is_public", "privacy_preferences", "notification_preferences",
  "patrulla", "seisena", "adelanto", "equipo_pioneros", "comunidad_rovers", "promesa", "ppp_url",
]);

function databaseError(error: { message?: string; code?: string } | null): void {
  if (error) throw Object.assign(new Error(error.message || "Database request failed"), { code: error.code });
}

function searchPattern(search: string): string {
  return `%${search.replace(/[\\%_]/g, "\\$&")}%`;
}

export class ProfileRepository {
  constructor(private readonly app: FastifyInstance) {}

  private admin() {
    if (!this.app.supabaseAdmin) throw new Error("Profile database is not configured");
    return this.app.supabaseAdmin;
  }

  async getOwn(userId: string): Promise<Record<string, unknown> | null> {
    if (this.app.db) {
      const { rows } = await this.app.db.query<Record<string, unknown>>(
        `select ${ownProfileFields} from public.profiles where user_id = $1 limit 1`, [userId],
      );
      return rows[0] ?? null;
    }
    const { data, error } = await this.admin().from("profiles").select(ownProfileFields)
      .eq("user_id", userId).maybeSingle();
    databaseError(error);
    return data;
  }

  async getAccess(userId: string): Promise<{ account_status: string | null; account_classification: string | null } | null> {
    if (this.app.db) {
      const { rows } = await this.app.db.query<{ account_status: string | null; account_classification: string | null }>(
        "select account_status, account_classification from public.profiles where user_id = $1 limit 1", [userId],
      );
      return rows[0] ?? null;
    }
    const { data, error } = await this.admin().from("profiles")
      .select("account_status,account_classification").eq("user_id", userId).maybeSingle();
    databaseError(error);
    return data;
  }

  async updateOwn(userId: string, body: Record<string, unknown>, client: UserDatabaseClient | null): Promise<Record<string, unknown> | null> {
    if (this.app.db) {
      const entries = Object.entries(body);
      if (entries.some(([field]) => !writableFields.has(field))) throw new Error("Profile field is not writable");
      const assignments = entries.map(([field], index) => `${field} = $${index + 2}`);
      const values = entries.map(([, value]) => value);
      const { rows } = await this.app.db.query<Record<string, unknown>>(
        `update public.profiles set ${assignments.join(", ")}, updated_at = now()
         where user_id = $1 returning ${ownProfileFields}`,
        [userId, ...values],
      );
      return rows[0] ?? null;
    }
    if (!client) throw new Error("Authenticated profile database is not configured");
    const { data, error } = await client.from("profiles").update(body).eq("user_id", userId)
      .select(ownProfileFields).single();
    databaseError(error);
    return data;
  }

  async listPublic(search: string | undefined, limit: number, offset: number, client: UserDatabaseClient | null): Promise<Record<string, unknown>[]> {
    if (this.app.db) {
      const values: unknown[] = [limit, offset];
      const filter = search ? "and (nombre_completo ilike $3 escape '\\' or username ilike $3 escape '\\')" : "";
      if (search) values.push(searchPattern(search));
      const { rows } = await this.app.db.query<Record<string, unknown>>(
        `select ${publicProfileFields} from public.profiles
         where is_public = true ${filter}
         order by nombre_completo asc limit $1 offset $2`, values,
      );
      return rows;
    }
    if (!client) throw new Error("Authenticated profile database is not configured");
    let query = client.from("profiles").select(publicProfileFields).eq("is_public", true)
      .order("nombre_completo", { ascending: true }).range(offset, offset + limit - 1);
    if (search) {
      const escaped = search.replace(/[%_,()]/g, "");
      query = query.or(`nombre_completo.ilike.%${escaped}%,username.ilike.%${escaped}%`);
    }
    const { data, error } = await query;
    databaseError(error);
    return data ?? [];
  }

  async getPublic(userId: string, client: UserDatabaseClient | null): Promise<Record<string, unknown> | null> {
    if (this.app.db) {
      const { rows } = await this.app.db.query<Record<string, unknown>>(
        `select ${publicProfileFields} from public.profiles where user_id = $1 and is_public = true limit 1`, [userId],
      );
      return rows[0] ?? null;
    }
    if (!client) throw new Error("Authenticated profile database is not configured");
    const { data, error } = await client.from("profiles").select(publicProfileFields)
      .eq("user_id", userId).eq("is_public", true).maybeSingle();
    databaseError(error);
    return data;
  }

  async getPublicBatch(ids: string[], client: UserDatabaseClient | null): Promise<Record<string, unknown>[]> {
    if (this.app.db) {
      const { rows } = await this.app.db.query<Record<string, unknown>>(
        `select ${publicProfileFields} from public.profiles
         where user_id = any($1::uuid[]) and is_public = true`, [ids],
      );
      return rows;
    }
    if (!client) throw new Error("Authenticated profile database is not configured");
    const { data, error } = await client.from("profiles").select(publicProfileFields)
      .in("user_id", ids).eq("is_public", true);
    databaseError(error);
    return data ?? [];
  }
}
