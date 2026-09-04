alter table public.profiles
  add column if not exists profesion_ocupacion text,
  add column if not exists descripcion_personal text,
  add column if not exists privacy_preferences jsonb not null default '{}'::jsonb,
  add column if not exists notification_preferences jsonb not null default '{}'::jsonb;
