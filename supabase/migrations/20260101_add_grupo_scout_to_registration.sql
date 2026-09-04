-- Add grupo_scout column to registration_requests table
-- Replaces tipo_relacion with grupo_scout to track if user is from Grupo Scout Séptimo or another group

ALTER TABLE registration_requests
ADD COLUMN IF NOT EXISTS grupo_scout TEXT;

-- Set default for existing rows
UPDATE registration_requests
SET grupo_scout = 'septimo'
WHERE grupo_scout IS NULL AND tipo_relacion = 'scout';

-- For backwards compatibility, keep tipo_relacion but mark as deprecated
-- New registrations will use grupo_scout
