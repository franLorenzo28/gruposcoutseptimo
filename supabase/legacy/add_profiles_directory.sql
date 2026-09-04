-- Directory function to list minimal profile info for discovery, bypassing profiles RLS safely
-- Returns only non-sensible fields and can be executed by authenticated users

-- Drop the old version if it exists
DROP FUNCTION IF EXISTS public.list_profiles_directory();

-- Create the updated version with username field
CREATE FUNCTION public.list_profiles_directory()
RETURNS TABLE (
  user_id uuid,
  nombre_completo text,
  username text,
  avatar_url text,
  edad int,
  is_public boolean
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT p.user_id, p.nombre_completo, p.username, p.avatar_url, p.edad, p.is_public
  FROM public.profiles p
  ORDER BY p.nombre_completo NULLS LAST, p.user_id;
$$;

-- Grant permissions
REVOKE ALL ON FUNCTION public.list_profiles_directory() FROM public;
GRANT EXECUTE ON FUNCTION public.list_profiles_directory() TO authenticated;
-- Optionally allow anonymous to discover public list (commented):
-- GRANT EXECUTE ON FUNCTION public.list_profiles_directory() TO anon;
