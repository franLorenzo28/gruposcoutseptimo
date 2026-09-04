-- Add PPP (Plan de Progresion Personal) fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS adelanto text,
  ADD COLUMN IF NOT EXISTS promesa boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS ppp_url text;
