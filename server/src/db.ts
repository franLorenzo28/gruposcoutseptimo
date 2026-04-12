import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";

const dataDir = path.join(process.cwd(), "server", "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

export const db = new Database(path.join(dataDir, "app.db"));
db.pragma("journal_mode = WAL");

// Minimal schema to replace Supabase for local dev
db.exec(`
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    username TEXT UNIQUE,
    email_verified_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS verification_tokens (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at TEXT NOT NULL,
    used_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS profiles (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    nombre_completo TEXT,
    telefono TEXT,
    fecha_nacimiento TEXT,
    rol_adulto TEXT,
    rama_que_educa TEXT,
    is_public INTEGER DEFAULT 0,
    avatar_url TEXT,
    username_updated_at TEXT,
    seisena TEXT,
    patrulla TEXT,
    equipo_pioneros TEXT,
    comunidad_rovers TEXT
  );

  CREATE TABLE IF NOT EXISTS follows (
    follower_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    following_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'accepted', -- accepted | pending | blocked
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (follower_id, following_id)
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    recipient_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    actor_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    type TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    data TEXT,
    read_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_notifications_recipient_created
  ON notifications(recipient_id, created_at DESC);

  CREATE TABLE IF NOT EXISTS user_presence (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'active', -- active | away
    last_seen_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_user_presence_last_seen
  ON user_presence(last_seen_at DESC);

  CREATE TABLE IF NOT EXISTS groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    cover_url TEXT,
    creator_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS group_members (
    group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner','admin','member')),
    joined_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (group_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS group_messages (
    id TEXT PRIMARY KEY,
    group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT,
    image_url TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_group_messages_group ON group_messages(group_id, created_at);

  -- Direct messages (DMs)
  CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    user_a TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_b TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_a, user_b)
  );

  CREATE TABLE IF NOT EXISTS dm_messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_dm_messages_conv ON dm_messages(conversation_id, created_at);

  -- Events (para reemplazar 'eventos' de Supabase)
  CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    fecha_inicio TEXT NOT NULL,
    location TEXT,
    participants TEXT,
    type TEXT,
    status TEXT,
    color TEXT,
    created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- Threads (muro simple)
  CREATE TABLE IF NOT EXISTS threads (
    id TEXT PRIMARY KEY,
    author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    image_url TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS thread_comments (
    id TEXT PRIMARY KEY,
    thread_id TEXT NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
    author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_threads_created ON threads(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_thread_comments_thread ON thread_comments(thread_id, created_at);

  -- Narrativas (relatos históricos por año)
  CREATE TABLE IF NOT EXISTS narrativas (
    id TEXT PRIMARY KEY,
    titulo TEXT NOT NULL,
    year_section TEXT NOT NULL,
    bloques TEXT NOT NULL,
    autor_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    fecha_publicacion TEXT NOT NULL DEFAULT (datetime('now')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_narrativas_year ON narrativas(year_section);
  CREATE INDEX IF NOT EXISTS idx_narrativas_created ON narrativas(created_at DESC);

  CREATE TABLE IF NOT EXISTS rama_documentos (
    id TEXT PRIMARY KEY,
    rama TEXT NOT NULL CHECK (rama IN ('lobatos','caminantes','pioneros','rover')),
    nombre TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    tamaño INTEGER NOT NULL DEFAULT 0,
    storage_path TEXT NOT NULL,
    subido_por TEXT NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_rama_documentos_rama ON rama_documentos(rama, created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_rama_documentos_subido_por ON rama_documentos(subido_por);
  CREATE INDEX IF NOT EXISTS idx_rama_documentos_created ON rama_documentos(created_at DESC);

  CREATE TABLE IF NOT EXISTS rama_broadcast_messages (
    id TEXT PRIMARY KEY,
    rama TEXT NOT NULL CHECK (rama IN ('lobatos','caminantes','pioneros','rover')),
    author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_rama_broadcast_rama_created
  ON rama_broadcast_messages(rama, created_at DESC);
`);


export type UserRow = {
  id: string;
  email: string;
  password_hash: string;
  username?: string | null;
  created_at: string;
};

// --- Lightweight migration to ensure new columns exist in existing DBs ---
function ensureProfileColumns() {
  try {
    const cols = db.prepare(`PRAGMA table_info(profiles)`).all() as Array<{
      name: string;
    }>;
    const names = new Set(cols.map((c) => c.name));
    const missing: Array<{ sql: string }> = [];
    if (!names.has("fecha_nacimiento"))
      missing.push({
        sql: `ALTER TABLE profiles ADD COLUMN fecha_nacimiento TEXT`,
      });
    if (!names.has("rol_adulto"))
      missing.push({ sql: `ALTER TABLE profiles ADD COLUMN rol_adulto TEXT` });
    if (!names.has("rama_que_educa"))
      missing.push({ sql: `ALTER TABLE profiles ADD COLUMN rama_que_educa TEXT` });
    if (!names.has("seisena"))
      missing.push({ sql: `ALTER TABLE profiles ADD COLUMN seisena TEXT` });
    if (!names.has("patrulla"))
      missing.push({ sql: `ALTER TABLE profiles ADD COLUMN patrulla TEXT` });
    if (!names.has("equipo_pioneros"))
      missing.push({
        sql: `ALTER TABLE profiles ADD COLUMN equipo_pioneros TEXT`,
      });
    if (!names.has("comunidad_rovers"))
      missing.push({
        sql: `ALTER TABLE profiles ADD COLUMN comunidad_rovers TEXT`,
      });
    if (!names.has("is_public"))
      missing.push({
        sql: `ALTER TABLE profiles ADD COLUMN is_public INTEGER DEFAULT 0`,
      });
    if (!names.has("avatar_url"))
      missing.push({
        sql: `ALTER TABLE profiles ADD COLUMN avatar_url TEXT`,
      });
    if (!names.has("username_updated_at"))
      missing.push({
        sql: `ALTER TABLE profiles ADD COLUMN username_updated_at TEXT`,
      });
    if (missing.length) {
      const tx = db.transaction((stmts: Array<{ sql: string }>) => {
        for (const s of stmts) db.exec(s.sql);
      });
      tx(missing);
    }
  } catch (e) {
    // ignore; best-effort migration
  }
}

function ensureUserColumns() {
  try {
    const cols = db.prepare(`PRAGMA table_info(users)`).all() as Array<{
      name: string;
    }>;
    const names = new Set(cols.map((c) => c.name));
    const missing: Array<{ sql: string }> = [];
    if (!names.has("email_verified_at"))
      missing.push({
        sql: `ALTER TABLE users ADD COLUMN email_verified_at TEXT`,
      });
    if (missing.length) {
      const tx = db.transaction((stmts: Array<{ sql: string }>) => {
        for (const s of stmts) db.exec(s.sql);
      });
      tx(missing);
    }
  } catch (e) {
    // ignore; best-effort migration
  }
}

ensureProfileColumns();
ensureUserColumns();
