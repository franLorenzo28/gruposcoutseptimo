-- Agregar columna lugar a la tabla eventos
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS lugar TEXT;
