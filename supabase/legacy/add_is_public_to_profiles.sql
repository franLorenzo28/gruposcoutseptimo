-- Agregar columna is_public a profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false;

COMMENT ON COLUMN profiles.is_public IS 'Indica si el perfil es público';
