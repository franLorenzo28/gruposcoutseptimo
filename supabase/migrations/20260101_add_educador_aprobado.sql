-- Add educador_aprobado column to profiles
-- Controls whether someone who claims to be an educator actually has access to coordinator features

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS educador_aprobado BOOLEAN NOT NULL DEFAULT false;

-- Set to true for existing educators who already have rama_que_educa set
UPDATE profiles SET educador_aprobado = true
WHERE rol_adulto = 'Educador/a' AND rama_que_educa IS NOT NULL AND rama_que_educa != '';
