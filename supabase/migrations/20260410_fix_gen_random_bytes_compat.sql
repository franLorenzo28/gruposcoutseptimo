-- Fix: signup falla por "function gen_random_bytes(integer) does not exist"
-- Objetivo: asegurar disponibilidad de pgcrypto y exponer wrappers compatibles
-- para funciones antiguas que llamen gen_random_bytes/gen_random_uuid sin schema.

-- 1) Asegurar extensión pgcrypto
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

-- 2) Wrapper de compatibilidad para gen_random_bytes(integer)
-- Si alguna función legacy llama gen_random_bytes() sin schema y no lo encuentra,
-- este wrapper en public evita el crash del signup.
create or replace function public.gen_random_bytes(length integer)
returns bytea
language sql
volatile
as $$
  select extensions.gen_random_bytes(length);
$$;

-- 3) Wrapper de compatibilidad para gen_random_uuid()
create or replace function public.gen_random_uuid()
returns uuid
language sql
volatile
as $$
  select extensions.gen_random_uuid();
$$;
